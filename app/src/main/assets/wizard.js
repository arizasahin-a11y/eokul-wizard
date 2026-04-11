/**
 * e-Okul Gelişim Düzeyi Sihirbazı v3.4 — Android WebView (Tied License)
 * SheetJS (XLSX), MainActivity tarafından önceden enjekte edilir.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'eokul_v3';
    const PENDING_KEY = 'eokul_pending'; // Ayrı key
    const OOK_URL     = 'https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK07015.aspx'; // Öğrenci Düzey Girişi Sayfası
    const IS_TARGET   = window.location.href.toLowerCase().includes('ook07015.aspx');
    const IS_EOKUL_LIST = window.location.href.toLowerCase().includes('ook07003.aspx');

    let S = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
        active: false, mode: 'fill', excelData: [],
        currentIndex: -1, catRange: '1', autoNextClass: true,
        autoConfirm: true, waiting: false, paused: false, open: true,
        activeTab: 'eokul', // Varsayılan artık E-Okul
        eokulListPending: false, eokulSelectedSinif: '', eokulSelectedDers: '',
        eokulRange: '1', selectedSube: '', selectedDers: '', autoStartList: false
    };
    // Oturum başlangıcında verileri koru
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(S));




    /* ── LİSANS SİSTEMİ ───────────────────────────────────────────── */
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
                <div style="font-size:36px;margin-bottom:8px">⚡</div>
                <div style="font-size:17px;font-weight:700;margin-bottom:4px">e-Okul Sihirbazı</div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Devam etmek için sipariş verin</div>
                

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
                const msg = `Merhaba, E-okul Sihirbazı uygulamasını almak istiyorum.\nCihaz ID: ${window.ANDROID_ID || 'Bilinmiyor'}`;
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
    /* ───────────────────────────────────────────────────────────────── */


    /* ── Yardımcılar ─────────────────────────────────────────── */
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const waitAjax = async (maxSec = 10) => {
        // e-Okul UpdatePanel (AJAX) meşguliyetini takip eder
        for (let i = 0; i < maxSec * 10; i++) {
            const isBusy = window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager.getInstance().get_isInAsyncPostBack();
            if (!isBusy) return true;
            await wait(100);
        }
        return false;
    };
    const msg = t => { 
        const e = document.getElementById('ew-log'); if (e) e.textContent = t; 
        const es = document.getElementById('ew-eokul-status'); if (es) es.innerHTML = t;
    };
    const getV = (c) => {
        if (!c) return '';
        const inp = c.querySelector('input, select');
        if (inp) return inp.value.trim();
        return c.textContent.trim();
    };
    function parseRange(s) {
        const idx = new Set();
        (s || '').split(',').map(p => p.trim()).forEach(p => {
            if (p.includes('-')) {
                const [a, b] = p.split('-').map(Number);
                if (!isNaN(a) && !isNaN(b)) for (let i = Math.min(a, b); i <= Math.max(a, b); i++) idx.add(i - 1);
            } else { const n = parseInt(p); if (!isNaN(n)) idx.add(n - 1); }
        });
        return [...idx].sort((a, b) => a - b);
    }
    const getRandLvl = (b) => {
        const r = Math.random();
        if (r < 0.10) { 
            let n = Math.random() < 0.5 ? b - 2 : b + 2;
            return Math.max(1, Math.min(4, n));
        } else if (r < 0.35) { 
            let n = Math.random() < 0.5 ? b - 1 : b + 1;
            return Math.max(1, Math.min(4, n));
        }
        return b;
    };

    function showLoader(text = 'Lütfen bekleyiniz...') {
        let loader = document.getElementById('ew-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'ew-loader';
            loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;display:flex;align-items:center;justify-content:center;z-index:9999999999;color:white;flex-direction:column;font-family:sans-serif;transition:opacity 0.4s';
            loader.innerHTML = `
                <div style="width:50px;height:50px;border:5px solid #1e293b;border-top:5px solid #10b981;border-radius:50%;animation:ewSpin 1s linear infinite;margin-bottom:20px"></div>
                <div id="ew-loader-text" style="font-size:16px;font-weight:700">Lütfen bekleyiniz...</div>
                <div style="font-size:12px;color:#64748b;margin-top:10px">İşlem otomatik olarak devam ediyor</div>
            `;
            document.body.appendChild(loader);
        }
        const lt = document.getElementById('ew-loader-text');
        if (lt) lt.textContent = text;
        loader.style.display = 'flex';
        setTimeout(() => { loader.style.opacity = '1'; }, 10);
        setTimeout(hideLoader, 15000); 
    }

    function hideLoader() {
        const loader = document.getElementById('ew-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 400);
        }
    }

    function autoModalClick() {
        if (!S.autoConfirm) return false;
        const modalContainers = document.querySelectorAll('.modal, .swal2-container, .sweet-alert, .ajs-dialog, .alert, [role="dialog"], .ui-dialog, .bootbox');
        for (const modal of modalContainers) {
            if (modal.offsetParent === null && window.getComputedStyle(modal).display === 'none') continue;
            const btns = modal.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn');
            for (const b of btns) {
                if (b.offsetParent === null) continue;
                const txt = ((b.textContent || '') + ' ' + (b.value || '') + ' ' + (b.innerText || '')).toLowerCase();
                const btnClass = (typeof b.className === 'string' ? b.className : '').toLowerCase();
                if (txt.includes('tamam') || txt.includes('evet') || txt.includes('onayla') || txt.includes('kapat') || txt.includes('ok') || btnClass.includes('confirm') || btnClass.includes('btn-primary') || btnClass.includes('btn-success')) {
                    b.click();
                    return true;
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

    /* ── CSS ─────────────────────────────────────────────────── */
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
            padding:10px 9px;border-radius:8px;font-size:14px;margin-bottom:8px;color-scheme:dark}
          .ew-sel option{color:#000;background:#fff}
          .ew-btn{border:none;border-radius:10px;color:white;font-size:15px;
            font-weight:700;cursor:pointer;padding:15px}
          .ew-inp{width:100%;background:#334155;border:1px solid #475569;color:#f1f5f9;
            padding:10px;border-radius:8px;font-size:14px;box-sizing:border-box;color-scheme:dark}
          .ew-inp:focus, .ew-sel:focus{background:#3b82f6!important;color:#fff!important;outline:none;border-color:#60a5fa}
          .ew-lbl{font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;margin-top:8px}
          @keyframes ewSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        `;
        document.head.appendChild(st);
    }

    /* ── ⚡ FAB ──────────────────────────────────────────────── */
    let fab = document.getElementById('ew-fab');
    if (!fab) {
        fab = document.createElement('div'); fab.id='ew-fab';
        
        Object.assign(fab.style,{
            position:'fixed',bottom:'20px',right:'20px',
            width:'64px',height:'64px',zIndex:'99999999',
            background:'linear-gradient(135deg,#10b981,#059669)',
            borderRadius:'50%',display:'flex',alignItems:'center',
            justifyContent:'center',cursor:'pointer',
            fontSize:'32px',userSelect:'none',transition:'transform .2s'
        });
        fab.textContent='⚡';
        document.body.appendChild(fab);
    }
    
    // Viewport ayarı - mobil görünümü düzelt
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewport);
    } else {
        // Mevcut viewport'u güncelle
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }

    /* ── Hedef sayfa değilse: Uyarı veya Navigasyon ── */
    if (!IS_TARGET && !IS_EOKUL_LIST) {
        const OO_URL = 'https://e-okul.meb.gov.tr/OrtaOgretim/OrtaOgretim.aspx';

        if (window.name === 'ew_nav') {
            window.name = '';
            window.location.href = OOK_URL; 
            return;
        }

        fab.onclick = () => {
             // Giriş ekranında mı kontrol et (MEB standart login sayfası)
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
                             <div style="font-size:32px; margin-bottom:12px">🔑</div>
                             <div style="font-size:15px; font-weight:700; margin-bottom:16px">Önce e-Okula Giriş yapınız</div>
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

            // Giriş yapılmışsa (veya login sayfası değilse) navigasyona devam et
            window.name = 'ew_nav'; 
            const link = [...document.querySelectorAll('a[href]')].find(a =>
                /OrtaO[gğ]retim/i.test(a.href) && !a.href.includes('OKL')
            );
            if (link) { link.click(); }
            else { window.location.href = OO_URL; }
        };
        return;
    }

    /* ══════════════════════════════════════════════════════════
       HEDEF SAYFA veya E-OKUL LİSTE SAYFASI — Tam Panel
    ══════════════════════════════════════════════════════════ */
    // iframe kontrolü - sadece aktif işlem yoksa ve iframe içindeyse atla
    if (window.top !== window.self && !S.active && !IS_EOKUL_LIST) return;

    if (!window._nativeConfirm) window._nativeConfirm = window.confirm;
    window.confirm = (m) => S.autoConfirm ? true : window._nativeConfirm.call(window, m);
    if (!window._nativeAlert) window._nativeAlert = window.alert;
    window.alert = (m) => S.autoConfirm ? true : window._nativeAlert.call(window, m);


    /* ── Panel HTML ──────────────────────────────────────────── */
    const oldPanel = document.getElementById('ew-panel');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div'); panel.id='ew-panel';
    const hd = S.excelData.length > 0;

    panel.innerHTML = `
<div style="background:#1e293b;color:#f1f5f9;padding:18px;border-radius:18px;
    box-shadow:0 20px 40px rgba(0,0,0,.65);font-family:'Segoe UI',sans-serif;
    width:min(360px,92vw);border:1px solid #334155;font-size:15px;">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <span style="font-size:17px;font-weight:700">⚡ e-Okul Sihirbazı</span>
    <span style="font-size:11px;color:#7c3aed;font-weight:700;letter-spacing:1px">@rız@</span>
    <div style="display:flex;gap:6px">
      <button id="ew-help-btn" title="Yardım" style="background:none;border:1px solid #475569;border-radius:50%;color:#94a3b8;font-size:14px;cursor:pointer;width:28px;height:28px;line-height:1">?</button>
      <button id="ew-close" style="background:none;border:none;color:#64748b;font-size:24px;cursor:pointer;line-height:1">×</button>
    </div>
  </div>

  <div id="ew-help" style="display:none;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:10px;font-size:12px;color:#94a3b8;line-height:1.8">
    <b style="color:#f1f5f9;font-size:13px">📚 Kullanım Kılavuzu</b><br>
    <b style="color:#10b981">1. E-Okul'dan Al:</b> Listeleme sayfasında sütun seçin ve başlatın.<br>
    <b style="color:#10b981">2. Excel'den Al:</b> Excel dosyasını seçip, doldurma sayfasına geçin.<br>
    <b style="color:#10b981">3. Altın Motor:</b> Tüm işlemler v3.3 Golden hızıyla yapılır.<br>
  </div>

  <div id="ew-log" style="background:#0f172a;padding:8px;border-radius:6px;font-family:monospace;font-size:12px;color:#10b981;margin-bottom:12px;height:24px;overflow:hidden;border:1px solid #334155">
    Hazır.
  </div>

  <!-- SEKME SİSTEMİ (Yeni Sıralama: 1. E-Okul) -->
  <div style="display:flex;gap:4px;margin-bottom:14px;border-bottom:2px solid #334155">
    <button id="ew-tab-eokul" class="ew-tab ew-tab-active" style="flex:1;background:none;border:none;color:#10b981;padding:11px;cursor:pointer;font-size:14px;font-weight:700;border-bottom:2px solid #10b981;margin-bottom:-2px">
      🌐 E-OKUL'DAN AL
    </button>
    <button id="ew-tab-excel" class="ew-tab" style="flex:1;background:none;border:none;color:#64748b;padding:11px;cursor:pointer;font-size:14px;font-weight:700">
      📊 EXCEL'DEN AL
    </button>
  </div>

  <!-- E-OKUL SEKMESI (Yeni Sıralama: 1. Sırada) -->
  <div id="ew-content-eokul" class="ew-tab-content">
    <div id="ew-eokul-status" style="background:#0f172a;padding:11px;border-radius:10px;margin-bottom:12px;font-size:13px;color:#94a3b8">
      ℹ️ Not Giriş/Liste sayfasına yönlendiriliyorsunuz...
    </div>
    
    <label class="ew-lbl" style="margin-top:0">Sınıf:</label>
    <select id="ew-eokul-sinif" class="ew-sel"><option value="">Yükleniyor...</option></select>
    
    <label class="ew-lbl">Ders:</label>
    <select id="ew-eokul-ders" class="ew-sel" disabled><option value="">Önce sınıf seçin...</option></select>
    
    <button id="ew-eokul-listele" class="ew-btn" disabled style="width:100%;background:#374151;margin-bottom:12px">
      📋 Listele
    </button>
    
    <label class="ew-lbl">Kriter Sütunu Seç:</label>
    <select id="ew-eokul-sutun" class="ew-sel" disabled><option value="">Önce listeleyin...</option></select>
    
    <label class="ew-lbl">Tema No (örn: 1 veya 2-4):</label>
    <input type="text" id="ew-eokul-range" class="ew-inp" value="${S.eokulRange||'1'}" style="margin-bottom:10px">
    
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button id="ew-eokul-basla" class="ew-btn" disabled style="flex:2;background:#374151">▶ BAŞLAT</button>
      <button id="ew-eokul-stop" class="ew-btn" disabled style="flex:1;background:#374151;font-size:22px">⏹</button>
    </div>
    <button id="ew-eokul-clear" class="ew-btn" disabled style="width:100%;background:#374151;margin-bottom:8px">
      🗑 TEMİZLE</button>
  </div>

  <!-- EXCEL SEKMESI (Yeni Sıralama: 2. Sırada) -->
  <div id="ew-content-excel" class="ew-tab-content" style="display:none">
    <div id="ew-info" style="background:rgba(16,185,129,0.1);padding:10px;border-radius:8px;font-size:13px;color:#10b981;margin-bottom:12px;border:1px solid rgba(16,185,129,0.2)">
      ${hd ? '📋 Kayıtlı: '+S.excelData.length+' Öğrenci' : '📂 İşlem için Excel yükleyin'}
    </div>

    <div style="margin-bottom:12px">
      <label class="ew-lbl" style="margin-top:0">
        ${hd?'📊 Excel Değiştir:':'📂 Excel Dosyası (.xlsx/.xls):'}
      </label>
      <input type="file" id="ew-file" accept=".xlsx,.xls"
        style="font-size:13px;width:100%;background:#0f172a;border:1px solid #475569;
               color:#f1f5f9;padding:10px;border-radius:8px;box-sizing:border-box">
    </div>

    <label class="ew-lbl">Tema No (örn: 1 veya 2-4):</label>
    <input type="text" id="ew-cat" class="ew-inp" value="${S.catRange}" style="margin-bottom:10px">
    <label style="font-size:14px;color:#94a3b8;display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
      <input type="checkbox" id="ew-auto" ${S.autoNextClass?'checked':''} style="width:19px;height:19px"> Şubeyi Otomatik Atla
    </label>
    <label style="font-size:14px;color:#94a3b8;display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:14px">
      <input type="checkbox" id="ew-ac" ${S.autoConfirm?'checked':''} style="width:19px;height:19px"> Kayıt Onayını Otomatik Onayla
    </label>

    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button id="ew-start" class="ew-btn" disabled style="flex:2;background:#374151">▶ BAŞLAT</button>
      <button id="ew-stop" class="ew-btn" style="flex:1;background:#475569;font-size:22px">⏹</button>
    </div>
    <button id="ew-clear" class="ew-btn" disabled style="width:100%;background:#374151;margin-bottom:8px">
      🗑 TEMİZLE</button>
  </div>

  <div style="text-align:right;margin-top:10px">
    <a href="#" id="ew-reset" style="color:#475569;font-size:12px;text-decoration:none">⟳ Veriyi Sıfırla</a>
    ${isActivated()?'':'<br><a href="#" id="ew-lic-show" style="color:#10b981;font-size:12px;text-decoration:none">🔑 Lisans Anahtarı Gir</a>'}
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

    
    // Veriyi Sıfırla Linki
    const resetLink = document.getElementById('ew-reset');
    if (resetLink) {
        resetLink.onclick = (e) => {
            e.preventDefault();
            S = {
                active: false, mode: 'fill', excelData: [],
                currentIndex: -1, catRange: '1', autoNextClass: true,
                autoConfirm: true, waiting: false, paused: false, open: true,
                activeTab: S.activeTab,
                eokulListPending: false, eokulSelectedSinif: '', eokulSelectedDers: '',
                eokulRange: '1', selectedSube: '', selectedDers: '', autoStartList: false
            };
            save();
            location.reload();
        };
    }

    document.getElementById('ew-help-btn').onclick = () => {
        const h = document.getElementById('ew-help');
        if (h) h.style.display = h.style.display === 'none' ? 'block' : 'none';
    };
    const lsBtn = document.getElementById('ew-lic-show');
    if (lsBtn) lsBtn.onclick = (e) => { e.preventDefault(); showLicModal(); };

    // GÜVENLİK KİLİDİ VE BUTON DURUM YÖNETİMİ
    function updateControlStates() {
        const hasExcel = S.excelData && S.excelData.length > 0;
        const eokulSutun = document.getElementById('ew-eokul-sutun');
        const hasEokulCol = eokulSutun && eokulSutun.value && eokulSutun.value !== "" && eokulSutun.options[eokulSutun.selectedIndex]?.text !== "Önce listeleyin...";

        // Excel Butonları
        const exStart = document.getElementById('ew-start');
        const exClear = document.getElementById('ew-clear');
        if (exStart) {
            exStart.disabled = !hasExcel;
            exStart.style.background = hasExcel ? '#10b981' : '#374151';
        }
        if (exClear) {
            exClear.disabled = !hasExcel;
            exClear.style.background = hasExcel ? '#ef4444' : '#374151';
        }

        // E-Okul Butonları (Kriter seçilmeden aktif olmaz)
        const eoStart = document.getElementById('ew-eokul-basla');
        const eoStop = document.getElementById('ew-eokul-stop');
        const eoClear = document.getElementById('ew-eokul-clear');
        if (eoStart) {
            eoStart.disabled = !hasEokulCol;
            eoStart.style.background = hasEokulCol ? '#10b981' : '#374151';
        }
        if (eoStop) {
            eoStop.disabled = !hasEokulCol;
            eoStop.style.background = hasEokulCol ? '#475569' : '#374151';
        }
        if (eoClear) {
            eoClear.disabled = !hasEokulCol;
            eoClear.style.background = hasEokulCol ? '#ef4444' : '#374151';
        }
    }

    // Sekme değiştirme
    function switchTab(tabName, triggerNav = false) {
        const tabs = document.querySelectorAll('.ew-tab');
        const contents = document.querySelectorAll('.ew-tab-content');
        
        tabs.forEach(tab => {
            tab.style.color = '#64748b';
            tab.style.borderBottom = 'none';
            tab.classList.remove('ew-tab-active');
        });
        
        contents.forEach(content => content.style.display = 'none');
        
        const activeTab = document.getElementById(`ew-tab-${tabName}`);
        const activeContent = document.getElementById(`ew-content-${tabName}`);
        if (activeTab) {
            activeTab.style.color = '#10b981';
            activeTab.style.borderBottom = '2px solid #10b981';
            activeTab.classList.add('ew-tab-active');
        }
        if (activeContent) activeContent.style.display = 'block';
        
        S.activeTab = tabName; save();
        updateControlStates();

        if (triggerNav) {
            if (tabName === 'eokul') {
                msg('🌐 Not Giriş sayfasına yönlendiriliyor...');
                setTimeout(() => { window.location.href = 'https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK07003.aspx'; }, 300);
            } else if (tabName === 'excel') {
                msg('📊 Gelişim sayfasına yönlendiriliyor...');
                setTimeout(() => { window.location.href = OOK_URL; }, 300);
            }
        }
    }
    
    document.getElementById('ew-tab-excel').onclick = () => switchTab('excel', true);
    document.getElementById('ew-tab-eokul').onclick = () => switchTab('eokul', true);
    
    if (IS_EOKUL_LIST) switchTab('eokul');
    else if (S.activeTab) switchTab(S.activeTab);
    else switchTab('eokul'); // Varsayılan E-Okul

    // E-OKUL'DAN AL SEKMESİ İŞLEVSELLİĞİ
    let eokulData = [];
    setTimeout(() => {
        updateControlStates();
        const colSel = document.getElementById('ew-eokul-sutun');
        if (colSel) colSel.onchange = updateControlStates;

        const listeleBtn = document.getElementById('ew-eokul-listele');
        if (listeleBtn) {
            listeleBtn.onclick = () => {
                localStorage.setItem(PENDING_KEY, JSON.stringify({ pending: true, time: Date.now() }));
                const pageListele = document.getElementById('btnListele') || 
                                   document.getElementById('btnSorgula') || 
                                   document.querySelector('input[id*="btnListele"]') ||
                                   document.querySelector('input[id*="Sorgu"]');
                if (pageListele) pageListele.click();
                else msg('⚠️ Sayfadaki Listele butonu bulunamadı!');
            };
        }
        
        // Sayfadaki Orijinal Listele butonlarını da yakala
        [...document.querySelectorAll('input[type="submit"], input[type="button"], button')].forEach(btn => {
            const txt = (btn.value || btn.textContent || '').toLowerCase();
            if (txt.includes('listele') || txt.includes('sorgula') || btn.id.includes('btnListele')) {
                btn.addEventListener('click', () => {
                    localStorage.setItem(PENDING_KEY, JSON.stringify({ pending: true, time: Date.now() }));
                });
            }
        });
    }, 2000);

    async function analyzeTable() {
        if (!IS_EOKUL_LIST) return;
        
        const statusEl = document.getElementById('ew-eokul-status');
        const sutunSel = document.getElementById('ew-eokul-sutun');
        if (statusEl) statusEl.innerHTML = '🔍 Tablo analiz ediliyor...';
        
        let table = null;
        for (let i = 0; i < 30; i++) {
            await wait(500);
            const mainContent = document.querySelector('#main, .main-content, .content, #content') || document.body;
            let tableCandidates = [...mainContent.querySelectorAll('table')].filter(t => {
                // Temel kontroller: çok küçük tabloları ve menü bileşenlerini ele
                if (t.rows.length < 5) return false;
                if (t.closest('[id*="Menu"], [class*="Menu"], [id*="sidebar"], [class*="sidebar"], [id*="left"], [class*="left"], [id*="tree"], [class*="tree"], .nav, .navigation')) return false;
                
                // İçerik kontrolü: Hem isim hem de numara/TC sütunu olmalı
                const text = t.textContent.toLowerCase();
                const hasName = text.includes('adı soyadı');
                const hasNo = text.includes('okul no') || text.includes('öğrenci no') || text.includes('t.c. kimlik');
                
                if (!hasName || !hasNo) return false;

                // Sütun sayısı kontrolü - gerçek listeler geniştir
                const firstRow = t.rows[0];
                if (firstRow && firstRow.cells.length < 5) return false;

                return true;
            });

            if (tableCandidates.length > 0) {
                // En çok satırı olanı (muhtemel liste) seç
                tableCandidates.sort((a,b) => b.rows.length - a.rows.length);
                table = tableCandidates[0];
            }

            if (!table) {
                table = mainContent.querySelector('table[id*="gvSinifListesi"]') || 
                        mainContent.querySelector('table[id*="gvListe"]') ||
                        mainContent.querySelector('table[id*="dgListe"]') ||
                        mainContent.querySelector('table[id*="Grid"]');
            }
            if (table) break;
        }
        
        if (!table) {
            if (statusEl) statusEl.innerHTML = '❌ Tablo bulunamadı. Lütfen "Listele" basın.';
            hideLoader();
            return;
        }
        
        let headerRow = null;
        for (let i = 0; i < Math.min(10, table.rows.length); i++) {
            const hText = table.rows[i].textContent.toLowerCase();
            const isHeader = hText.includes('adı soyadı') || hText.includes('öğrenci no') || hText.includes('okul no') || hText.includes('notu');
            if (isHeader) {
                headerRow = table.rows[i];
                break;
            }
        }
        
        if (!headerRow) {
            if (statusEl) statusEl.innerHTML = '❌ Başlık satırı bulunamadı.';
            hideLoader();
            return;
        }
        
        const headersExpanded = [];
        [...headerRow.cells].forEach(cell => {
            const span = cell.colSpan || 1;
            const txt = cell.textContent.trim();
            for (let i = 0; i < span; i++) headersExpanded.push(span > 1 ? `${txt} (${i + 1})` : txt);
        });
        
        const hIdx = [...table.rows].indexOf(headerRow);
        const stRows = [...table.rows].slice(hIdx + 1).filter(r => {
            if (r.cells.length < 2) return false;
            const tContent = r.textContent.trim();
            return tContent.length > 0 && !tContent.includes('kayıt bulundu');
        });
        
        if (stRows.length === 0) {
            if (statusEl) statusEl.innerHTML = '❌ Veri bulunamadı.';
            hideLoader();
            return;
        }
        
        const numericColumns = [];
        const blackExactSet = new Set(['.', 'no', 'nu', 'tc', 't.c.', 'ad', 'soyad', 'muaf', 'uyarı', 'işlem', 'seç', 'adı', 'adı soyadı']);
        const blackContainSet = ['okul no', 'kimlik no', 'öğrenci no', 'adı soyadı', 'sınıf', 'şubesi', 'şube', 't.c.'];
        
        const cCount = stRows[0].cells.length;
        // İlk sütun hariç (j=1)
        for (let j = 1; j < cCount; j++) {
            let hName = (headersExpanded[j] || '').trim().toLowerCase();
            let dName = (headersExpanded[j] || `Sütun ${j + 1}`).trim();
            
            const isB = blackExactSet.has(hName) || blackContainSet.some(b => hName.includes(b));
            if (isB) continue;
            
            // Sadece çok uzun metin içeren (açıklama gibi) sütunları ele
            let isTooLong = false;
            let hasNumber = false;
            for (let r = 0; r < Math.min(15, stRows.length); r++) {
                const val = getV(stRows[r].cells[j]);
                if (val.length > 40) { isTooLong = true; break; }
                if (!isNaN(parseFloat(val)) && isFinite(val)) hasNumber = true;
            }
            
            // SADECE içinde en az bir sayı olan ve çok uzun olmayan sütunları al
            if (hasNumber && !isTooLong) {
                numericColumns.push({ index: j, name: dName });
            }
        }
        
        if (numericColumns.length === 0) {
            const debugList = headersExpanded.slice(1, 6).join(', ');
            if (statusEl) statusEl.innerHTML = `❌ Sütun bulunamadı. (Sıradakiler: ${debugList})`;
            hideLoader();
            return;
        }
        
        if (sutunSel) {
            sutunSel.innerHTML = '<option value="">Sütun seçin...</option>';
            numericColumns.forEach(c => sutunSel.add(new Option(c.name, c.index)));
            sutunSel.disabled = false;
            sutunSel.onchange = () => {
                const btn = document.getElementById('ew-eokul-basla');
                if (btn && sutunSel.value) { btn.disabled = false; btn.style.background = '#10b981'; }
            };
        }
        
        eokulData = stRows.map(r => {
            let sNo = '';
            if (r.cells[0]) {
                const c1 = r.cells[0].textContent.trim();
                sNo = c1.includes('/') ? c1.split('/').pop().trim() : c1;
            }
            if (!sNo && r.cells[1]) {
                const c2 = r.cells[1].textContent.trim();
                if (/^\d+$/.test(c2)) sNo = c2;
            }
            return { no: sNo, values: [...r.cells].map(c => getV(c)) };
        });

        const colList = numericColumns.length > 0 
            ? numericColumns.map(c => c.name).join(', ') 
            : 'Sayısal veri bulunamadı';

        if (statusEl) statusEl.innerHTML = `✅ ${eokulData.length} öğrenci bulundu!<br><small>🔢 Sayı içeren sütunlar: ${colList}</small>`;
        hideLoader();
    }

    if (IS_EOKUL_LIST) {
        const pendingData = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
        const shouldAnalyzeTable = pendingData && pendingData.pending;
        
        if (shouldAnalyzeTable) {
            localStorage.removeItem(PENDING_KEY);
        }
        
        // SADECE 'Listele' yapıldıysa otomatik tablo analizi yap
        if (shouldAnalyzeTable) {
            showLoader('Liste analiz ediliyor...');
            setTimeout(() => {
                analyzeTable();
            }, 1000);
        } else {
            // Bayrak yoksa bile sessizce bir kez dene (belki tablo çoktan gelmiştir)
            setTimeout(() => {
                const main = document.querySelector('#main, .main-content, .content, #content') || document.body;
                if (main.querySelector('table')) analyzeTable();
            }, 3000);
        }
        
        // Manuel analiz için durum yazısına tıklandığında analizi başlat
        const statusTxt = document.getElementById('ew-eokul-status');
        if (statusTxt) {
            statusTxt.style.cursor = 'pointer';
            statusTxt.title = 'Yenilemek için tıklayın';
            statusTxt.onclick = () => analyzeTable();
            // Yanına küçük bir yenile ikonu ekle
            statusTxt.innerHTML += ' <span style="font-size:12px;opacity:0.6">🔄</span>';
        }
        
        setTimeout(() => {
            // Sınıf dropdown'ını bul
            const pageSinif = document.getElementById('cmbSiniflar') ||
                             document.getElementById('cmbSinif') ||
                             document.querySelector('select[name*="Sinif"]') ||
                             document.querySelector('select[name*="sinif"]') ||
                             [...document.querySelectorAll('select')].find(sel => {
                                 const label = sel.previousElementSibling?.textContent || 
                                              sel.parentElement?.textContent || '';
                                 return label.includes('Sınıf');
                             });
            
            const panelSinif = document.getElementById('ew-eokul-sinif');
            
            if (pageSinif && panelSinif) {
                panelSinif.innerHTML = '';
                [...pageSinif.options].forEach(opt => {
                    panelSinif.add(new Option(opt.text, opt.value));
                });
                
                // Kaydedilmiş sınıf seçimi varsa geri yükle
                if (S.eokulSelectedSinif) {
                    panelSinif.value = S.eokulSelectedSinif;
                    pageSinif.value = S.eokulSelectedSinif;
                    
                    // SADECE sayfa yenilendiyse (Listele'den gelindiyse) change event tetikle
                    // Ama sadece bir kez tetikle, sonsuz döngüye girmesin
                    if (shouldAnalyzeTable) {
                        pageSinif.dispatchEvent(new Event('change', {bubbles: true}));
                        if (window.$ && window.$.fn && window.$.fn.select2) {
                            $(pageSinif).trigger('change.select2');
                        }
                    }
                } else {
                    // Sınıf seçimi yoksa ilk seçeneği seç (genellikle boş değil)
                    if (panelSinif.options.length > 1) {
                        panelSinif.selectedIndex = 1; // İlk gerçek seçenek
                        pageSinif.selectedIndex = 1;
                        S.eokulSelectedSinif = panelSinif.value;
                        save();
                    }
                }
                
                // Sınıf değiştiğinde
                panelSinif.onchange = () => {
                    if (pageSinif) {
                        pageSinif.value = panelSinif.value;
                        pageSinif.dispatchEvent(new Event('change', {bubbles: true}));
                        if (window.$ && window.$.fn && window.$.fn.select2) {
                            $(pageSinif).trigger('change.select2');
                        }
                    }
                    
                    // Seçimi kaydet
                    S.eokulSelectedSinif = panelSinif.value;
                    save();
                    
                    showLoader('Dersler yükleniyor...');
                    setTimeout(() => {
                        loadDersDropdown(false); // Kullanıcı kendi seçtiyse reload değildir
                    }, 1000);
                };
                
                // Eğer sınıf seçiliyse, ders dropdown'ını yükle
                if (panelSinif.value) {
                    setTimeout(() => {
                        loadDersDropdown(shouldAnalyzeTable); // Sayfa yenilendiyse reload=true
                    }, 1500);
                } else {
                    document.getElementById('ew-eokul-status').innerHTML = '✅ Sınıf seçin';
                }
            } else {
                document.getElementById('ew-eokul-status').innerHTML = 
                    '⚠️ Sınıf listesi bulunamadı. Sayfayı yenileyin.';
            }
        }, 1500);
    }
    
    // Ders dropdown'ını yükle
    function loadDersDropdown(isReload = false) {
        const pageDers = document.getElementById('cmbDersler') || 
                        document.getElementById('cmbDers') ||
                        document.querySelector('select[name*="Ders"]') ||
                        document.querySelector('select[name*="ders"]') ||
                        [...document.querySelectorAll('select')].find(sel => {
                            const label = sel.previousElementSibling?.textContent || 
                                         sel.parentElement?.textContent || '';
                            return label.includes('Ders');
                        });
        
        const panelDers = document.getElementById('ew-eokul-ders');
        
        if (pageDers && panelDers) {
            panelDers.innerHTML = '';
            [...pageDers.options].forEach(opt => {
                panelDers.add(new Option(opt.text, opt.value));
            });
            
            // Kaydedilmiş ders seçimi varsa geri yükle
            if (S.eokulSelectedDers) {
                panelDers.value = S.eokulSelectedDers;
                pageDers.value = S.eokulSelectedDers;
            } else {
                // Ders seçimi yoksa ilk gerçek seçeneği seç
                panelDers.selectedIndex = 1;
                pageDers.selectedIndex = 1;
                S.eokulSelectedDers = panelDers.value;
                save();
            }
            
            panelDers.disabled = false;
            document.getElementById('ew-eokul-status').innerHTML = '✅ Ders seçin ve Listele\'ye tıklayın';
            document.getElementById('ew-eokul-listele').disabled = false;
            document.getElementById('ew-eokul-listele').style.background = '#10b981';
            
            // Ders değiştiğinde
            panelDers.onchange = () => {
                if (pageDers) {
                    pageDers.value = panelDers.value;
                    pageDers.dispatchEvent(new Event('change', {bubbles: true}));
                    if (window.$ && window.$.fn && window.$.fn.select2) {
                        $(pageDers).trigger('change.select2');
                    }
                }
            };

            // Kayıtlı dersi koru
            if (panelDers.value) { S.eokulSelectedDers = panelDers.value; save(); }
        } else {
            document.getElementById('ew-eokul-status').innerHTML = 
                '⚠️ Ders listesi yüklenmedi. Sınıf seçimini kontrol edin.';
        }
    }

    document.getElementById('ew-eokul-listele').onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        msg('📋 Listele butonuna tıklandı!');
        
        const panelSinif = document.getElementById('ew-eokul-sinif');
        const panelDers = document.getElementById('ew-eokul-ders');
        
        if (!panelSinif || !panelSinif.value) {
            msg('⚠️ Önce sınıf seçin!');
            return;
        }
        
        if (!panelDers || !panelDers.value) {
            msg('⚠️ Önce ders seçin!');
            return;
        }
        
        S.eokulSelectedDers = panelDers.value;
        save();
        
        showLoader('Liste hazırlanıyor...');
        
        const pendingData = {
            pending: true,
            timestamp: Date.now(),
            sinif: panelSinif.value,
            ders: panelDers.value
        };
        localStorage.setItem(PENDING_KEY, JSON.stringify(pendingData));
        
        msg('📋 Listele butonuna tıklanıyor...');
        
        const listeleBtn = document.getElementById('btnListele') || 
                           document.getElementById('btnSorgula') ||
                           document.querySelector('input[value="Listele"]') ||
                           document.querySelector('button.btn-primary') ||
                           document.querySelector('button[id*="Listele"]') ||
                           document.querySelector('input[type="submit"][value*="Listele"]') ||
                           [...document.querySelectorAll('button, input[type="button"], input[type="submit"]')]
                               .find(b => (b.value || b.textContent || '').toLowerCase().includes('listele'));
        
        if (!listeleBtn) {
            msg('❌ Listele butonu bulunamadı, form denenecek...');
            const form = document.querySelector('form');
            if (form) {
                form.submit();
            } else {
                localStorage.removeItem(PENDING_KEY);
                hideLoader();
            }
            return;
        }
        
        listeleBtn.click();
    };

    /* ── Otomasyon Motoru ve Kontroller ──────────────────────── */
    
    const updateStartBtn = () => {
        const hd = S.excelData.length > 0;
        const buttons = [
            { start: 'ew-start', stop: 'ew-stop', clear: 'ew-clear' },
            { start: 'ew-eokul-basla', stop: 'ew-eokul-stop', clear: 'ew-eokul-clear' }
        ];

        buttons.forEach(b => {
            const s = document.getElementById(b.start);
            const t = document.getElementById(b.stop);
            const c = document.getElementById(b.clear);
            
            if (s) {
                if (S.active) {
                    s.textContent = S.paused ? '▶ DEVAM ET' : '⏸ DURAKLAT';
                    s.style.background = S.paused ? '#f59e0b' : '#3b82f6';
                    s.disabled = false;
                } else {
                    s.textContent = '▶ BAŞLAT';
                    s.style.background = hd ? '#10b981' : '#374151';
                    s.disabled = !hd && !(IS_EOKUL_LIST && b.start === 'ew-eokul-basla');
                }
            }
            if (t) t.disabled = !S.active;
            if (c) {
                if (S.active && S.mode === 'clear') {
                    c.textContent = S.paused ? '▶ TEMİZLE' : '⏸ DURAKLAT';
                    c.style.background = '#f59e0b';
                } else {
                    c.textContent = '🗑 TEMİZLE';
                    c.style.background = hd ? '#ef4444' : '#374151';
                }
                c.disabled = !hd || (S.active && S.mode !== 'clear');
            }
        });
    };

    const handleStop = () => {
        S.active = false; S.paused = false; S.currentIndex = -1;
        save(); updateStartBtn();
        msg('⏹ Otomasyon durduruldu.');
    };

    const handleClear = () => {
        if (S.active && S.mode === 'clear') {
            S.paused = !S.paused;
        } else {
            S.active = true;
            S.mode = 'clear';
            S.paused = false;
            S.currentIndex = -1;
        }
        save();
        updateStartBtn();
        if (S.active && !S.paused) {
            msg('🧹 Temizleme otomasyonu başlıyor...');
            runLoop();
        }
    };

    const runEokulExtraction = () => {
        if (!isActivated()) { showLicModal(); return; } // İlk adımda lisans kontrolü
        const sutunSel = document.getElementById('ew-eokul-sutun');
        const colIdx = parseInt(sutunSel.value);
        if (!colIdx || eokulData.length === 0) { msg('⚠️ Önce listele ve sütun seç!'); return; }
        
        S.excelData = eokulData.map(row => {
            const cellValue = (row.values[colIdx] || '').toString().trim().toUpperCase();
            if (!cellValue || cellValue === 'R') return null;
            if (cellValue === '0' || cellValue === 'G' || cellValue === 'K') {
                return { no: row.no, vals: [-1], forceLevel: 1 };
            }
            const numVal = parseFloat(cellValue);
            return (!isNaN(numVal) && numVal >= 0) ? { no: row.no, vals: [numVal] } : null;
        }).filter(d => d !== null && d.no);

        if (S.excelData.length === 0) { msg('❌ İşlenebilir öğrenci bulunamadı!'); return; }
        
        S.currentIndex = -1; S.active = true; S.paused = false; S.mode = 'fill';
        S.catRange = S.eokulRange || '1';
        S.selectedSube = S.eokulSelectedSinif; S.selectedDers = S.eokulSelectedDers;
        S.autoStartList = true;
        save();
        msg('✅ Veriler hazırlandı. Yönlendiriliyor...');
        setTimeout(() => { window.location.href = OOK_URL; }, 1000);
    };

    // Dinleyicileri Bağla
    document.getElementById('ew-file').onchange = function (e) {
        const f = e.target.files[0]; if (!f) return;
        msg('📂 Excel okunuyor...');
        const r = new FileReader();
        r.onload = evt => {
            try {
                const wb   = XLSX.read(evt.target.result, {type:'binary'});
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
                const data = [];
                for (let i = 1; i < rows.length; i++) {
                    if (!rows[i][2]) continue; // C kolonu (Student No)
                    const vals = [];
                    for (let c = 4; c < rows[i].length; c++) { // E kolonu (Values)
                        const v = parseFloat(rows[i][c]);
                        vals.push(isNaN(v) ? 0 : v);
                    }
                    if (vals.length === 0) vals.push(0);
                    data.push({no: rows[i][2].toString().trim(), vals});
                }
                S.excelData = data; S.currentIndex = -1; S.active = false;
                save();
                const startEl  = document.getElementById('ew-start');
                document.getElementById('ew-info').textContent = '📋 Kayıtlı: ' + data.length + ' Öğrenci';
                if (startEl) {
                    startEl.disabled = false;
                    startEl.style.background = '#10b981';
                }
                msg('✅ Excel yüklendi.');
            } catch(ex) { alert('Excel okunamadı: ' + ex.message); }
        };
        r.readAsBinaryString(f);
    };

    ['ew-start', 'ew-eokul-basla'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => {
            if (!isActivated()) { showLicModal(); return; }
            if (id === 'ew-eokul-basla' && IS_EOKUL_LIST) { runEokulExtraction(); return; }
            if (S.excelData.length === 0) { msg('⚠️ Önce veri yükleyin!'); return; }
            
            if (S.active && S.mode === 'fill') {
                S.paused = !S.paused;
            } else {
                S.active = true;
                S.mode = 'fill';
                S.paused = false;
                S.currentIndex = -1;
                // Başladığında aktif sekmeye göre range kontrolü yap
                if (S.activeTab === 'eokul' && S.eokulRange) S.catRange = S.eokulRange;
            }
            save(); updateStartBtn();
            if (S.active && !S.paused) runLoop();
        };
    });

    // AYAR KAYDETME DİNLEYİCİLERİ (Kesin Kayıt Sistemi)
    function initBinders() {
        const bindInp = (id, key, isCheck = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            const handler = (e) => {
                S[key] = isCheck ? e.target.checked : e.target.value;
                save();
            };
            el[isCheck ? 'onchange' : 'oninput'] = handler;
        };
        bindInp('ew-cat', 'catRange');
        bindInp('ew-eokul-range', 'eokulRange');
        bindInp('ew-auto', 'autoNextClass', true);
        bindInp('ew-ac', 'autoConfirm', true);
    }
    setTimeout(initBinders, 500);
    setTimeout(initBinders, 2500); // Fail-safe (Panel yeniden render olursa)

    ['ew-stop', 'ew-eokul-stop'].forEach(id => {
        const btn = document.getElementById(id); if (btn) btn.onclick = handleStop;
    });

    ['ew-clear', 'ew-eokul-clear'].forEach(id => {
        const btn = document.getElementById(id); if (btn) btn.onclick = handleClear;
    });

    let mainTimer = null;
    let loopBusy = false;
    const runLoop = async () => {
        if (loopBusy || !S.active || S.paused) return;
        loopBusy = true;

        try {
            // ALTIN MOTOR ÇEKİRDEĞİ (v3.3 EN İYİ ANDROID 1 - TÜM SİSTEM)
            const btns = [...document.querySelectorAll('button[id^="btnOpen"]')];
            const rows = btns.map(b => b.closest('tr')).filter(Boolean);

            if (!rows.length) {
                const lb = document.querySelector('button.btn-primary.has-ripple') || document.getElementById('btnListele');
                if (lb) { loopBusy = false; lb.click(); setTimeout(runLoop, 3000); return; }
                msg('⚠️ Liste yüklenemedi. (Ders/Şube seçili mi?)'); loopBusy = false; return;
            }

            S.currentIndex++;
            if (S.currentIndex >= rows.length) {
                // Sınıf Atlatma Mantığı
                if (S.autoNextClass) {
                    const sel = document.getElementById('cmbSubeler');
                    if (sel && sel.selectedIndex < sel.options.length - 1) {
                        sel.selectedIndex++;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                        if (window.$?.fn?.select2) $(sel).trigger('change.select2');
                        S.currentIndex = -1; save();
                        loopBusy = false;
                        setTimeout(() => {
                            document.querySelector('button.btn-primary.has-ripple')?.click();
                            setTimeout(runLoop, 2000);
                        }, 500);
                        return;
                    }
                }
                msg(S.mode === 'clear' ? '✅ Sınıf temizlendi!' : '✅ TÜM LİSTE TAMAMLANDI!');
                if (S.autoConfirm) await pollAutoConfirm(3.0);
                S.active = false; S.paused = false; loopBusy = false; save();
                updateStartBtn(); return;
            }

            const tr = rows[S.currentIndex];
            const sNo = tr.cells[2]?.innerText.trim();
            const btnOp = tr.querySelector('button[id^="btnOpen"]');
            
            // Veri Kaynağından Öğrenciyi Bul (Excel veya Extraction fark etmez)
            const student = S.excelData.find(s => s.no === sNo);
            if (S.mode === 'fill' && !student) { 
                msg(`⏭ Atlanıyor: ${sNo} (Verisi yok)`);
                loopBusy = false; setTimeout(runLoop, 300); return; 
            }

            msg(`👤 ${sNo} No | Golden Motor devrede...`);
            btnOp.click();
            await wait(1200);

            // Başlıkları ve Temaları Saptama (v3.3)
            let headers = [...document.querySelectorAll('a.text-light')];
            if (!headers.length) headers = [...document.querySelectorAll('[data-toggle="collapse"] a, a[data-toggle="collapse"]')];
            
            const currentRange = (S.activeTab === 'eokul') ? (S.eokulRange || '1') : (S.catRange || '1');
            const targetIdxs = parseRange(currentRange);
            let changed = false;

            for (const idx of targetIdxs) {
                let searchIn = document;
                if (headers.length > 0 && idx < headers.length) {
                    const h = headers[idx];
                    if (h.classList.contains('collapsed')) { h.click(); await wait(300); }
                    searchIn = h.closest('.card') || h.parentElement?.nextElementSibling || document;
                }

                if (S.mode === 'fill') {
                    // v3.3 BAĞIL PUANLAMA MANTIĞI (EN İYİ)
                    const colVals = S.excelData.map(d => (d.vals && d.vals[idx] !== undefined) ? d.vals[idx] : (d.vals ? d.vals[0] : 0));
                    const minV = Math.min(...colVals);
                    const maxV = Math.max(...colVals);
                    const stuVal = (student.vals && student.vals[idx] !== undefined) ? student.vals[idx] : (student.vals ? student.vals[0] : 0);
                    const r = maxV > minV ? (stuVal - minV) / (maxV - minV) : 1;
                    const baseLvl = r < .25 ? 1 : r < .50 ? 2 : r < .75 ? 3 : 4;

                    const allRadios = searchIn.querySelectorAll('input[type="radio"]');
                    const stems = new Set();
                    allRadios.forEach(rd => {
                        const rid = rd.id;
                        const lastUnder = rid.lastIndexOf('_');
                        if (lastUnder !== -1) stems.add(rid.substring(0, lastUnder));
                    });

                    stems.forEach(stem => {
                        const lvl = getRandLvl(baseLvl);
                        const rd = document.getElementById(`${stem}_${lvl}`);
                        if (rd && !rd.checked) { 
                            rd.click(); 
                            if (rd.style) { rd.style.outline = '3px solid #10b981'; rd.style.background = '#dcfce7'; }
                            changed = true; 
                        }
                    });
                } else {
                    // v3.3 TEMİZLEME MANTIĞI
                    const tBtns = [...searchIn.querySelectorAll('button, input, a')].filter(b => (b.textContent||b.value||b.title||'').toLowerCase().includes('temizle'));
                    for (const b of tBtns) { b.click(); if (S.autoConfirm) autoModalClick(); await wait(20); changed = true; }
                }
            }

            if (changed) {
                await wait(500);
                const kaydet = document.getElementById('btnKaydet') || document.querySelector('button[id*="Kaydet"]') || document.querySelector('.btn-success.has-ripple');
                if (kaydet) {
                    msg('💾 Kaydediliyor...');
                    kaydet.click();
                    await wait(600);
                    await pollAutoConfirm(4.0);
                    loopBusy = false;
                    setTimeout(runLoop, 500);
                } else { loopBusy = false; setTimeout(runLoop, 500); }
            } else { loopBusy = false; setTimeout(runLoop, 300); }
        } catch (err) {
            msg(`⚠️ Bir sorun oluştu, devam ediliyor...`);
            loopBusy = false; setTimeout(runLoop, 2000);
        }
    };

    function mirrorOpts(src, dst) {
        if (!src || !dst) return;
        const prev = dst.value;
        dst.innerHTML = '';
        [...src.options].forEach(o => dst.add(new Option(o.text, o.value, o.defaultSelected, o.selected)));
        if (prev && dst.querySelector(`option[value="${prev}"]`)) dst.value = prev;
    }

    function syncDropdowns() {
        function makePoller(getPage, panelId) {
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
                    fresh.value = panelSel.value;
                    fresh.dispatchEvent(new Event('change', {bubbles: true}));
                    if (window.$ && window.$.fn && window.$.fn.select2 && $(fresh).data('select2')) $(fresh).trigger('change');
                };
            };
        }
        const pollSube = makePoller(() => document.getElementById('cmbSubeler'), 'ew-sube');
        const pollDers = makePoller(() => document.getElementById('cmbBeceriler'), 'ew-ders');
        setInterval(() => { pollSube(); pollDers(); }, 1000);
    }

    const resume = async () => { 
        updateStartBtn();
        if (IS_EOKUL_LIST) {
            const pendingData = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
            if (pendingData && pendingData.pending) showLoader('Tablo analiz ediliyor...');
        }
        
        // Hedef sayfada otonom landing (seçim + listeleme + başlama)
        if (IS_TARGET && S.active && (S.autoStartList || S.currentIndex === -1)) {
            showLoader('Sınıf ve ders otomatik seçiliyor...');
            await wait(2000); 
            
            const subeEl = document.getElementById('cmbSubeler');
            const dersEl = document.getElementById('cmbBeceriler');
            
            if (subeEl && S.selectedSube) {
                subeEl.value = S.selectedSube;
                subeEl.dispatchEvent(new Event('change', {bubbles:true}));
                await wait(1200); 
            }
            
            if (dersEl && S.selectedDers) {
                dersEl.value = S.selectedDers;
                dersEl.dispatchEvent(new Event('change', {bubbles:true}));
                await wait(800);
            }
            
            const listBtn = document.querySelector('button.btn-primary.has-ripple') || document.getElementById('btnListele');
            if (listBtn) {
                listBtn.click();
                S.autoStartList = false;
                save();
                msg('📋 Liste yüklendi, otomasyon başlıyor...');
                await wait(2000);
            }
            hideLoader();
        }
        
        if (S.active && !S.paused && S.excelData.length > 0) {
            if (mainTimer) clearTimeout(mainTimer);
            mainTimer = setTimeout(runLoop, 1000);
        }
    };

    // Başlatıcı
    syncDropdowns();
    if (document.readyState === 'complete') resume();
    else window.addEventListener('load', resume);

})();
