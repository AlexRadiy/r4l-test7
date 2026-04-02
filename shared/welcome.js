/* welcome.js */
/* ===============================
   welcome.js — Welcome page logic
   - Hero video: no loop, fade to poster on last 2s, replay on scroll back
   - Scroll-down button
   - Scroll-past-hero detection for CTA/nav
   =============================== */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  /* ---- Hero video: fade to poster on end, replay on scroll into view ---- */
  const video = $('.hero__video');
  if (video) {
    // Remove loop if it was set via attribute (also removed in HTML, belt-and-suspenders)
    video.removeAttribute('loop');

    // Check if hero was already shown in this session — if so, show button immediately
    const heroShownOnce = sessionStorage.getItem('heroShownOnce');
    const caseBtn = document.getElementById('hero-case2-btn');
    if (heroShownOnce && caseBtn) {
      caseBtn.style.display = 'flex';
    }

    // Try to autoplay immediately (most browsers allow muted autoplay)
    video.play().catch(() => {
      // Autoplay blocked; will play when user scrolls or interacts
    });

    let fadeStarted = false;

    // Monitor time to start fading 2 seconds before the end
    video.addEventListener('timeupdate', () => {
      // Check if video duration is available and we are within the last 2 seconds
      if (!fadeStarted && video.duration && (video.duration - video.currentTime <= 1)) {
        fadeStarted = true;
        video.style.transition = 'opacity 1s ease';
        video.style.opacity = '0';
        
        // Show the button as soon as the fade starts
        if (caseBtn) {
          caseBtn.style.display = 'flex';
          sessionStorage.setItem('heroShownOnce', '1');
        }
      }
    });

    // Fallback for when the video completely ends
    video.addEventListener('ended', () => {
      if (!fadeStarted) {
        video.style.transition = 'opacity 2s ease';
        video.style.opacity = '0';
      }
      if (caseBtn) {
        caseBtn.style.display = 'flex';
        sessionStorage.setItem('heroShownOnce', '1');
      }
    });

    const heroSection = video.closest('.hero') || $('section#hero');
    if (heroSection) {
      const videoIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Reset state when scrolled back into view
              fadeStarted = false;
              video.style.transition = 'none'; // Remove transition to snap opacity back immediately
              
              // Force reflow so the transition removal takes effect before opacity change
              void video.offsetWidth; 
              
              video.style.opacity = '1';
              video.currentTime = 0;
              video.play().catch(() => {});
              
              // Only hide button if hero has never been fully shown yet
              if (!sessionStorage.getItem('heroShownOnce') && caseBtn) {
                caseBtn.style.display = 'none';
              }
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.1 }
      );
      videoIO.observe(heroSection);
    }
  }

  /* ---- Scroll-past-hero detection (shows CTA floating button) ---- */
  const heroEl = $('section#hero') || $('.hero');
  function updateScrolledPastHero() {
    if (!heroEl) {
      document.body.classList.add('scrolled-past-hero');
      return;
    }
    const heroBottom = heroEl.getBoundingClientRect().bottom;
    if (heroBottom <= 0) {
      document.body.classList.add('scrolled-past-hero');
    } else {
      document.body.classList.remove('scrolled-past-hero');
    }
  }
  window.addEventListener('scroll', updateScrolledPastHero, { passive: true });
  updateScrolledPastHero();

  /* ---- Scroll-down arrow ---- */
  const scrollBtn = $('#scroll-next');
  const nextSection = document.querySelector('.section--value') || document.querySelector('section:nth-of-type(2)');
  if (scrollBtn && nextSection) {
    scrollBtn.addEventListener('click', () => {
      // Adjust offset for fixed nav
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 60;
      const top = nextSection.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

})();