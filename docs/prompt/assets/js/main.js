/* ============================================================
   大模型提示词工程 · 交互脚本（无依赖，事件委托）
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. 深浅色主题 ---------- */
  var THEME_KEY = 'pe-theme';
  var meta = $('#themeColorMeta');
  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      if (meta) meta.setAttribute('content', '#0e141b');
      $('#themeBtn').textContent = '☀️';
    } else {
      root.removeAttribute('data-theme');
      if (meta) meta.setAttribute('content', '#1F4E79');
      $('#themeBtn').textContent = '🌙';
    }
  }
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(sysDark ? 'dark' : 'light');
  }
  $('#themeBtn').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  /* ---------- 2. 阅读进度条 ---------- */
  var progress = $('#progress');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct + '%';
    if (toTop) toTop.classList.toggle('show', h.scrollTop > 400);
  }

  /* ---------- 3. 侧栏滚动高亮 ---------- */
  var tocLinks = $$('.toc a');
  var linkMap = {};
  tocLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id) linkMap[id] = a;
  });
  function setActive(id) {
    tocLinks.forEach(function (a) { a.classList.remove('active'); });
    if (linkMap[id]) linkMap[id].classList.add('active');
  }
  var sections = $$('.content > section[id]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-72px 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- 4. 移动端抽屉 ---------- */
  var body = document.body;
  var backdrop = $('#backdrop');
  function openDrawer() { body.classList.add('toc-open'); backdrop.classList.add('open'); }
  function closeDrawer() { body.classList.remove('toc-open'); backdrop.classList.remove('open'); }
  $('#menuBtn').addEventListener('click', openDrawer);
  backdrop.addEventListener('click', closeDrawer);
  tocLinks.forEach(function (a) { a.addEventListener('click', closeDrawer); });

  /* ---------- 5. 标签页 ---------- */
  $$('.tabs').forEach(function (tabs) {
    var group = tabs.getAttribute('data-group');
    var btns = $$('.tab', tabs);
    var panels = group
      ? $$('.panels[data-group="' + group + '"] .panel')
      : $$('.panels .panel');
    // 关联到最近的 .panels
    var panelWrap = tabs.nextElementSibling;
    if (panelWrap && panelWrap.classList.contains('panels')) panels = $$('.panel', panelWrap);
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-t');
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (panelWrap) {
          $$('.panel', panelWrap).forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('data-p') === t);
          });
        }
      });
    });
  });

  /* ---------- 6. 全文搜索 ---------- */
  var searchInput = $('#searchInput');
  var searchResults = $('#searchResults');
  var index = sections.map(function (s) {
    var h = $('.chap', s) || s.querySelector('h2,h3');
    return {
      id: s.id,
      title: h ? h.textContent.trim() : s.id,
      text: s.textContent.replace(/\s+/g, ' ').trim(),
      el: s
    };
  });
  function makeSnippet(text, q) {
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text.slice(0, 80);
    var start = Math.max(0, i - 30);
    var end = Math.min(text.length, i + q.length + 50);
    var pre = (start > 0 ? '…' : '') + text.slice(start, i);
    var hit = text.slice(i, i + q.length);
    var post = text.slice(i + q.length, end) + (end < text.length ? '…' : '');
    return pre + '<mark>' + hit + '</mark>' + post;
  }
  function doSearch() {
    var q = searchInput.value.trim();
    if (q.length < 1) { searchResults.classList.remove('open'); searchResults.innerHTML = ''; return; }
    var ql = q.toLowerCase();
    var hits = index.filter(function (it) { return it.text.toLowerCase().indexOf(ql) >= 0; }).slice(0, 8);
    if (!hits.length) {
      searchResults.innerHTML = '<div class="sr-empty">没有找到「' + q + '」相关内容</div>';
      searchResults.classList.add('open');
      return;
    }
    searchResults.innerHTML = hits.map(function (it) {
      return '<a class="sr-item" role="option" data-id="' + it.id + '">' +
        '<div class="sr-sec">' + it.title + '</div>' +
        '<div class="sr-snip">' + makeSnippet(it.text, q) + '</div></a>';
    }).join('');
    searchResults.classList.add('open');
  }
  function revealIn(el, q) {
    // 展开含关键词的折叠块
    $$('details', el).forEach(function (d) {
      if (!d.open && d.textContent.toLowerCase().indexOf(q.toLowerCase()) >= 0) d.open = true;
    });
    // 激活含关键词的未激活标签
    $$('.tabs', el).forEach(function (tabs) {
      var wrap = tabs.nextElementSibling;
      if (!wrap || !wrap.classList.contains('panels')) return;
      $$('.panel', wrap).forEach(function (p) {
        if (p.classList.contains('active')) return;
        if (p.textContent.toLowerCase().indexOf(q.toLowerCase()) >= 0) {
          var t = p.getAttribute('data-p');
          $$('.tab', tabs).forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-t') === t); });
          $$('.panel', wrap).forEach(function (pp) { pp.classList.toggle('active', pp === p); });
        }
      });
    });
  }
  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
    el.addEventListener('animationend', function handler() {
      el.classList.remove('flash');
      el.removeEventListener('animationend', handler);
    });
  }
  searchInput.addEventListener('input', doSearch);
  searchResults.addEventListener('click', function (e) {
    var item = e.target.closest('.sr-item');
    if (!item) return;
    var id = item.getAttribute('data-id');
    var el = document.getElementById(id);
    var q = searchInput.value.trim();
    if (el) {
      revealIn(el, q);
      closeDrawer();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flash(el);
    }
    searchResults.classList.remove('open');
  });

  /* ---------- 7. 复制按钮 ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    var card = btn.closest('.prompt-card');
    var pre = card ? card.querySelector('pre') : null;
    var text = pre ? pre.innerText : '';
    function ok() {
      var old = btn.textContent;
      btn.textContent = '已复制 ✓';
      btn.classList.add('done');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('done'); }, 1400);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (err) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else { fallback(); }
  });

  /* ---------- 8. 练习清单 ---------- */
  var EX_KEY = 'pe-exercise';
  var exBoxes = $$('#exList input[type=checkbox]');
  var exPill = $('#exProgress');
  function saveEx() {
    var state = exBoxes.map(function (b) { return b.checked ? b.id : null; }).filter(Boolean);
    try { localStorage.setItem(EX_KEY, JSON.stringify(state)); } catch (e) {}
    var n = exBoxes.filter(function (b) { return b.checked; }).length;
    if (exPill) exPill.textContent = n + ' / ' + exBoxes.length;
  }
  try {
    var saved2 = JSON.parse(localStorage.getItem(EX_KEY) || '[]');
    exBoxes.forEach(function (b) { if (saved2.indexOf(b.id) >= 0) b.checked = true; });
  } catch (e) {}
  exBoxes.forEach(function (b) { b.addEventListener('change', saveEx); });
  saveEx();

  /* ---------- 9. 图片灯箱 ---------- */
  var lightbox = $('#lightbox');
  var lbImg = $('#lbImg');
  document.addEventListener('click', function (e) {
    var fig = e.target.closest('.inst-img');
    if (!fig) return;
    var img = fig.querySelector('img');
    if (!img) return;
    lbImg.src = img.src; lbImg.alt = img.alt || '';
    lightbox.classList.add('open');
  });
  function closeLightbox() { lightbox.classList.remove('open'); lbImg.src = ''; }
  $('#lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

  /* ---------- 10. 回到顶部 ---------- */
  var toTop = $('#toTop');
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- 11. 键盘快捷键 ---------- */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
      e.preventDefault(); searchInput.focus(); searchInput.select();
    } else if (e.key === 'Escape') {
      if (lightbox.classList.contains('open')) closeLightbox();
      closeDrawer();
      searchResults.classList.remove('open');
      if (document.activeElement === searchInput) searchInput.blur();
    }
  });
  // 点击搜索框外部关闭结果
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search')) searchResults.classList.remove('open');
  });

  /* ---------- 滚动监听 ---------- */
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
