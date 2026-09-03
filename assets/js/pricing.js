(() => {
  /* ---------- Help Me Choose ----------
     Scoring is a simple point-tally derived directly from the same facts
     shown in the comparison table above (page count, positioning, booking
     inclusion) — no logic here that isn't traceable to docs/pricing.md.
     Ties default to Professional, matching pricing.md's own stated sales
     goal ("land most clients on Professional or above") — a design
     choice, not a sourced fact. */
  const chooseQuestions = document.querySelector('.choose-questions');
  const resultPanel = document.querySelector('.choose-result');
  if (chooseQuestions && resultPanel && window.LaaraPricingData) {
    const packages = window.LaaraPricingData.packages;
    const pagesToPackage = { '4-5': 'essential', '6-8': 'professional', '8-12': 'growth' };
    const goalToPackage = { fast: 'essential', visibility: 'professional', competitors: 'growth' };

    function getAnswer(name) {
      const checked = chooseQuestions.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : null;
    }

    function computeResult() {
      const pages = getAnswer('choose-pages');
      const goal = getAnswer('choose-goal');
      const booking = getAnswer('choose-booking');
      if (!pages || !goal || !booking) return;

      const scores = { essential: 0, professional: 0, growth: 0 };
      if (pagesToPackage[pages]) scores[pagesToPackage[pages]] += 1;
      if (goalToPackage[goal]) scores[goalToPackage[goal]] += 1;
      if (booking === 'yes') {
        scores.professional += 1;
        scores.growth += 1;
      } else if (booking === 'no') {
        scores.essential += 1;
      }

      const maxScore = Math.max(scores.essential, scores.professional, scores.growth);
      const tied = ['essential', 'professional', 'growth'].filter((id) => scores[id] === maxScore);
      const winnerId = tied.includes('professional') ? 'professional' : tied[0];

      showResult(winnerId);
    }

    function showResult(id) {
      const pkg = packages.find((p) => p.id === id);
      if (!pkg) return;

      document.querySelectorAll('#packages .pricing-card[data-package]').forEach((card) => {
        card.classList.toggle('is-recommended', card.dataset.package === id);
      });

      resultPanel.querySelector('.choose-result-name').textContent = `${pkg.label} looks like your best starting point`;
      resultPanel.querySelector('.choose-result-desc').textContent = pkg.bestFor;
      const cta = resultPanel.querySelector('.choose-result-cta');
      cta.href = `/contact.html?package=${pkg.id}`;
      cta.textContent = `Start with ${pkg.label} →`;

      if (!resultPanel.classList.contains('is-visible')) {
        resultPanel.classList.add('is-visible');
        requestAnimationFrame(() => resultPanel.classList.add('is-shown'));
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    chooseQuestions.addEventListener('change', computeResult);
  }

  /* ---------- Comparison table: package highlight ----------
     Progressive enhancement only. Without this script, .compare-table
     never gets a data-active attribute, so the CSS highlight/hide rules
     never match anything, every column stays visible, and the radios
     still work as plain inputs — just with no effect on the table. */
  const compareSelect = document.querySelector('.compare-select-grid');
  const compareTable = document.querySelector('.compare-table');
  if (compareSelect && compareTable) {
    function activate(id) {
      compareTable.dataset.active = id;
      compareTable.querySelectorAll('tfoot [data-package] a.laara-btn').forEach((a) => {
        const isActive = a.closest('[data-package]').dataset.package === id;
        a.classList.toggle('laara-btn--primary', isActive);
        a.classList.toggle('laara-btn--secondary', !isActive);
      });
    }

    compareSelect.addEventListener('change', (e) => {
      if (e.target.name === 'compare-select') activate(e.target.value);
    });

    const checked = compareSelect.querySelector('input[name="compare-select"]:checked');
    if (checked) activate(checked.value);
  }
})();
