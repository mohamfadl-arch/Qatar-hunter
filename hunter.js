void async function() {
  if (window._h) return window._h();
  window._h = 1;
  const d = document, m = new Map();
  let si, tab = 'all';

  // استعادة الجلسة
  try {
    const stored = sessionStorage.getItem('__hunter');
    if (stored) JSON.parse(stored).forEach(e => m.set(e.k, { title: e.t, url: e.u, type: e.y, meta: e.m || {} }));
  } catch (e) {}

  function persist() {
    const arr = [];
    m.forEach((v, k) => arr.push({ k, t: v.title, u: v.url, y: v.type, m: v.meta }));
    try { sessionStorage.setItem('__hunter', JSON.stringify(arr)); } catch (e) {}
  }

  function classify(t) {
    const tx = t.toLowerCase();
    if (/(مطلوب|أبحث عن|أرغب في|طلب\s+(شراء|إيجار|استئجار)|مستأجر يبحث|مشتري جاد)/i.test(tx)) return 'request';
    if (/إيجار|للإيجار|استئجار/.test(tx)) return 'rent';
    if (/بيع|للبيع|تملك|فرصة/.test(tx)) return 'sale';
    return 'other';
  }

  function add(url, title, type) {
    if (!url || title.length < 4 || m.has(url) || /facebook\.com\/wui/.test(url)) return;
    m.set(url, { title: title.slice(0, 60), url, type });
    persist();
  }

  function scanLocal() {
    // جمع الروابط
    d.querySelectorAll('a').forEach(a => {
      const t = a.innerText.trim();
      if (!/facebook\.com\/wui/.test(a.href)) add(a.href, t, classify(t));
    });
    // جمع النصوص الطلبية
    d.querySelectorAll('div, p, span').forEach(el => {
      const t = el.innerText.trim();
      if (t.length > 15 && /(مطلوب|أبحث عن|طلب شراء|طلب إيجار|مستأجر|مشتري)/i.test(t)) {
        const key = 'txt_' + t.slice(0, 40);
        if (!m.has(key)) {
          add('#', '📘 ' + t.slice(0, 60), 'request');
        }
      }
    });
  }

  function updateCounts() {
    let sc = 0, rc = 0, rq = 0;
    m.forEach(v => {
      if (v.type === 'sale') sc++;
      else if (v.type === 'rent') rc++;
      else if (v.type === 'request') rq++;
    });
    cnt.textContent = m.size + ' | بيع:' + sc + ' إيجار:' + rc + ' طلبات:' + rq;
    ts.textContent = 'معروضات (' + sc + ')';
    tr.textContent = 'إيجار (' + rc + ')';
    treq.textContent = 'طلبات (' + rq + ')';
  }

  function render() {
    ls.innerHTML = '';
    const q = si.value.trim().toLowerCase();
    const filtered = [];
    m.forEach(v => {
      if (tab !== 'all' && v.type !== tab) return;
      if (q && !v.title.toLowerCase().includes(q)) return;
      filtered.push(v);
    });
    filtered.sort((a, b) => a.title.localeCompare(b.title));
    if (m.size === 0) {
      ls.innerHTML = '<div style="color:#fbbf24;text-align:center;padding:20px;">لا توجد نتائج بعد. اضغط زر "فيسبوك" لفتح البحث العام.</div>';
    } else if (filtered.length === 0) {
      ls.innerHTML = '<div style="color:#fbbf24;text-align:center;padding:20px;">لا توجد نتائج تطابق بحثك.</div>';
    } else {
      filtered.forEach(v => {
        const card = d.createElement('div');
        card.style.cssText = 'background:#1e293b;margin:3px 0;padding:6px;border-radius:6px;';
        const lbl = v.type === 'sale' ? '🟢 بيع' : v.type === 'rent' ? '🔵 إيجار' : v.type === 'request' ? '🟡 طلب' : '⚪';
        const link = v.url !== '#' ? `<a href="${v.url}" target="_blank" style="color:#38bdf8;text-decoration:none;">${v.title}</a>` : `<span style="color:#fbbf24;">${v.title}</span>`;
        card.innerHTML = `<div>${lbl} ${link}</div>`;
        ls.appendChild(card);
      });
    }
    updateCounts();
  }

  // بناء الواجهة
  scanLocal();
  const w = d.createElement('div');
  w.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:#0f172a;color:#fff;direction:rtl;display:flex;flex-direction:column;font:12px sans-serif;';
  const hd = d.createElement('div');
  hd.style.cssText = 'background:#1e293b;padding:8px;display:flex;justify-content:space-between;';
  const cnt = d.createElement('span');
  hd.innerHTML = '<b style="color:#38bdf8">🏠 صياد عقارات قطر الذكي</b> ';
  hd.appendChild(cnt);
  const cl = d.createElement('span');
  cl.textContent = '✕'; cl.style.cssText = 'color:#f44;cursor:pointer;';
  cl.onclick = () => { w.remove(); window._h = 0; };
  hd.appendChild(cl); w.appendChild(hd);
  const tabs = d.createElement('div');
  tabs.style.cssText = 'display:flex;gap:2px;background:#111827;padding:4px;';
  function mkTab(lb, ty) {
    const b = d.createElement('button');
    b.textContent = lb;
    b.style.cssText = 'flex:1;background:' + (tab === ty ? '#2563eb' : '#1f2937') + ';color:#fff;border:none;padding:6px;border-radius:6px;font-weight:bold;';
    b.onclick = () => { tab = ty; render(); };
    return b;
  }
  const ta = mkTab('الكل', 'all'), ts = mkTab('معروضات', 'sale'), tr = mkTab('إيجار', 'rent'), treq = mkTab('طلبات', 'request');
  tabs.append(ta, ts, tr, treq); w.appendChild(tabs);
  const ls = d.createElement('div'); ls.style.cssText = 'flex:1;overflow-y:auto;padding:6px;'; w.appendChild(ls);
  si = d.createElement('input'); si.placeholder = 'ابحث...'; si.style.cssText = 'margin:4px;padding:6px;background:#1e293b;border:none;color:#fff;border-radius:6px;'; si.oninput = render; w.appendChild(si);
  const btns = d.createElement('div'); btns.style.cssText = 'display:flex;gap:4px;padding:4px;flex-wrap:wrap;';
  const eb = d.createElement('button'); eb.textContent = '📥 JSON'; eb.style.cssText = 'background:#f59e0b;border:none;color:#fff;padding:6px;border-radius:6px;flex:1;';
  const fbBtn = d.createElement('button'); fbBtn.textContent = '📘 فيسبوك'; fbBtn.style.cssText = 'background:#1877f2;border:none;color:#fff;padding:6px;border-radius:6px;flex:1;';
  btns.append(eb, fbBtn); w.appendChild(btns);
  d.body.appendChild(w);
  updateCounts(); render();

  fbBtn.onclick = () => {
    window.open('https://mbasic.facebook.com/search/posts/?q=مطلوب+عقار+قطر', '_blank');
    alert('📘 ستفتح صفحة البحث. اضغط الإشارة المرجعية مرة أخرى لجمع النتائج.');
  };

  eb.onclick = () => {
    const data = [];
    m.forEach(v => data.push({ type: v.type, title: v.title, url: v.url }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = d.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'qatar_ads.json'; a.click();
  };

  window._h = () => { w.remove(); window._h = 0; };
}();
