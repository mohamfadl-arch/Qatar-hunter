// ==================== AUTO-DETECT PAGE TYPE ====================
const IS_LIVE = /tango\.me\/live|bigo\.tv|youtube\.com\/live/i.test(location.href);

if (IS_LIVE) {
  // --------------- LIVE STREAM DASHBOARD ---------------
  (function() {
    if (window._live) return;
    window._live = 1;
    const d = document, streams = new Map();
    let si, tab = 'all', sortBy = 'viewers', refreshInterval;

    function extractCard(card) {
      const id = card.getAttribute('data-room-id') || 
                 card.querySelector('[data-room-id]')?.getAttribute('data-room-id') ||
                 card.id || '';
      if (!id) return null;
      const title = card.querySelector('.title, [class*="title"], h3, h4')?.innerText?.trim() || '';
      const cover = card.querySelector('img')?.src || '';
      const viewersText = card.querySelector('.audience-count, [class*="viewer"], [class*="count"]')?.innerText?.trim() || '0';
      const viewers = parseInt(viewersText.replace(/[^0-9]/g, ''), 10) || 0;
      const category = card.querySelector('.category, [class*="category"], [class*="tag"]')?.innerText?.trim() || 'غير معروف';
      const language = card.querySelector('.language, [class*="lang"]')?.innerText?.trim() || 'غير معروف';
      const startTime = card.getAttribute('data-start') || '';
      const status = card.classList.contains('live') ? 'مباشر' : 'منتهي';
      return { id, title, cover, viewers, category, language, startTime, status };
    }

    function scan() {
      d.querySelectorAll('.room-card, [class*="room-item"], [class*="stream-card"], .live-card').forEach(el => {
        const data = extractCard(el);
        if (data && !streams.has(data.id)) {
          streams.set(data.id, data);
        }
      });
    }

    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches && node.matches('.room-card, [class*="room-item"], [class*="stream-card"], .live-card')) {
            const data = extractCard(node);
            if (data) streams.set(data.id, data);
          } else {
            node.querySelectorAll?.('.room-card, [class*="room-item"], [class*="stream-card"], .live-card').forEach(el => {
              const data = extractCard(el);
              if (data) streams.set(data.id, data);
            });
          }
        }
      }));
      render();
    });

    function render() {
      if (!list) return;
      let arr = [...streams.values()];
      const search = si.value.trim().toLowerCase();
      if (search) arr = arr.filter(s => s.title.toLowerCase().includes(search) || s.category.toLowerCase().includes(search));
      if (tab !== 'all') arr = arr.filter(s => s.category === tab);
      // Sort
      if (sortBy === 'viewers') arr.sort((a, b) => b.viewers - a.viewers);
      else if (sortBy === 'time') arr.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      
      list.innerHTML = '';
      if (arr.length === 0) {
        list.innerHTML = '<div style="color:#fbbf24;text-align:center;padding:20px;">لا توجد بثوث مطابقة.</div>';
        return;
      }
      arr.forEach(s => {
        const card = d.createElement('div');
        card.style.cssText = 'background:#1e293b;margin:4px 0;padding:10px;border-radius:8px;display:flex;gap:10px;';
        card.innerHTML = `
          <img src="${s.cover}" style="width:80px;height:60px;border-radius:6px;object-fit:cover" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2260%22><rect fill=%22%23374151%22 width=%2280%22 height=%2260%22/><text x=%2210%22 y=%2235%22 fill=%22%23fff%22 font-size=%2212%22>No Img</text></svg>'">
          <div style="flex:1">
            <a href="${location.origin}/room/${s.id}" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:bold;">${s.title}</a>
            <div style="color:#94a3b8;font-size:11px;">${s.category} | ${s.language} | 👁 ${s.viewers.toLocaleString()} | ${s.status}</div>
          </div>`;
        list.appendChild(card);
      });
      cnt.textContent = streams.size;
    }

    // Build UI
    scan();
    const w = d.createElement('div');
    w.id = 'liveDash';
    w.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0f172a;color:#fff;direction:rtl;display:flex;flex-direction:column;font:12px sans-serif;';
    w.innerHTML = `
      <div style="background:#1e293b;padding:10px;display:flex;justify-content:space-between;align-items:center;">
        <b style="color:#38bdf8;font-size:16px">📡 بثوث مباشرة <span id="cnt" style="background:#0284c7;padding:2px 6px;border-radius:10px;font-size:11px">0</span></b>
        <span style="color:#f44;cursor:pointer;font-size:18px" onclick="document.getElementById('liveDash').remove();window._live=0;">✕</span>
      </div>
      <div style="padding:8px;background:#111827;display:flex;gap:4px;flex-wrap:wrap">
        <input id="si" placeholder="ابحث..." style="flex:2;padding:7px;background:#1f2937;border:1px solid #374151;color:#fff;border-radius:6px">
        <select id="sortBy" style="background:#1f2937;color:#fff;border:1px solid #374151;border-radius:6px;padding:7px">
          <option value="viewers">👁 الأكثر مشاهدة</option>
          <option value="time">🕒 الأحدث</option>
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

    const cnt = w.querySelector('#cnt'),
          si = w.querySelector('#si'),
          list = w.querySelector('#list'),
          sortSel = w.querySelector('#sortBy');
    
    // Category tabs
    w.querySelectorAll('.catTab').forEach(btn => {
      btn.onclick = () => {
        tab = btn.dataset.cat;
        w.querySelectorAll('.catTab').forEach(b => b.style.background='#1f2937');
        btn.style.background='#2563eb';
        render();
      };
    });

    si.oninput = render;
    sortSel.onchange = () => { sortBy = sortSel.value; render(); };
    document.getElementById('tvMode').onclick = () => {
      w.style.fontSize = '22px';
      w.querySelectorAll('a').forEach(a => a.style.fontSize = '20px');
    };

    observer.observe(d.body, { childList: true, subtree: true });
    render();
    // Auto-refresh every 30s (re-scan)
    refreshInterval = setInterval(() => { scan(); render(); }, 30000);
    window._live = () => { w.remove(); clearInterval(refreshInterval); window._live = 0; };
  })();

} else {
  // --------------- REAL ESTATE HUNTER (original code) ---------------
  void async function(){ /* ... the entire real estate hunter code you had previously ... */ }();
}
