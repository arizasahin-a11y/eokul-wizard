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
        autoConfirm: true, waiting: false, paused: false, open: true
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

    /* ── ⚡ FAB ──────────────────────────────────────────────── */
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

    /* ── Hedef sayfa değilse: tek tıkla, otomatik iki adımlı nav ── */
    if (!IS_TARGET) {
        const OO_URL = 'https://e-okul.meb.gov.tr/OrtaOgretim/OrtaOgretim.aspx';

        // window.name sayfa geçişlerinde korunur (sessionStorage'dan güvenilir)
        if (window.name === 'ew_nav') {
            window.name = '';
            window.location.href = OOK_URL;  // 2. adım: OOK'a geç
            return;
        }

        fab.onclick = () => {
            window.name = 'ew_nav';  // flag: sonraki sayfada OOK'a git
            // Önce sayfadaki OrtaÖğretim linkini bul, yoksa hardcode URL
            const link = [...document.querySelectorAll('a[href]')].find(a =>
                /OrtaO[gğ]retim/i.test(a.href) && !a.href.includes('OKL')
            );
            if (link) { link.click(); }
            else { window.location.href = OO_URL; }
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

  <!-- Başlık -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <span style="font-size:15px;font-weight:700">⚡ e-Okul Sihirbazı</span>
    <span style="font-size:10px;color:#7c3aed;font-weight:700;letter-spacing:1px">@rız@</span>
    <div style="display:flex;gap:6px">
      <button id="ew-help-btn" title="Yardım" style="background:none;border:1px solid #475569;border-radius:50%;color:#94a3b8;font-size:13px;cursor:pointer;width:26px;height:26px;line-height:1">?</button>
      <button id="ew-close" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;line-height:1">×</button>
    </div>
  </div>

  <!-- Yardım Paneli (gizli) -->
  <div id="ew-help" style="display:none;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:10px;font-size:11px;color:#94a3b8;line-height:1.8">
    <b style="color:#f1f5f9;font-size:12px">📚 Kullanım Kılavuzu</b><br>
    <b style="color:#10b981">1. Excel:</b> C=Öğrenci No, E→…=Tema puanları<br>
    <b style="color:#10b981">2. Şube &amp; Ders seç:</b> Otomatik listelenir.<br>
    <b style="color:#10b981">3. Excel yükle:</b> Dosya seç butonuyla.<br>
    <b style="color:#10b981">4. Tema No:</b> "1" veya "2-4" formatında.<br>
    <b style="color:#10b981">5. BAŞLAT:</b> Sırayla işler &amp; kaydeder.<br>
    <hr style="border-color:#334155;margin:6px 0">
    <b style="color:#f59e0b">⏸ DURAKLAT:</b> Mevcut öğrenci biter, bekler.<br>
    <b style="color:#7c3aed">➡ DEVAM ET</b> (mor): Manuel onay sonrası.<br>
    <b style="color:#ef4444">🗑 TEMİZLE:</b> Şubenin tüm girilerini siler.<br>
    <b style="color:#475569">⏹ DURDUR:</b> Her şeyi sıfırlar.
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
    <button id="ew-stop" class="ew-btn" style="flex:1;background:#475569;font-size:22px">⏹</button>
  </div>
  <button id="ew-clear" class="ew-btn" ${hd?'':'disabled'}
    style="width:100%;background:${hd?'#ef4444':'#374151'};margin-bottom:8px">
    🗑 TEMİZLE</button>
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
    document.getElementById('ew-help-btn').onclick = () => {
        const h = document.getElementById('ew-help');
        if (h) h.style.display = h.style.display === 'none' ? 'block' : 'none';
    };


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
                const colCount = data[0]?.vals.length || 0;
                const infoEl   = document.getElementById('ew-info');
                const startEl  = document.getElementById('ew-start');
                const clearEl  = document.getElementById('ew-clear');
                if (infoEl) infoEl.textContent = '📋 Kayıtlı: ' + data.length + ' Öğrenci | ' + colCount + ' tema sütunu';
                if (startEl) { updateStartBtn(); }
                if (clearEl) { clearEl.disabled=false; clearEl.style.background='#ef4444'; }
                msg('✅ ' + data.length + ' öğrenci yüklendi. Şube/ders seçimini koruyun.');
            } catch(ex) { alert('Excel okunamadı: '+ex.message); }
        };
        r.readAsBinaryString(f);
    };

    /* ── Başlat / Duraklat / Devam Et yardımcısı ────────── */
    function updateStartBtn() {
        const btn = document.getElementById('ew-start');
        if (!btn) return;
        if (!S.active) {
            btn.textContent = '▶ BAŞLAT';
            btn.style.background = S.excelData.length ? '#10b981' : '#374151';
            btn.disabled = !S.excelData.length;
        } else if (S.paused) {
            btn.textContent = '▶ DEVAM ET';
            btn.style.background = '#f59e0b';
            btn.disabled = false;
        } else {
            btn.textContent = '⏸ DURAKLAT';
            btn.style.background = '#3b82f6';
            btn.disabled = false;
        }
    }

    /* ── Butonlar ───────────────────────────────────────────── */
    document.getElementById('ew-start').onclick = () => {
        if (!S.active) {
            // BAŞLAT
            if (S.excelData.length === 0) { msg('⚠️ Önce Excel dosyası yükleyin!'); return; }
            if (S.waiting) { msg('⏸ Önce ➡ DEVAM ET\'e basın!'); return; }
            S.active = true; S.paused = false; S.mode = 'fill';
            S.currentIndex = -1; loopBusy = false;
            save(); updateStartBtn(); runLoop();
        } else if (!S.paused) {
            // DURAKLAT
            S.paused = true; save(); updateStartBtn();
            msg('⏸ Duraklatıldı. Devam etmek için tekrar basın.');
        } else {
            // DEVAM ET
            S.paused = false; loopBusy = false; save(); updateStartBtn();
            msg('▶ Devam ediliyor…');
            runLoop();
        }
    };
    document.getElementById('ew-stop').onclick = () => {
        S.active = false; S.paused = false; S.waiting = false;
        loopBusy = false; save();
        const devamEl = document.getElementById('ew-devam');
        if (devamEl) devamEl.style.display = 'none';
        updateStartBtn();
        msg('⏹ Durduruldu.');
    };
    document.getElementById('ew-clear').onclick = () => {
        if (S.excelData.length === 0) { msg('⚠️ Excel yüklenmedi!'); return; }
        if (confirm('Seçili kategorilerdeki tüm girişler SİLİNECEKTİR. Devam?')) {
            S.active=true; S.mode='clear';
            S.currentIndex = -1;
            loopBusy = false;
            save(); runLoop();
        }
    };
    document.getElementById('ew-cat').oninput   = e => { S.catRange=e.target.value; save(); };
    document.getElementById('ew-auto').onchange = e => { S.autoNextClass=e.target.checked; save(); };
    document.getElementById('ew-ac').onchange   = e => { S.autoConfirm=e.target.checked; save(); };

    document.getElementById('ew-reset').onclick = e => {
        e.preventDefault(); localStorage.removeItem(STORAGE_KEY); location.reload();
    };

    document.getElementById('ew-devam').onclick = () => {
        S.waiting = false; loopBusy = false; save();
        document.getElementById('ew-devam').style.display = 'none';
        runLoop();
    };


    /* ── Ana Döngü ───────────────────────────────────────────── */
    let loopBusy = false;  // çakışan çağrıları önler
    async function runLoop() {
        if (loopBusy || !S.active || S.paused) return;
        loopBusy = true;


        const btns = [...document.querySelectorAll('button[id^="btnOpen"]')];
        const rows = btns.map(b=>b.closest('tr')).filter(Boolean);

        if (!rows.length) {
            const lb = document.querySelector('button.btn-primary.has-ripple');
            if (lb) { loopBusy=false; lb.click(); setTimeout(runLoop, 3000); return; }
            msg('❌ Liste yüklenemedi.'); loopBusy=false; return;
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
                    loopBusy=false;
                    setTimeout(()=>{
                        document.querySelector('button.btn-primary.has-ripple')?.click();
                        setTimeout(runLoop, 1800);
                    }, 400);
                    return;
                }
            }
            // Temizle modunda sadece mevcut sınıf temizlenir, sonrakine geçilmez
            msg(S.mode==='clear' ? '✅ Sınıf temizlendi! 🏁' : '✅ TAMAMLANDI! 🏁');
            S.active=false; S.paused=false; loopBusy=false; save();
            updateStartBtn();
            return;
        }

        const tr    = rows[S.currentIndex];
        const sNo   = tr.cells[2]?.innerText.trim();
        const btnOp = tr.querySelector('button[id^="btnOpen"]');

        msg(`🔄 ${sNo} No — işlem başlıyor…`);

        const student = S.excelData.find(s=>s.no===sNo);
        if (S.mode==='fill' && !student) { loopBusy=false; setTimeout(runLoop, 200); return; }

        btnOp.click();

        // İçerik yüklenene kadar bekle (maks 4sn)
        for (let w=0; w<6; w++) {
            await wait(200);
            if (document.querySelectorAll('input[type="radio"]').length > 0) break;
        }

        // Tema başlığı seçici — birden fazla ihtimali dene
        let headers = [...document.querySelectorAll('a.text-light')];
        if (!headers.length) headers = [...document.querySelectorAll('[data-toggle="collapse"] a, a[data-toggle="collapse"]')];
        if (!headers.length) headers = [...document.querySelectorAll('.card-header a, .accordion-header a')];
        if (!headers.length) headers = [...document.querySelectorAll('.card .card-header')];

        const targetIdxs = parseRange(S.catRange||'1');
        let changed      = false;

        msg(`🔄 ${sNo} | ${headers.length} tema, ${document.querySelectorAll('input[type="radio"]').length} radio bulundu`);

        // Modal/diyalog otomatik onaylama
        function autoModalClick() {
            if (!S.autoConfirm) return false;
            const mbtn = document.querySelector(
                '.modal.show .btn-primary, .modal.show .btn-success, .modal.show .btn-danger, .modal.show button[data-dismiss]'
            );
            if (mbtn) { mbtn.click(); return true; }
            const sbtn = document.querySelector('.swal2-confirm, .swal-button--confirm');
            if (sbtn) { sbtn.click(); return true; }
            return false;
        }

        // Eğer hiç başlık bulunamadıysa → tüm sayfadaki radio butonlarla çalış
        const noHeaders = headers.length === 0;

        for (const idx of targetIdxs) {
            let cont = null;
            if (!noHeaders) {
                if (idx >= headers.length) continue;
                const h = headers[idx];
                if (h.classList.contains('collapsed')) { h.click(); await wait(300); }
                cont = h.closest('.card')?.querySelector('.collapse')
                    || h.closest('.card')
                    || h.parentElement?.nextElementSibling;
            }
            // cont=null → tüm sayfa, cont=el → sadece o bölüm
            const searchIn = cont || document;
            if (!searchIn) continue;


            if (S.mode==='fill') {
                // Her tema için o sütunun min/max değerleri ile seviye hesapla
                const colVals = S.excelData.map(d => d.vals[idx] ?? d.vals[0] ?? 0);
                const minV    = Math.min(...colVals);
                const maxV    = Math.max(...colVals);
                const stuVal  = student.vals[idx] ?? student.vals[0] ?? 0;
                const r       = maxV > minV ? (stuVal - minV) / (maxV - minV) : 1;
                const baseLvl = r < .25 ? 1 : r < .50 ? 2 : r < .75 ? 3 : 4;
                const lvl     = getRandLvl(baseLvl);
                // rdMadde27_59_1 formatına uyan seçici: sona _lvl ile biten
                const radios  = searchIn.querySelectorAll(`input[type="radio"][id$="_${lvl}"]`);
                msg(`🔄 ${sNo} | Tema ${idx+1}: puan=${stuVal.toFixed(1)} min=${minV.toFixed(1)} max=${maxV.toFixed(1)} → ★${lvl} (${radios.length} radio)`);
                radios.forEach(rd=>{ if(!rd.checked){ rd.click(); changed=true; }});
            } else {
                const temizleBtns = [
                    ...searchIn.querySelectorAll('button'),
                    ...tr.querySelectorAll('button')
                ].filter(b => /temizle/i.test(b.textContent || b.innerText));
                for (const b of temizleBtns) {
                    b.click();
                    await wait(200);
                    autoModalClick();
                    await wait(100);
                    changed = true;

                }
            }
        }

        if (changed) {
            await wait(400);
            const kaydet = document.getElementById('OOMToolbarActive1_btnKaydet')
                        || document.querySelector('button[id*="btnKaydet"]')
                        || document.querySelector('input[id*="btnKaydet"]');
            if (kaydet) {
                msg('💾 Kaydediliyor…');
                kaydet.click();
                await wait(300);
                autoModalClick();
                loopBusy = false;
                if (S.autoConfirm) {
                    setTimeout(runLoop, 1400);
                } else {
                    S.waiting = true; save();
                    msg('⏸ Kaydet onaylanınca ➡ DEVAM ET\'e basın');
                    const devamEl = document.getElementById('ew-devam');
                    if (devamEl) devamEl.style.display = 'block';
                }
            } else {
                msg('⚠️ Kaydet butonu bulunamadı!');
                loopBusy = false;
                setTimeout(runLoop, 700);
            }
        } else {
            msg('ℹ️ Değişiklik yok.');
            loopBusy = false;
            setTimeout(runLoop, 350);
        }

    }

    /* ── Oto-devam (sayfa yenileme sonrası) ──────────────────── */
    const resume = () => { if (S.active && S.excelData.length>0) setTimeout(runLoop, 1800); };
    if (document.readyState==='complete') resume();
    else window.addEventListener('load', resume);

})();
