/**
 * e-Okul Geli┼şim D├╝zeyi Sihirbaz─▒ v3.4 ÔÇö Android WebView (Tied License)
 * SheetJS (XLSX), MainActivity taraf─▒ndan ├Ânceden enjekte edilir.
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
    // Oturum ba┼şlang─▒c─▒nda excel verisini temizle (otomasyon devam etmiyorsa)
    if (!S.active) { S.excelData = []; }
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(S));


    /* ÔöÇÔöÇ L─░SANS S─░STEM─░ ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
    const LIC_STORE = 'eokul_lic1';
    const _ALPHA    = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 karakter
    const _SALT     = 0x7A59;

    function _licHash(body) {
        let h = _SALT;
        const aid = (window.ANDROID_ID || "").toUpperCase();
        for (let i=0; i<aid.length; i++) { h += aid.charCodeAt(i); h = (h * 31) & 0xFFFFFF; }
        const b = body.toUpperCase();
        for (let i=0; i<b.length; i++) { h += b.charCodeAt(i); h = (h * 31) & 0xFFFFFF; }
        return [20,15,10,5].map(s => _ALPHA[(h>>s)&0x1F]).join('');
    }
    function validateLic(raw) {
        const k = (raw||'').toUpperCase().replace(/[^A-Z2-9]/g,'');
        if (k.length !== 16) return false;
        return _licHash(k.slice(0,12)) === k.slice(12);
    }
    function isActivated() {
        try {
            const d = JSON.parse(localStorage.getItem(LIC_STORE)||'null');
            return !!(d && d.ok && validateLic(d.k));
        } catch(e) { return false; }
    }
    function saveLic(key) {
        const k = key.toUpperCase().replace(/[^A-Z2-9]/g,'');
        localStorage.setItem(LIC_STORE, JSON.stringify({ok:true, k, t:Date.now()}));
    }

    function showLicModal() {
        let ov = document.getElementById('ew-lic-ov');
        if (!ov) {
            ov = document.createElement('div'); ov.id='ew-lic-ov';
            Object.assign(ov.style, {
                display:'none', position:'fixed', inset:'0',
                background:'rgba(0,0,0,0.88)', zIndex:'999999999',
                alignItems:'center', justifyContent:'center'
            });
            ov.innerHTML = `
              <div style="background:#1e293b;color:#f1f5f9;padding:24px;border-radius:18px;
                  box-shadow:0 20px 40px rgba(0,0,0,.8);font-family:'Segoe UI',sans-serif;
                  width:min(320px,94vw);border:1px solid #334155;text-align:center;">
                <div style="font-size:36px;margin-bottom:8px">ÔÜí</div>
                <div style="font-size:17px;font-weight:700;margin-bottom:4px">e-Okul Sihirbaz─▒</div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Devam etmek i├ğin sipari┼ş verin</div>
                

                <button id="ew-lic-wa"
                  style="width:100%;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;
                         border:none;border-radius:8px;padding:14px;font-size:14px;font-weight:700;
                         cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                  <span>Sipari┼ş Ver (WhatsApp)</span>
                </button>

                <div style="margin:16px 0;display:flex;align-items:center;gap:10px;color:#475569">
                  <hr style="flex:1;border-color:#334155"><span>VEYA</span><hr style="flex:1;border-color:#334155">
                </div>

                <input id="ew-lic-inp" placeholder="XXXX-XXXX-XXXX-XXXX"
                  style="width:100%;background:#0f172a;border:1px solid #475569;color:#f1f5f9;
                         padding:10px;border-radius:8px;font-size:14px;box-sizing:border-box;
                         text-align:center;letter-spacing:2px;margin-bottom:12px;font-family:monospace">
                <button id="ew-lic-btn"
                  style="width:100%;background:linear-gradient(135deg,#10b981,#059669);color:#fff;
                         border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;
                         cursor:pointer;margin-bottom:10px">
                  Ô£à Aktifle┼ştir
                </button>
                <div id="ew-lic-err" style="color:#ef4444;font-size:12px;min-height:16px"></div>
                <button id="ew-lic-cancel" style="background:none;border:none;color:#64748b;font-size:12px;cursor:pointer;margin-top:10px">Vazge├ğ</button>
              </div>`;
            document.body.appendChild(ov);
            
            document.getElementById('ew-lic-wa').onclick = () => {
                const msg = `Merhaba, E-okul Sihirbaz─▒ uygulamas─▒n─▒ almak istiyorum.\nCihaz ID: ${window.ANDROID_ID || 'Bilinmiyor'}`;
                if (window.Android && window.Android.openWhatsApp) {
                    window.Android.openWhatsApp('905063705528', msg);
                } else {
                    window.open(`https://wa.me/905063705528?text=${encodeURIComponent(msg)}`);
                }
            };

            document.getElementById('ew-lic-btn').onclick = () => {
                const val = document.getElementById('ew-lic-inp').value.trim();
                if (validateLic(val)) {
                    saveLic(val);
                    ov.style.display = 'none';
                    location.reload();
                } else {
                    document.getElementById('ew-lic-err').textContent = 'ÔØî Ge├ğersiz lisans anahtar─▒!';
                }
            };
            document.getElementById('ew-lic-cancel').onclick = () => ov.style.display = 'none';
        }
        ov.style.display = 'flex';
    }
    /* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */


    /* ÔöÇÔöÇ Yard─▒mc─▒lar ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
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
        const r = Math.random();
        if (r < 0.10) { // %10 ihtimalle 2 d├╝zey kayd─▒r
            let n = Math.random() < 0.5 ? base - 2 : base + 2;
            if (n < 1) n = 1; if (n > 4) n = 4;
            return n;
        } else if (r < 0.35) { // +%25 (toplam %35) ihtimalle 1 d├╝zey kayd─▒r
            let n = Math.random() < 0.5 ? base - 1 : base + 1;
            if (n < 1) n = 1; if (n > 4) n = 4;
            return n;
        }
        return base;
    }
    const wait = ms => new Promise(r=>setTimeout(r,ms));
    const msg  = t  => { const e=document.getElementById('ew-log'); if(e) e.textContent=t; };

    /* ÔöÇÔöÇ CSS ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
    if (!document.getElementById('ew-css')) {
        const st=document.createElement('style'); st.id='ew-css';
        st.textContent=`
          @keyframes ewPulse{0%,100%{transform:scale(1);box-shadow:0 0 20px rgba(16,185,129,.4)}50%{transform:scale(1.08);box-shadow:0 0 35px rgba(16,185,129,.7)}}
          #ew-fab{animation:ewPulse 2s ease-in-out infinite;background:linear-gradient(135deg,#10b981,#3b82f6)!important;
                  border:2px solid rgba(255,255,255,.3);backdrop-filter:blur(10px)}
          #ew-fab:hover{animation:none;transform:scale(1.15)!important;box-shadow:0 0 40px rgba(16,185,129,.8);transition:.2s}
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

    /* ÔöÇÔöÇ ÔÜí FAB ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
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
        fab.textContent='ÔÜí';
        document.body.appendChild(fab);
    }

    /* ÔöÇÔöÇ Hedef sayfa de─şilse: Uyar─▒ veya Navigasyon ÔöÇÔöÇ */
    if (!IS_TARGET) {
        const OO_URL = 'https://e-okul.meb.gov.tr/OrtaOgretim/OrtaOgretim.aspx';

        if (window.name === 'ew_nav') {
            window.name = '';
            window.location.href = OOK_URL; 
            return;
        }

        fab.onclick = () => {
             // Giri┼ş ekran─▒nda m─▒ kontrol et (MEB standart login sayfas─▒)
             if (window.location.href.toLowerCase().includes('login.aspx') || 
                 document.getElementById('txtKullaniciAd') || 
                 document.querySelector('input[type="password"]')) {
                 
                 let ov = document.getElementById('ew-alert-ov');
                 if (!ov) {
                     ov = document.createElement('div'); ov.id='ew-alert-ov';
                     Object.assign(ov.style, {
                         position:'fixed', inset:'0', background:'rgba(0,0,0,0.85)',
                         zIndex:'999999999', display:'flex', alignItems:'center', justifyContent:'center'
                     });
                     ov.innerHTML = `
                         <div style="background:#1e293b; color:#f1f5f9; padding:24px; border-radius:16px;
                             box-shadow:0 20px 40px rgba(0,0,0,0.5); width:280px; text-align:center;
                             border:1px solid #334155; font-family:sans-serif;">
                             <div style="font-size:32px; margin-bottom:12px">­şöæ</div>
                             <div style="font-size:15px; font-weight:700; margin-bottom:16px">├ûnce e-Okula Giri┼ş yap─▒n─▒z</div>
                             <button id="ew-alert-ok" style="width:100%; padding:12px; border-radius:8px; border:none;
                                 background:linear-gradient(135deg,#10b981,#059669); color:white; font-weight:700; cursor:pointer">
                                 Tamam
                             </button>
                         </div>`;
                     document.body.appendChild(ov);
                     document.getElementById('ew-alert-ok').onclick = () => ov.style.display='none';
                 }
                 ov.style.display = 'flex';
                 return;
             }

            // Giri┼ş yap─▒lm─▒┼şsa (veya login sayfas─▒ de─şilse) navigasyona devam et
            window.name = 'ew_nav'; 
            const link = [...document.querySelectorAll('a[href]')].find(a =>
                /OrtaO[g─ş]retim/i.test(a.href) && !a.href.includes('OKL')
            );
            if (link) { link.click(); }
            else { window.location.href = OO_URL; }
        };
        return;
    }

    /* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
       HEDEF SAYFA ÔÇö Tam Panel
    ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
    if (window.top !== window.self && !S.active) return;

    if (!window._nativeConfirm) window._nativeConfirm = window.confirm;
    window.confirm = (m) => S.autoConfirm ? true : window._nativeConfirm.call(window, m);
    if (!window._nativeAlert) window._nativeAlert = window.alert;
    window.alert = (m) => S.autoConfirm ? true : window._nativeAlert.call(window, m);


    /* ÔöÇÔöÇ Panel HTML ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
    const oldPanel = document.getElementById('ew-panel');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div'); panel.id='ew-panel';
    const hd = S.excelData.length > 0;

    panel.innerHTML = `
<div style="background:#1e293b;color:#f1f5f9;padding:16px;border-radius:18px;
    box-shadow:0 20px 40px rgba(0,0,0,.65);font-family:'Segoe UI',sans-serif;
    width:min(318px,90vw);border:1px solid #334155;">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <span style="font-size:15px;font-weight:700">ÔÜí e-Okul Sihirbaz─▒</span>
    <span style="font-size:10px;color:#7c3aed;font-weight:700;letter-spacing:1px">@r─▒z@</span>
    <div style="display:flex;gap:6px">
      <button id="ew-help-btn" title="Yard─▒m" style="background:none;border:1px solid #475569;border-radius:50%;color:#94a3b8;font-size:13px;cursor:pointer;width:26px;height:26px;line-height:1">?</button>
      <button id="ew-close" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;line-height:1">├ù</button>
    </div>
  </div>

  <div id="ew-help" style="display:none;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:10px;font-size:11px;color:#94a3b8;line-height:1.8">
    <b style="color:#f1f5f9;font-size:12px">­şôÜ Kullan─▒m K─▒lavuzu</b><br>
    <b style="color:#10b981">1. Excel:</b> C=├û─şrenci No, EÔåÆÔÇĞ=Tema puanlar─▒<br>
    <b style="color:#10b981">2. ┼Şube &amp; Ders se├ğ:</b> Otomatik listelenir.<br>
    <b style="color:#10b981">3. Excel y├╝kle:</b> Dosya se├ğ butonuyla.<br>
    <b style="color:#10b981">4. Tema No:</b> "1" veya "2-4" format─▒nda.<br>
    <b style="color:#10b981">5. BA┼ŞLAT:</b> S─▒rayla i┼şler &amp; kaydeder.<br>
  </div>

  <label class="ew-lbl" style="margin-top:0">┼Şube:</label>
  <select id="ew-sube" class="ew-sel"><option>Y├╝kleniyorÔÇĞ</option></select>
  <label class="ew-lbl">Ders:</label>
  <select id="ew-ders" class="ew-sel"><option>Y├╝kleniyorÔÇĞ</option></select>

  <div style="background:#0f172a;padding:10px;border-radius:10px;margin-bottom:12px;font-size:12px">
    <div id="ew-info">${hd?'­şôï Kay─▒tl─▒: '+S.excelData.length+' ├û─şrenci':'ÔÜá´©Å Excel y├╝klenmedi'}</div>
    <div id="ew-log" style="color:#94a3b8;font-size:11px;margin-top:5px">BekleniyorÔÇĞ ${isActivated()?'':'(Lisans Gerekli)'}</div>
  </div>

  <div style="margin-bottom:12px">
    <label class="ew-lbl" style="margin-top:0">
      ${hd?'­şôè Excel De─şi┼ştir:':'­şôé Excel Dosyas─▒ (.xlsx/.xls):'}
    </label>
    <input type="file" id="ew-file" accept=".xlsx,.xls"
      style="font-size:12px;width:100%;background:#0f172a;border:1px solid #475569;
             color:#f1f5f9;padding:9px;border-radius:8px;box-sizing:border-box">
  </div>

  <label class="ew-lbl">Tema No (├Ârn: 1 veya 2-4):</label>
  <input type="text" id="ew-cat" class="ew-inp" value="${S.catRange}" style="margin-bottom:10px">
  <label style="font-size:13px;color:#94a3b8;display:flex;align-items:center;gap:8px;
                cursor:pointer;margin-bottom:8px">
    <input type="checkbox" id="ew-auto" ${S.autoNextClass?'checked':''} style="width:18px;height:18px">
    ┼Şubeyi Otomatik Atla
  </label>
  <label style="font-size:13px;color:#94a3b8;display:flex;align-items:center;gap:8px;
                cursor:pointer;margin-bottom:14px">
    <input type="checkbox" id="ew-ac" ${S.autoConfirm?'checked':''} style="width:18px;height:18px">
    Kay─▒t Onay─▒n─▒ Otomatik Onayla
  </label>

  <div style="display:flex;gap:8px;margin-bottom:8px">
    <button id="ew-start" class="ew-btn" ${hd?'':'disabled'}
      style="flex:2;background:${hd?'#10b981':'#374151'}">ÔûÂ BA┼ŞLAT</button>
    <button id="ew-stop" class="ew-btn" style="flex:1;background:#475569;font-size:22px">ÔÅ╣</button>
  </div>
  <button id="ew-clear" class="ew-btn" ${hd?'':'disabled'}
    style="width:100%;background:${hd?'#ef4444':'#374151'};margin-bottom:8px">
    ­şùæ TEM─░ZLE</button>
  <button id="ew-devam" class="ew-btn"
    style="display:none;width:100%;background:#7c3aed;margin-bottom:10px">
    ÔŞí DEVAM ET
  </button>

  <div style="text-align:right">
    <a href="#" id="ew-reset" style="color:#475569;font-size:11px;text-decoration:none">Ôş│ Veriyi S─▒f─▒rla</a>
    ${isActivated()?'':'<br><a href="#" id="ew-lic-show" style="color:#10b981;font-size:11px;text-decoration:none">­şöæ Lisans Anahtar─▒ Gir</a>'}
  </div>
</div>`;

    Object.assign(panel.style, {
        position:'fixed', bottom:'80px', right:'12px',
        zIndex:'9999998', maxHeight:'92vh', overflowY:'auto'
    });
    if (!S.open) panel.classList.add('ew-hidden');
    document.body.appendChild(panel);

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
    const lsBtn = document.getElementById('ew-lic-show');
    if (lsBtn) lsBtn.onclick = (e) => { e.preventDefault(); showLicModal(); };


    function mirrorOpts(src, dst) {
        if (!src || !dst) return;
        const prev = dst.value;
        dst.innerHTML = '';
        [...src.options].forEach(o => dst.add(new Option(o.text, o.value, o.defaultSelected, o.selected)));
        if (prev && dst.querySelector(`option[value="${prev}"]`)) dst.value = prev;
    }

    function findDers() { return document.getElementById('cmbBeceriler') || null; }

    function syncDropdowns() {
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
                    if (window.$ && window.$.fn && window.$.fn.select2 && $(fresh).data('select2')) {
                        $(fresh).val(val).trigger('change');
                    } else {
                        fresh.value = val;
                        fresh.dispatchEvent(new Event('change', {bubbles: true}));
                    }
                    if (triggerChange) triggerChange();
                };
            };
        }
        const pollSube = makePoller(() => document.getElementById('cmbSubeler'), 'ew-sube');
        const pollDers = makePoller(findDers, 'ew-ders', autoListele);
        pollSube(); pollDers();
        setInterval(() => { pollSube(); pollDers(); }, 500);
    }
    setTimeout(syncDropdowns, 1200);

    function autoListele() {
        setTimeout(() => {
            const btn = document.querySelector('button.btn-primary.has-ripple');
            if (btn) { btn.click(); msg('­şôï Ders se├ğildi, listeleniyorÔÇĞ'); }
        }, 600);
    }

    document.getElementById('ew-file').onchange = function (e) {
        const f = e.target.files[0]; if (!f) return;
        msg('­şôé Excel okunuyorÔÇĞ');
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
                const startEl  = document.getElementById('ew-start');
                const clearEl  = document.getElementById('ew-clear');
                document.getElementById('ew-info').textContent = '­şôï Kay─▒tl─▒: ' + data.length + ' ├û─şrenci';
                if (startEl) { updateStartBtn(); }
                if (clearEl) { clearEl.disabled=false; clearEl.style.background='#ef4444'; }
                msg('Ô£à Excel y├╝klendi.');
            } catch(ex) { alert('Excel okunamad─▒: '+ex.message); }
        };
        r.readAsBinaryString(f);
    };

    function updateStartBtn() {
        const btn = document.getElementById('ew-start');
        if (!btn) return;
        if (!S.active) {
            btn.textContent = 'ÔûÂ BA┼ŞLAT';
            btn.style.background = S.excelData.length ? '#10b981' : '#374151';
            btn.disabled = !S.excelData.length;
        } else if (S.paused) {
            btn.textContent = 'ÔûÂ DEVAM ET';
            btn.style.background = '#f59e0b';
            btn.disabled = false;
        } else {
            btn.textContent = 'ÔÅ© DURAKLAT';
            btn.style.background = '#3b82f6';
            btn.disabled = false;
        }
    }

    document.getElementById('ew-start').onclick = () => {
        if (!isActivated()) { showLicModal(); return; }
        if (!S.active) {
            if (S.excelData.length === 0) { msg('ÔÜá´©Å ├ûnce Excel dosyas─▒ y├╝kleyin!'); return; }
            if (S.waiting) { msg('ÔÅ© ├ûnce ÔŞí DEVAM ET\'e bas─▒n!'); return; }
            S.active = true; S.paused = false; S.mode = 'fill';
            S.currentIndex = -1; loopBusy = false;
            save(); updateStartBtn(); runLoop();
        } else if (!S.paused) {
            S.paused = true; save(); updateStartBtn();
            msg('ÔÅ© Duraklat─▒ld─▒.');
        } else {
            S.paused = false; loopBusy = false; save(); updateStartBtn();
            msg('ÔûÂ Devam ediliyorÔÇĞ');
            runLoop();
        }
    };
    document.getElementById('ew-stop').onclick = () => {
        S.active = false; S.paused = false; S.waiting = false;
        loopBusy = false; save();
        const devamEl = document.getElementById('ew-devam');
        if (devamEl) devamEl.style.display = 'none';
        updateStartBtn();
        msg('ÔÅ╣ Durduruldu.');
    };
    document.getElementById('ew-clear').onclick = () => {
        if (!isActivated()) { showLicModal(); return; }
        if (S.excelData.length === 0) { msg('ÔÜá´©Å Excel y├╝klenmedi!'); return; }
        if (confirm('Se├ğili kategorilerdeki t├╝m giri┼şler S─░L─░NECEKT─░R. Devam?')) {
            S.active=true; S.mode='clear';
            S.currentIndex = -1; loopBusy = false;
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


    let loopBusy = false;
    async function runLoop() {
        if (loopBusy || !S.active || S.paused) return;
        loopBusy = true;

        const btns = [...document.querySelectorAll('button[id^="btnOpen"]')];
        const rows = btns.map(b=>b.closest('tr')).filter(Boolean);

        if (!rows.length) {
            const lb = document.querySelector('button.btn-primary.has-ripple');
            if (lb) { loopBusy=false; lb.click(); setTimeout(runLoop, 3000); return; }
            msg('ÔØî Liste y├╝klenemedi.'); loopBusy=false; return;
        }

        S.currentIndex++;

        if (S.currentIndex >= rows.length) {
            if (S.autoNextClass) {
                const sel = document.getElementById('cmbSubeler');
                if (sel && sel.selectedIndex < sel.options.length-1) {
                    sel.selectedIndex++;
                    sel.dispatchEvent(new Event('change',{bubbles:true}));
                    if (window.$?.fn?.select2) $(sel).trigger('change.select2');
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
            msg(S.mode==='clear' ? 'Ô£à S─▒n─▒f temizlendi! ­şÅü' : 'Ô£à TAMAMLANDI! ­şÅü');
            // Son ├Â─şrencinin kayd─▒ i├ğin modal gelmi┼ş olabilir, temizleme bitmeden bekle
            if (S.autoConfirm) {
                await pollAutoConfirm(3.0);
            }
            S.active=false; S.paused=false; loopBusy=false; save();
            updateStartBtn();
            return;
        }

        const tr    = rows[S.currentIndex];
        const sNo   = tr.cells[2]?.innerText.trim();
        const btnOp = tr.querySelector('button[id^="btnOpen"]');

        msg(`­şöä ${sNo} No ÔÇö i┼şlem ba┼şl─▒yorÔÇĞ`);

        const student = S.excelData.find(s=>s.no===sNo);
        if (S.mode==='fill' && !student) { loopBusy=false; setTimeout(runLoop, 200); return; }

        btnOp.click();

        for (let w=0; w<6; w++) {
            await wait(200);
            if (document.querySelectorAll('input[type="radio"]').length > 0) break;
        }

        let headers = [...document.querySelectorAll('a.text-light')];
        if (!headers.length) headers = [...document.querySelectorAll('[data-toggle="collapse"] a, a[data-toggle="collapse"]')];
        if (!headers.length) headers = [...document.querySelectorAll('.card-header a, .accordion-header a')];
        if (!headers.length) headers = [...document.querySelectorAll('.card .card-header')];

        const targetIdxs = parseRange(S.catRange||'1');
        let changed      = false;

        msg(`­şöä ${sNo} | ─░┼şleniyorÔÇĞ`);

        function autoModalClick() {
            if (!S.autoConfirm) return false;

            // E-Okul'un kulland─▒─ş─▒ veya kullanabilece─şi t├╝m potansiyel modal k─▒l─▒flar─▒
            const modalContainers = document.querySelectorAll(
                '.modal, .swal2-container, .sweet-alert, .ajs-dialog, .alert, [role="dialog"], .ui-dialog, .bootbox'
            );

            for (const modal of modalContainers) {
                // E─şer ekranda g├Âr├╝nm├╝yorsa atla
                if (modal.offsetParent === null && window.getComputedStyle(modal).display === 'none') continue; 
                
                // Modal─▒n i├ğindeki t├╝m butonlar
                const btns = modal.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn');
                for (const b of btns) {
                     if (b.offsetParent === null) continue;
                     
                     // Butonun yaz─▒s─▒nda veya class'─▒nda onay anlam─▒na gelen bir ┼şey var m─▒?
                     const txt = ((b.textContent||'') + ' ' + (b.value||'') + ' ' + (b.innerText||'')).toLowerCase();
                     const btnClass = (typeof b.className === 'string' ? b.className : '').toLowerCase();

                     if (txt.includes('tamam') || txt.includes('evet') || 
                         txt.includes('onayla') || txt.includes('kapat') || 
                         txt.includes('ok') || 
                         btnClass.includes('confirm') || btnClass.includes('btn-primary') || btnClass.includes('btn-success')) {
                         
                         b.click();
                         return true; // Modal onayland─▒
                     }
                }
            }
            return false;
        }

        async function pollAutoConfirm(durationS = 2) {
            if (!S.autoConfirm) return;
            const end = Date.now() + durationS * 1000;
            while (Date.now() < end) {
                if (autoModalClick()) break;
                await wait(150);
            }
        }

        const noHeaders = headers.length === 0;
        const clickedTemizle = new Set();


        for (const idx of targetIdxs) {
            let cont = null;
            if (!noHeaders) {
                if (idx >= headers.length) continue;
                const h = headers[idx];
                if (h.classList.contains('collapsed')) { h.click(); await wait(300); }
                cont = h.closest('.card')?.querySelector('.collapse') || h.closest('.card') || h.parentElement?.nextElementSibling;
            }
            const searchIn = cont || document;
            if (!searchIn) continue;

            if (S.mode==='fill') {
                const colVals = S.excelData.map(d => d.vals[idx] ?? d.vals[0] ?? 0);
                const minV = Math.min(...colVals);
                const maxV = Math.max(...colVals);
                const stuVal = student.vals[idx] ?? student.vals[0] ?? 0;
                const r = maxV > minV ? (stuVal - minV) / (maxV - minV) : 1;
                const baseLvl = r < .25 ? 1 : r < .50 ? 2 : r < .75 ? 3 : 4;

                const allRadios = searchIn.querySelectorAll('input[type="radio"]');
                const stems = new Set();
                allRadios.forEach(rd => {
                    const id = rd.id;
                    const lastUnder = id.lastIndexOf('_');
                    if (lastUnder !== -1) stems.add(id.substring(0, lastUnder));
                });

                stems.forEach(stem => {
                    const lvl = getRandLvl(baseLvl);
                    const targetId = `${stem}_${lvl}`;
                    const rd = document.getElementById(targetId);
                    if (rd && !rd.checked) { rd.click(); changed = true; }
                });
            } else {
                const temizleBtns = [
                    ...searchIn.querySelectorAll('button, input[type="button"], input[type="submit"]'), 
                    ...tr.querySelectorAll('button, input[type="button"], input[type="submit"]')
                ].filter(b => {
                    const txt = ((b.textContent || '') + ' ' + 
                                 (b.value || '') + ' ' + (b.title || '') + ' ' + 
                                 (b.getAttribute('alt') || '') + ' ' + (b.id || '') + ' ' + 
                                 (typeof b.className === 'string' ? b.className : '')).toLowerCase();
                    return txt.includes('temizle');
                });
                
                for (const b of temizleBtns) {
                    if (clickedTemizle.has(b)) continue; 
                    
                    clickedTemizle.add(b);
                    b.click(); 
                    
                    // Modal─▒ yakalamak i├ğin bo┼şuna 1 saniye beklemesin, yoksa her butonda 1 saniye duraksar.
                    // Sadece anl─▒k kontrol edip direkt s─▒radaki butona mermi gibi ge├ğsin.
                    if (S.autoConfirm) autoModalClick();
                    await wait(10); 
                    
                    changed = true;
                }
            }
        }

        if (changed) {
            // E-okul formunun Temizle sonras─▒ kendini toparlamas─▒ (de─şi┼şkenleri e┼şitlemesi) i├ğin bekleme
            await wait(400); 
            const kaydet = document.getElementById('OOMToolbarActive1_btnKaydet') || 
                           document.querySelector('button[id*="btnKaydet"]') || 
                           document.querySelector('input[id*="btnKaydet"]') ||
                           document.querySelector('.btn-success.has-ripple'); // Alternatif kaydet
            if (kaydet) {
                msg('­şÆ¥ KaydediliyorÔÇĞ');
                kaydet.click();
                
                // Kaydet komutunun MEB sunucular─▒na gitmesi i├ğin bekleme
                await wait(500); 
                
                // MEB sunucular─▒ bazen yava┼ş yan─▒t verebilir, onay kutusunu max 4 saniyeye kadar bekle
                await pollAutoConfirm(4.0); 
                
                loopBusy = false;
                // Onay verildikten sonra yeni ├Â─şrenciye ge├ğerken sistemin donmamas─▒ i├ğin yar─▒m saniye nefes pay─▒
                if (S.autoConfirm) { setTimeout(runLoop, 500); }
                else {
                    S.waiting = true; save();
                    msg('ÔÅ© BekleniyorÔÇĞ');
                    const devamEl = document.getElementById('ew-devam');
                    if (devamEl) devamEl.style.display = 'block';
                }
            } else { loopBusy = false; setTimeout(runLoop, 500); } 
        } else { loopBusy = false; setTimeout(runLoop, 250); } 
    }

    const resume = () => { if (S.active && S.excelData.length>0) setTimeout(runLoop, 500); }; // Sayfa yenilenmesinde kalk─▒┼ş s├╝resi 1800'den 500'e ├ğekildi
    if (document.readyState==='complete') resume();
    else window.addEventListener('load', resume);

})();
