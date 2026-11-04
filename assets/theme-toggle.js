/* Dark-mode toggle (from the Cross Traffic design system).
   Load in <head>, not deferred, so the theme is set before first paint.
   The choice is stored in localStorage('ct-theme') and shared by every page
   on the origin; with no stored choice, the OS prefers-color-scheme decides.
   The button is styled by .theme-toggle in style.css. */
(function () {
  var root = document.documentElement;
  try {
    var t = localStorage.getItem('ct-theme');
    var dark = t === 'dark' || (!t && window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) root.dataset.theme = 'dark';
  } catch (e) {}

  function mount() {
    if (document.getElementById('theme-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Dark mode');
    function sync() {
      var d = root.dataset.theme === 'dark';
      btn.setAttribute('aria-pressed', d ? 'true' : 'false');
      btn.textContent = d ? '☀ Light' : '☾ Dark';
    }
    btn.addEventListener('click', function () {
      var d = root.dataset.theme === 'dark';
      if (d) { delete root.dataset.theme; } else { root.dataset.theme = 'dark'; }
      try { localStorage.setItem('ct-theme', d ? 'light' : 'dark'); } catch (e) {}
      sync();
    });
    sync();
    document.body.appendChild(btn);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
