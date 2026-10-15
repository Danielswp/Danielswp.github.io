// ===== 笔记数据 =====
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

const PAGE_SIZE = 5;
let currentPage = 1;

const fileList = document.getElementById('file-list');
const pagination = document.getElementById('pagination');

// ===== 弹窗容器（动态创建，插入到 main 后面） =====
let viewerOverlay = null;

function createViewer() {
    if (viewerOverlay) return;

    viewerOverlay = document.createElement('div');
    viewerOverlay.id = 'note-viewer';
    viewerOverlay.innerHTML = `
        <div class="viewer-inner">
            <div class="viewer-bar">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
                <span class="viewer-title" id="viewer-filename"></span>
                <button class="viewer-close" id="viewer-close">[X]</button>
            </div>
            <div class="viewer-body">
                <iframe id="viewer-frame" frameborder="0"></iframe>
            </div>
        </div>
    `;
    document.querySelector('.container').appendChild(viewerOverlay);

    // 关闭按钮
    document.getElementById('viewer-close').addEventListener('click', closeViewer);

    // 点遮罩也关闭
    viewerOverlay.addEventListener('click', (e) => {
        if (e.target === viewerOverlay) closeViewer();
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && viewerOverlay.classList.contains('open')) {
            closeViewer();
        }
    });
}

function openViewer(link, title) {
    createViewer();
    const frame = document.getElementById('viewer-frame');
    const filename = document.getElementById('viewer-filename');

    frame.src = link;
    filename.textContent = `cat ${title}`;
    viewerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeViewer() {
    if (!viewerOverlay) return;
    viewerOverlay.classList.remove('open');
    document.getElementById('viewer-frame').src = '';
    document.body.style.overflow = '';
}

// ===== 渲染列表（拦截 a 标签点击） =====
function renderList(page) {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = notes.slice(start, end);

    fileList.innerHTML = slice.map(note => `
        <li>
            <a href="${note.link}" data-link="${note.link}" data-title="${note.title}">
                <div class="note-title">${note.title}</div>
                <div class="note-date">${note.date}</div>
            </a>
        </li>
    `).join('');

    // 拦截点击 → 弹窗打开
    fileList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const link = a.dataset.link;
            const title = a.dataset.title;
            openViewer(link, title);
        });
    });
}

// ===== 分页（不变） =====
function renderPagination(page) {
    const totalPages = Math.ceil(notes.length / PAGE_SIZE);
    let html = '';

    html += `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">[&lt;]</button>`;

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
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l > 2) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }
    return rangeWithDots;
}

renderList(currentPage);
renderPagination(currentPage);