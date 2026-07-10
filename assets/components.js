const SITE_LINKS = {
  linkedin: 'https://www.linkedin.com/in/annakalil/',
  substack: 'https://crosstrafficdoesnotstop.substack.com/about',
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
  mount.innerHTML = `Read more on <a class="placeholder-token" href="${SITE_LINKS.substack}" target="_blank" rel="noopener" style="border-bottom-style: solid;">Substack</a>.`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderFooter();
  renderCtaLinks();
  renderSubstackCta();
});
