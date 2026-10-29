// ============================================
// 配置
// ============================================
const PAGE_SIZE = 20;
let currentPage = 1;

const notes = [
    { title: '<font style=\'color:green\'>【置顶】<\/font>本站故事', date: '2026-10-15 23:37:53', link: 'readme.md', category: '技术' },
    { title: '<font style=\'color:red\'>【强推】<\/font>软件推荐', date: '2026-10-15 23:37:58', link: 'blog/软件推荐.md', category: '分享' },
    { title: 'QRhi', date: '2026-10-16 00:07:54', link: 'blog/QRhi.md', category: '技术' },
    { title: '颜值即胜利', date: '2026-10-17 20:17:05', link: 'blog/颜值即胜利.md', category: '生活' },
    { title: 'Qt的pro文件配置', date: '2026-10-29 08:43:03', link: 'blog/Qt的pro文件配置.md', category: '技术' },
    { title: '第六篇笔记', date: '2024-01-06', link: 'notes/note6.md', category: '随笔' },
    { title: '第七篇笔记', date: '2024-01-07', link: 'notes/note7.md', category: '技术' },
    { title: '第八篇笔记', date: '2024-01-08', link: 'notes/note8.md', category: '生活' },
    { title: '第九篇笔记', date: '2024-01-09', link: 'notes/note9.md', category: '技术' },
    { title: '第十篇笔记', date: '2024-01-10', link: 'notes/note10.md', category: '随笔' },
    { title: '第十一篇笔记', date: '2024-01-11', link: 'notes/note11.md', category: '技术' },
    { title: '第十二篇笔记', date: '2024-01-12', link: 'notes/note12.md', category: '生活' },
    { title: '第十篇笔记', date: '2024-01-10', link: 'notes/note10.md', category: '随笔' },
    { title: '第十一篇笔记', date: '2024-01-11', link: 'notes/note11.md', category: '技术' },
    { title: '第十二篇笔记', date: '2024-01-12', link: 'notes/note12.md', category: '生活' },
    { title: '第六篇笔记', date: '2024-01-06', link: 'notes/note6.md', category: '随笔' },
    { title: '第七篇笔记', date: '2024-01-07', link: 'notes/note7.md', category: '技术' },
    { title: '第八篇笔记', date: '2024-01-08', link: 'notes/note8.md', category: '生活' },
    { title: '第九篇笔记', date: '2024-01-09', link: 'notes/note9.md', category: '技术' },
    { title: '第十篇笔记', date: '2024-01-10', link: 'notes/note10.md', category: '随笔' },
    { title: '第十一篇笔记', date: '2024-01-11', link: 'notes/note11.md', category: '技术' },
    { title: '第十二篇笔记', date: '2024-01-12', link: 'notes/note12.md', category: '生活' },
    { title: '第十篇笔记', date: '2024-01-10', link: 'notes/note10.md', category: '随笔' },
    { title: '第十一篇笔记', date: '2024-01-11', link: 'notes/note11.md', category: '技术' },
    { title: '第十二篇笔记', date: '2024-01-12', link: 'notes/note12.md', category: '生活' }
];

// ============================================
// 缓存 & 状态
// ============================================
const cache = new Map();
let md = null;
let filteredNotes = notes.slice();
let searchQuery = '';
let activeCategory = 'all';
let debounceTimer = null;

let fileList, pagination, loading, statsEl, noResultEl;

// ★ 唯一 id 生成器（进程级单例，绝不重复）
const idGen = {
    prefix: 'h-' + Math.random().toString(36).slice(2, 7) + '-',
    seq: 0,
    next: function (hint) {
        var s = (hint || '').replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '') || 'h';
        return this.prefix + s + '-' + (++this.seq);
    }
};

function slug(text) { return idGen.next(text); }
function strip(s) { return String(s || '').replace(/<[^>]+>/g, ''); }

// ============================================
// 跳转速度（改这里全局生效，毫秒，0 = 瞬时）
// ============================================
const SCROLL_DURATION = 0;   // ★ 原来是 smooth 动画，现改为 0

// ★ 瞬时/极速滚动：直接设 scrollTop，无惯性、不排队
function fastScroll(el, top) {
    if (!el) return;
    el.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
}

// ============================================
// Markdown 渲染器
// ============================================
function getMd() {
    if (md) return md;
    if (!window.markdownit) return null;

    md = window.markdownit({
        html: false,
        linkify: true,
        typographer: true,
        highlight: function (code, lang) {
            if (lang && window.hljs && window.hljs.getLanguage(lang)) {
                try { return window.hljs.highlight(code, { language: lang }).value; } catch (e) {}
            }
            if (window.hljs) return window.hljs.highlightAuto(code).value;
            return code;
        }
    });

    var slugger = function (s) { return idGen.next(String(s || '')); };

    if (window.markdownItAnchor) {
        try {
            md.use(window.markdownItAnchor, {
                level: [1, 2, 3],
                slugify: slugger,
                permalink: false,
                tabIndex: false,
                uniqueSlugStartAt: 1
            });
        } catch (e) { console.warn('anchor 插件初始化失败，改用内置锚点', e); }
    }

    md.core.ruler.push('toc_anchor_fallback', function (state) {
        state.tokens.forEach(function (token) {
            if (token.type !== 'heading_open') return;
            if (!token.attrGet('id')) token.attrSet('id', slugger(''));
            token.attrSet('data-toc-head', 'true');
        });
        return false;
    });

    return md;
}

// ============================================
// 弹窗
// ============================================
const Viewer = (function () {
    let overlay = null;

    function init() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'note-viewer';
        overlay.innerHTML = '<div class="viewer-inner">' +
            '<div class="viewer-bar">' +
                '<span class="dot red"></span>' +
                '<span class="dot yellow"></span>' +
                '<span class="dot green"></span>' +
                '<span class="viewer-title" id="viewer-filename"></span>' +
                '<button class="toc-toggle" id="toc-toggle" title="目录 (T)">☰</button>' +
                '<button class="viewer-close" id="viewer-close">[X]</button>' +
            '</div>' +
            '<div class="viewer-layout">' +
                '<aside class="viewer-toc" id="viewer-toc"></aside>' +
                '<div class="viewer-body" id="viewer-content">' +
                    '<div class="loading"><span class="blink">加载中...</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.appendChild(overlay);

        document.getElementById('viewer-close').onclick = close;
        overlay.onclick = function (e) { if (e.target === overlay) close(); };
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('open')) { e.preventDefault(); close(); }
        });
    }

    function open(link, title) {
        init();
        document.getElementById('viewer-filename').textContent = 'cat ' + strip(title);
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        var content = document.getElementById('viewer-content');

        var show = function (html) {
            content.innerHTML = html;
            Toc.refresh();
            ScrollSync.bind(content);
            var hash = (link.split('#')[1] || '');
            jump(hash || Toc.firstId());
        };

        if (cache.has(link)) { show(cache.get(link)); return; }

        content.innerHTML = '<div class="loading"><span class="blink">加载中...</span></div>';
        fetch(link)
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(function (text) {
                var parser = getMd();
                if (!parser) { show('<p style="color:red;">渲染引擎加载中，请重试</p>'); return; }
                var html = parser.render(text);
                if (window.DOMPurify) html = window.DOMPurify.sanitize(html);
                cache.set(link, html);
                show(html);
            })
            .catch(function (err) {
                console.error('加载失败:', link, err);
                show('<p style="color:#cf222e;">加载失败: ' + link + '</p>');
            });
    }

    function close() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        ScrollSync.unbind();
        Toc.reset();
    }

    // ★ 瞬时定位：先取消正文正在进行的滚动，再一次性落位
    function jump(id) {
        if (!id) return;
        var el = document.getElementById(id);
        var body = document.getElementById('viewer-content');
        if (el && body) {
            var tRect = el.getBoundingClientRect();
            var bRect = body.getBoundingClientRect();
            fastScroll(body, body.scrollTop + (tRect.top - bRect.top) - 24);
        }
        Toc.setActive(id);
    }

    return { open: open, jump: jump };
})();

// ============================================
// 筛选 & 分页
// ============================================
function doFilter() {
    var lower = searchQuery.toLowerCase();
    filteredNotes = notes.filter(function (note) {
        return (activeCategory === 'all' || note.category === activeCategory) &&
            (!lower || strip(note.title).toLowerCase().indexOf(lower) !== -1);
    });
}

function renderPage() {
    if (statsEl) {
        statsEl.textContent = (searchQuery || activeCategory !== 'all')
            ? '筛选结果: ' + filteredNotes.length + ' 篇'
            : notes.length + ' 篇笔记';
    }

    if (filteredNotes.length === 0) {
        loading.style.display = 'none';
        fileList.style.display = 'none';
        pagination.innerHTML = '';
        if (!noResultEl) {
            noResultEl = document.createElement('div');
            noResultEl.id = 'no-result';
            noResultEl.className = 'empty';
            fileList.parentNode.insertBefore(noResultEl, fileList);
        }
        noResultEl.innerHTML = '<p>~ 没有找到匹配的笔记 ~</p>';
        noResultEl.style.display = 'block';
        return;
    }
    if (noResultEl) noResultEl.style.display = 'none';

    var totalPages = Math.ceil(filteredNotes.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = 1;
    var start = (currentPage - 1) * PAGE_SIZE;
    var slice = filteredNotes.slice(start, start + PAGE_SIZE);

    loading.style.display = 'none';
    fileList.style.display = 'block';

    var html = '';
    for (var i = 0; i < slice.length; i++) {
        var n = slice[i];
        html += '<li><a href="#" data-link="' + n.link + '" data-title="' + n.title.replace(/"/g, '&quot;') + '">' +
            '<div class="note-title">' + n.title + '</div>' +
            '<div class="note-date">' + n.date + '</div>' +
        '</a></li>';
    }
    fileList.innerHTML = html;

    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    var pager = '<button ' + (currentPage === 1 ? 'disabled' : '') + ' data-page="' + (currentPage - 1) + '">[&lt;]</button>';
    for (var p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
            pager += '<button class="' + (p === currentPage ? 'active' : '') + '" data-page="' + p + '">' + p + '</button>';
        } else if (p === currentPage - 2 || p === currentPage + 2) {
            pager += '<span class="ellipsis">…</span>';
        }
    }
    pager += '<button ' + (currentPage === totalPages ? 'disabled' : '') + ' data-page="' + (currentPage + 1) + '">[&gt;]</button>';
    pagination.innerHTML = pager;
}

function applyFilter() { doFilter(); renderPage(); }

function debounceFilter() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () { currentPage = 1; applyFilter(); }, 300);
}

document.addEventListener('DOMContentLoaded', function () {
    fileList = document.getElementById('file-list');
    pagination = document.getElementById('pagination');
    loading = document.getElementById('loading');
    statsEl = document.getElementById('stats');

    var input = document.getElementById('search-input');
    var clearBtn = document.getElementById('search-clear');
    if (input) {
        input.addEventListener('input', function (e) {
            searchQuery = e.target.value.trim();
            if (clearBtn) clearBtn.style.display = searchQuery ? 'inline' : 'none';
            debounceFilter();
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            input.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            currentPage = 1;
            applyFilter();
            input.focus();
        });
    }

    var bar = document.getElementById('category-bar');
    if (bar) {
        bar.addEventListener('click', function (e) {
            if (!e.target.classList.contains('cat-btn')) return;
            bar.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
            e.target.classList.add('active');
            activeCategory = e.target.dataset.cat;
            currentPage = 1;
            applyFilter();
        });
    }

    fileList.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-link]');
        if (!a) return;
        e.preventDefault();
        Viewer.open(a.dataset.link, a.dataset.title);
    });

    pagination.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-page]');
        if (!btn) return;
        var target = Number(btn.dataset.page);
        var totalPages = Math.ceil(filteredNotes.length / PAGE_SIZE);
        if (target >= 1 && target <= totalPages && target !== currentPage) {
            currentPage = target;
            renderPage();
            // ★ 分页回顶：瞬时，不滑
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    });

    applyFilter();
});

// ============================================
// 目录模块 Toc
// ★ 默认收起；点 ☰ / 按 T 展开
// ============================================
const Toc = (function () {
    var tocEl = null, bodyEl = null, toggleBtn = null;
    var headings = [];
    var visible = false;   // ★ 默认关闭

    function headingNodes() {
        if (!bodyEl) return [];
        var all = bodyEl.querySelectorAll('h1[id], h2[id], h3[id]');
        return all.length ? all : bodyEl.querySelectorAll('[data-toc-head="true"]');
    }

    function build() {
        tocEl = document.getElementById('viewer-toc');
        bodyEl = document.getElementById('viewer-content');
        toggleBtn = document.getElementById('toc-toggle');

        if (!tocEl || !bodyEl) return;
        tocEl.innerHTML = '';
        headings = [];

        var nodes = headingNodes();
        if (!nodes.length) {
            tocEl.innerHTML = '<span class="toc-empty">（本文无标题）</span>';
            hide();
            return;
        }

        // ★ 只读取已有 id，绝不覆盖
        Array.prototype.forEach.call(nodes, function (h) {
            var id = h.id;
            if (!id) { id = slug(h.textContent); h.id = id; }
            headings.push({ id: id, text: h.textContent.trim(), level: +h.tagName[1], node: h });

            var a = document.createElement('a');
            a.href = '#' + id;
            a.className = 'toc-item toc-l' + h.tagName[1];
            a.textContent = h.textContent.trim();
            a.dataset.id = id;

            a.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                Viewer.jump(id);                 // 瞬时落位
                history.replaceState(null, '', '#' + id);
            });

            tocEl.appendChild(a);
        });

        // 有标题才默认收起，保持收起态渲染完再交给 refresh
        hide();
    }

    function show() {
        visible = true;
        if (tocEl) tocEl.classList.remove('viewer-toc-collapsed');
        if (toggleBtn) toggleBtn.classList.add('on');
    }
    function hide() {
        visible = false;
        if (tocEl) tocEl.classList.add('viewer-toc-collapsed');
        if (toggleBtn) toggleBtn.classList.remove('on');
    }
    function toggle() { visible ? hide() : show(); }

    // 目录自身滚动：瞬时
    function setActive(id) {
        if (!tocEl) return;
        var links = tocEl.getElementsByClassName('toc-item');
        var cur = null;
        for (var i = 0; i < links.length; i++) {
            var on = links[i].dataset.id === id;
            links[i].classList.toggle('active', on);
            if (on) cur = links[i];
        }
        if (cur) cur.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }

    function bindToggle() {
        if (!toggleBtn || toggleBtn._bound) return;
        toggleBtn._bound = true;
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggle();
            if (visible && tocEl && tocEl.focus) tocEl.focus({ preventScroll: true });
        });
        document.addEventListener('keydown', function (e) {
            var overlay = document.getElementById('note-viewer');
            if ((e.key === 't' || e.key === 'T') &&
                overlay && overlay.classList.contains('open') &&
                !/INPUT|TEXTAREA/i.test(e.target.tagName)) {
                e.preventDefault();
                toggle();
            }
        });
    }

    function refresh() {
        build();
        bindToggle();
        var hasH = headings.length > 0;
        // ★ 有标题 → 默认收起；无标题 → 隐藏按钮
        if (hasH) { hide(); }
        if (toggleBtn) toggleBtn.style.visibility = hasH ? '' : 'hidden';
    }

    function reset() { headings = []; visible = false; if (tocEl) tocEl.innerHTML = ''; }

    return {
        refresh: refresh,
        reset: reset,
        setActive: setActive,
        firstId: function () { return headings.length ? headings[0].id : ''; },
        items: function () { return headings; }
    };
})();

// ============================================
// 滚动高亮（只认正文容器）
// ============================================
const ScrollSync = (function () {
    var bodyEl = null, handler = null, rafId = null, lastId = null;

    function pickActive() {
        var hs = Toc.items();
        if (!hs.length || !bodyEl) return null;
        var bRect = bodyEl.getBoundingClientRect();
        var best = null, closest = -1e9;
        for (var i = 0; i < hs.length; i++) {
            var r = hs[i].node.getBoundingClientRect();
            var offset = r.top - bRect.top;
            if (offset >= -48 && offset < closest) { closest = offset; best = hs[i].id; }
        }
        if (!best) {
            var d = 1e9, idx = 0;
            for (var j = 0; j < hs.length; j++) {
                var r2 = hs[j].node.getBoundingClientRect();
                var dd = Math.abs(r2.top - bRect.top);
                if (dd < d) { d = dd; idx = j; }
            }
            best = hs[idx].id;
        }
        return best;
    }

    function onScroll() {
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
            rafId = null;
            var id = pickActive();
            if (id && id !== lastId) { lastId = id; Toc.setActive(id); }
        });
    }

    function bind(el) {
        unbind();
        bodyEl = el;
        handler = onScroll;
        bodyEl.addEventListener('scroll', handler, { passive: true });
        setTimeout(onScroll, 60);
    }
    function unbind() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (bodyEl && handler) bodyEl.removeEventListener('scroll', handler);
        bodyEl = null; handler = null; lastId = null;
    }
    return { bind: bind, unbind: unbind };
})();