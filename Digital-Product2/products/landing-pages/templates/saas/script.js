/* ============================================================
   SAAS TEMPLATE — JavaScript
   Minimal, dependency-free JS for interactivity.

   Features:
   - Mobile menu toggle
   - Smooth scroll to sections (with nav offset)
   - FAQ accordion toggle
   - Scroll-reveal animations
   - Nav background on scroll

   NOTE: This file is optional. The page works without JS —
   the FAQ just won't have smooth open/close animations.
   ============================================================ */

(function () {
  'use strict';

  // ======================== MOBILE MENU ========================
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      const isOpen = navMobile.classList.toggle('open');
      navToggle.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when a link is clicked
    const mobileLinks = navMobile.querySelectorAll('.nav-mobile-link');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navMobile.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ======================== FAQ ACCORDION ========================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    question.addEventListener('click', function () {
      const isOpen = item.classList.contains('open');

      // Close all other FAQ items
      faqItems.forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.faq-question');
          const otherAnswer = other.querySelector('.faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAnswer) otherAnswer.hidden = true;
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('open');
        question.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
      } else {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
      }
    });
  });

  // ======================== SCROLL REVEAL ========================
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show all elements if IntersectionObserver is not supported
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ======================== NAV SCROLL EFFECT ========================
  // Optional: Add a subtle border/shadow to nav when scrolled
  const nav = document.getElementById('nav');

  if (nav) {
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
      const currentScroll = window.scrollY;

      if (currentScroll > 50) {
        nav.style.borderBottomColor = 'rgba(255, 255, 255, 0.06)';
        nav.style.boxShadow = '0 1px 12px rgba(0, 0, 0, 0.3)';
      } else {
        nav.style.borderBottomColor = '';
        nav.style.boxShadow = '';
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

})();
