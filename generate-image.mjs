import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const [, , prompt, outputName] = process.argv;

if (!prompt || !outputName) {
  console.error('Usage: node generate-image.mjs "<prompt>" <output-filename.png>');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-...') {
  console.error('OPENAI_API_KEY is not set. Add it to .env first.');
  process.exit(1);
}

const openai = new OpenAI();

const result = await openai.images.generate({
  model: 'gpt-image-2',
  prompt,
  size: '1536x1024',
});

const outDir = path.join(process.cwd(), 'assets', 'img');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, outputName);

const imageBytes = Buffer.from(result.data[0].b64_json, 'base64');
fs.writeFileSync(outPath, imageBytes);

console.log(`Saved ${outPath}`);
