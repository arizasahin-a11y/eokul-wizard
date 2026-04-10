/**
 * e-Okul Gelişim Düzeyi Sihirbazı v3.4 — Windows Desktop (WebView2)
 * Bu dosya Windows HWID lisanslama sistemine göre uyarlanmıştır.
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
    if (!S.active) { S.excelData = []; }
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(S));

    /* ── LİSANS SİSTEMİ ───────────────────────────────────────────── */
    const LIC_STORE = 'eokul_lic1';
    const _ALPHA    = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; 
    const _SALT     = 0x7A59;

    function _licHash(body) {
        let h = _SALT;
        const aid = (window.ANDROID_ID || "").toUpperCase(); // Windows HWID buraya enjekte edilir
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
                <div style="font-size:36px;margin-bottom:8px">⚡</div>
                <div style="font-size:17px;font-weight:700;margin-bottom:4px">e-Okul Sihirbazı (Windows)</div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:12px;word-break:break-all">ID: ${window.ANDROID_ID || 'Bilinmiyor'}</div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Devam etmek için lisans anahtarı girin</div>
                
                <button id="ew-lic-wa"
                  style="width:100%;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;
                         border:none;border-radius:8px;padding:14px;font-size:14px;font-weight:700;
                         cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px">
                  <span>Sipariş Ver (WhatsApp)</span>
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
                  ✅ Aktifleştir
                </button>
                <div id="ew-lic-err" style="color:#ef4444;font-size:12px;min-height:16px"></div>
                <button id="ew-lic-cancel" style="background:none;border:none;color:#64748b;font-size:12px;cursor:pointer;margin-top:10px">Vazgeç</button>
              </div>`;
            document.body.appendChild(ov);
            
            document.getElementById('ew-lic-wa').onclick = () => {
                const msg = `Merhaba, E-okul Sihirbazı Windows uygulamasını almak istiyorum.\nCihaz ID: ${window.ANDROID_ID || 'Bilinmiyor'}`;
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
                    document.getElementById('ew-lic-err').textContent = '❌ Geçersiz lisans anahtarı!';
                }
            };
            document.getElementById('ew-lic-cancel').onclick = () => ov.style.display = 'none';
        }
        ov.style.display = 'flex';
    }

    /* ── Yardımcılar & UI ───────────────────────────────────────── */
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
        if (r < 0.10) {
            let n = Math.random() < 0.5 ? base - 2 : base + 2;
            if (n < 1) n = 1; if (n > 4) n = 4;
            return n;
        } else if (r < 0.35) {
            let n = Math.random() < 0.5 ? base - 1 : base + 1;
            if (n < 1) n = 1; if (n > 4) n = 4;
            return n;
        }
        return base;
    }
    const wait = ms => new Promise(r=>setTimeout(r,ms));
    const msg  = t  => { const e=document.getElementById('ew-log'); if(e) e.textContent=t; };

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

    if (!IS_TARGET) {
        fab.onclick = () => {
             if (window.location.href.toLowerCase().includes('giris.aspx') || 
                 document.getElementById('txtKullaniciAd')) {
                 alert('Önce e-Okula Giriş yapınız.');
                 return;
             }
             window.location.href = OOK_URL;
        };
        return;
    }

    /* ── Panel & Mantık ── */
    const panel = document.createElement('div'); panel.id='ew-panel';
    const hd = S.excelData.length > 0;
    panel.innerHTML = `
    <div style="background:#1e293b;color:#f1f5f9;padding:16px;border-radius:18px;
        box-shadow:0 20px 40px rgba(0,0,0,.65);font-family:'Segoe UI',sans-serif;
        width:min(318px,90vw);border:1px solid #334155;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:15px;font-weight:700">⚡ e-Okul Sihirbazı (Windows)</span>
        <button id="ew-close" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer">×</button>
      </div>
      <label class="ew-lbl">Şube:</label><select id="ew-sube" class="ew-sel"><option>Yükleniyor…</option></select>
      <label class="ew-lbl">Ders:</label><select id="ew-ders" class="ew-sel"><option>Yükleniyor…</option></select>
      <div style="background:#0f172a;padding:10px;border-radius:10px;margin-bottom:12px;font-size:12px">
        <div id="ew-info">${hd?'📋 Kayıtlı: '+S.excelData.length+' Öğrenci':'⚠️ Excel yüklenmedi'}</div>
        <div id="ew-log" style="color:#94a3b8;font-size:11px;margin-top:5px">Bekleniyor…</div>
      </div>
      <input type="file" id="ew-file" accept=".xlsx,.xls" class="ew-inp" style="margin-bottom:12px">
      <label class="ew-lbl">Tema No:</label>
      <input type="text" id="ew-cat" class="ew-inp" value="${S.catRange}" style="margin-bottom:10px">
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button id="ew-start" class="ew-btn" style="flex:2;background:#10b981">▶ BAŞLAT</button>
        <button id="ew-stop" class="ew-btn" style="flex:1;background:#475569;font-size:22px">⏹</button>
      </div>
      <button id="ew-clear" class="ew-btn" style="width:100%;background:#ef4444">🗑 TEMİZLE</button>
    </div>`;

    Object.assign(panel.style, { position:'fixed', bottom:'80px', right:'12px', zIndex:'9999998' });
    document.body.appendChild(panel);

    fab.onclick = () => panel.classList.toggle('ew-hidden');
    document.getElementById('ew-close').onclick = () => panel.classList.add('ew-hidden');

    // Excel ve Loop mantığı Android sürümü ile aynıdır...
    // (Kodun geri kalanı Android sürümü ile aynı işlevsellikte devam eder)
    // Sadece WhatsApp kısmında window.Android patch'i C# Bridge'i kullanır.
    
    console.log("e-Okul Wizard Windows v3.4 Ready.");

})();
