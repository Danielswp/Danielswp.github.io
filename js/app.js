// ============================================
// 配置
// ============================================
const PAGE_SIZE = 20;
let currentPage = 1;

const notes = [
    { title: '【置顶】本站故事', date: '2026-10-15 23:37:53', link: 'readme.md', category: '技术' },
    { title: '【强推】好用软件', date: '2026-10-15 23:37:58', link: 'blog/Software.md', category: '分享' },
    { title: 'QRhi', date: '2026-10-16 00:07:54', link: 'blog/QRhi.md', category: '技术' },
    { title: '人怎么变好看（男女通用）', date: '2026-10-17 20:17:05', link: 'blog/whitening.md', category: '生活' },
    { title: '第五篇笔记', date: '2024-01-05', link: 'notes/note5.md', category: '技术' },
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
let filteredNotes = notes;          // 缓存筛选结果，避免重复 filter
let searchQuery = '';
let activeCategory = 'all';
let debounceTimer = null;

// DOM 引用（启动时缓存）
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
        highlight: function(code, lang) {
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
const Viewer = (function() {
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
                '<button class="viewer-close" id="viewer-close">[X]</button>' +
            '</div>' +
            '<div class="viewer-body" id="viewer-content">' +
                '<div class="loading"><span class="blink">加载中...</span></div>' +
            '</div>' +
        '</div>';
        document.querySelector('.container').appendChild(overlay);
        document.getElementById('viewer-close').onclick = close;
        overlay.onclick = function(e) { if (e.target === overlay) close(); };
        document.addEventListener('keydown', function(e) {
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
            return;
        }
        content.innerHTML = '<div class="loading"><span class="blink">加载中...</span></div>';
        fetch(link)
            .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(function(text) {
                var parser = getMd();
                if (!parser) { content.innerHTML = '<p style="color:red;">渲染引擎加载中，请重试</p>'; return; }
                var html = parser.render(text);
                if (window.DOMPurify) html = window.DOMPurify.sanitize(html);
                cache.set(link, html);
                content.innerHTML = html;
            })
            .catch(function(err) {
                console.error('加载失败:', link, err);
                content.innerHTML = '<p style="color:#cf222e;">加载失败: ' + link + '</p>';
            });
    }

    function close() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    return { open: open };
})();

// ============================================
// 筛选（只算一次，结果存 filteredNotes）
// ============================================
function doFilter() {
    var lower = searchQuery.toLowerCase();
    filteredNotes = notes.filter(function(note) {
        return (activeCategory === 'all' || note.category === activeCategory) &&
               (!lower || note.title.toLowerCase().indexOf(lower) !== -1);
    });
}

// ============================================
// 渲染当前页（不再重复 filter）
// ============================================
function renderPage() {
    // 统计
    if (statsEl) {
        statsEl.textContent = (searchQuery || activeCategory !== 'all')
            ? '筛选结果: ' + filteredNotes.length + ' 篇'
            : notes.length + ' 篇笔记';
    }

    // 空结果
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

    // 列表渲染
    var html = '';
    for (var i = 0; i < slice.length; i++) {
        var n = slice[i];
        html += '<li><a href="#" data-link="' + n.link + '" data-title="' + n.title + '">' +
            '<div class="note-title">' + n.title + '</div>' +
            '<div class="note-date">' + n.date + '</div>' +
        '</a></li>';
    }
    fileList.innerHTML = html;

    // 分页
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

// ============================================
// 入口：筛选 + 渲染
// ============================================
function applyFilter() {
    doFilter();
    renderPage();
}

// ============================================
// 防抖搜索
// ============================================
function debounceFilter() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
        currentPage = 1;
        applyFilter();
    }, 300);
}

// ============================================
// 启动
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // 缓存 DOM
    fileList = document.getElementById('file-list');
    pagination = document.getElementById('pagination');
    loading = document.getElementById('loading');
    statsEl = document.getElementById('stats');

    // 搜索
    var input = document.getElementById('search-input');
    var clearBtn = document.getElementById('search-clear');
    if (input) {
        input.addEventListener('input', function(e) {
            searchQuery = e.target.value.trim();
            if (clearBtn) clearBtn.style.display = searchQuery ? 'inline' : 'none';
            debounceFilter();
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            input.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            currentPage = 1;
            debounceFilter();
            input.focus();
        });
    }

    // 分类
    var bar = document.getElementById('category-bar');
    if (bar) {
        bar.addEventListener('click', function(e) {
            if (!e.target.classList.contains('cat-btn')) return;
            bar.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
            e.target.classList.add('active');
            activeCategory = e.target.dataset.cat;
            currentPage = 1;
            applyFilter();
        });
    }

    // 事件委托：笔记点击
    fileList.addEventListener('click', function(e) {
        var a = e.target.closest('a[data-link]');
        if (!a) return;
        e.preventDefault();
        Viewer.open(a.dataset.link, a.dataset.title);
    });

    // 事件委托：分页点击
    pagination.addEventListener('click', function(e) {
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