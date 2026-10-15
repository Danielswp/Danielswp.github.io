// ============================================
// 配置
// ============================================
const PAGE_SIZE = 5;
const notes = [
    { title: '第一篇笔记', date: '2024-01-01', link: 'blog/Software.md' },
    { title: '第二篇笔记', date: '2024-01-02', link: 'readme.md' },
    { title: '第三篇笔记', date: '2024-01-03', link: 'notes/note3.md' },
    { title: '第四篇笔记', date: '2024-01-04', link: 'notes/note4.md' },
    { title: '第五篇笔记', date: '2024-01-05', link: 'notes/note5.md' },
    { title: '第六篇笔记', date: '2024-01-06', link: 'notes/note6.md' },
    { title: '第七篇笔记', date: '2024-01-07', link: 'notes/note7.md' },
    { title: '第八篇笔记', date: '2024-01-08', link: 'notes/note8.md' },
    { title: '第九篇笔记', date: '2024-01-09', link: 'notes/note9.md' },
    { title: '第十篇笔记', date: '2024-01-10', link: 'notes/note10.md' },
    { title: '第十一篇笔记', date: '2024-01-11', link: 'notes/note11.md' },
    { title: '第十二篇笔记', date: '2024-01-12', link: 'notes/note12.md' },
];

// ============================================
// Markdown 渲染器（单例）
// ============================================
const md = window.markdownit({
    html: false,
    linkify: true,
    typographer: true,
    highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            try { return hljs.highlight(code, { language: lang }).value; } catch {}
        }
        return hljs.highlightAuto(code).value;
    }
});

// ============================================
// 弹窗模块
// ============================================
const Viewer = (() => {
    let overlay = null;

    function init() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'note-viewer';
        overlay.innerHTML = `
            <div class="viewer-inner">
                <div class="viewer-bar">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                    <span class="viewer-title" id="viewer-filename"></span>
                    <button class="viewer-close" id="viewer-close">[X]</button>
                </div>
                <div class="viewer-body markdown-body" id="viewer-content"></div>
            </div>
        `;
        document.querySelector('.container').appendChild(overlay);

        document.getElementById('viewer-close').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) close();
        });
    }

    function open(link, title) {
        init();
        document.getElementById('viewer-filename').textContent = `cat ${title}`;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        // 加载并渲染 Markdown
        fetch(link)
            .then(r => r.text())
            .then(text => {
                const html = DOMPurify.sanitize(md.render(text));
                document.getElementById('viewer-content').innerHTML = html;
            })
            .catch(() => {
                document.getElementById('viewer-content').innerHTML =
                    '<p style="color:red;">加载失败，请检查文件路径。</p>';
            });
    }

    function close() {
        overlay.classList.remove('open');
        document.getElementById('viewer-content').innerHTML = '';
        document.body.style.overflow = '';
    }

    return { open };
})();

// ============================================
// 列表渲染
// ============================================
let currentPage = 1;

function renderList(page) {
    const start = (page - 1) * PAGE_SIZE;
    const slice = notes.slice(start, start + PAGE_SIZE);

    fileList.innerHTML = slice.map(note => `
        <li>
            <a href="#" data-link="${note.link}" data-title="${note.title}">
                <div class="note-title">${note.title}</div>
                <div class="note-date">${note.date}</div>
            </a>
        </li>
    `).join('');

    fileList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            Viewer.open(a.dataset.link, a.dataset.title);
        });
    });
}

// ============================================
// 分页
// ============================================
function renderPagination(page) {
    const totalPages = Math.ceil(notes.length / PAGE_SIZE);
    let html = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">[&lt;]</button>`;

    const pages = getPageNumbers(page, totalPages);
    pages.forEach(p => {
        if (p === '...') {
            html += `<span class="ellipsis">…</span>`;
        } else {
            html += `<button class="${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
    });

    html += `<button ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">[&gt;]</button>`;
    pagination.innerHTML = html;

    pagination.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = Number(btn.dataset.page);
            if (target >= 1 && target <= totalPages && target !== currentPage) {
                currentPage = target;
                renderList(currentPage);
                renderPagination(currentPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

function getPageNumbers(current, total) {
    const delta = 1, range = [], rangeWithDots = [];
    let l;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) range.push(i);
    }
    for (let i of range) {
        if (l && i - l > 1) rangeWithDots.push('...');
        rangeWithDots.push(i);
        l = i;
    }
    return rangeWithDots;
}

// ============================================
// 初始化
// ============================================
const fileList = document.getElementById('file-list');
const pagination = document.getElementById('pagination');

renderList(currentPage);
renderPagination(currentPage);