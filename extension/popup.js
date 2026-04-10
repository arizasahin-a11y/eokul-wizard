// Popup script
document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const activateBtn = document.getElementById('activateBtn');
    const helpBtn = document.getElementById('helpBtn');

    // Mevcut tab'ı kontrol et
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url && tab.url.includes('e-okul.meb.gov.tr')) {
        statusDiv.className = 'status active';
        statusDiv.innerHTML = `
            <div class="status-icon">✅</div>
            <div class="status-text">e-Okul sayfası tespit edildi</div>
        `;
        activateBtn.textContent = '⚡ Sihirbazı Başlat';
    } else {
        statusDiv.className = 'status inactive';
        statusDiv.innerHTML = `
            <div class="status-icon">⚠️</div>
            <div class="status-text">e-Okul sayfasında değilsiniz</div>
        `;
        activateBtn.textContent = '🌐 e-Okul\'a Git';
    }

    // Aktifleştir butonu
    activateBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url && tab.url.includes('e-okul.meb.gov.tr')) {
            // Sihirbazı aktifleştir
            chrome.tabs.sendMessage(tab.id, { action: 'activate' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Hata:', chrome.runtime.lastError);
                    alert('⚠️ Sayfa yenilenmeli. Sayfayı yenileyip tekrar deneyin.');
                } else {
                    window.close();
                }
            });
        } else {
            // e-Okul'a git
            chrome.tabs.create({ url: 'https://e-okul.meb.gov.tr' });
            window.close();
        }
    });

    // Yardım butonu
    helpBtn.addEventListener('click', () => {
        chrome.tabs.create({ 
            url: 'https://arizasahin-a11y.github.io/eokul-wizard/web/KULLANIM.md' 
        });
        window.close();
    });
});
