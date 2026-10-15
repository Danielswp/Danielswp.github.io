// 在这里添加新的 .md 文件即可，不需要动 HTML
const articles = [
    { path: './readme.md',          name: 'readme.md',          size: '2.4K', date: 'Oct 15 14:23' },
    { path: './blog/software.md',   name: 'blog/software.md',  size: '1.8K', date: 'Oct 14 09:47' },
    // 新增文件直接加在这里 ↓
    // { path: './new-post.md',       name: 'new-post.md',       size: '3.1K', date: 'Oct 16 10:00' },
];

const fileList = document.getElementById('file-list');
const fileCount = document.getElementById('file-count');

fileCount.textContent = articles.length;

articles.forEach((article, index) => {
    const li = document.createElement('li');
    li.style.animationDelay = `${0.1 + index * 0.1}s`;
    
    li.innerHTML = `
        <a href="${article.path}" target="_blank">
            <span class="perms">-rw-r--r--</span>
            <span class="links">1</span>
            <span class="owner">root</span>
            <span class="group">root</span>
            <span class="size">${article.size}</span>
            <span class="date">${article.date}</span>
            <span class="name">${article.name}</span>
        </a>
    `;
    
    fileList.appendChild(li);
});