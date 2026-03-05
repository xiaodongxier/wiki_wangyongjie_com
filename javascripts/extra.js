(function () {
  function initHomePage() {
    const hero = document.querySelector('.hero');
    const isHome = Boolean(hero);

    document.body.classList.toggle('home-page', isHome);
    if (!isHome || hero.dataset.bound === '1') return;

    hero.dataset.bound = '1';

    const revealItems = document.querySelectorAll('[data-reveal]');
    const tiltItems = document.querySelectorAll('[data-tilt]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion) {
      hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--mx', x + '%');
        hero.style.setProperty('--my', y + '%');
      });

      tiltItems.forEach((item) => {
        item.addEventListener('pointermove', (event) => {
          const rect = item.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          const rx = (0.5 - py) * 7;
          const ry = (px - 0.5) * 8;
          item.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        });

        item.addEventListener('pointerleave', () => {
          item.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)';
        });
      });
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      revealItems.forEach((item) => observer.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    }
  }

  if (window.document$ && typeof window.document$.subscribe === 'function') {
    window.document$.subscribe(initHomePage);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
  } else {
    initHomePage();
  }
})();
