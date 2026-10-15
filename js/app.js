// ===== 笔记数据（可替换成你自己的） =====
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

function renderList(page) {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = notes.slice(start, end);

    fileList.innerHTML = slice.map(note => `
        <li>
            <a href="${note.link}">
                <div class="note-title">${note.title}</div>
                <div class="note-date">${note.date}</div>
            </a>
        </li>
    `).join('');
}

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