const header = document.querySelector('header');
const burger = document.querySelector('.burger');
const mobileNav = document.querySelector('.mobile-nav');

function normalizePath(pathname) {
  const cleaned = String(pathname || '').replace(/\/$/, '');

  if (!cleaned || cleaned === '/index' || cleaned === '/index.html') {
    return '/';
  }

  return cleaned.replace(/\.html$/, '');
}

function setActiveLink(link, isActive) {
  link.classList.toggle('nav__link--active', isActive);

  if (isActive) {
    link.setAttribute('aria-current', 'page');
    return;
  }

  link.removeAttribute('aria-current');
}

function updateActiveLinks() {
  const currentPath = normalizePath(window.location.pathname);

  document.querySelectorAll('.menu a[href]').forEach((link) => {
    const href = normalizePath(link.getAttribute('href') || '');
    setActiveLink(link, href === currentPath);
  });

  document.querySelectorAll('.mobile-nav a[href]').forEach((link) => {
    const href = normalizePath(link.getAttribute('href') || '');
    setActiveLink(link, href === currentPath);
  });
}

function closeMobileMenu() {
  if (!mobileNav || !burger) {
    return;
  }

  mobileNav.classList.remove('mobile-nav--open');
  burger.setAttribute('aria-expanded', 'false');
}

function openMobileMenu() {
  if (!mobileNav || !burger) {
    return;
  }

  mobileNav.classList.add('mobile-nav--open');
  burger.setAttribute('aria-expanded', 'true');
}

function toggleMobileMenu() {
  if (!mobileNav || !burger) {
    return;
  }

  const isOpen = mobileNav.classList.toggle('mobile-nav--open');
  burger.setAttribute('aria-expanded', String(isOpen));
}

if (burger) {
  burger.setAttribute('aria-expanded', 'false');
  burger.addEventListener('click', toggleMobileMenu);
}

if (mobileNav) {
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMobileMenu();
  }
});

window.addEventListener('scroll', () => {
  if (!header) {
    return;
  }

  header.classList.toggle('scrolled', window.scrollY > 16);
});

updateActiveLinks();
