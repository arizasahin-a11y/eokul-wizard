// Background service worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('⚡ e-Okul Sihirbazı yüklendi!');
    
    // Varsayılan ayarları kaydet
    chrome.storage.local.set({
        settings: {
            autoNextClass: true,
            autoConfirm: true,
            themeRange: '1'
        }
    });
});

// Extension icon'a tıklandığında
chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.includes('e-okul.meb.gov.tr')) {
        // e-Okul sayfasındaysa sihirbazı aktifleştir
        chrome.tabs.sendMessage(tab.id, { action: 'activate' });
    } else {
        // Değilse e-Okul'a yönlendir
        chrome.tabs.create({ url: 'https://e-okul.meb.gov.tr' });
    }
});

// Tab güncellendiğinde kontrol et
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('e-okul.meb.gov.tr')) {
        // e-Okul sayfası yüklendiğinde badge göster
        chrome.action.setBadgeText({ text: '⚡', tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId: tabId });
    }
});
