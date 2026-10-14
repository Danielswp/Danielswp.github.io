/**
 * ============================================================
 * Daniel Blog - 动画效果脚本
 * ============================================================
 */

(function ($) {
  'use strict';

  // ===== 滚动进入视口时的淡入动画 =====
  function initScrollAnimations() {
    // 检查浏览器是否支持 IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      // 不支持则直接显示
      $('.animate-on-scroll').addClass('visible');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // 观察所有需要动画的元素
    document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ===== 数字计数动画（用于统计数据展示） =====
  function animateCounter($el) {
    var target = parseInt($el.data('target'), 10);
    var current = 0;
    var increment = target / 60; // 60帧
    var timer = setInterval(function () {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      $el.text(Math.floor(current));
    }, 16);
  }

  // ===== 页面加载动画 =====
  function initPageLoadAnimation() {
    $('body').css('opacity', '0');
    $(window).on('load', function () {
      $('body').css({
        'opacity': '1',
        'transition': 'opacity 0.5s ease'
      });
    });
  }

  // ===== 初始化 =====
  $(document).ready(function () {
    initScrollAnimations();
    initPageLoadAnimation();
  });

})(jQuery);
