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
    { title: '第十二篇笔记', date: '2024-01-12', link: 'notes/note12.md', category: '生活' }
];

// ============================================
// 缓存 & 状态
// ============================================
const cache = new Map();
let md = null;
let filteredNotes = notes;
let searchQuery = '';
let activeCategory = 'all';
let debounceTimer = null;

let fileList, pagination, loading, statsEl, noResultEl;

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
        // ★ 改动点：加了 toc-toggle + viewer-toc + viewer-layout
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
                '<nav class="viewer-toc" id="viewer-toc"></nav>' +
                '<div class="viewer-body" id="viewer-content">' +
                    '<div class="loading"><span class="blink">加载中...</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.querySelector('.container').appendChild(overlay);

        document.getElementById('viewer-close').onclick = close;
        overlay.onclick = function (e) { if (e.target === overlay) close(); };
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('open')) close();
        });
    }

    function open(link, title) {
        init();
        document.getElementById('viewer-filename').textContent = 'cat ' + title;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        var content = document.getElementById('viewer-content');

        if (cache.has(link)) {
            content.innerHTML = cache.get(link);
            Toc.refresh();                     // ★ 缓存命中也建目录
            return;
        }
        content.innerHTML = '<div class="loading"><span class="blink">加载中...</span></div>';
        fetch(link)
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(function (text) {
                var parser = getMd();
                if (!parser) { content.innerHTML = '<p style="color:red;">渲染引擎加载中，请重试</p>'; return; }
                var html = parser.render(text);
                if (window.DOMPurify) html = window.DOMPurify.sanitize(html);
                cache.set(link, html);
                content.innerHTML = html;
                Toc.refresh();                 // ★ 渲染完建目录
            })
            .catch(function (err) {
                console.error('加载失败:', link, err);
                content.innerHTML = '<p style="color:#cf222e;">加载失败: ' + link + '</p>';
                Toc.refresh();                 // ★ 失败时也刷新（显示“无标题”）
            });
    }

    function close() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    return { open: open };
})();

// ============================================
// 筛选
// ============================================
function doFilter() {
    var lower = searchQuery.toLowerCase();
    filteredNotes = notes.filter(function (note) {
        return (activeCategory === 'all' || note.category === activeCategory) &&
            (!lower || note.title.toLowerCase().indexOf(lower) !== -1);
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
            noResultEl.className = 'no-result';
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
        html += '<li><a href="#" data-link="' + n.link + '" data-title="' + n.title + '">' +
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

// ============================================
// 启动
// ============================================
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
            debounceFilter();
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    applyFilter();
});

// ============================================
// 目录模块 Toc（自包含，不依赖任何插件）
// ============================================
const Toc = (function () {
    var tocEl, bodyEl, toggleBtn;
    var headings = [];
    var observer = null;

    function slug(text) {
        return (text || '').trim().toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-|-$/g, '') || 'h';
    }

    function build() {
        if (!tocEl || !bodyEl) return;
        tocEl.innerHTML = '';
        headings = [];
        var nodes = bodyEl.querySelectorAll('h1, h2, h3');
        if (!nodes.length) {
            tocEl.innerHTML = '<span class="toc-empty">（本文无标题）</span>';
            return;
        }
        var used = {};
        Array.prototype.forEach.call(nodes, function (h) {
            var id = slug(h.textContent), n = 1, base = id;
            while (used[id]) { n++; id = base + '-' + n; }
            used[id] = true;
            h.id = id;                     // 补锚点，原页面零侵入
            headings.push({ id: id, node: h });

            var a = document.createElement('a');
            a.href = '#' + id;
            a.className = 'toc-item toc-l' + h.tagName[1];
            a.textContent = h.textContent.trim();
            a.dataset.id = id;
            a.onclick = function (e) {
                e.preventDefault();
                if (h.scrollIntoView) h.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActive(id);
            };
            tocEl.appendChild(a);
        });
    }

    function setActive(id) {
        var items = tocEl.getElementsByClassName('toc-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('active', items[i].dataset.id === id);
        }
        var cur = tocEl.querySelector('.toc-item.active');
        if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    }

    function watch() {
        if (!window.IntersectionObserver) return null;
        if (observer) observer.disconnect();
        observer = new IntersectionObserver(function (entries) {
            var vis = [];
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) vis.push(entries[i]);
            }
            vis.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
            if (vis[0]) setActive(vis[0].target.id);
        }, { root: bodyEl, rootMargin: '0px 0px -70% 0px' });
        for (var i = 0; i < headings.length; i++) observer.observe(headings[i].node);
        return observer;
    }

    function bindToggle() {
        if (!toggleBtn) return;
        toggleBtn.onclick = function () {
            var collapsed = tocEl.classList.toggle('viewer-toc-collapsed');
            toggleBtn.classList.toggle('on', !collapsed);
        };
        // 快捷键 T（弹窗打开时才生效，且不干扰输入框）
        document.addEventListener('keydown', function (e) {
            var overlay = document.getElementById('note-viewer');
            if ((e.key === 't' || e.key === 'T') &&
                overlay && overlay.classList.contains('open') &&
                !/INPUT|TEXTAREA/i.test(e.target.tagName)) {
                e.preventDefault();
                toggleBtn.click();
            }
        });
    }

    function refresh() {
        tocEl = document.getElementById('viewer-toc');
        bodyEl = document.getElementById('viewer-content');
        toggleBtn = document.getElementById('toc-toggle');
        bindToggle();
        build();
        watch();
        if (tocEl && toggleBtn) {
            // 有标题默认展开，没有则默认收起
            var hasH = headings.length > 0;
            tocEl.classList.toggle('viewer-toc-collapsed', !hasH);
            toggleBtn.classList.toggle('on', hasH);
        }
    }

    return { refresh: refresh };
})();
