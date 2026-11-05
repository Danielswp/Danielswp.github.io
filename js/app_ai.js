(function () {
  'use strict';

  /* ========== 1. 动态注入样式 ========== */
  const css = `
    /* 触发按钮：固定左下角（移动端缩小尺寸） */
    #panel-trigger-btn {
      position: fixed;
      left: 24px;
      bottom: 24px;
      z-index: 9998;
      padding: 10px 20px;
      background: #1a73e8;
      color: #fff;
      border: none;
      border-radius: 24px;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,.25);
      transition: background .2s, transform .2s;
    }
    #panel-trigger-btn:hover { background: #1557b0; transform: translateY(-2px); }

    /* 遮罩层 */
    #panel-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.35);
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity .25s;
    }
    #panel-overlay.show { opacity: 1; visibility: visible; }

    /* 弹出面板：全屏，无标题栏 */
    #popup-panel {
      position: fixed;
      inset: 0;
      background: #fff;
      z-index: 10000;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch; /* iOS 顺滑滚动 */
      opacity: 0;
      visibility: hidden;
      transform: scale(.98);
      transition: all .25s ease;
    }
    #popup-panel.show { opacity: 1; visibility: visible; transform: none; }

    /* 全屏内容区域 */
    .panel-body {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 16px;
      box-sizing: border-box;
      font-size: 14px;
      color: #333;
    }
    .panel-body iframe { width: 100%; height: 100%; border: none; display: block; }

    /* 右上角悬浮关闭按钮 */
    .panel-close-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 10001;
      width: 44px;   /* 移动端易点，44px 为推荐最小点击区域 */
      height: 44px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,.45);
      color: #fff;
      font-size: 24px;
      line-height: 44px;
      text-align: center;
      cursor: pointer;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity .25s, visibility .25s, background .2s;
    }
    .panel-close-btn.show { opacity: 1; visibility: visible; pointer-events: auto; }
    .panel-close-btn:hover { background: rgba(0,0,0,.65); }

    /* ===== 移动端适配 ===== */
    @media (max-width: 768px) {
      #panel-trigger-btn {
        left: 16px;
        bottom: 16px;
        padding: 10px 18px;
        font-size: 15px;
      }
      .panel-body { padding: 12px; font-size: 15px; }
    }

    /* 防止移动端弹层打开时 body 滚动穿透 */
    body.panel-open { overflow: hidden; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ========== 2. 动态创建面板结构（内容懒加载） ========== */
  const PANEL_URL = 'ai_page.html';
  let frameLoaded = false;

  const overlay = document.createElement('div');
  overlay.id = 'panel-overlay';

  const panel = document.createElement('div');
  panel.id = 'popup-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', '快速使用 AI');
  panel.innerHTML = '<div class="panel-body" id="panel-body"></div>';
  const panelBody = panel.querySelector('.panel-body');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close-btn';
  closeBtn.type = 'button';
  closeBtn.innerHTML = '&times;';
  closeBtn.title = '关闭';
  closeBtn.setAttribute('aria-label', '关闭面板');

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  document.body.appendChild(closeBtn);

  /* ========== 3. 开关逻辑 ========== */
  const triggerBtn = document.getElementById('panel-trigger-btn');

  // 用 DOM API 创建 iframe，避免字符串拼接带来的注入风险
  function setUrl(url) {
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.title = 'AI 服务';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    panelBody.innerHTML = '';
    panelBody.appendChild(frame);
    frameLoaded = true;
  }

  function openPanel() {
    // 首次打开时才加载，减少首屏请求；关闭后保留 iframe 以免丢失会话
    if (!frameLoaded) setUrl(PANEL_URL);
    overlay.classList.add('show');
    panel.classList.add('show');
    closeBtn.classList.add('show');
    document.body.classList.add('panel-open'); // 锁定背景滚动
  }
  function closePanel() {
    overlay.classList.remove('show');
    panel.classList.remove('show');
    closeBtn.classList.remove('show');
    document.body.classList.remove('panel-open');
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', function () {
      panel.classList.contains('show') ? closePanel() : openPanel();
    });
  }
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    // 仅面板打开时响应 ESC，避免影响阅读器弹窗
    if (e.key === 'Escape' && panel.classList.contains('show')) {
      e.preventDefault();
      closePanel();
    }
  });

  /* ========== 4. 对外接口 ========== */
  window.PopupPanel = {
    open: openPanel,
    close: closePanel,
    setContent: function (html) {
      panelBody.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
    },
    setUrl: setUrl
  };
})();