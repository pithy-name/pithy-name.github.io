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

// Cookieless traffic counting (GoatCounter), no annoying opt-in pop-up required.
//   live domain      -> counted normally
//   loopback         -> never loads (local dev, Playwright, CI)
//   any other host   -> staging: counted, every path prefixed /staging so it never mixes with live
//   the 404 page     -> counted as /404/<requested path> (after any /staging prefix)
const ANALYTICS = {
  liveHost: 'pithy-name.github.io',
  counter: 'https://pithy-name.goatcounter.com/count',
  script: 'https://gc.zgo.at/count.js',
  stagingPrefix: '/staging',
};

function loadAnalytics() {
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || location.protocol === 'file:') return;
  const staging = host !== ANALYTICS.liveHost;
  // GitHub Pages serves 404.html at whatever missing URL was requested, so label those
  // hits /404/<requested path>: broken inbound links show up instead of passing as pages.
  const notFound = document.body.dataset.page === '404';
  const prefix = (staging ? ANALYTICS.stagingPrefix : '') + (notFound ? '/404' : '');
  if (staging || notFound) {
    window.goatcounter = {
      // GoatCounter skips private addresses (192.168.x.x) unless told otherwise.
      ...(staging ? { allow_local: true } : {}),
      path: (p) => prefix + p,
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
