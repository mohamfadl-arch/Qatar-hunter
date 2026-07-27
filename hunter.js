void async function() {
  if (window._h) return window._h();
  window._h = 1;
  const d = document, m = new Map(), STREAMS = new Map();
  let si, tab = 'all', cf, list, cnt, sortBy = 'viewers', cat = 'all', isLive = false, observer;

  // ---------- اكتشاف تلقائي لنوع الصفحة ----------
  const url = location.href.toLowerCase();
  if (/tango\.me\/live|bigo\.tv|youtube\.com\/live|dlive|ustream/i.test(url)) {
    isLive = true;
  }

  // ================== وضع العقارات ==================
  function realEstateMain() {
    // ... الكود الكامل لصياد العقارات الذي تم تطويره سابقاً ...
    // مرفق أدناه مباشرة
  }

  // ================== وضع البث المباشر ==================
  function liveStreamMain() {
    // ... كود البث المباشر الذي أرسلته ...
  }

  if (isLive) {
    liveStreamMain();
  } else {
    realEstateMain();
  }
}();
