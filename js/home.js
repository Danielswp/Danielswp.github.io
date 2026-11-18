/* 首页：结构装配 + 交互（单文件，按区块组织） */
(function () {
    'use strict';

    const siteBar = `
<header class="site-bar">
    <button type="button" class="sidebar-toggle" id="sidebar-toggle" aria-label="打开目录" aria-controls="sidebar" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
    </button>
    <a class="site-bar-brand" href="index.html"><span class="brand-g" aria-hidden="true">G</span><span>努力！奋斗</span></a>
    <span class="site-bar-sub">技术笔记与个人博客</span>
    <nav class="site-bar-links" aria-label="站点导航">
        <a href="#notes">笔记</a><a href="#pdfs">PDF</a><a href="#bookmarks">书签</a><a href="sitemap.xml">站点地图</a>
    </nav>
</header>`;

    const sidebarHtml = `
<aside class="sidebar" id="sidebar" aria-label="笔记目录">
    <div class="sidebar-head">📁 notes/</div>
    <ul class="tree" id="sidebar-tree"></ul>
    <div class="sidebar-foot">共 <span id="sidebar-count">0</span> 篇笔记</div>
</aside>
<div class="sidebar-mask" id="sidebar-mask"></div>`;

    const hero = `
<section class="hero" aria-label="站点介绍与搜索">
    <h1 class="hero-logo"><span class="c-blue">努</span><span class="c-red">力</span><span class="c-yellow">！</span><span class="c-blue">奋</span><span class="c-green">斗</span></h1>
    <p class="hero-sub">技术笔记与个人博客</p>
    <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>
        <input type="text" id="search-input" placeholder="搜索笔记..." aria-label="搜索笔记" autocomplete="off">
        <span class="search-clear" id="search-clear" style="display:none" role="button" tabindex="0" aria-label="清空搜索">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
        </span>
        <span class="search-shortcut" aria-hidden="true">/</span>
    </div>
    <nav class="category-bar" id="category-bar" aria-label="笔记分类">
        <button type="button" class="cat-btn active" data-cat="all">全部</button>
        <button type="button" class="cat-btn" data-cat="技术">技术</button>
        <button type="button" class="cat-btn" data-cat="随笔">随笔</button>
        <button type="button" class="cat-btn" data-cat="生活">生活</button>
    </nav>
    <div class="stats" id="stats"></div>
</section>`;

    const notes = `
<main id="notes" class="results">
    <div id="loading" class="loading"><span class="blink">读取中...</span></div>
    <ul id="file-list" class="note-list" style="display:none"></ul>
    <noscript><p class="empty">笔记列表需要 JavaScript 才能显示，也可以浏览 <a href="sitemap.xml">站点地图</a> 查看全部文章。</p></noscript>
    <div id="empty" class="empty" style="display:none"><p>~ 暂无笔记 ~</p></div>
    <nav id="pagination" class="pagination" aria-label="笔记分页"></nav>
</main>`;

    // 每项格式：名称|网址|图标；分组第一项为标题
    const bookmarks = [
        ['🤖 国内 AI', 'AI排名|https://rank.opencompass.org.cn/leaderboard/llm|🚀', 'DeepSeek|https://chat.deepseek.com/|🧠', '通义千问|https://tongyi.aliyun.com/|🌩️', '豆包|https://www.doubao.com/|🫘', '腾讯元宝|https://yuanbao.tencent.com/|🐧', '文心一言|https://yiyan.baidu.com/|🅑', '讯飞星火|https://xinghuo.xfyun.cn/|🔥', '智谱清言|https://chatglm.cn/|🪢'],
        ['🌐 国际 AI', 'ChatGPT|https://chat.openai.com/|🤖', 'Claude|https://claude.ai/|📎', 'Gemini|https://gemini.google.com/|✨'],
        ['🔎 搜索', '百度|https://www.baidu.com/|🐾', 'Bing|https://www.bing.com/|🪟', 'Google|https://www.google.com/|G', '搜狗|https://www.sogou.com/|🔍'],
        ['📺 视频 / 新闻', 'B 站|https://www.bilibili.com/|📺', 'YouTube|https://www.youtube.com/|▶️', '今日头条|https://www.toutiao.com/|📰', '知乎|https://www.zhihu.com/|📘', '今日热榜|https://www.tophub.today/|🔥'],
        ['🛠 开发者', '掘金|https://juejin.cn/|⚡', 'CSDN|https://www.csdn.net/|💻', '博客园|https://www.cnblogs.com/|📝', 'Gitee|https://gitee.com/|🌳', 'MDN|https://developer.mozilla.org/zh-CN/|🦊', '菜鸟教程|https://www.runoob.com/|📖'],
        ['📚 文档 / 效率', '语雀|https://www.yuque.com/|📚', '腾讯文档|https://docs.qq.com/|📄', '飞书|https://www.feishu.cn/|☁️', '少数派|https://www.sspai.com/|✨']
    ];

    function renderBookmarks() {
        const groups = bookmarks.map(function (group) {
            const cells = group.slice(1).map(function (item) {
                const parts = item.split('|');
                const cls = parts[2] === 'G' ? ' google-ico' : '';
                return `<a href="${parts[1]}" rel="noopener"><span class="ico${cls}" aria-hidden="true">${parts[2]}</span><span class="label">${parts[0]}</span></a>`;
            }).join('');
            return `<div class="bm-group"><div class="bm-group-title" role="button" tabindex="0">${group[0]}</div><div class="bookmark-grid">${cells}</div></div>`;
        }).join('');
        return `<section class="bookmarks" id="bookmarks" aria-label="快捷入口"><div class="bookmarks-title">快捷入口</div>${groups}</section>`;
    }

    // 在线阅读：新增 PDF 时在这里追加 { title, file }
    const pdfBooks = [
        { title: '跟我一起写 Makefile', file: 'assets/pdf/跟我一起写Makefile_陈皓.pdf' },
        { title: '大话设计模式C++', file: 'assets/pdf/大话设计模式C++.pdf' }
    ];

    function renderPdfs() {
        if (!pdfBooks.length) return '';
        const cards = pdfBooks.map(function (book, i) {
            return `<button type="button" class="pdf-card" data-index="${i}">
                <span class="pdf-cover" aria-hidden="true">PDF</span>
                <span class="pdf-info"><span class="pdf-name">${book.title}</span><span class="pdf-meta">点击在线阅读</span></span>
                <span class="pdf-arrow" aria-hidden="true">↗</span>
            </button>`;
        }).join('');
        return `<section class="pdf-section" id="pdfs" aria-label="在线阅读">
            <div class="bookmarks-title">在线阅读</div>
            <p class="pdf-hint">使用内置 pdf.js 阅读器，在页面中直接翻阅。</p>
            <div class="pdf-grid">${cards}</div>
        </section>`;
    }

    const footerHtml = `
<footer>
    <div><a href="sitemap.xml">站点地图</a><a href="readme.md">关于本站</a><a href="https://github.com/Danielswp" rel="noopener">GitHub</a></div>
    <p>努力！奋斗 · 技术笔记与个人博客</p>
    <p class="footer-hint">按 / 快速搜索 · 点击笔记查看 · ESC 关闭</p>
</footer>
<button type="button" id="back-to-top" aria-label="回到顶部"><span class="arrow-up"></span></button>
<button type="button" id="panel-trigger-btn">快速使用 AI</button>`;

    const pdfViewerHtml = `
<div class="pdf-viewer" id="pdf-viewer" role="dialog" aria-modal="true" aria-label="PDF 阅读器">
    <div class="pdf-viewer-inner">
        <div class="pdf-viewer-bar">
            <span class="pdf-viewer-title" id="pdf-viewer-title"></span>
            <button type="button" id="pdf-new-tab">新窗口打开</button>
            <button type="button" id="pdf-close">关闭</button>
        </div>
        <iframe id="pdf-frame" title="PDF 阅读器"></iframe>
    </div>
</div>`;

    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = [
        siteBar, sidebarHtml, '<div class="container">',
        hero, notes, renderPdfs(), renderBookmarks(), footerHtml,
        '</div>', pdfViewerHtml
    ].join('');

    const $ = function (id) { return document.getElementById(id); };
    let closeSidebar = function () {};

    // 窄屏目录抽屉
    const toggle = $('sidebar-toggle');
    const mask = $('sidebar-mask');
    const sidebarEl = $('sidebar');
    if (toggle && mask && sidebarEl) {
        const setOpen = function (open) {
            document.body.classList.toggle('sidebar-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? '关闭目录' : '打开目录');
        };
        closeSidebar = function () { setOpen(false); };
        toggle.onclick = function () { setOpen(!document.body.classList.contains('sidebar-open')); };
        mask.onclick = closeSidebar;
        sidebarEl.onclick = function (e) { if (e.target.closest('a')) closeSidebar(); };
    }

    // 回到顶部
    const toTop = $('back-to-top');
    if (toTop) {
        const footerEl = document.querySelector('footer');
        let footerVisible = false;
        const update = function () {
            toTop.classList.toggle('show', !footerVisible && window.pageYOffset > 400);
        };
        if (footerEl && 'IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                footerVisible = entries[0].isIntersecting;
                update();
            }, { rootMargin: '-80px 0px 0px 0px' }).observe(footerEl);
        }
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        toTop.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
        update();
    }

    // PDF 在线阅读：按需加载 pdf.js 自带阅读器
    const pdfOverlay = $('pdf-viewer');
    const pdfFrame = $('pdf-frame');
    let currentPdfUrl = '';
    let closePdf = function () {};
    if (pdfOverlay && pdfFrame) {
        const pdfTitle = $('pdf-viewer-title');
        closePdf = function () {
            pdfOverlay.classList.remove('show');
            document.body.classList.remove('pdf-open');
            pdfFrame.src = 'about:blank';
            currentPdfUrl = '';
        };
        $('pdf-close').onclick = closePdf;
        pdfOverlay.onclick = function (e) { if (e.target === pdfOverlay) closePdf(); };
        $('pdf-new-tab').onclick = function () {
            if (currentPdfUrl) window.open(currentPdfUrl, '_blank', 'noopener');
        };
        document.addEventListener('click', function (e) {
            const card = e.target.closest('.pdf-card');
            if (!card) return;
            const book = pdfBooks[Number(card.dataset.index)];
            if (!book) return;
            currentPdfUrl = new URL(book.file, document.baseURI).href;
            pdfFrame.src = 'js/pdfjs-6.5.438-dist/web/viewer.html?file=' + encodeURIComponent(currentPdfUrl);
            if (pdfTitle) pdfTitle.textContent = book.title;
            pdfOverlay.classList.add('show');
            document.body.classList.add('pdf-open');
        });
    }

    const searchInput = $('search-input');

    // 统一处理键盘与分类折叠
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeSidebar(); closePdf(); return; }
        if (e.key === '/' && searchInput && !/^(INPUT|TEXTAREA)$/i.test(e.target.tagName) &&
            !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            searchInput.focus();
            return;
        }
        const title = e.target.closest && e.target.closest('.bm-group-title');
        if (title && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            title.parentElement.classList.toggle('collapsed');
        }
    });

    // 书签分组点击折叠
    document.addEventListener('click', function (e) {
        const title = e.target.closest('.bm-group-title');
        if (title) title.parentElement.classList.toggle('collapsed');
    });
})();
