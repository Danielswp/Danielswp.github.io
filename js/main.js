/**
 * ============================================================
 * Daniel Blog - 主交互脚本
 * ============================================================
 */

(function ($) {
  'use strict';

  // ===== 页面加载完成后执行 =====
  $(document).ready(function () {

    // --- 导航栏滚动效果 ---
    var $header = $('.blog-header');
    var lastScrollTop = 0;

    $(window).on('scroll', function () {
      var scrollTop = $(this).scrollTop();

      // 滚动时添加阴影
      if (scrollTop > 10) {
        $header.css('box-shadow', '0 2px 20px rgba(0,0,0,0.08)');
      } else {
        $header.css('box-shadow', 'none');
      }

      lastScrollTop = scrollTop;
    });

    // --- 卡片点击跳转（stretched-link 已在CSS中处理） ---
    // 为卡片添加悬停音效提示（可选）
    $('.card-feature').on('mouseenter', function () {
      $(this).find('.stretched-link').css('color', 'var(--secondary-color)');
    }).on('mouseleave', function () {
      $(this).find('.stretched-link').css('color', 'var(--primary-color)');
    });

    // --- 平滑滚动到锚点 ---
    $('a[href^="#"]').on('click', function (e) {
      var target = $(this).attr('href');
      if (target !== '#' && $(target).length) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $(target).offset().top - 80
        }, 500);
      }
    });

    // --- 文章阅读进度条（可选功能） ---
    // 在页面顶部添加进度条
    $('body').prepend('<div id="reading-progress" style="position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#667eea,#764ba2);z-index:9999;width:0;transition:width 0.1s;"></div>');

    $(window).on('scroll', function () {
      var scrollPercent = ($(window).scrollTop() / ($(document).height() - $(window).height())) * 100;
      $('#reading-progress').css('width', scrollPercent + '%');
    });

    // --- 移动端导航激活状态 ---
    $('.nav-scroller .nav a').on('click', function () {
      $('.nav-scroller .nav a').removeClass('active');
      $(this).addClass('active');
    });

  });

})(jQuery);
