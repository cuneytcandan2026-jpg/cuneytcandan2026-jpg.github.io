(() => {
  /* ---------- Help Me Choose ----------
     The scoring itself lives in main.js as window.LaaraPricing.recommend, so
     this tool and the homepage helper cannot drift apart — they used to hold
     separate copies of the same rule. This file owns only the presentation:
     the full result panel with the package's own description from
     pricing-data.js. main.js is deferred and loads first, so LaaraPricing is
     always defined by the time this runs; the guard below is belt-and-braces
     for a future load-order change. */
  const chooseQuestions = document.querySelector('.choose-questions');
  const resultPanel = document.querySelector('.choose-result');
  if (chooseQuestions && resultPanel && window.LaaraPricingData && window.LaaraPricing) {
    const packages = window.LaaraPricingData.packages;

    function getAnswer(name) {
      const checked = chooseQuestions.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : null;
    }

    function computeResult() {
      const winnerId = window.LaaraPricing.recommend({
        pages: getAnswer('choose-pages'),
        goal: getAnswer('choose-goal'),
        booking: getAnswer('choose-booking'),
      });
      if (!winnerId) return;
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
