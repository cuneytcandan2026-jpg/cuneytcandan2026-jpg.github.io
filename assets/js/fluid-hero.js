/* ============================================================
   Laara Digital — hero fluid background
   Original build on top of the MIT-licensed WebGL Fluid Simulation
   by Pavel Dobryakov (github.com/PavelDoGreat/WebGL-Fluid-Simulation).
   The Navier–Stokes solver (advection, curl/vorticity, pressure
   projection, splats) is the well-known reference algorithm and is
   kept intact under the same MIT terms; everything around it —
   module structure, quality tiering, lifecycle management, colour
   generation and the dither texture — is written fresh for this site.
   MIT License: Copyright (c) 2017 Pavel Dobryakov.
   ============================================================ */

(() => {
  'use strict';

  const canvas = document.querySelector('.hero-fluid');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (prefersReducedMotion || saveData) return;

  const gl = canvas.getContext('webgl2', { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false })
    || canvas.getContext('webgl', { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return;

  /* From here the sim is definitely running, so the static CSS background
     type (the reduced-motion/no-WebGL fallback) is replaced by the live,
     canvas-baked version below — hide it so the two don't stack. */
  const typeFallback = document.querySelector('.hero-type');
  if (typeFallback) typeFallback.style.display = 'none';

  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  const isCoarsePointer = matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 700;
  const lowPower = isCoarsePointer || isSmallScreen || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  /* ---------- Quality tiers ---------- */
  const config = lowPower
    ? {
        SIM_RESOLUTION: 64,
        DYE_RESOLUTION: 384,
        DENSITY_DISSIPATION: 0.6,
        VELOCITY_DISSIPATION: 0.01,
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 12,
        CURL: 24,
        SPLAT_RADIUS: 0.3,
        SPLAT_FORCE: 2000,
        BLOOM: true,
        BLOOM_ITERATIONS: 5,
        BLOOM_RESOLUTION: 128,
        BLOOM_INTENSITY: 0.9,
        BLOOM_THRESHOLD: 0.35,
        BLOOM_SOFT_KNEE: 0.7
      }
    : {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 768,
        DENSITY_DISSIPATION: 1.2,
        VELOCITY_DISSIPATION: 0.2,
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 30,
        SPLAT_RADIUS: 0.25,
        SPLAT_FORCE: 6000,
        BLOOM: true,
        BLOOM_ITERATIONS: 8,
        BLOOM_RESOLUTION: 256,
        BLOOM_INTENSITY: 1,
        BLOOM_THRESHOLD: 0.35,
        BLOOM_SOFT_KNEE: 0.7
      };
  config.SHADING = true;
  config.COLOR_UPDATE_SPEED = 8;
  config.BACK_COLOR = { r: 250, g: 250, b: 249 }; // --laara-paper
  config.MAX_DPR = lowPower ? 1.5 : 2;

  /* ---------- WebGL capability helpers ---------- */
  function supportsRenderTexture(internalFormat, format, type) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  }
  function getSupportedFormat(internalFormat, format, type) {
    if (supportsRenderTexture(internalFormat, format, type)) return { internalFormat, format };
    if (internalFormat === gl.R16F) return getSupportedFormat(gl.RG16F, gl.RG, type);
    if (internalFormat === gl.RG16F) return getSupportedFormat(gl.RGBA16F, gl.RGBA, type);
    return null;
  }

  let halfFloatTexType, formatRGBA, formatRG, formatR, supportLinearFiltering;
  if (isWebGL2) {
    gl.getExtension('EXT_color_buffer_float');
    supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    halfFloatTexType = gl.HALF_FLOAT;
    formatRGBA = getSupportedFormat(gl.RGBA16F, gl.RGBA, halfFloatTexType);
    formatRG = getSupportedFormat(gl.RG16F, gl.RG, halfFloatTexType);
    formatR = getSupportedFormat(gl.R16F, gl.RED, halfFloatTexType);
  } else {
    const halfFloat = gl.getExtension('OES_texture_half_float');
    if (!halfFloat) return;
    supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    halfFloatTexType = halfFloat.HALF_FLOAT_OES;
    formatRGBA = getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
    formatRG = formatRGBA;
    formatR = formatRGBA;
  }
  if (!formatRGBA || !formatRG || !formatR) return;
  if (!supportLinearFiltering) {
    config.DYE_RESOLUTION = Math.min(config.DYE_RESOLUTION, 384);
    config.SHADING = false;
    config.BLOOM = false;
  }
  gl.clearColor(0, 0, 0, 1);

  /* ---------- Shader compilation ---------- */
  function compileShader(type, source, keywords) {
    const withKeywords = keywords ? keywords.map(k => `#define ${k}\n`).join('') + source : source;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, withKeywords);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader));
    return shader;
  }
  function createProgram(vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(program));
    return program;
  }
  function getUniforms(program) {
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(program, i).name;
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    return uniforms;
  }
  /* A Program wraps two already-compiled shaders (no keyword variants). */
  class Program {
    constructor(vertexShader, fragmentShader) {
      this.program = createProgram(vertexShader, fragmentShader);
      this.uniforms = getUniforms(this.program);
    }
    bind() {
      gl.useProgram(this.program);
    }
  }

  /* A Material recompiles its fragment shader from source per #define
     combination — only the display pass needs this (SHADING/BLOOM toggle). */
  class Material {
    constructor(vertexShader, fragmentShaderSource) {
      this.vertexShader = vertexShader;
      this.fragmentShaderSource = fragmentShaderSource;
      this.variants = {};
      this.active = null;
      this.uniforms = {};
    }
    setKeywords(keywords) {
      const hash = keywords.join('|');
      if (!this.variants[hash]) {
        const fs = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
        this.variants[hash] = createProgram(this.vertexShader, fs);
      }
      if (this.variants[hash] === this.active) return;
      this.active = this.variants[hash];
      this.uniforms = getUniforms(this.active);
    }
    bind() {
      gl.useProgram(this.active);
    }
  }

  const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform vec2 texelSize;
    void main () {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `);
  const clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
  `);
  const colorShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec4 color;
    void main () { gl_FragColor = color; }
  `);
  const displayShaderSource = `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;
    #ifdef TYPE_MASK
      uniform sampler2D uMask;
    #endif
    vec3 linearToGamma (vec3 color) {
      color = max(color, vec3(0));
      return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }
    void main () {
      vec3 c = texture2D(uTexture, vUv).rgb;
      #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;
        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);
        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);
        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
      #endif
      #ifdef TYPE_MASK
        float typeDensity = length(c);
      #endif
      #ifdef BLOOM
        vec3 bloom = texture2D(uBloom, vUv).rgb;
        float noise = texture2D(uDithering, vUv * ditherScale).r;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 255.0;
        bloom = linearToGamma(bloom);
        c += bloom;
        #ifdef TYPE_MASK
          typeDensity += length(bloom) * 0.8;
        #endif
      #endif
      #ifdef TYPE_MASK
        /* Oversized background type: hidden in flat/idle areas of the fluid
           (paper-on-paper, ~no contrast), revealed toward white where dye
           density/bloom rises underneath — the reveal tracks the fluid
           itself rather than a fixed blend mode, so it holds up regardless
           of how muted the palette is tuned to be. */
        float mask = texture2D(uMask, vec2(vUv.x, 1.0 - vUv.y)).a;
        float reveal = smoothstep(0.06, 0.42, clamp(typeDensity, 0.0, 1.0));
        c = mix(c, mix(c, vec3(1.0), reveal), mask);
      #endif
      float a = max(c.r, max(c.g, c.b));
      gl_FragColor = vec4(c, a);
    }
  `;
  const bloomPrefilterShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;
    void main () {
      vec3 c = texture2D(uTexture, vUv).rgb;
      float br = max(c.r, max(c.g, c.b));
      float rq = clamp(br - curve.x, 0.0, curve.y);
      rq = curve.z * rq * rq;
      c *= max(rq, br - threshold) / max(br, 0.0001);
      gl_FragColor = vec4(c, 0.0);
    }
  `);
  const bloomBlurShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vL, vR, vT, vB;
    uniform sampler2D uTexture;
    void main () {
      vec4 sum = texture2D(uTexture, vL) + texture2D(uTexture, vR) + texture2D(uTexture, vT) + texture2D(uTexture, vB);
      gl_FragColor = sum * 0.25;
    }
  `);
  const bloomFinalShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vL, vR, vT, vB;
    uniform sampler2D uTexture;
    uniform float intensity;
    void main () {
      vec4 sum = texture2D(uTexture, vL) + texture2D(uTexture, vR) + texture2D(uTexture, vT) + texture2D(uTexture, vB);
      gl_FragColor = sum * 0.25 * intensity;
    }
  `);
  const splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main () {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
    }
  `);
  const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;
    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
      vec2 st = uv / tsize - 0.5;
      vec2 iuv = floor(st);
      vec2 fuv = fract(st);
      vec4 a = texture2D(sam, (iuv + vec2(0.5)) * tsize);
      vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
      vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
      vec4 d = texture2D(sam, (iuv + vec2(1.5)) * tsize);
      return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }
    void main () {
      #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
      #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
      #endif
      float decay = 1.0 + dissipation * dt;
      gl_FragColor = result / decay;
    }
  `, supportLinearFiltering ? null : ['MANUAL_FILTERING']);
  const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) { L = -C.x; }
      if (vR.x > 1.0) { R = -C.x; }
      if (vT.y > 1.0) { T = -C.y; }
      if (vB.y < 0.0) { B = -C.y; }
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `);
  const curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
  `);
  const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main () {
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C;
      force.y *= -1.0;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity += force * dt;
      velocity = min(max(velocity, -1000.0), 1000.0);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `);
  const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float C = texture2D(uPressure, vUv).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `);
  const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `);

  /* ---------- Fullscreen blit ---------- */
  const blitBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, blitBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const blitIBO = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, blitIBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(target) {
    if (target == null) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  function createFBO(w, h, internalFormat, format, type, filter) {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      texture, fbo, width: w, height: h,
      texelSizeX: 1 / w, texelSizeY: 1 / h,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }
  function createDoubleFBO(w, h, internalFormat, format, type, filter) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
    let fbo2 = createFBO(w, h, internalFormat, format, type, filter);
    return {
      width: w, height: h,
      texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
      get read() { return fbo1; },
      set read(v) { fbo1 = v; },
      get write() { return fbo2; },
      set write(v) { fbo2 = v; },
      swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; }
    };
  }

  /* ---------- Procedural dither texture (no external asset) ---------- */
  function createDitherTexture() {
    const size = 32;
    const pixels = new Uint8Array(size * size);
    for (let i = 0; i < pixels.length; i++) pixels[i] = Math.floor(Math.random() * 256);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const format = isWebGL2 ? gl.R8 : gl.LUMINANCE;
    const dataFormat = isWebGL2 ? gl.RED : gl.LUMINANCE;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, size, size, 0, dataFormat, gl.UNSIGNED_BYTE, pixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return {
      width: size, height: size,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }

  /* ---------- Programs ---------- */
  const clearProgram = new Program(baseVertexShader, clearShader);
  const colorProgram = new Program(baseVertexShader, colorShader);
  const bloomPrefilterProgram = new Program(baseVertexShader, bloomPrefilterShader);
  const bloomBlurProgram = new Program(baseVertexShader, bloomBlurShader);
  const bloomFinalProgram = new Program(baseVertexShader, bloomFinalShader);
  const splatProgram = new Program(baseVertexShader, splatShader);
  const advectionProgram = new Program(baseVertexShader, advectionShader);
  const divergenceProgram = new Program(baseVertexShader, divergenceShader);
  const curlProgram = new Program(baseVertexShader, curlShader);
  const vorticityProgram = new Program(baseVertexShader, vorticityShader);
  const pressureProgram = new Program(baseVertexShader, pressureShader);
  const gradientSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
  const displayProgram = new Material(baseVertexShader, displayShaderSource);

  function updateDisplayKeywords() {
    const keywords = [];
    if (config.SHADING) keywords.push('SHADING');
    if (config.BLOOM) keywords.push('BLOOM');
    if (typeMaskReady) keywords.push('TYPE_MASK');
    displayProgram.setKeywords(keywords);
  }

  const ditheringTexture = createDitherTexture();

  /* ---------- Oversized background type, baked as a mask texture ----------
     Rasterised once (and again on resize/webfont load) into an offscreen
     2D canvas, then sampled in the display shader — this is the "proper
     masking/compositing solution using the WebGL canvas" version of the
     hero-type overlay, needed because a plain CSS layer can't react to the
     fluid's actual colour underneath it. */
  // Read from the fallback markup already in the DOM (index.html's .hero-type
  // span or its per-page equivalent) rather than a hardcoded string, so each
  // page declares its own phrase once, in HTML, and the JS stays generic.
  const TYPE_PHRASE = (typeFallback && typeFallback.querySelector('span')?.textContent.trim().toUpperCase()) || 'GET FOUND';
  const typeMaskCanvas = document.createElement('canvas');
  const typeMaskCtx = typeMaskCanvas.getContext('2d');
  const typeMaskTexture = gl.createTexture();
  let typeMaskReady = false;

  function drawTypeMask() {
    const boxW = canvas.clientWidth;
    const boxH = canvas.clientHeight;
    if (!boxW || !boxH) return;
    const mw = 1024;
    const mh = Math.max(1, Math.round(mw * (boxH / boxW)));
    typeMaskCanvas.width = mw;
    typeMaskCanvas.height = mh;
    typeMaskCtx.clearRect(0, 0, mw, mh);
    typeMaskCtx.fillStyle = '#fff';
    typeMaskCtx.textAlign = 'center';
    typeMaskCtx.textBaseline = 'middle';
    let fontSize = mh * 0.34;
    typeMaskCtx.font = `900 ${fontSize}px Lato, sans-serif`;
    const maxWidth = mw * 0.94;
    const measured = typeMaskCtx.measureText(TYPE_PHRASE).width;
    if (measured > maxWidth) {
      fontSize *= maxWidth / measured;
      typeMaskCtx.font = `900 ${fontSize}px Lato, sans-serif`;
    }
    typeMaskCtx.fillText(TYPE_PHRASE, mw / 2, mh / 2);

    gl.bindTexture(gl.TEXTURE_2D, typeMaskTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, typeMaskCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    typeMaskReady = true;
    updateDisplayKeywords();
  }

  let dye, velocity, divergence, curl, pressure, bloom;
  let bloomFramebuffers = [];

  function getResolution(resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspectRatio);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
  }

  function initFramebuffers() {
    const simRes = getResolution(config.SIM_RESOLUTION);
    const dyeRes = getResolution(config.DYE_RESOLUTION);
    const filter = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    gl.disable(gl.BLEND);
    dye = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, halfFloatTexType, filter);
    velocity = createDoubleFBO(simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, halfFloatTexType, filter);
    divergence = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    curl = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    pressure = createDoubleFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    initBloomFramebuffers();
  }
  function initBloomFramebuffers() {
    const res = getResolution(config.BLOOM_RESOLUTION);
    const filter = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    bloom = createFBO(res.width, res.height, formatRGBA.internalFormat, formatRGBA.format, halfFloatTexType, filter);
    bloomFramebuffers = [];
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
      const width = res.width >> (i + 1);
      const height = res.height >> (i + 1);
      if (width < 2 || height < 2) break;
      bloomFramebuffers.push(createFBO(width, height, formatRGBA.internalFormat, formatRGBA.format, halfFloatTexType, filter));
    }
  }

  /* ---------- Colour: soft pink / magenta only ---------- */
  function hsvToRgb(h, s, v) {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: return { r: v, g: t, b: p };
      case 1: return { r: q, g: v, b: p };
      case 2: return { r: p, g: v, b: t };
      case 3: return { r: p, g: q, b: v };
      case 4: return { r: t, g: p, b: v };
      default: return { r: v, g: p, b: q };
    }
  }
  // Per-page accent, read from data-hue-from/-to on the canvas (0–1 HSV hue);
  // falls back to the homepage's magenta/pink-red band when unset.
  const hueFrom = canvas.dataset.hueFrom !== undefined ? parseFloat(canvas.dataset.hueFrom) : 0.86;
  const hueTo = canvas.dataset.hueTo !== undefined ? parseFloat(canvas.dataset.hueTo) : 0.99;
  function generateColor() {
    const hue = hueFrom + Math.random() * (hueTo - hueFrom);
    const c = hsvToRgb(hue, 0.6, 1);
    c.r *= 0.34;
    c.g *= 0.34;
    c.b *= 0.34;
    return c;
  }
  function normalizeColor(c) {
    return { r: c.r / 255, g: c.g / 255, b: c.b / 255 };
  }

  /* ---------- Splats ---------- */
  function correctRadius(radius) {
    const aspectRatio = canvas.width / canvas.height;
    return aspectRatio > 1 ? radius * aspectRatio : radius;
  }
  function splat(x, y, dx, dy, color) {
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
    gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100));
    blit(velocity.write);
    velocity.swap();
    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
  }

  /* ---------- Pointer tracking (single pointer — hero is a decorative surface, not multitouch) ---------- */
  const pointer = { x: 0, y: 0, prevX: 0, prevY: 0, dx: 0, dy: 0, down: false, moved: false, color: generateColor() };

  function scaleByDPR(value) {
    return Math.floor(value * Math.min(window.devicePixelRatio || 1, config.MAX_DPR));
  }
  function correctDeltaX(delta) {
    const ar = canvas.width / canvas.height;
    return ar < 1 ? delta * ar : delta;
  }
  function correctDeltaY(delta) {
    const ar = canvas.width / canvas.height;
    return ar > 1 ? delta / ar : delta;
  }
  function updatePointerMove(posX, posY) {
    pointer.prevX = pointer.x;
    pointer.prevY = pointer.y;
    pointer.x = posX / canvas.width;
    pointer.y = 1 - posY / canvas.height;
    pointer.dx = correctDeltaX(pointer.x - pointer.prevX);
    pointer.dy = correctDeltaY(pointer.y - pointer.prevY);
    pointer.moved = Math.abs(pointer.dx) > 0 || Math.abs(pointer.dy) > 0;
  }

  canvas.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    pointer.down = true;
    const rect = canvas.getBoundingClientRect();
    updatePointerMove(scaleByDPR(e.clientX - rect.left), scaleByDPR(e.clientY - rect.top));
    pointer.prevX = pointer.x;
    pointer.prevY = pointer.y;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && !pointer.down) return;
    const rect = canvas.getBoundingClientRect();
    updatePointerMove(scaleByDPR(e.clientX - rect.left), scaleByDPR(e.clientY - rect.top));
  }, { passive: true });
  canvas.addEventListener('pointerdown', (e) => {
    pointer.down = true;
    const rect = canvas.getBoundingClientRect();
    updatePointerMove(scaleByDPR(e.clientX - rect.left), scaleByDPR(e.clientY - rect.top));
  });
  canvas.addEventListener('pointerleave', () => { pointer.down = false; });
  window.addEventListener('pointerup', () => { pointer.down = false; });

  /* ---------- Ambient motion — the primary visual on touch devices and before
     a visitor's first hover, so the hero reads as alive without any input. ---------- */
  let nextAmbientSplat = 300;
  let ambientTimer = 0;
  function ambientSplat() {
    const x = 0.2 + Math.random() * 0.6;
    const y = 0.2 + Math.random() * 0.6;
    const angle = Math.random() * Math.PI * 2;
    const force = (lowPower ? 300 : 500) + Math.random() * 250;
    splat(x, y, Math.cos(angle) * force, Math.sin(angle) * force, generateColor());
  }

  /* ---------- Render passes ---------- */
  function step(dt) {
    gl.disable(gl.BLEND);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    gradientSubtractProgram.bind();
    gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    const velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    if (!supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
  }

  function applyBloom(source, destination) {
    if (bloomFramebuffers.length < 2) return;
    let last = destination;
    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    const knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, config.BLOOM_THRESHOLD - knee, knee * 2, 0.25 / knee);
    gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    blit(last);

    bloomBlurProgram.bind();
    for (let i = 0; i < bloomFramebuffers.length; i++) {
      const dest = bloomFramebuffers[i];
      gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      blit(dest);
      last = dest;
    }
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);
    for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
      const baseTex = bloomFramebuffers[i];
      gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      blit(baseTex);
      last = baseTex;
    }
    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    blit(destination);
  }

  function drawColor(color) {
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    blit(null);
  }
  function drawDisplay() {
    displayProgram.bind();
    if (config.SHADING) gl.uniform2f(displayProgram.uniforms.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
    if (config.BLOOM) {
      gl.uniform1i(displayProgram.uniforms.uBloom, bloom.attach(1));
      gl.uniform1i(displayProgram.uniforms.uDithering, ditheringTexture.attach(2));
      gl.uniform2f(displayProgram.uniforms.ditherScale, gl.drawingBufferWidth / ditheringTexture.width, gl.drawingBufferHeight / ditheringTexture.height);
    }
    if (typeMaskReady) {
      gl.activeTexture(gl.TEXTURE0 + 3);
      gl.bindTexture(gl.TEXTURE_2D, typeMaskTexture);
      gl.uniform1i(displayProgram.uniforms.uMask, 3);
    }
    blit(null);
  }
  function render() {
    if (config.BLOOM) applyBloom(dye.read, bloom);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    drawColor(normalizeColor(config.BACK_COLOR));
    drawDisplay();
  }

  /* ---------- Lifecycle: only run while visible, on-screen and tab-active ---------- */
  let running = false;
  let inViewport = true;
  let tabVisible = !document.hidden;
  let rafId = null;
  let lastTime = performance.now();

  function resizeCanvas() {
    const w = scaleByDPR(canvas.clientWidth);
    const h = scaleByDPR(canvas.clientHeight);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      drawTypeMask();
      return true;
    }
    return false;
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 1 / 60);
    lastTime = now;

    if (resizeCanvas()) initFramebuffers();

    ambientTimer += dt * 1000;
    if (ambientTimer > nextAmbientSplat) {
      ambientTimer = 0;
      nextAmbientSplat = lowPower ? 2200 + Math.random() * 1600 : 1400 + Math.random() * 1200;
      ambientSplat();
    }

    if (pointer.moved) {
      pointer.moved = false;
      splat(pointer.x, pointer.y, pointer.dx * config.SPLAT_FORCE, pointer.dy * config.SPLAT_FORCE, pointer.color);
    }

    colorTimer += dt * config.COLOR_UPDATE_SPEED;
    if (colorTimer >= 1) {
      colorTimer %= 1;
      pointer.color = generateColor();
    }

    step(dt);
    render();
    rafId = requestAnimationFrame(frame);
  }
  let colorTimer = 0;

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
  function syncRunning() {
    if (inViewport && tabVisible) start();
    else stop();
  }

  document.addEventListener('visibilitychange', () => {
    tabVisible = !document.hidden;
    syncRunning();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inViewport = entries[0].isIntersecting;
      syncRunning();
    }, { threshold: 0 }).observe(canvas);
  }

  updateDisplayKeywords();
  resizeCanvas();
  initFramebuffers();
  drawTypeMask();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawTypeMask);
  }
  syncRunning();
})();
