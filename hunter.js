void async function() {
  if (window._h) return window._h();
  window._h = 1;
  const d = document,
    m = new Map(),
    PROXY = 'https://api.allorigins.win/raw?url=',
    STREAMS = new Map();
  let si, tab = 'all', sortBy = 'viewers', cat = 'all',
    isLive = false, observer;

  // ---------- اكتشاف تلقائي لنوع الصفحة ----------
  const url = location.href.toLowerCase();
  if (/tango\.me\/live|bigo\.tv|youtube\.com\/live|dlive/i.test(url)) {
    isLive = true;
  }

  // ========== وضع العقارات (الأصلي) ==========
  if (!isLive) {
    // ... (نفس كود العقارات السابق كاملاً، غير مكرر هنا للإيجاز لكنه موجود في الملف الكامل)
    // سنرمز له بـ realEstateMain()
    realEstateMain();
  }
  // ========== وضع البث المباشر ==========
  else {
    function extractStreamCard(card) {
      const id = card.getAttribute('data-room-id') ||
        card.querySelector('[data-room-id]')?.getAttribute('data-room-id') ||
        card.id || card.querySelector('a[href*="/room/"]')?.href?.split('/').pop() || '';
      const title = card.querySelector('.title, [class*="title"], h3, h4, [class*="name"]')?.innerText?.trim() || '';
      const cover = card.querySelector('img')?.src || card.querySelector('video')?.poster || '';
      const viewersText = card.querySelector('.audience-count, [class*="viewer"], [class*="count"], [class*="num"]')?.innerText?.trim() || '0';
      const viewers = parseInt(viewersText.replace(/[^0-9]/g, ''), 10) || 0;
      const category = card.querySelector('.category, [class*="category"], [class*="tag"]')?.innerText?.trim() || 'غير معروف';
      const language = card.querySelector('.language, [class*="lang"]')?.innerText?.trim() || 'غير معروف';
      const startTime = card.getAttribute('data-start') || '';
      const status = card.classList.contains('live') || viewers > 0 ? 'مباشر' : 'منتهي';
      const interaction = parseInt((card.querySelector('.likes, [class*="like"], .hearts')?.innerText || '0').replace(/[^0-9]/g, ''), 10) || 0;
      return { id, title, cover, viewers, category, language, startTime, status, interaction };
    }

    function scanLive() {
      d.querySelectorAll('.room-card, [class*="room-item"], [class*="stream-card"], .live-card, [class*="live-item"]').forEach(el => {
        const data = extractStreamCard(el);
        if (data && data.id && !STREAMS.has(data.id)) {
          STREAMS.set(data.id, data);
        }
      });
      updateLiveUI();
    }

    function updateLiveUI() {
      if (!listEl) return;
      let arr = [...STREAMS.values()];
      const search = si.value.trim().toLowerCase();
      if (search) arr = arr.filter(s => s.title.toLowerCase().includes(search) || s.category.toLowerCase().includes(search));
      if (cat !== 'all') arr = arr.filter(s => s.category === cat);
      if (sortBy === 'viewers') arr.sort((a, b) => b.viewers - a.viewers);
      else if (sortBy === 'interaction') arr.sort((a, b) => b.interaction - a.interaction);
      else if (sortBy === 'recent') arr.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      listEl.innerHTML = '';
      if (arr.length === 0) {
        listEl.innerHTML = '<div style="color:#fbbf24;text-align:center;padding:20px;">لا توجد بثوث مطابقة.</div>';
        return;
      }
      arr.forEach(s => {
        const card = d.createElement('div');
        card.style.cssText = 'background:#1e293b;margin:4px 0;padding:10px;border-radius:8px;display:flex;gap:10px;';
        card.innerHTML = `
          <img src="${s.cover}" style="width:80px;height:60px;border-radius:6px;object-fit:cover" loading="lazy" onerror="this.style.display='none'">
          <div style="flex:1">
            <a href="${location.origin}/room/${s.id}" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:bold;">${s.title}</a>
            <div style="color:#94a3b8;font-size:11px;">${s.category} | ${s.language} | 👁 ${s.viewers.toLocaleString()} | ❤️ ${s.interaction.toLocaleString()} | ${s.status}</div>
          </div>`;
        listEl.appendChild(card);
      });
      cntEl.textContent = STREAMS.size;
    }

    // بناء واجهة البث
    scanLive();
    const w = d.createElement('div');
    w.id = 'liveDash';
    w.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0f172a;color:#fff;direction:rtl;display:flex;flex-direction:column;font:12px sans-serif;';
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
        ${['all','العاب','موسيقى','دردشة','رياضة','تعليم','أخبار','أخرى'].map(c => 
          `<button class="catTab" data-cat="${c}" style="flex:1;background:#1f2937;color:#fff;border:none;padding:6px;border-radius:6px;white-space:nowrap">${c==='all'?'الكل':c}</button>`
        ).join('')}
      </div>
      <div id="list" style="flex:1;overflow-y:auto;padding:8px"></div>`;
    d.body.appendChild(w);

    const cntEl = w.querySelector('#cnt'),
      listEl = w.querySelector('#list'),
      sortSel = w.querySelector('#sortBy'),
      si = w.querySelector('#si'),
      catTabs = w.querySelectorAll('.catTab');

    catTabs.forEach(btn => {
      btn.onclick = () => {
        cat = btn.dataset.cat;
        catTabs.forEach(b => b.style.background = '#1f2937');
        btn.style.background = '#2563eb';
        updateLiveUI();
      };
    });
    si.oninput = updateLiveUI;
    sortSel.onchange = () => { sortBy = sortSel.value; updateLiveUI(); };
    w.querySelector('#tvMode').onclick = () => {
      w.style.fontSize = '22px';
      w.querySelectorAll('a').forEach(a => a.style.fontSize = '20px');
    };

    observer = new MutationObserver(mutations => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches && node.matches('.room-card, [class*="room-item"], [class*="stream-card"], .live-card, [class*="live-item"]')) {
            const data = extractStreamCard(node);
            if (data && data.id) STREAMS.set(data.id, data);
          } else {
            node.querySelectorAll?.('.room-card, [class*="room-item"], [class*="stream-card"], .live-card, [class*="live-item"]').forEach(el => {
              const data = extractStreamCard(el);
              if (data && data.id) STREAMS.set(data.id, data);
            });
          }
        }
      }));
      updateLiveUI();
    });
    observer.observe(d.body, { childList: true, subtree: true });
  }

  // تعريف دالة realEstateMain() التي تحتوي على كود العقارات الكامل السابق
  function realEstateMain() {
    // هنا كود العقارات الذي تم تطويره سابقاً (النسخة المحسنة v3)
    // لم يتم تكراره هنا للإيجاز ولكن يجب دمجه في الملف النهائي
  }
}();
