function liveStreamMain() {
  function extractStreamData() {
    const rooms = [];
    // البحث عن جميع الروابط التي تشير إلى /room/
    document.querySelectorAll('a[href*="/room/"]').forEach(a => {
      const id = a.href.split('/room/')[1]?.split('?')[0] || '';
      if (!id) return;
      const card = a.closest('div, li, article, section') || a.parentElement;
      const title = card.querySelector('[class*="title"], h3, h4, strong')?.innerText?.trim() || a.innerText.trim();
      const cover = card.querySelector('img')?.src || '';
      // استخراج عدد المشاهدين من النص القريب
      const viewerEl = card.querySelector('[class*="viewer"], [class*="audience"], [class*="count"]');
      const viewersText = viewerEl?.innerText?.trim() || '';
      const viewers = parseInt(viewersText.replace(/[^0-9]/g, ''), 10) || 0;
      // محاولة استخراج التفاعل (إعجابات)
      const likeEl = card.querySelector('[class*="like"], [class*="heart"], [class*="interact"]');
      const interactionText = likeEl?.innerText?.trim() || '';
      const interaction = parseInt(interactionText.replace(/[^0-9]/g, ''), 10) || 0;
      // الفئة واللغة من النص أو العناصر
      const category = card.querySelector('[class*="category"], [class*="tag"], [class*="label"]')?.innerText?.trim() || 'غير معروف';
      const language = card.querySelector('[class*="lang"], [class*="locale"]')?.innerText?.trim() || 'غير معروف';
      rooms.push({ id, title, cover, viewers, category, language, interaction, url: a.href });
    });

    // إزالة التكرار بواسطة id
    const unique = [];
    const seen = new Set();
    rooms.forEach(r => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        unique.push(r);
      }
    });
    return unique;
  }

  function updateUI() {
    if (!listEl) return;
    let arr = [...STREAMS.values()];
    const search = si.value.trim().toLowerCase();
    if (search) arr = arr.filter(s => s.title.toLowerCase().includes(search) || s.category.toLowerCase().includes(search));
    if (cat !== 'all') arr = arr.filter(s => s.category === cat);
    if (sortBy === 'viewers') arr.sort((a, b) => b.viewers - a.viewers);
    else if (sortBy === 'interaction') arr.sort((a, b) => b.interaction - a.interaction);
    else if (sortBy === 'recent') arr.sort((a, b) => b.url.localeCompare(a.url));

    listEl.innerHTML = '';
    arr.forEach(s => {
      const card = d.createElement('div');
      card.style.cssText = 'background:#1e293b;margin:4px 0;padding:10px;border-radius:8px;display:flex;gap:10px;';
      card.innerHTML = `<img src="${s.cover}" style="width:80px;height:60px;border-radius:6px;object-fit:cover" loading="lazy" onerror="this.style.display='none'">
        <div style="flex:1">
          <a href="${s.url}" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:bold;">${s.title}</a>
          <div style="color:#94a3b8;font-size:11px;">${s.category} | 👁 ${s.viewers.toLocaleString()} | ❤️ ${s.interaction.toLocaleString()}</div>
        </div>`;
      listEl.appendChild(card);
    });
    cntEl.textContent = STREAMS.size;
  }

  function scanAndUpdate() {
    const newRooms = extractStreamData();
    newRooms.forEach(r => { if (r.id && !STREAMS.has(r.id)) STREAMS.set(r.id, r); });
    updateUI();
  }

  // تهيئة الواجهة (كما في السابق)
  scanAndUpdate();
  const w = d.createElement('div');
  w.id = 'liveDash';
  w.style = 'position:fixed;inset:0;z-index:2147483647;background:#0f172a;color:#fff;direction:rtl;display:flex;flex-direction:column;font:12px sans-serif;';
  w.innerHTML = `
    <div style="background:#1e293b;padding:10px;display:flex;justify-content:space-between;align-items:center;">
      <b style="color:#38bdf8;font-size:16px">📡 بثوث مباشرة <span id="cnt" style="background:#0284c7;padding:2px 6px;border-radius:10px;font-size:11px">0</span></b>
      <span style="color:#f44;cursor:pointer;font-size:18px" onclick="document.getElementById('liveDash').remove();window._h=0;">✕</span>
    </div>
    <div style="padding:8px;background:#111827;display:flex;gap:4px;flex-wrap:wrap">
      <input id="si" placeholder="ابحث..." style="flex:2;padding:7px;background:#1f2937;border:1px solid #374151;color:#fff;border-radius:6px">
      <select id="sortBy" style="background:#1f2937;color:#fff;border:1px solid #374151;border-radius:6px;padding:7px">
        <option value="viewers">👁 الأكثر مشاهدة</option>
        <option value="interaction">❤️ الأكثر تفاعل</option>
        <option value="recent">🕒 الأحدث</option>
      </select>
      <button id="tvMode" style="background:#8b5cf6;border:none;color:#fff;padding:7px 10px;border-radius:6px">📺</button>
    </div>
    <div style="display:flex;gap:2px;background:#111827;padding:4px;overflow-x:auto">
      ${['all','موسيقى','دردشة','ألعاب','رياضة','تعليم','أخرى'].map(c => `<button class="catTab" data-cat="${c}" style="flex:1;background:#1f2937;color:#fff;border:none;padding:6px;border-radius:6px;white-space:nowrap">${c==='all'?'الكل':c}</button>`).join('')}
    </div>
    <div id="list" style="flex:1;overflow-y:auto;padding:8px"></div>`;
  d.body.appendChild(w);

  const cntEl = w.querySelector('#cnt'), listEl = w.querySelector('#list'), sortSel = w.querySelector('#sortBy'), si = w.querySelector('#si'), catTabs = w.querySelectorAll('.catTab');

  catTabs.forEach(btn => {
    btn.onclick = () => {
      cat = btn.dataset.cat;
      catTabs.forEach(b => b.style.background='#1f2937');
      btn.style.background='#2563eb';
      updateUI();
    };
  });
  si.oninput = updateUI;
  sortSel.onchange = () => { sortBy = sortSel.value; updateUI(); };
  w.querySelector('#tvMode').onclick = () => {
    w.style.fontSize='22px';
    w.querySelectorAll('a').forEach(a => a.style.fontSize='20px');
  };

  // مراقبة التغييرات
  observer = new MutationObserver(() => {
    scanAndUpdate();
  });
  observer.observe(d.body, { childList: true, subtree: true });
}
