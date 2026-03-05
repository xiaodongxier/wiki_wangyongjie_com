(function () {
  function animateCounter(node) {
    if (node.dataset.done === '1') return;
    node.dataset.done = '1';

    var target = Number(node.dataset.count || 0);
    var duration = 1100;
    var start = performance.now();

    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function addTilt(item) {
    item.addEventListener('pointermove', function (event) {
      var rect = item.getBoundingClientRect();
      var px = (event.clientX - rect.left) / rect.width;
      var py = (event.clientY - rect.top) / rect.height;
      var rx = (0.5 - py) * 7;
      var ry = (px - 0.5) * 8;
      item.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    });

    item.addEventListener('pointerleave', function () {
      item.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)';
    });
  }

  function addMagnetic(button) {
    button.addEventListener('pointermove', function (event) {
      var rect = button.getBoundingClientRect();
      var x = event.clientX - rect.left - rect.width / 2;
      var y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = 'translate(' + x * 0.12 + 'px, ' + y * 0.16 + 'px)';
    });

    button.addEventListener('pointerleave', function () {
      button.style.transform = 'translate(0, 0)';
    });
  }

  function initHomePage() {
    var hero = document.querySelector('.hero');
    var isHome = Boolean(hero);
    document.body.classList.toggle('home-page', isHome);

    if (!isHome || hero.dataset.bound === '1') return;
    hero.dataset.bound = '1';

    var revealItems = document.querySelectorAll('[data-reveal]');
    var tiltItems = document.querySelectorAll('[data-tilt]');
    var magneticButtons = document.querySelectorAll('.magnetic');
    var counters = document.querySelectorAll('.count[data-count]');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion) {
      hero.addEventListener('pointermove', function (event) {
        var rect = hero.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) * 100;
        var y = ((event.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--mx', x + '%');
        hero.style.setProperty('--my', y + '%');
      });

      tiltItems.forEach(addTilt);
      magneticButtons.forEach(addMagnetic);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      revealItems.forEach(function (item) {
        observer.observe(item);
      });

      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      counters.forEach(function (node) {
        counterObserver.observe(node);
      });
    } else {
      revealItems.forEach(function (item) {
        item.classList.add('is-visible');
      });
      counters.forEach(animateCounter);
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
