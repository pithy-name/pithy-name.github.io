const SITE_LINKS = {
  linkedin: 'https://www.linkedin.com/in/annakalil/',
  substack: 'https://crosstrafficdoesnotstop.substack.com/notes',
  github: 'https://github.com/pithy-name/',
};

function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;
  mount.innerHTML = `
    <div class="footer__inner">
      <span class="footer__brand">Anna Kalil</span>
      <ul class="footer__links">
        <li><a class="footer__link" href="${SITE_LINKS.substack}" target="_blank" rel="noopener">Substack</a></li>
        <li><a class="footer__link" href="${SITE_LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn</a></li>
        <li><a class="footer__link" href="${SITE_LINKS.github}" target="_blank" rel="noopener">GitHub</a></li>
      </ul>
      <p class="footer__copy">Cross traffic does not stop. &nbsp;·&nbsp; 🚧 Site under construction.</p>
    </div>
  `;
}

function renderCtaLinks() {
  const mount = document.getElementById('cta-links');
  if (!mount) return;
  mount.innerHTML = `
    <a class="btn btn--ghost" href="${SITE_LINKS.substack}" target="_blank" rel="noopener">Substack</a>
    <a class="btn btn--ghost" href="${SITE_LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
    <a class="btn btn--ghost" href="${SITE_LINKS.github}" target="_blank" rel="noopener">GitHub</a>
  `;
}

function renderSubstackCta() {
  const mount = document.getElementById('substack-cta');
  if (!mount) return;
  mount.innerHTML = `Read more on <a class="writing__cta-link" href="${SITE_LINKS.substack}" target="_blank" rel="noopener">Substack</a>.`;
}

// Cookieless traffic counting (GoatCounter), no consent prompt needed.
//   live domain      -> counted normally
//   loopback         -> never loads (local dev, Playwright, CI)
//   any other host   -> staging: counted, every path prefixed /staging so it never mixes with live
const ANALYTICS = {
  liveHost: 'pithy-name.github.io',
  counter: 'https://pithy-name.goatcounter.com/count',
  script: 'https://gc.zgo.at/count.js',
  stagingPrefix: '/staging',
};

function loadAnalytics() {
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || location.protocol === 'file:') return;
  if (host !== ANALYTICS.liveHost) {
    // GoatCounter skips private addresses (192.168.x.x) unless told otherwise.
    window.goatcounter = {
      allow_local: true,
      path: (p) => ANALYTICS.stagingPrefix + p,
    };
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = ANALYTICS.script;
  s.dataset.goatcounter = ANALYTICS.counter;
  document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', () => {
  renderFooter();
  renderCtaLinks();
  renderSubstackCta();
  loadAnalytics();
});
