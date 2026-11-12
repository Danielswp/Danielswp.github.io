// ============================================
// 配置
// ============================================
const PAGE_SIZE = 20;
const SITE_ORIGIN = 'https://danielswp.github.io';
const SITE_NAME = '努力！奋斗';
let currentPage = 1;

// slug 决定文章落地页 URL，新增文章时一并填写（小写字母、数字、连字符）
const notes = [
    { title: '<font style=\'color:green\'>【置顶】<\/font>本站故事', date: '2026-10-15 23:37:53', link: 'readme.md', slug: 'about', category: '技术' },
    { title: '<font style=\'color:red\'>【强推】<\/font>软件推荐', date: '2026-10-15 23:37:58', link: 'blog/软件推荐.md', slug: 'software', category: '分享' },
    { title: 'QRhi', date: '2026-10-16 00:07:54', link: 'blog/QRhi.md', slug: 'qrhi', category: '技术' },
    { title: '颜值即胜利', date: '2026-10-17 20:17:05', link: 'blog/颜值即胜利.md', slug: 'appearance', category: '生活' },
    { title: 'Qt的pro文件配置', date: '2026-10-29 08:43:03', link: 'blog/Qt的pro文件配置.md', slug: 'qt-pro-config', category: '技术' },
    { title: 'DrMemory', date: '2026-10-30 13:00:00', link: 'blog/DrMemory.md', slug: 'drmemory', category: '技术' },
    { title: 'Model Context Protocol(MCP)', date: '2026-11-03 14:31:16', link: 'blog/MCP.md', slug: 'mcp', category: '技术' },
    { title: 'Claude Code CLI教程', date: '2026-11-05 09:34:50', link: 'blog/Claude Code CLI教程.md', slug: 'claude-code-cli', category: '技术' },
	{ title: '任天堂历代主机', date: '2026-11-05 09:34:50', link: 'blog/任天堂历代主机.md', slug: 'Nintendo', category: '御宅' }	
];

function postUrl(n) {
    return 'post.html?s=' + (n.slug || encodeURIComponent(n.link));
}
function postAbsoluteUrl(n) {
    return SITE_ORIGIN + '/' + postUrl(n);
}
function cleanTitle(n) {
    return strip(n.title).replace(/^【[^】]+】/, '');
}
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function toISODate(s) {
    // "2026-10-15 23:37:53" → "2026-10-15T23:37:53+08:00"
    var m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?: (\d{2}:\d{2}:\d{2}))?/);
    if (!m) return '';
    return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) +
        'T' + (m[4] || '00:00:00') + '+08:00';
}

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
// 目录跳转（瞬时滚动）
// ============================================
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
// 图片路径重写
// 内容最终渲染在 index.html 文档内，相对路径以主页 URL 为基准，
// 故需补上 md 所在目录；不加前导 "/"，以兼容 GitHub Pages 子路径部署。
// 例：blog/MCP.md 中的 ![](./MCP/a.jpg) → ![](blog/MCP/a.jpg)
// ============================================
function fixImagePaths(text, link) {
    var parts = String(link).split('/');
    var dir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
    if (!dir) return text;

    return text.replace(/(!\[[^\]]*\]\(\s*)([^\s)]+)([^)]*\))/g, function(match, prefix, rawPath, rest) {
        // 绝对 URL、协议/数据 URI、站点根路径、纯锚点保持原样
        if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(rawPath)) return match;

        var path = rawPath.replace(/^\.\//, '');
        var base = dir;
        // 支持 ../ 回退到上级目录
        while (path.indexOf('../') === 0 && base) {
            path = path.slice(3);
            base = base.replace(/[^/]+\/$/, '');
        }
        if (!base) return prefix + path + rest;
        // 已带目录前缀（如 blog/assets/x.png）时不重复拼接
        if (path.indexOf(base) === 0) return match;

        return prefix + base + path + rest;
    });
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
            if (e.key !== 'Escape' || !overlay.classList.contains('open')) return;
            // AI 面板叠在上方时，ESC 只交给面板处理，避免两层弹窗同时关闭
            var aiPanel = document.getElementById('popup-panel');
            if (aiPanel && aiPanel.classList.contains('show')) return;
            e.preventDefault();
            close();
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
                
                // 渲染前修复图片相对路径
                text = fixImagePaths(text, link);
                
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
        // data-* 只放纯文本，标题里的 <font> 仅用于列表显示
        var safeLink = escapeHtml(n.link);
        var safeTitle = escapeHtml(strip(n.title));
        // href 指向真实落地页：爬虫可跟随、用户可复制链接，点击仍由弹窗接管
        html += '<li><a href="' + postUrl(n) + '" data-link="' + safeLink + '" data-title="' + safeTitle + '">' +
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
    // 文章落地页与主页共用渲染器，但走独立初始化
    if (document.getElementById('post-article')) { initPostPage(); return; }

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
        clearBtn.setAttribute('role', 'button');
        clearBtn.setAttribute('tabindex', '0');
        clearBtn.setAttribute('aria-label', '清空搜索');
        clearBtn.addEventListener('click', function () {
            input.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            currentPage = 1;
            applyFilter();
            input.focus();
        });
        clearBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearBtn.click();
            }
        });
    }

    // 支持 /?q=关键词 直达搜索结果，对应 WebSite 结构化数据里的 SearchAction
    var q = new URLSearchParams(location.search).get('q');
    if (input && q) {
        input.value = q;
        searchQuery = q.trim();
        if (clearBtn) clearBtn.style.display = searchQuery ? 'inline' : 'none';
    }

    var bar = document.getElementById('category-bar');
    if (bar) {
        // 依据文章数据自动补全分类按钮，避免新增分类后 HTML 里漏配（如"分享"）
        notes.forEach(function (n) {
            var cat = n.category;
            if (!cat) return;
            var exists = Array.prototype.some.call(bar.querySelectorAll('.cat-btn'), function (b) {
                return b.dataset.cat === cat;
            });
            if (exists) return;
            var btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.dataset.cat = cat;
            btn.textContent = cat;
            bar.appendChild(btn);
        });

        bar.addEventListener('click', function (e) {
            if (!e.target.classList.contains('cat-btn')) return;
            bar.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
            e.target.classList.add('active');
            activeCategory = e.target.dataset.cat;
            currentPage = 1;
            applyFilter();
        });
    }

    // 全局委托：笔记列表与左侧目录树共用同一套打开逻辑
    document.addEventListener('click', function (e) {
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
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    });

    applyFilter();
    renderItemListLd();
    renderSidebarTree();
});

// ============================================
// 目录模块 Toc
// ============================================
const Toc = (function () {
    var tocEl = null, bodyEl = null, toggleBtn = null;
    var headings = [];
    var visible = false;

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
                Viewer.jump(id);
                history.replaceState(null, '', '#' + id);
            });

            tocEl.appendChild(a);
        });

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
// 滚动高亮
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

// ============================================
// SEO：结构化数据 / meta 写入 / 文章落地页
// ============================================
function appendLd(obj) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    // 避免正文里出现 </script> 提前闭合脚本
    s.textContent = JSON.stringify(obj).replace(/</g, '\\u003c');
    document.head.appendChild(s);
}

function setMeta(attr, key, value) {
    var el = document.head.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

function renderItemListLd() {
    appendLd({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': SITE_NAME + ' 的全部笔记',
        'itemListElement': notes.map(function (n, i) {
            return {
                '@type': 'ListItem',
                'position': i + 1,
                'name': cleanTitle(n),
                'url': postAbsoluteUrl(n)
            };
        })
    });
}

function renderPostNeighbors(index) {
    var box = document.getElementById('post-neighbors');
    if (!box) return;
    var parts = [];
    if (index > 0) {
        parts.push('<a href="' + postUrl(notes[index - 1]) + '">← ' +
            escapeHtml(cleanTitle(notes[index - 1])) + '</a>');
    }
    if (index < notes.length - 1) {
        parts.push('<a href="' + postUrl(notes[index + 1]) + '">' +
            escapeHtml(cleanTitle(notes[index + 1])) + ' →</a>');
    }
    box.innerHTML = parts.join('');
}

// 每篇文章拥有独立 URL、独立的 title/description/canonical 与 BlogPosting 数据
function initPostPage() {
    var params = new URLSearchParams(location.search);
    var slug = params.get('s');
    var link = params.get('p');
    var note = null, index = -1;

    // 严格按白名单匹配，避免通过参数读取任意文件
    for (var i = 0; i < notes.length; i++) {
        if ((slug && notes[i].slug === slug) || (link && notes[i].link === link)) {
            note = notes[i]; index = i; break;
        }
    }

    var titleEl = document.getElementById('post-title');
    var contentEl = document.getElementById('post-content');
    if (!contentEl) return;
    if (!note) {
        if (titleEl) titleEl.textContent = '文章不存在';
        contentEl.innerHTML = '<p>没有找到这篇文章，请<a href="index.html">返回笔记列表</a>。</p>';
        setMeta('name', 'robots', 'noindex,follow');
        return;
    }

    var title = cleanTitle(note);
    var url = postAbsoluteUrl(note);
    var iso = toISODate(note.date);
    var fallbackDesc = title + ' — ' + SITE_NAME + '的' + note.category + '笔记，发布于 ' + note.date + '。';

    document.title = title + ' | ' + SITE_NAME;
    setMeta('name', 'description', fallbackDesc);
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:title', document.title);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:description', fallbackDesc);
    setMeta('property', 'article:published_time', iso);
    setMeta('property', 'article:section', note.category);
    setMeta('name', 'twitter:title', document.title);
    setMeta('name', 'twitter:description', fallbackDesc);

    var canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    if (titleEl) titleEl.textContent = title;
    var crumb = document.getElementById('post-crumb');
    if (crumb) crumb.textContent = title;
    var metaEl = document.getElementById('post-meta');
    if (metaEl) metaEl.textContent = '分类：' + note.category + ' · 发布于 ' + note.date;

    renderPostNeighbors(index);
    appendLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': '首页', 'item': SITE_ORIGIN + '/' },
            { '@type': 'ListItem', 'position': 2, 'name': title, 'item': url }
        ]
    });

    fetch(note.link)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (text) {
            var parser = getMd();
            if (!parser) throw new Error('Markdown 渲染引擎未加载');
            var html = parser.render(fixImagePaths(text, note.link));
            if (window.DOMPurify) html = window.DOMPurify.sanitize(html);
            contentEl.innerHTML = html;

            // 每页只保留一个 h1：正文首个 h1 降级为 h2
            var firstH1 = contentEl.querySelector('h1');
            if (firstH1) {
                var h2 = document.createElement('h2');
                h2.innerHTML = firstH1.innerHTML;
                if (firstH1.id) h2.id = firstH1.id;
                firstH1.parentNode.replaceChild(h2, firstH1);
            }

            // 用正文文本生成更准确的描述
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            var desc = (tmp.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 150);
            if (desc) {
                setMeta('name', 'description', desc);
                setMeta('property', 'og:description', desc);
                setMeta('name', 'twitter:description', desc);
            }

            appendLd({
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                'headline': title,
                'description': desc || fallbackDesc,
                'datePublished': iso,
                'dateModified': iso,
                'inLanguage': 'zh-CN',
                'articleSection': note.category,
                'url': url,
                'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
                'image': SITE_ORIGIN + '/assets/img/BigmodelPoster.png',
                'author': { '@type': 'Person', 'name': 'Danielswp' },
                'publisher': { '@type': 'Organization', 'name': SITE_NAME },
                'isPartOf': { '@type': 'Blog', '@id': SITE_ORIGIN + '/#website' }
            });
        })
        .catch(function (err) {
            console.error('文章加载失败:', note.link, err);
            contentEl.innerHTML = '<p>文章加载失败，请<a href="index.html">返回笔记列表</a>。</p>';
        });
}

// ============================================
// 左侧目录树：按分类分组，数据直接取自 notes
// ============================================
function renderSidebarTree() {
    var tree = document.getElementById('sidebar-tree');
    if (!tree) return;

    var groups = {}, order = [];
    notes.forEach(function (n) {
        var cat = n.category || '未分类';
        if (!groups[cat]) { groups[cat] = []; order.push(cat); }
        groups[cat].push(n);
    });

    var html = '';
    order.forEach(function (cat) {
        html += '<li><details open><summary>📁 ' + escapeHtml(cat) + '</summary><ul>';
        groups[cat].forEach(function (n) {
            html += '<li><a href="' + postUrl(n) + '" data-link="' + escapeHtml(n.link) +
                '" data-title="' + escapeHtml(strip(n.title)) + '">' +
                escapeHtml(cleanTitle(n)) + '</a></li>';
        });
        html += '</ul></details></li>';
    });
    tree.innerHTML = html;

    var count = document.getElementById('sidebar-count');
    if (count) count.textContent = notes.length;
}