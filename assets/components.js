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
const ANALYTICS = {
  liveHost: 'pithy-name.github.io',
  counter: 'https://pithy-name.goatcounter.com/count',
  script: 'https://gc.zgo.at/count.js',
  stagingPrefix: '/staging',
};

// Mark every link that leaves the site so GoatCounter records the click as an event.
// Event path: /outbound/<host><path>, or /staging/outbound/... off the live domain.
// The staging prefix is written into the name because GoatCounter's path callback does
// not apply to click events. Title: link text plus the page it was clicked on.
// Runs before count.js loads, so GoatCounter binds every tagged link, including the
// footer and contact links rendered above.
function tagOutboundLinks() {
  const prefix = location.hostname === ANALYTICS.liveHost ? '' : ANALYTICS.stagingPrefix;
  document.querySelectorAll('a[href]').forEach((a) => {
    if (!/^https?:$/.test(a.protocol) || a.hostname === ANALYTICS.liveHost || a.hostname === location.hostname) return;
    a.dataset.goatcounterClick = `${prefix}/outbound/${a.hostname}${a.pathname}`;
    a.dataset.goatcounterTitle = `${a.textContent.trim()} (from ${location.pathname})`;
  });
}

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
  tagOutboundLinks();
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
