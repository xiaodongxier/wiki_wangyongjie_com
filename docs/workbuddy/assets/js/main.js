/* ===========================================================
   WorkBuddy 培训手册 · 交互脚本
   =========================================================== */
(function () {
  'use strict';

  /* ---------- 主题（深/浅色） ---------- */
  var themeBtn = document.getElementById('themeBtn');
  var themeColor = document.getElementById('themeColor');

  function applyTheme(mode) {
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeBtn.textContent = '☀️';
      themeBtn.setAttribute('aria-label', '切换为浅色');
      if (themeColor) themeColor.setAttribute('content', '#0e141b');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeBtn.textContent = '🌙';
      themeBtn.setAttribute('aria-label', '切换为深色');
      if (themeColor) themeColor.setAttribute('content', '#1F4E79');
    }
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem('wb_theme'); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  themeBtn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('wb_theme', next); } catch (e) {}
  });

  /* ---------- 阅读进度条 + 回到顶部 ---------- */
  var progress = document.getElementById('progress');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var sc = max > 0 ? h.scrollTop / max : 0;
    progress.style.width = (sc * 100) + '%';
    toTop.classList.toggle('show', h.scrollTop > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- 目录：滚动高亮 ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('aside.toc a'));
  var linkMap = {};
  tocLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (document.getElementById(id)) linkMap[id] = a;
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove('active'); });
          var a = linkMap[e.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-18% 0px -70% 0px', threshold: 0 });
    Object.keys(linkMap).forEach(function (id) { obs.observe(document.getElementById(id)); });
  }

  /* ---------- 移动端目录抽屉 ---------- */
  var toc = document.getElementById('toc');
  var backdrop = document.getElementById('tocBackdrop');
  var menuBtn = document.getElementById('menuBtn');

  function openToc() { toc.classList.add('open'); backdrop.classList.add('show'); }
  function closeToc() { toc.classList.remove('open'); backdrop.classList.remove('show'); }

  menuBtn.addEventListener('click', function () {
    toc.classList.contains('open') ? closeToc() : openToc();
  });
  backdrop.addEventListener('click', closeToc);
  tocLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.innerWidth <= 880) closeToc();
    });
  });

  /* ---------- 通用标签页 ---------- */
  function initTabs(tabsSelector, panelsSelector, defaultKey) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(tabsSelector));
    var panels = Array.prototype.slice.call(document.querySelectorAll(panelsSelector));
    if (!tabs.length || !panels.length) return;
    function activate(key) {
      tabs.forEach(function (x) { x.classList.toggle('active', x.dataset.t === key); });
      panels.forEach(function (p) { p.classList.toggle('active', p.dataset.p === key); });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t.dataset.t); });
    });
    activate(defaultKey || tabs[0].dataset.t);
    return activate;
  }

  var sceneActivate = initTabs('#sceneTabs .tab', '#scene .panel', 'ops');
  var installActivate = initTabs('#installTabs .tab', '#install .panel', 'win');

  /* ---------- 复制 ---------- */
  function fallbackCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function copyText(txt, btn) {
    var old = btn.textContent;
    var done = function () {
      btn.textContent = '已复制 ✓';
      btn.classList.add('done');
      setTimeout(function () {
        btn.textContent = old;
        btn.classList.remove('done');
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
    } else {
      fallbackCopy(txt);
      done();
    }
  }

  // Prompt 速查卡
  document.querySelectorAll('.pcard .copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.parentElement.querySelector('.ptext');
      if (t) copyText(t.textContent.trim(), btn);
    });
  });

  // 场景例句
  document.querySelectorAll('.panel li .mini').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.parentElement.querySelector('.ex');
      if (t) copyText(t.textContent.trim(), btn);
    });
  });

  /* ---------- 练习清单（本地保存进度） ---------- */
  var checklist = document.getElementById('checklist');
  if (checklist) {
    var boxes = Array.prototype.slice.call(checklist.querySelectorAll('input[type="checkbox"]'));
    var pgFill = document.getElementById('pgFill');
    var pgText = document.getElementById('pgText');
    var pgReset = document.getElementById('pgReset');

    function refresh() {
      var n = 0;
      boxes.forEach(function (cb) {
        cb.closest('li').classList.toggle('on', cb.checked);
        if (cb.checked) n++;
      });
      pgText.textContent = '已完成 ' + n + ' / ' + boxes.length;
      pgFill.style.width = (n / boxes.length * 100) + '%';
    }

    boxes.forEach(function (cb) {
      var key = 'wb_ex_' + cb.dataset.k;
      try { cb.checked = localStorage.getItem(key) === '1'; } catch (e) {}
      cb.addEventListener('change', function () {
        try { localStorage.setItem(key, cb.checked ? '1' : '0'); } catch (e) {}
        refresh();
      });
    });

    pgReset.addEventListener('click', function () {
      boxes.forEach(function (cb) {
        cb.checked = false;
        try { localStorage.removeItem('wb_ex_' + cb.dataset.k); } catch (e) {}
      });
      refresh();
    });

    refresh();
  }

  /* ---------- 全文搜索 ---------- */
  var input = document.getElementById('siteSearch');
  var resBox = document.getElementById('searchRes');
  var searchWrap = document.getElementById('searchWrap');
  var searchBtn = document.getElementById('searchBtn');
  var searchClose = document.getElementById('searchClose');

  function pureText(el) {
    var c = el.cloneNode(true);
    c.querySelectorAll('button').forEach(function (b) { b.parentNode.removeChild(b); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  // 建立索引
  var index = [];
  document.querySelectorAll('main section').forEach(function (sec) {
    var h2 = sec.querySelector('h2.chap');
    var chap = h2 ? h2.textContent.trim() : '';
    sec.querySelectorAll('p, li, td, h3.sub, summary, .ans, .ptext').forEach(function (el) {
      var t = pureText(el);
      if (t.length > 3) index.push({ chap: chap, id: sec.id, text: t, el: el });
    });
  });

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function snippet(text, q) {
    var i = text.toLowerCase().indexOf(q);
    var start = Math.max(0, i - 24);
    var end = Math.min(text.length, i + q.length + 46);
    var s = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    var pos = s.toLowerCase().indexOf(q);
    if (pos < 0) return escapeHtml(s);
    return escapeHtml(s.slice(0, pos)) +
      '<mark>' + escapeHtml(s.slice(pos, pos + q.length)) + '</mark>' +
      escapeHtml(s.slice(pos + q.length));
  }

  function reveal(el) {
    // 若命中内容在未激活的标签页里，先切换过去
    var panel = el.closest ? el.closest('.panel') : null;
    if (panel && !panel.classList.contains('active')) {
      var group = panel.closest('section');
      if (group && group.id === 'scene' && sceneActivate) sceneActivate(panel.dataset.p);
      if (group && group.id === 'install' && installActivate) installActivate(panel.dataset.p);
    }
    // 若在折叠的 FAQ 里，先展开
    var det = el.closest ? el.closest('details') : null;
    if (det) det.open = true;

    setTimeout(function () {
      var top = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
      el.classList.add('flash');
      setTimeout(function () { el.classList.remove('flash'); }, 1900);
    }, 60);
  }

  function runSearch() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 1) { resBox.classList.remove('show'); resBox.innerHTML = ''; return; }

    var hits = [];
    for (var i = 0; i < index.length && hits.length < 12; i++) {
      if (index[i].text.toLowerCase().indexOf(q) >= 0) hits.push(index[i]);
    }

    if (!hits.length) {
      resBox.innerHTML = '<div class="sr-empty">没有找到“' + escapeHtml(input.value.trim()) + '”相关内容</div>';
      resBox.classList.add('show');
      return;
    }

    resBox.innerHTML = '';
    hits.forEach(function (h) {
      var a = document.createElement('a');
      a.href = 'javascript:void(0)';
      a.innerHTML = '<div class="sr-chap">' + escapeHtml(h.chap) + '</div>' +
        '<div class="sr-txt">' + snippet(h.text, q) + '</div>';
      a.addEventListener('click', function () {
        resBox.classList.remove('show');
        if (window.innerWidth <= 880) searchWrap.classList.remove('show');
        reveal(h.el);
      });
      resBox.appendChild(a);
    });
    resBox.classList.add('show');
  }

  input.addEventListener('input', runSearch);
  input.addEventListener('focus', function () { if (input.value.trim()) runSearch(); });

  document.addEventListener('click', function (e) {
    if (!searchWrap.contains(e.target) && e.target !== searchBtn) resBox.classList.remove('show');
  });

  searchBtn.addEventListener('click', function () {
    searchWrap.classList.add('show');
    input.focus();
  });
  searchClose.addEventListener('click', function () {
    searchWrap.classList.remove('show');
    resBox.classList.remove('show');
    input.value = '';
  });

  // 键盘：/ 聚焦搜索，Esc 关闭
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      if (window.innerWidth <= 880) searchWrap.classList.add('show');
      input.focus();
    } else if (e.key === 'Escape') {
      resBox.classList.remove('show');
      input.blur();
      if (window.innerWidth <= 880) searchWrap.classList.remove('show');
      closeToc();
    }
  });

  onScroll();

  /* ---------- 图片：原生懒加载，JS 只做兜底 ----------
     图片已直接写 src + loading="lazy"，即使本文件加载失败也能正常显示。
     下面仅兼容极端情况：浏览器拿到了旧版缓存 HTML（图片写的是 data-src）。 */
  Array.prototype.slice.call(document.querySelectorAll('img[data-src]')).forEach(function (img) {
    if (!img.getAttribute('src')) img.src = img.getAttribute('data-src');
    img.classList.add('loaded');
  });

  // 图片加载失败时给出可见提示，避免用户面对一片空白不知所措
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'IMG' && !el.dataset.failed) {
      el.dataset.failed = '1';
      el.alt = '图片加载失败，请刷新页面重试';
      el.style.minHeight = '80px';
      el.style.border = '1px dashed #c00';
    }
  }, true);

  // 灯箱放大
  var imgWrap = document.createElement('div');
  imgWrap.className = 'img-wrap';
  imgWrap.innerHTML = '<button class="imgClose" aria-label="关闭">✕</button><img src="" alt="">';
  document.body.appendChild(imgWrap);
  var imgWrapImg = imgWrap.querySelector('img');
  var imgWrapClose = imgWrap.querySelector('.imgClose');
  function closeLightbox() { imgWrap.classList.remove('show'); imgWrapImg.src = ''; }
  imgWrapClose.addEventListener('click', closeLightbox);
  imgWrap.addEventListener('click', function (e) { if (e.target === imgWrap) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

  document.querySelectorAll('.inst-img').forEach(function (img) {
    img.addEventListener('click', function () {
      imgWrapImg.src = img.src;
      imgWrapImg.alt = img.alt || '';
      imgWrap.classList.add('show');
    });
  });
})();
