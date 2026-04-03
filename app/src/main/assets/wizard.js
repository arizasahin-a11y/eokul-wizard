/**
 * e-Okul Gelişim Düzeyi Sihirbazı v3.3 — Android WebView
 * SheetJS (XLSX), MainActivity tarafından önceden enjekte edilir.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'eokul_v3';
    const OOK_URL     = 'https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK07015.aspx';
    const IS_TARGET   = /OOK07015/i.test(window.location.pathname);

    let S = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
        active: false, mode: 'fill', excelData: [],
        currentIndex: -1, catRange: '1', autoNextClass: true,
        autoConfirm: true, open: true
    };
    // Oturum başlangıcında excel verisini temizle (otomasyon devam etmiyorsa)
    if (!S.active) { S.excelData = []; }
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(S));


    /* ── Yardımcılar ─────────────────────────────────────────── */
    function parseRange(s) {
        const idx = new Set();
        (s||'').split(',').map(p=>p.trim()).forEach(p=>{
            if (p.includes('-')) {
                const [a,b]=p.split('-').map(Number);
                if(!isNaN(a)&&!isNaN(b)) for(let i=Math.min(a,b);i<=Math.max(a,b);i++) idx.add(i-1);
            } else { const n=parseInt(p); if(!isNaN(n)) idx.add(n-1); }
        });
        return [...idx].sort((a,b)=>a-b);
    }
    function getRandLvl(base) {
        const r=Math.random();
        if(base===1) return r<.15?2:1;
        if(base===4) return r<.15?3:4;
        if(r<.10) return base-1; if(r<.20) return base+1; return base;
    }
    const wait = ms => new Promise(r=>setTimeout(r,ms));
    const msg  = t  => { const e=document.getElementById('ew-log'); if(e) e.textContent=t; };

    /* ── CSS ─────────────────────────────────────────────────── */
    if (!document.getElementById('ew-css')) {
        const st=document.createElement('style'); st.id='ew-css';
        st.textContent=`
          @keyframes ewPulse{0%,100%{box-shadow:0 4px 15px rgba(16,185,129,.5)}50%{box-shadow:0 4px 28px rgba(16,185,129,.9)}}
          #ew-fab{animation:ewPulse 2.2s ease-in-out infinite}
          #ew-fab:hover{animation:none;transform:scale(1.12)!important;transition:.15s}
          #ew-panel{transition:opacity .25s,transform .25s;transform-origin:bottom right}
          #ew-panel.ew-hidden{opacity:0;transform:scale(.88);pointer-events:none}
          .ew-sel{width:100%;background:#334155;border:1px solid #475569;color:#f1f5f9;
            padding:9px 8px;border-radius:8px;font-size:13px;margin-bottom:8px}
          .ew-btn{border:none;border-radius:10px;color:white;font-size:14px;
            font-weight:700;cursor:pointer;padding:14px}
          .ew-inp{width:100%;background:#334155;border:1px solid #475569;color:#f1f5f9;
            padding:9px;border-radius:8px;font-size:13px;box-sizing:border-box}
          .ew-lbl{font-size:11px;color:#94a3b8;display:block;margin-bottom:3px;margin-top:8px}
        `;
        document.head.appendChild(st);
    }

    /* ── ⚡ FAB (her sayfada) ─────────────────────────────────── */
    let fab = document.getElementById('ew-fab');
    if (!fab) {
        fab = document.createElement('div'); fab.id='ew-fab';
        Object.assign(fab.style,{
            position:'fixed',bottom:'20px',right:'20px',
            width:'52px',height:'52px',zIndex:'99999999',
            background:'linear-gradient(135deg,#10b981,#059669)',
            borderRadius:'50%',display:'flex',alignItems:'center',
            justifyContent:'center',cursor:'pointer',
            fontSize:'26px',userSelect:'none',transition:'transform .2s'
        });
        fab.textContent='⚡';
        document.body.appendChild(fab);
    }

    /* ── Hedef sayfa değilse: tıklayınca navigasyon ────────── */
    if (!IS_TARGET) {
        fab.onclick = () => {
            const href = window.location.href;

            // Zaten OrtaOgretim bölümündeyse direkt hedef sayfaya git
            if (href.includes('OrtaOgretim') || href.includes('OrtaOğretim')) {
                window.location.href = OOK_URL;
                return;
            }

            // Sayfadaki mentü linklerinde "Gelişim" veya OrtaOğretim ara
            const link = [...document.querySelectorAll('a[href]')].find(a =>
                /OrtaO(g|ğ)retim/i.test(a.href) ||
                /gelişim/i.test(a.textContent)
            );
            if (link) {
                link.click();
            } else {
                // Fallback: OrtaOğretim portaline git, oradan tekrar tıklanır
                window.location.href = 'https://e-okul.meb.gov.tr/OrtaOgretim/OrtaOgretim.aspx';
            }
        };
        return;
    }

    /* ══════════════════════════════════════════════════════════
       HEDEF SAYFA — Tam Panel
    ══════════════════════════════════════════════════════════ */
    if (window.top !== window.self && !S.active) return;

    // Kayıt onayı: önce native'i sakla, sonra override et
    if (!window._nativeConfirm) window._nativeConfirm = window.confirm;
    window.confirm = (m) => S.autoConfirm ? true : window._nativeConfirm.call(window, m);



    /* ── Panel HTML ──────────────────────────────────────────── */
    const oldPanel = document.getElementById('ew-panel');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div'); panel.id='ew-panel';
    const hd = S.excelData.length > 0;

    panel.innerHTML = `
<div style="background:#1e293b;color:#f1f5f9;padding:16px;border-radius:18px;
    box-shadow:0 20px 40px rgba(0,0,0,.65);font-family:'Segoe UI',sans-serif;
    width:min(318px,90vw);border:1px solid #334155;">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <span style="font-size:16px;font-weight:600">⚡ e-Okul Sihirbazı v3.3</span>
    <button id="ew-close" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;line-height:1">×</button>
  </div>

  <!-- Şube / Ders -->
  <label class="ew-lbl" style="margin-top:0">Şube:</label>
  <select id="ew-sube" class="ew-sel"><option>Yükleniyor…</option></select>
  <label class="ew-lbl">Ders:</label>
  <select id="ew-ders" class="ew-sel"><option>Yükleniyor…</option></select>

  <!-- Log -->
  <div style="background:#0f172a;padding:10px;border-radius:10px;margin-bottom:12px;font-size:12px">
    <div id="ew-info">${hd?'📋 Kayıtlı: '+S.excelData.length+' Öğrenci':'⚠️ Excel yüklenmedi'}</div>
    <div id="ew-log" style="color:#94a3b8;font-size:11px;margin-top:5px">Bekleniyor…</div>
  </div>

  <!-- Excel — HER ZAMAN GÖRÜİR -->
  <div style="margin-bottom:12px">
    <label class="ew-lbl" style="margin-top:0">
      ${hd?'📊 Excel Değiştir:':'📂 Excel Dosyası (.xlsx/.xls):'}
    </label>
    <input type="file" id="ew-file" accept=".xlsx,.xls"
      style="font-size:12px;width:100%;background:#0f172a;border:1px solid #475569;
             color:#f1f5f9;padding:9px;border-radius:8px;box-sizing:border-box">
  </div>

  <!-- Tema No -->
  <label class="ew-lbl">Tema No (örn: 1 veya 2-4):</label>
  <input type="text" id="ew-cat" class="ew-inp" value="${S.catRange}" style="margin-bottom:10px">
  <label style="font-size:13px;color:#94a3b8;display:flex;align-items:center;gap:8px;
                cursor:pointer;margin-bottom:8px">
    <input type="checkbox" id="ew-auto" ${S.autoNextClass?'checked':''} style="width:18px;height:18px">
    Şubeyi Otomatik Atla
  </label>
  <label style="font-size:13px;color:#94a3b8;display:flex;align-items:center;gap:8px;
                cursor:pointer;margin-bottom:14px">
    <input type="checkbox" id="ew-ac" ${S.autoConfirm?'checked':''} style="width:18px;height:18px">
    Kayıt Onayını Otomatik Onayla
  </label>

  <!-- Eylem Butonları -->
  <div style="display:flex;gap:8px;margin-bottom:8px">
    <button id="ew-start" class="ew-btn" ${hd?'':'disabled'}
      style="flex:2;background:${hd?'#10b981':'#374151'}">▶ BAŞLAT</button>
    <button id="ew-stop"  class="ew-btn" style="flex:1;background:#475569;font-size:22px">⏹</button>
  </div>
  <button id="ew-clear" class="ew-btn" ${hd?'':'disabled'}
    style="width:100%;background:${hd?'#ef4444':'#374151'};margin-bottom:8px">
    🗑 ALANI TEMİZLE</button>
  <button id="ew-devam" class="ew-btn"
    style="display:none;width:100%;background:#7c3aed;margin-bottom:10px">
    ➡ DEVAM ET
  </button>

  <div style="text-align:right">
    <a href="#" id="ew-reset" style="color:#475569;font-size:11px;text-decoration:none">⟳ Veriyi Sıfırla</a>
  </div>
</div>`;

    Object.assign(panel.style, {
        position:'fixed', bottom:'80px', right:'12px',
        zIndex:'9999998', maxHeight:'92vh', overflowY:'auto'
    });
    if (!S.open) panel.classList.add('ew-hidden');
    document.body.appendChild(panel);

    /* ── Toggle ──────────────────────────────────────────────── */
    function togglePanel() {
        S.open = !S.open;
        panel.classList.toggle('ew-hidden', !S.open);
        save();
    }
    fab.onclick = togglePanel;
    document.getElementById('ew-close').onclick = togglePanel;

    /* ── Dropdown Senkronu ───────────────────────────────────── */

    // Sayfanın herhangi bir select'ini panel select'e yansıt
    function mirrorOpts(src, dst) {
        if (!src || !dst) return;
        const prev = dst.value;
        dst.innerHTML = '';
        [...src.options].forEach(o => dst.add(new Option(o.text, o.value, o.defaultSelected, o.selected)));
        if (prev && dst.querySelector(`option[value="${prev}"]`)) dst.value = prev;
    }

    // Yıl/Dönem select'i bul
    function findYilDonem() {
        return [...document.querySelectorAll('select')].find(s =>
            !s.id.startsWith('ew-') &&
            [...s.options].some(o => /dönem|donem|\d{4}-\d{4}/i.test(o.text))
        );
    }

    // Ders select = cmbBeceriler (e-okul OOK07015 sayfasından tespit edildi)
    function findDers() {
        return document.getElementById('cmbBeceriler') || null;
    }

    function syncDropdowns() {
        // ── Ortak polling fonksiyonu ─────────────────────
        function makePoller(getPage, panelId, triggerChange) {
            let lastHTML = '';
            return () => {
                const pageSel  = getPage();
                const panelSel = document.getElementById(panelId);
                if (!panelSel || !pageSel) return;
                const html = pageSel.innerHTML;
                if (html === lastHTML) return;
                lastHTML = html;
                mirrorOpts(pageSel, panelSel);
                panelSel.onchange = () => {
                    const fresh = getPage();
                    if (!fresh) return;
                    const val = panelSel.value;
                    if (window.$ && window.$.fn && window.$.fn.select2
                            && $(fresh).data('select2')) {
                        // Select2 bağlı: jQuery üzerinden değer ata
                        $(fresh).val(val).trigger('change');
                    } else {
                        // Standart select
                        fresh.value = val;
                        fresh.dispatchEvent(new Event('change', {bubbles: true}));
                    }
                    if (triggerChange) triggerChange();
                };
            };
        }


        const pollSube = makePoller(
            () => document.getElementById('cmbSubeler'), 'ew-sube'
        );
        const pollDers = makePoller(findDers, 'ew-ders', autoListele);

        pollSube(); pollDers();
        setInterval(() => { pollSube(); pollDers(); }, 500);
    }
    setTimeout(syncDropdowns, 1200);

    /* ── Ders değişince otomatik Listele ──────────────── */
    // makePoller içinde ew-ders için triggerChange olarak geçilecek
    function autoListele() {
        setTimeout(() => {
            const btn = document.querySelector('button.btn-primary.has-ripple');
            if (btn) { btn.click(); msg('📋 Ders seçildi, listeleniyor…'); }
        }, 600);
    }


    /* ── Excel ──────────────────────────────────────────────── */
    document.getElementById('ew-file').onchange = function (e) {
        const f = e.target.files[0]; if (!f) return;
        msg('📂 Excel okunuyor…');
        const r = new FileReader();
        r.onload = evt => {
            try {
                const wb   = XLSX.read(evt.target.result, {type:'binary'});
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
                const data = [];
                for (let i=1; i<rows.length; i++) {
                    if (!rows[i][2]) continue;
                    // Sütun 5'ten itibaren tüm numeric değerleri topla
                    const vals = [];
                    for (let c=4; c<rows[i].length; c++) {
                        const v = parseFloat(rows[i][c]);
                        vals.push(isNaN(v) ? 0 : v);
                    }
                    if (vals.length === 0) vals.push(0);
                    data.push({no: rows[i][2].toString().trim(), vals});
                }
                S.excelData = data; S.currentIndex = -1; S.active = false;
                save();

                // Sayfa yenileme YOK — UI dinamik güncellenir
                const colCount = data[0]?.vals.length || 0;
                const infoEl   = document.getElementById('ew-info');
                const startEl  = document.getElementById('ew-start');
                const clearEl  = document.getElementById('ew-clear');
                if (infoEl) infoEl.textContent = '📋 Kayıtlı: ' + data.length + ' Öğrenci | ' + colCount + ' tema sütunu';
                if (startEl) { startEl.disabled=false; startEl.style.background='#10b981'; }
                if (clearEl) { clearEl.disabled=false; clearEl.style.background='#ef4444'; }
                msg('✅ ' + data.length + ' öğrenci yüklendi. Şube/ders seçimini koruyun.');
            } catch(ex) { alert('Excel okunamadı: '+ex.message); }
        };
        r.readAsBinaryString(f);
    };


    /* ── Butonlar ────────────────────────────────────────────── */
    document.getElementById('ew-start').onclick = () => { S.active=true;  S.mode='fill';  save(); runLoop(); };
    document.getElementById('ew-stop').onclick  = () => { S.active=false; save(); msg('⏹ Durduruldu.'); };
    document.getElementById('ew-clear').onclick = () => {
        if (confirm('Seçili kategorilerdeki tüm girişler SİLİNECEKTİR. Devam?')) {
            S.active=true; S.mode='clear'; save(); runLoop();
        }
    };
    document.getElementById('ew-cat').oninput   = e => { S.catRange=e.target.value; save(); };
    document.getElementById('ew-auto').onchange = e => { S.autoNextClass=e.target.checked; save(); };
    document.getElementById('ew-ac').onchange   = e => { S.autoConfirm=e.target.checked; save(); };

    document.getElementById('ew-reset').onclick = e => {
        e.preventDefault(); localStorage.removeItem(STORAGE_KEY); location.reload();
    };

    document.getElementById('ew-devam').onclick = () => {
        document.getElementById('ew-devam').style.display = 'none';
        runLoop();
    };

    /* ── Ana Döngü ───────────────────────────────────────────── */
    async function runLoop() {
        if (!S.active) return;

        const btns = [...document.querySelectorAll('button[id^="btnOpen"]')];
        const rows = btns.map(b=>b.closest('tr')).filter(Boolean);

        if (!rows.length) {
            const lb = document.querySelector('button.btn-primary.has-ripple');
            if (lb) { lb.click(); setTimeout(runLoop, 3000); return; }
            msg('❌ Liste yüklenemedi.'); return;
        }

        S.currentIndex++;

        /* Şube bitti */
        if (S.currentIndex >= rows.length) {
            if (S.autoNextClass) {
                const sel = document.getElementById('cmbSubeler');
                if (sel && sel.selectedIndex < sel.options.length-1) {
                    sel.selectedIndex++;
                    sel.dispatchEvent(new Event('change',{bubbles:true}));
                    if (window.$?.fn?.select2) $(sel).trigger('change.select2');
                    // Panel dropdown senkronu
                    const pd = document.getElementById('ew-sube');
                    if (pd) pd.selectedIndex = sel.selectedIndex;
                    S.currentIndex=-1; save();
                    setTimeout(()=>{
                        document.querySelector('button.btn-primary.has-ripple')?.click();
                        setTimeout(runLoop, 3000);
                    }, 800);
                    return;
                }
            }
            msg('✅ TAMAMLANDI! 🏁'); S.active=false; save(); return;
        }

        const tr    = rows[S.currentIndex];
        const sNo   = tr.cells[2]?.innerText.trim();
        const btnOp = tr.querySelector('button[id^="btnOpen"]');

        msg(`🔄 ${sNo} No — işlem başlıyor…`);

        const student = S.excelData.find(s=>s.no===sNo);
        if (S.mode==='fill' && !student) { setTimeout(runLoop, 500); return; }

        btnOp.click();
        await wait(1400);

        const headers    = [...document.querySelectorAll('a.text-light')];
        const targetIdxs = parseRange(S.catRange||'1');
        let changed      = false;

        for (const idx of targetIdxs) {
            if (idx>=headers.length) continue;
            const h = headers[idx];
            if (h.classList.contains('collapsed')) { h.click(); await wait(250); }
            const cont = h.closest('.card')?.querySelector('.collapse');
            if (!cont) continue;

            if (S.mode==='fill') {
                // Her tema için o sütunun min/max değerleri ile seviye hesapla
                const colVals = S.excelData.map(d => d.vals[idx] ?? d.vals[0] ?? 0);
                const minV    = Math.min(...colVals);
                const maxV    = Math.max(...colVals);
                const stuVal  = student.vals[idx] ?? student.vals[0] ?? 0;
                const r       = maxV > minV ? (stuVal - minV) / (maxV - minV) : 1;
                const baseLvl = r < .25 ? 1 : r < .50 ? 2 : r < .75 ? 3 : 4;
                const lvl     = getRandLvl(baseLvl);
                msg(`🔄 ${sNo} | Tema ${idx+1}: puan=${stuVal.toFixed(1)} min=${minV.toFixed(1)} max=${maxV.toFixed(1)} → ★${lvl}`);
                const radios = cont.querySelectorAll(`input[type="radio"][id$="_${lvl}"]`);
                radios.forEach(rd=>{ if(!rd.checked){ rd.click(); changed=true; }});
            } else {
                const btns2 = [...cont.querySelectorAll('button.btn-success')].filter(b=>b.innerText.includes('Temizle'));
                for (const b of btns2) { b.click(); await wait(100); changed=true; }
            }
        }

        if (changed) {
            await wait(700);
            const kaydet = document.getElementById('OOMToolbarActive1_btnKaydet');
            if (kaydet) {
                msg('💾 Kaydediliyor…');
                kaydet.click();
                if (S.autoConfirm) {
                    // Onay otomatik — AJAX sonrası devam
                    setTimeout(runLoop, 2500);
                } else {
                    // Manuel onay — '➡ DEVAM ET' butonunu göster
                    msg('⏸ Kaydet onaylanınca ➡ DEVAM ET’e basın');
                    const devamEl = document.getElementById('ew-devam');
                    if (devamEl) devamEl.style.display = 'block';
                }
            } else {
                msg('⚠️ Kaydet butonu yok!');
                setTimeout(runLoop, 1500);
            }
        } else {
            msg('ℹ️ Değişiklik yok.');
            setTimeout(runLoop, 800);  // 1200 → 800ms
        }
    }

    /* ── Oto-devam (sayfa yenileme sonrası) ──────────────────── */
    const resume = () => { if (S.active && S.excelData.length>0) setTimeout(runLoop, 3000); };
    if (document.readyState==='complete') resume();
    else window.addEventListener('load', resume);

})();
