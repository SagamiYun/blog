// Mobile Navigation Toggle for Kenosis Theme
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('mobile-menu-toggle');
  var nav = document.getElementById('main-nav');

  if (!toggle || !nav) return;

  function toggleMenu() {
    var isOpen = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking outside
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
});
