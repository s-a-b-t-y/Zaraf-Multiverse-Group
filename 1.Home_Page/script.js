/* ═══════════════════════════════════════════
   ZARAF MULTIVERSE GROUP — HOMEPAGE SCRIPTS
═══════════════════════════════════════════ */

/* ── Navbar: scroll state + active link ── */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('navLinks');

// Scroll state for navbar background
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// Efficient active nav link highlight using IntersectionObserver
const activeNavObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === id);
      });
    }
  });
}, { threshold: 0.5, rootMargin: '-72px 0px 0px 0px' });

sections.forEach(sec => activeNavObserver.observe(sec));

/* ── Hamburger menu ── */
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinksContainer.classList.toggle('open');
});

// Close menu on link click (mobile)
navLinksContainer.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinksContainer.classList.remove('open');
  });
});

/* ── Scroll-reveal animations ── */
const animElements = document.querySelectorAll('[data-animate]');

window.observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const delay = el.dataset.delay || 0;
      setTimeout(() => el.classList.add('animated'), parseInt(delay));
      window.observer.unobserve(el);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

animElements.forEach(el => window.observer.observe(el));


/* ── Counter animation for hero stats ── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const start = performance.now();

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };

  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('.stat-number[data-target]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

counters.forEach(c => counterObserver.observe(c));

/* ── Social icons: ripple click effect ── */
document.querySelectorAll('.social-icon').forEach(icon => {
  icon.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute;border-radius:50%;
      background:rgba(255,255,255,0.3);
      width:80px;height:80px;
      left:${e.offsetX - 40}px;top:${e.offsetY - 40}px;
      transform:scale(0);animation:rippleAnim 0.5s ease forwards;
      pointer-events:none;z-index:10;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Inject ripple keyframe once
const rippleStyle = document.createElement('style');
rippleStyle.textContent = '@keyframes rippleAnim{to{transform:scale(1.5);opacity:0}}';
document.head.appendChild(rippleStyle);

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── Footer service links: subtle glow on hover ── */
document.querySelectorAll('.footer-list a').forEach(link => {
  link.addEventListener('mouseenter', function () {
    this.style.textShadow = '0 0 12px rgba(201,168,76,0.4)';
  });
  link.addEventListener('mouseleave', function () {
    this.style.textShadow = 'none';
  });
});

/* ── Contact Modal ── */
const contactOverlay = document.getElementById('contactModalOverlay');

function openContactModal() {
  contactOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Close mobile menu if open
  hamburger.classList.remove('open');
  navLinksContainer.classList.remove('open');
}

function closeContactModal(e) {
  // If called from overlay click, only close when clicking the backdrop itself
  if (e && e.target !== contactOverlay) return;
  contactOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    contactOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});
