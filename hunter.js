void async function() {
  if (window._h) return window._h();
  window._h = 1;

  const d = document,
        m = new Map();

  let si, tab = 'all';

  // استعادة الجلسة السابقة
  try {
    const stored = sessionStorage.getItem('__hunter');
    if (stored) {
      JSON.parse(stored).forEach(e => m.set(e.k, { title: e.t, url: e.u, type: e.y, meta: e.m || {} }));
    }
  } catch (e) {}

  function persist() {
    const arr = [];
    m.forEach((v, k) => arr.push({ k, t: v.title, u: v.url, y: v.type, m: v.meta }));
    try { sessionStorage.setItem('__hunter', JSON.stringify(arr)); } catch (e) {}
  }

  function extractMeta(text) {
    const tx = text.toLowerCase(), meta = {};
    const cityMatch = tx.match(/(الدوحة|الريان|الوكرة|أم صلال|الخور|الذخيرة|الشمال|الظعاين|اللؤلؤة|لوسيل|الدفنة|الوعب|الغرافة|الخريطيات|معيذر|أبو هامور|مسيمير|الوكير|الوكرة|روضة أقديم|روضة الخيل|بني هاجر|الغويرية|الجميلية|دخان)/i);
    if (cityMatch) meta.city = cityMatch[1];
    const roomsMatch = tx.match(/(\d+)\s*(غرفة|غرف|غرفه)/i);
    if (roomsMatch) meta.rooms = parseInt(roomsMatch[1]);
    const bathsMatch = tx.match(/(\d+)\s*(حمام|حمامات|دورة مياه)/i);
    if (bathsMatch) meta.bathrooms = parseInt(bathsMatch[1]);
    const areaMatch = tx.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(م²|متر مربع|sq\.?\s*ft|قدم مربع|sqm|m²)/i);
    if (areaMatch) meta.area = areaMatch[1].replace(/,/g, '');
    const priceMatch = tx.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(ريال|﷼|SAR|ر\.س|دولار|USD|€|جنيه|درهم)/i);
    if (priceMatch) meta.price = priceMatch[1].replace(/,/g, '');
    return meta;
  }

  function classify(text) {
    const tx = text.toLowerCase();
    if (/(مطلوب|أبحث عن|أرغب في|طلب\s+(شراء|إيجار|استئجار)|مستأجر يبحث|مشتري جاد)/i.test(tx)) return 'request';
    if (/إيجار|للإيجار|استئجار/.test(tx)) return 'rent';
    if (/بيع|للبيع|تملك|فرصة/.test(tx)) return 'sale';
    return 'other';
  }

  function isGoogleInternal(url) {
    return /^https?:\/\/(www\.)?google\.[a-z.]+\/(webhp|setprefs|preferences|myactivity|services|about|intl|policies|support|help|advanced|finance|travel|maps|search\?(?!.*q=))|support\.google|policies\.google|translate\.google/i.test(url);
  }

  function add(url, title, type, meta = null) {
    if (!url || title.length < 4 || m.has(url) || isGoogleInternal(url)) return;
    m.set(url, { title: title.slice(0, 60), url, type, meta: meta || extractMeta(title) });
    persist();
  }

  function scanLocal() {
    d.querySelectorAll('a').forEach(a => {
      const t = a.innerText.trim();
      add(a.href, t, classify(t));
    });
    d.querySelectorAll('div, article, section, p, span').forEach(el => {
      const t = el.innerText.trim();
      if (t.length > 10 && /(مطلوب|أبحث عن|أرغب في|طلب\s+(شراء|إيجار|استئجار)|مستأجر يبحث|مشتري جاد)/i.test(t)) {
        const key = 'txt_' + t.slice(0, 40);
        if (!m.has(key)) {
          const meta = extractMeta(t);
          add('#', t, 'request', meta);
        }
      }
    });
  }

  function matchRequest(req) {
    const reqMeta = req.meta;
    if (!reqMeta || Object.keys(reqMeta).length === 0) return [];
    const matches = [];
    m.forEach(v => {
      if (v.type === 'request' || v.type === 'other') return;
      const saleMeta = v.meta;
      if (!saleMeta) return;
      let score = 0;
      if (reqMeta.city && saleMeta.city && reqMeta.city === saleMeta.city) score += 3;
      if (reqMeta.rooms && saleMeta.rooms && reqMeta.rooms === saleMeta.rooms) score += 2;
      if (reqMeta.area && saleMeta.area && Math.abs(parseFloat(reqMeta.area) - parseFloat(saleMeta.area)) < 20) score += 1;
      if (score >= 3) matches.push({ ad: v, score });
    });
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 3);
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
      ls.innerHTML = '<div style="color:#fbbf24;text-align:center;padding:20px;">لا توجد نتائج بعد. استخدم زر فيسبوك لفتح مجموعة العقارات.</div>';
    } else if (filtered.length === 0) {
      ls.innerHTML = '<div style="color:#fbbf24;text-align:center;padding:20px;">لا توجد نتائج تطابق بحثك.</div>';
    } else {
      filtered.forEach(v => {
        const card = d.createElement('div');
        card.style.cssText = 'background:#1e293b;margin:3px 0;padding:6px;border-radius:6px;';
        const lbl = v.type === 'sale' ? '🟢 بيع' : v.type === 'rent' ? '🔵 إيجار' : v.type === 'request' ? '🟡 طلب' : '⚪';
        const link = v.url !== '#' ? `<a href="${v.url}" target="_blank" style="color:#38bdf8;text-decoration:none;">${v.title}</a>` : `<span style="color:#fbbf24;">${v.title}</span>`;
        card.innerHTML = `<div>${lbl} ${link}</div>`;
        if (v.type === 'request') {
          const matches = matchRequest(v);
          if (matches.length > 0) {
            const matchDiv = d.createElement('div');
            matchDiv.style.cssText = 'margin-top:5px;padding-left:10px;font-size:11px;';
            matchDiv.innerHTML = '<b>🏠 معروضات مطابقة:</b>';
            matches.forEach(match => {
              const ad = match.ad;
              const adLink = ad.url !== '#' ? `<a href="${ad.url}" target="_blank" style="color:#10b981;text-decoration:none;">${ad.title}</a>` : `<span style="color:#10b981;">${ad.title}</span>`;
              matchDiv.innerHTML += `<div style="margin:2px 0;">${adLink}</div>`;
            });
            card.appendChild(matchDiv);
          }
        }
        ls.appendChild(card);
      });
    }
    updateCounts();
  }

  // ---------- بناء الواجهة ----------
  scanLocal();

  const w = d.createElement('div');
  w.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:#0f172a;color:#fff;direction:rtl;display:flex;flex-direction:column;font:12px sans-serif;';

  const hd = d.createElement('div');
  hd.style.cssText = 'background:#1e293b;padding:8px;display:flex;justify-content:space-between;';
  const cnt = d.createElement('span');
  hd.innerHTML = '<b style="color:#38bdf8">🏠 صياد عقارات قطر الذكي</b> ';
  hd.appendChild(cnt);
  const cl = d.createElement('span');
  cl.textContent = '✕';
  cl.style.cssText = 'color:#f44;cursor:pointer;';
  cl.onclick = () => { w.remove(); window._h = 0; };
  hd.appendChild(cl);
  w.appendChild(hd);

  const tabs = d.createElement('div');
  tabs.style.cssText = 'display:flex;gap:2px;background:#111827;padding:4px;';
  function mkTab(lb, ty) {
    const b = d.createElement('button');
    b.textContent = lb;
    b.style.cssText = 'flex:1;background:' + (tab === ty ? '#2563eb' : '#1f2937') + ';color:#fff;border:none;padding:6px;border-radius:6px;font-weight:bold;';
    b.onclick = () => { tab = ty; render(); };
    return b;
  }
  const ta = mkTab('الكل', 'all'),
        ts = mkTab('معروضات', 'sale'),
        tr = mkTab('إيجار', 'rent'),
        treq = mkTab('طلبات', 'request');
  tabs.append(ta, ts, tr, treq);
  w.appendChild(tabs);

  const ls = d.createElement('div');
  ls.style.cssText = 'flex:1;overflow-y:auto;padding:6px;';
  w.appendChild(ls);

  si = d.createElement('input');
  si.placeholder = 'ابحث...';
  si.style.cssText = 'margin:4px;padding:6px;background:#1e293b;border:none;color:#fff;border-radius:6px;';
  si.oninput = render;
  w.appendChild(si);

  const btns = d.createElement('div');
  btns.style.cssText = 'display:flex;gap:4px;padding:4px;flex-wrap:wrap;';
  const eb = d.createElement('button');
  eb.textContent = '📥 JSON';
  eb.style.cssText = 'background:#f59e0b;border:none;color:#fff;padding:6px;border-radius:6px;flex:1;';
  const fbBtn = d.createElement('button');
  fbBtn.textContent = '📘 فيسبوك عقارات';
  fbBtn.style.cssText = 'background:#1877f2;border:none;color:#fff;padding:6px;border-radius:6px;flex:1;';
  btns.append(eb, fbBtn);
  w.appendChild(btns);

  d.body.appendChild(w);
  updateCounts();
  render();

  // ---------- تحميل خارجي (آمن) ----------
  async function safeFetch(url, sourceName) {
    try {
      const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
      if (!response.ok) return;
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('a').forEach(a => {
        const t = a.textContent.trim();
        if (t.length > 4) add(a.href, t, classify(t));
      });
      doc.querySelectorAll('div, article, section, p, span').forEach(el => {
        const t = el.textContent.trim();
        if (t.length > 10 && /(مطلوب|أبحث عن|طلب شراء|طلب إيجار|مستأجر|مشتري)/i.test(t)) {
          const key = sourceName + '_' + t.slice(0, 40);
          if (!m.has(key)) {
            const meta = extractMeta(t);
            add('#', '🌐 ' + t.slice(0, 55), 'request', meta);
          }
        }
      });
      render();
    } catch (e) {
      console.log('تعذر جلب ' + sourceName);
    }
  }

  // محاولة جلب Qatar Living في الخلفية
  safeFetch('https://www.qatarliving.com/requests', 'qatarLiving');

  // زر فيسبوك
  fbBtn.onclick = () => {
    const fbUrl = 'https://mbasic.facebook.com/groups/realestateqatar';
    window.open(fbUrl, '_blank');
    alert('📘 افتح صفحة المجموعة ثم اضغط الإشارة المرجعية مرة أخرى لجمع المنشورات.');
  };

  eb.onclick = () => {
    const data = [];
    m.forEach(v => data.push({ type: v.type, title: v.title, url: v.url, meta: v.meta }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = d.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qatar_ads.json';
    a.click();
  };

  window._h = () => { w.remove(); window._h = 0; };
}();
