/**
 * e-Okul Gelişim Düzeyi Sihirbazı v3.4 — Web Bookmarklet
 * SheetJS (XLSX) önceden yüklenmiş olmalı
 */
(function () {
    'use strict';

    // e-Okul sayfasında mıyız kontrol et (test için devre dışı)
    const isEokul = window.location.hostname.includes('e-okul.meb.gov.tr');
    const isTest = window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost');
    
    if (!isEokul && !isTest) {
        alert('⚠️ Bu araç sadece e-okul.meb.gov.tr sayfasında çalışır!\n\nTest için: https://arizasahin-a11y.github.io/eokul-wizard/web/test.html');
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
                <div style="font-size:13px;color:#94a3b8;margin-bottom:18px">Devam etmek için lisans anahtarı girin</div>
                
                <button id="ew-lic-wa"
                  style="width:100%;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;
                         border:none;border-radius:10px;padding:16px;font-size:15px;font-weight:700;
                         cursor:pointer;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:10px;
                         touch-action:manipulation;min-height:48px">
                  <span>💬 Sipariş Ver (WhatsApp)</span>
                </button>

                <div style="margin:18px 0;display:flex;align-items:center;gap:12px;color:#475569">
                  <hr style="flex:1;border-color:#334155"><span style="font-size:13px">VEYA</span><hr style="flex:1;border-color:#334155">
                </div>

                <input id="ew-lic-inp" placeholder="XXXX-XXXX-XXXX-XXXX"
                  style="width:100%;background:#0f172a;border:2px solid #475569;color:#f1f5f9;
                         padding:14px;border-radius:10px;font-size:16px;box-sizing:border-box;
                         text-align:center;letter-spacing:2px;margin-bottom:14px;font-family:monospace"
                  inputmode="text">
                <button id="ew-lic-btn"
                  style="width:100%;background:linear-gradient(135deg,#10b981,#059669);color:#fff;
                         border:none;border-radius:10px;padding:16px;font-size:15px;font-weight:700;
                         cursor:pointer;margin-bottom:12px;touch-action:manipulation;min-height:48px">
                  ✅ Aktifleştir
                </button>
                <div id="ew-lic-err" style="color:#ef4444;font-size:13px;min-height:20px;margin-bottom:8px"></div>
                <button id="ew-lic-cancel" style="background:none;border:none;color:#64748b;font-size:14px;cursor:pointer;padding:12px;touch-action:manipulation">Vazgeç</button>
              </div>`;
            document.body.appendChild(ov);

            document.getElementById('ew-lic-wa').onclick = () => {
                const msg = `Merhaba, E-okul Sihirbazı Web versiyonunu almak istiyorum.`;
                window.open(`https://wa.me/905063705528?text=${encodeURIComponent(msg)}`, '_blank');
            };

            document.getElementById('ew-lic-btn').onclick = () => {
                const val = document.getElementById('ew-lic-inp').value.trim();
                if (validateLic(val)) {
                    saveLic(val);
                    ov.style.display = 'none';
                    msg('✅ Lisans aktifleştirildi!');
                } else {
                    document.getElementById('ew-lic-err').textContent = '❌ Geçersiz lisans anahtarı!';
                }
            };
            document.getElementById('ew-lic-cancel').onclick = () => ov.style.display = 'none';
        }
        ov.style.display = 'flex';
    }

    /* ── Yardımcılar ─────────────────────────────────────────── */
    function parseRange(s) {
        const idx = new Set();
        (s || '').split(',').map(p => p.trim()).forEach(p => {
            if (p.includes('-')) {
                const [a, b] = p.split('-').map(Number);
                if (!isNaN(a) && !isNaN(b))
                    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) idx.add(i - 1);
            } else {
                const n = parseInt(p);
                if (!isNaN(n)) idx.add(n - 1);
            }
        });
        return [...idx].sort((a, b) => a - b);
    }

    function getRandLvl(base) {
        const r = Math.random();
        if (r < 0.10) {
            let n = Math.random() < 0.5 ? base - 2 : base + 2;
            if (n < 1) n = 1;
            if (n > 4) n = 4;
            return n;
        } else if (r < 0.35) {
            let n = Math.random() < 0.5 ? base - 1 : base + 1;
            if (n < 1) n = 1;
            if (n > 4) n = 4;
            return n;
        }
        return base;
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
          .ew-sel{width:100%;background:#334155;border:1px solid #475569;color:#f1f5f9;
            padding:12px 10px;border-radius:8px;font-size:16px;margin-bottom:8px;
            -webkit-appearance:none;appearance:none}
          .ew-btn{border:none;border-radius:10px;color:white;font-size:16px;
            font-weight:700;cursor:pointer;padding:16px;touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;min-height:48px}
          .ew-btn:active{transform:scale(0.98)}
          .ew-inp{width:100%;background:#334155;border:1px solid #475569;color:#f1f5f9;
            padding:12px;border-radius:8px;font-size:16px;box-sizing:border-box}
          .ew-lbl{font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;margin-top:10px}
          input[type="file"]{font-size:14px;padding:10px!important}
          input[type="checkbox"]{width:22px!important;height:22px!important;cursor:pointer}
          
          /* Mobil optimizasyonlar */
          @media (max-width: 480px) {
            #ew-fab{width:56px;height:56px;font-size:28px;bottom:16px;right:16px}
            #ew-panel{bottom:80px;right:8px;left:8px;width:auto!important;max-width:none!important}
            #ew-panel > div{width:100%!important;padding:14px!important}
            .ew-btn{font-size:15px;padding:14px}
            .ew-sel,.ew-inp{font-size:16px;padding:12px}
            #ew-help{font-size:12px!important}
          }
          
          /* Yatay mod */
          @media (max-width: 768px) and (orientation: landscape) {
            #ew-panel{max-height:85vh}
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
    const hd = S.excelData.length > 0;

    panel.innerHTML = `
<div style="background:#1e293b;color:#f1f5f9;padding:18px;border-radius:18px;
    box-shadow:0 20px 40px rgba(0,0,0,.65);font-family:'Segoe UI',sans-serif;
    width:100%;max-width:340px;border:1px solid #334155;">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <span style="font-size:16px;font-weight:700">⚡ e-Okul Sihirbazı</span>
    <span style="font-size:10px;color:#7c3aed;font-weight:700;letter-spacing:1px">WEB</span>
    <div style="display:flex;gap:8px">
      <button id="ew-help-btn" title="Yardım" style="background:none;border:1px solid #475569;border-radius:50%;color:#94a3b8;font-size:14px;cursor:pointer;width:32px;height:32px;line-height:1;touch-action:manipulation">?</button>
      <button id="ew-close" style="background:none;border:none;color:#64748b;font-size:28px;cursor:pointer;line-height:1;touch-action:manipulation">×</button>
    </div>
  </div>

  <div id="ew-help" style="display:none;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:14px;margin-bottom:12px;font-size:13px;color:#94a3b8;line-height:1.8">
    <b style="color:#f1f5f9;font-size:14px">📚 Kullanım Kılavuzu</b><br>
    <b style="color:#10b981">1. Excel:</b> C=Öğrenci No, E→…=Tema puanları<br>
    <b style="color:#10b981">2. Şube &amp; Ders seç:</b> Sayfadan seçin.<br>
    <b style="color:#10b981">3. Excel yükle:</b> Dosya seç butonuyla.<br>
    <b style="color:#10b981">4. Tema No:</b> "1" veya "2-4" formatında.<br>
    <b style="color:#10b981">5. BAŞLAT:</b> Sırayla işler &amp; kaydeder.<br>
  </div>

  <div style="background:#0f172a;padding:12px;border-radius:10px;margin-bottom:14px;font-size:13px">
    <div id="ew-info">${hd ? '📋 Kayıtlı: ' + S.excelData.length + ' Öğrenci' : '⚠️ Excel yüklenmedi'}</div>
    <div id="ew-log" style="color:#94a3b8;font-size:12px;margin-top:6px">Bekleniyor… ${isActivated() ? '✅ Lisanslı' : '🔒 Lisans Gerekli'}</div>
  </div>

  <div style="margin-bottom:14px">
    <label class="ew-lbl" style="margin-top:0">
      ${hd ? '📊 Excel Değiştir:' : '📂 Excel Dosyası (.xlsx/.xls):'}
    </label>
    <input type="file" id="ew-file" accept=".xlsx,.xls"
      style="font-size:14px;width:100%;background:#0f172a;border:1px solid #475569;
             color:#f1f5f9;padding:10px;border-radius:8px;box-sizing:border-box;cursor:pointer">
  </div>

  <label class="ew-lbl">Tema No (örn: 1 veya 2-4):</label>
  <input type="text" id="ew-cat" class="ew-inp" value="${S.themeRange}" style="margin-bottom:12px" inputmode="numeric">
  
  <label style="font-size:14px;color:#94a3b8;display:flex;align-items:center;gap:10px;
                cursor:pointer;margin-bottom:10px;padding:8px 0">
    <input type="checkbox" id="ew-auto" ${S.autoNextClass ? 'checked' : ''} style="width:22px;height:22px">
    <span>Şubeyi Otomatik Atla</span>
  </label>
  
  <label style="font-size:14px;color:#94a3b8;display:flex;align-items:center;gap:10px;
                cursor:pointer;margin-bottom:16px;padding:8px 0">
    <input type="checkbox" id="ew-ac" ${S.autoConfirm ? 'checked' : ''} style="width:22px;height:22px">
    <span>Kayıt Onayını Otomatik Onayla</span>
  </label>

  <div style="display:flex;gap:10px;margin-bottom:10px">
    <button id="ew-start" class="ew-btn" ${hd ? '' : 'disabled'}
      style="flex:2;background:${hd ? '#10b981' : '#374151'}">▶ BAŞLAT</button>
    <button id="ew-stop" class="ew-btn" style="flex:1;background:#475569;font-size:24px">⏹</button>
  </div>
  
  <button id="ew-clear" class="ew-btn" ${hd ? '' : 'disabled'}
    style="width:100%;background:${hd ? '#ef4444' : '#374151'};margin-bottom:10px">
    🗑 TEMİZLE</button>

  <div style="text-align:right;margin-top:12px">
    <a href="#" id="ew-reset" style="color:#475569;font-size:12px;text-decoration:none;padding:8px">⟳ Veriyi Sıfırla</a>
    ${isActivated() ? '' : '<br><a href="#" id="ew-lic-show" style="color:#10b981;font-size:12px;text-decoration:none;padding:8px">🔑 Lisans Anahtarı Gir</a>'}
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
    
    // Mobil için tam genişlik
    if (window.innerWidth <= 480) {
        panel.style.left = '8px';
        panel.style.right = '8px';
        panel.style.maxWidth = 'none';
    }
    
    panel.classList.add('ew-hidden'); // Başlangıçta kapalı
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
    if (lsBtn) lsBtn.onclick = (e) => {
        e.preventDefault();
        showLicModal();
    };

    // Excel yükleme
    document.getElementById('ew-file').onchange = function (e) {
        const f = e.target.files[0];
        if (!f) return;
        msg('📂 Excel okunuyor…');
        const r = new FileReader();
        r.onload = evt => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                const data = [];
                for (let i = 1; i < rows.length; i++) {
                    if (!rows[i][2]) continue;
                    const vals = [];
                    for (let c = 4; c < rows[i].length; c++) {
                        const v = parseFloat(rows[i][c]);
                        vals.push(isNaN(v) ? 0 : v);
                    }
                    if (vals.length === 0) vals.push(0);
                    data.push({ no: rows[i][2].toString().trim(), vals });
                }
                S.excelData = data;
                S.currentIndex = -1;
                S.active = false;
                save();
                
                const startEl = document.getElementById('ew-start');
                const clearEl = document.getElementById('ew-clear');
                document.getElementById('ew-info').textContent = '📋 Kayıtlı: ' + data.length + ' Öğrenci';
                if (startEl) {
                    startEl.disabled = false;
                    startEl.style.background = '#10b981';
                }
                if (clearEl) {
                    clearEl.disabled = false;
                    clearEl.style.background = '#ef4444';
                }
                msg('✅ Excel yüklendi: ' + data.length + ' öğrenci');
            } catch (ex) {
                alert('Excel okunamadı: ' + ex.message);
                msg('❌ Excel okuma hatası!');
            }
        };
        r.readAsBinaryString(f);
    };

    // Başlat butonu
    document.getElementById('ew-start').onclick = () => {
        // Lisans kontrolü
        if (!isActivated()) {
            showLicModal();
            return;
        }

        if (S.excelData.length === 0) {
            msg('⚠️ Önce Excel dosyası yükleyin!');
            alert('⚠️ Önce Excel dosyası yükleyin!');
            return;
        }

        msg('🚀 İşlem başlatılıyor...');
        alert('⚠️ Bu web versiyonu simülasyon modunda çalışır.\n\nGerçek e-Okul entegrasyonu için Android uygulamasını kullanın.\n\nŞimdi konsolu açarak işlem simülasyonunu görebilirsiniz (F12).');
        
        // Simülasyon
        S.excelData.forEach((student, idx) => {
            setTimeout(() => {
                msg(`🔄 İşleniyor: ${student.no} (${idx + 1}/${S.excelData.length})`);
            }, idx * 500);
        });

        setTimeout(() => {
            msg('✅ Simülasyon tamamlandı! Android uygulamasında gerçek işlem yapılır.');
        }, S.excelData.length * 500 + 500);
    };

    // Durdur butonu
    document.getElementById('ew-stop').onclick = () => {
        S.active = false;
        S.paused = false;
        save();
        msg('⏹ Durduruldu.');
    };

    // Temizle butonu
    document.getElementById('ew-clear').onclick = () => {
        if (!isActivated()) {
            showLicModal();
            return;
        }
        
        if (confirm('Yüklenen Excel verisini temizlemek istediğinize emin misiniz?')) {
            S.excelData = [];
            S.currentIndex = -1;
            save();
            
            document.getElementById('ew-info').textContent = '⚠️ Excel yüklenmedi';
            document.getElementById('ew-start').disabled = true;
            document.getElementById('ew-start').style.background = '#374151';
            document.getElementById('ew-clear').disabled = true;
            document.getElementById('ew-clear').style.background = '#374151';
            document.getElementById('ew-file').value = '';
            
            msg('🗑 Veriler temizlendi');
        }
    };

    // Ayarlar
    document.getElementById('ew-cat').oninput = e => {
        S.themeRange = e.target.value;
        save();
    };
    document.getElementById('ew-auto').onchange = e => {
        S.autoNextClass = e.target.checked;
        save();
    };
    document.getElementById('ew-ac').onchange = e => {
        S.autoConfirm = e.target.checked;
        save();
    };

    document.getElementById('ew-reset').onclick = e => {
        e.preventDefault();
        if (confirm('Tüm ayarlar ve veriler sıfırlanacak. Emin misiniz?')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };

    // Başlangıç mesajı
    msg('✨ e-Okul Sihirbazı hazır! ⚡ ikona tıklayın.');
    console.log('%c⚡ e-Okul Sihirbazı v3.4 yüklendi!', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('%cSağ alttaki ⚡ ikona tıklayarak paneli açabilirsiniz.', 'color: #94a3b8; font-size: 12px;');

})();
