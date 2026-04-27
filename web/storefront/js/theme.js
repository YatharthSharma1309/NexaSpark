(function () {
  var STORAGE_KEY = 'nexaspark_theme';
  var ALLOWED = ['light', 'warm', 'dark'];
  var META_COLORS = { light: '#2874f0', warm: '#bf360c', dark: '#1a1a2e' };

  function setMetaTheme(hex) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', hex);
  }

  function apply(theme) {
    var t = ALLOWED.indexOf(theme) >= 0 ? theme : 'light';
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch (_) {}
    setMetaTheme(META_COLORS[t] || META_COLORS.light);
    document.querySelectorAll('[data-theme-select]').forEach(function (sel) {
      sel.value = t;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-select]').forEach(function (sel) {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && ALLOWED.indexOf(saved) >= 0) sel.value = saved;
        else sel.value = document.documentElement.getAttribute('data-theme') || 'light';
      } catch (_) {
        sel.value = 'light';
      }
      sel.addEventListener('change', function () {
        apply(sel.value);
      });
    });
  });

  window.NexaSparkTheme = { apply: apply, allowed: ALLOWED };
})();
