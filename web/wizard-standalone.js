/**
 * e-Okul Gelişim Düzeyi Sihirbazı v3.4 — Standalone (CSP Bypass)
 * Tüm kod inline olarak çalışır, harici script yüklemez
 */
(function () {
    'use strict';

    // e-Okul sayfasında mıyız kontrol et
    const isEokul = window.location.hostname.includes('e-okul.meb.gov.tr');
    const isTest = window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost');
    
    if (!isEokul && !isTest) {
        alert('⚠️ Bu araç sadece e-okul.meb.gov.tr sayfasında çalışır!');
        return;
    }

    // Zaten yüklü mü kontrol et
    if (document.getElementById('ew-fab')) {
        alert('⚡ Sihirbaz zaten yüklü! Sağ alttaki ikona tıklayın.');
        return;
    }

    const STORAGE_KEY = 'eokul_wizard_v3';
    const LIC_STORE = 'eokul_lic1';
    const _ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const _SALT = 0x7A59;

    let S = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
        active: false,
        mode: 'fill',
        excelData: [],
        currentIndex: -1,
        themeRange: '1',
        autoNextClass: true,
        autoConfirm: true,
        waiting: false,
        paused: false,
        open: false
    };

    if (!S.active) S.excelData = [];
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(S));

    /* ── LİSANS SİSTEMİ ───────────────────────────────────────────── */
    function _licHash(body) {
        let h = _SALT;
        const aid = (window.DEVICE_ID || "WEB").toUpperCase();
        for (let i = 0; i < aid.length; i++) {
            h += aid.charCodeAt(i);
            h = (h * 31) & 0xFFFFFF;
        }
        const b = body.toUpperCase();
        for (let i = 0; i < b.length; i++) {
            h += b.charCodeAt(i);
            h = (h * 31) & 0xFFFFFF;
        }
        return [20, 15, 10, 5].map(s => _ALPHA[(h >> s) & 0x1F]).join('');
    }

    function validateLic(raw) {
        const k = (raw || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
        if (k.length !== 16) return false;
        return _licHash(k.slice(0, 12)) === k.slice(12);
    }

    function isActivated() {
        try {
            const d = JSON.parse(localStorage.getItem(LIC_STORE) || 'null');
            return !!(d && d.ok && validateLic(d.k));
        } catch (e) {
            return false;
        }
    }

    function saveLic(key) {
        const k = key.toUpperCase().replace(/[^A-Z2-9]/g, '');
        localStorage.setItem(LIC_STORE, JSON.stringify({ ok: true, k, t: Date.now() }));
    }

    function showLicModal() {
        let ov = document.getElementById('ew-lic-ov');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'ew-lic-ov';
            Object.assign(ov.style, {
                display: 'none',
                position: 'fixed',
                inset: '0',
                background: 'rgba(0,0,0,0.88)',
                zIndex: '999999999',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            });
            ov.innerHTML = `
              <div style="background:#1e293b;color:#f1f5f9;padding:24px;border-radius:18px;
                  box-shadow:0 20px 40px rgba(0,0,0,.8);font-family:'Segoe UI',sans-serif;
                  width:100%;max-width:340px;border:1px solid #334155;text-align:center;">
                <div style="font-size:40px;margin-bottom:10px">⚡</div>
                <div style="font-size:18px;font-weight:700;margin-bottom:6px">e-Okul Sihirbazı</div>
                <div style="font-size:13px;color:#94a3b8;margin-bottom:18px">⚠️ Excel özelliği için SheetJS kütüphanesi gerekli ancak e-Okul'un güvenlik politikası harici script yüklemeyi engelliyor.</div>
                
                <div style="background:#0f172a;padding:16px;border-radius:10px;margin-bottom:16px;text-align:left;font-size:13px">
                  <strong style="color:#10b981">Çözüm:</strong><br>
                  1. Android uygulamasını kullanın (tam özellikli)<br>
                  2. Veya manuel veri girişi yapın
                </div>

                <button id="ew-lic-wa"
                  style="width:100%;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;
                         border:none;border-radius:10px;padding:16px;font-size:15px;font-weight:700;
                         cursor:pointer;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:10px;
                         touch-action:manipulation;min-height:48px">
                  <span>📱 Android Uygulamasını İndir</span>
                </button>

                <button id="ew-lic-cancel" style="background:none;border:none;color:#64748b;font-size:14px;cursor:pointer;padding:12px;touch-action:manipulation">Kapat</button>
              </div>`;
            document.body.appendChild(ov);

            document.getElementById('ew-lic-wa').onclick = () => {
                window.open('https://arizasahin-a11y.github.io/eokul-wizard/docs/index.html', '_blank');
            };

            document.getElementById('ew-lic-cancel').onclick = () => ov.style.display = 'none';
        }
        ov.style.display = 'flex';
    }

    const wait = ms => new Promise(r => setTimeout(r, ms));
    const msg = t => {
        const e = document.getElementById('ew-log');
        if (e) e.textContent = t;
        console.log('[e-Okul Sihirbazı]', t);
    };

    /* ── CSS ─────────────────────────────────────────────────── */
    if (!document.getElementById('ew-css')) {
        const st = document.createElement('style');
        st.id = 'ew-css';
        st.textContent = `
          @keyframes ewPulse{0%,100%{transform:scale(1);box-shadow:0 0 20px rgba(16,185,129,.4)}50%{transform:scale(1.08);box-shadow:0 0 35px rgba(16,185,129,.7)}}
          #ew-fab{animation:ewPulse 2s ease-in-out infinite;background:linear-gradient(135deg,#10b981,#3b82f6)!important;
                  border:2px solid rgba(255,255,255,.3);backdrop-filter:blur(10px);
                  touch-action:manipulation;-webkit-tap-highlight-color:transparent}
          #ew-fab:hover{animation:none;transform:scale(1.15)!important;box-shadow:0 0 40px rgba(16,185,129,.8);transition:.2s}
          #ew-fab:active{transform:scale(0.95)!important}
          #ew-panel{transition:opacity .25s,transform .25s;transform-origin:bottom right}
          #ew-panel.ew-hidden{opacity:0;transform:scale(.88);pointer-events:none}
          .ew-btn{border:none;border-radius:10px;color:white;font-size:16px;
            font-weight:700;cursor:pointer;padding:16px;touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;min-height:48px}
          .ew-btn:active{transform:scale(0.98)}
          
          @media (max-width: 480px) {
            #ew-fab{width:56px;height:56px;font-size:28px;bottom:16px;right:16px}
            #ew-panel{bottom:80px;right:8px;left:8px;width:auto!important;max-width:none!important}
            #ew-panel > div{width:100%!important;padding:14px!important}
          }
        `;
        document.head.appendChild(st);
    }

    /* ── ⚡ FAB ──────────────────────────────────────────────── */
    let fab = document.getElementById('ew-fab');
    if (!fab) {
        fab = document.createElement('div');
        fab.id = 'ew-fab';
        Object.assign(fab.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '52px',
            height: '52px',
            zIndex: '99999999',
            background: 'linear-gradient(135deg,#10b981,#059669)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '26px',
            userSelect: 'none',
            transition: 'transform .2s'
        });
        fab.textContent = '⚡';
        document.body.appendChild(fab);
    }

    /* ── Panel HTML ──────────────────────────────────────────── */
    const oldPanel = document.getElementById('ew-panel');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div');
    panel.id = 'ew-panel';

    panel.innerHTML = `
<div style="background:#1e293b;color:#f1f5f9;padding:18px;border-radius:18px;
    box-shadow:0 20px 40px rgba(0,0,0,.65);font-family:'Segoe UI',sans-serif;
    width:100%;max-width:340px;border:1px solid #334155;">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <span style="font-size:16px;font-weight:700">⚡ e-Okul Sihirbazı</span>
    <span style="font-size:10px;color:#7c3aed;font-weight:700;letter-spacing:1px">WEB</span>
    <button id="ew-close" style="background:none;border:none;color:#64748b;font-size:28px;cursor:pointer;line-height:1;touch-action:manipulation">×</button>
  </div>

  <div style="background:#0f172a;padding:12px;border-radius:10px;margin-bottom:14px;font-size:13px">
    <div style="color:#fbbf24;margin-bottom:8px">⚠️ CSP Kısıtlaması</div>
    <div id="ew-log" style="color:#94a3b8;font-size:12px;line-height:1.6">
      e-Okul'un güvenlik politikası harici script yüklemeyi engelliyor. 
      Excel özelliği için <strong>Android uygulamasını</strong> kullanın.
    </div>
  </div>

  <button id="ew-android" class="ew-btn"
    style="width:100%;background:linear-gradient(135deg,#10b981,#059669);margin-bottom:10px">
    📱 Android Uygulamasını İndir
  </button>

  <button id="ew-info" class="ew-btn"
    style="width:100%;background:#475569">
    ℹ️ Detaylı Bilgi
  </button>

  <div style="text-align:center;margin-top:12px;font-size:12px;color:#64748b">
    Web versiyonu e-Okul CSP nedeniyle sınırlıdır
  </div>
</div>`;

    Object.assign(panel.style, {
        position: 'fixed',
        bottom: '80px',
        right: '12px',
        zIndex: '9999998',
        maxHeight: '85vh',
        overflowY: 'auto',
        maxWidth: '340px'
    });
    
    if (window.innerWidth <= 480) {
        panel.style.left = '8px';
        panel.style.right = '8px';
        panel.style.maxWidth = 'none';
    }
    
    panel.classList.add('ew-hidden');
    document.body.appendChild(panel);

    function togglePanel() {
        S.open = !S.open;
        panel.classList.toggle('ew-hidden', !S.open);
        save();
    }

    fab.onclick = togglePanel;
    document.getElementById('ew-close').onclick = togglePanel;
    
    document.getElementById('ew-android').onclick = () => {
        window.open('https://arizasahin-a11y.github.io/eokul-wizard/docs/index.html', '_blank');
    };

    document.getElementById('ew-info').onclick = () => {
        showLicModal();
    };

    msg('✨ e-Okul Sihirbazı yüklendi!');
    console.log('%c⚡ e-Okul Sihirbazı v3.4', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('%c⚠️ CSP Kısıtlaması: Excel özelliği için Android uygulamasını kullanın', 'color: #fbbf24; font-size: 12px;');
    console.log('%cAndroid: https://arizasahin-a11y.github.io/eokul-wizard/docs/', 'color: #94a3b8; font-size: 12px;');

})();
