/**
 * e-Okul Gelişim Düzeyi Sihirbazı - Web Versiyonu
 * v3.4
 */

(function() {
    'use strict';

    // State Management
    const state = {
        excelData: [],
        currentIndex: -1,
        isRunning: false,
        isPaused: false,
        mode: 'fill', // 'fill' or 'clear'
        themeRange: '1',
        autoNextClass: true,
        autoConfirm: true,
        totalProcessed: 0,
        totalErrors: 0
    };

    // DOM Elements
    const elements = {
        excelFile: document.getElementById('excelFile'),
        themeRange: document.getElementById('themeRange'),
        autoNextClass: document.getElementById('autoNextClass'),
        autoConfirm: document.getElementById('autoConfirm'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        clearBtn: document.getElementById('clearBtn'),
        studentCount: document.getElementById('studentCount'),
        statusText: document.getElementById('statusText'),
        progressBar: document.getElementById('progressBar'),
        logArea: document.getElementById('logArea'),
        studentListContainer: document.getElementById('studentListContainer'),
        studentTableBody: document.getElementById('studentTableBody'),
        eokulFrame: document.getElementById('eokulFrame'),
        eokulUrl: document.getElementById('eokulUrl')
    };

    // Logging Functions
    function log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        entry.textContent = `[${timestamp}] ${message}`;
        elements.logArea.appendChild(entry);
        elements.logArea.scrollTop = elements.logArea.scrollHeight;
    }

    function updateStatus(text) {
        elements.statusText.textContent = text;
        log(text, 'info');
    }

    function updateProgress() {
        if (state.excelData.length === 0) {
            elements.progressBar.style.width = '0%';
            return;
        }
        const progress = ((state.currentIndex + 1) / state.excelData.length) * 100;
        elements.progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    // Excel Processing
    function parseRange(rangeStr) {
        const indices = new Set();
        const parts = rangeStr.split(',').map(p => p.trim());
        
        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                        indices.add(i - 1);
                    }
                }
            } else {
                const num = parseInt(part);
                if (!isNaN(num)) {
                    indices.add(num - 1);
                }
            }
        });
        
        return Array.from(indices).sort((a, b) => a - b);
    }

    function processExcelFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                log('Excel dosyası okunuyor...', 'info');
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                state.excelData = [];
                
                // İlk satır başlık, 2. satırdan itibaren veri
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row[2]) continue; // C sütunu (öğrenci no) boşsa atla
                    
                    const studentNo = row[2].toString().trim();
                    const scores = [];
                    
                    // E sütunundan (index 4) itibaren puanları al
                    for (let c = 4; c < row.length; c++) {
                        const score = parseFloat(row[c]);
                        scores.push(isNaN(score) ? 0 : score);
                    }
                    
                    if (scores.length === 0) scores.push(0);
                    
                    state.excelData.push({
                        no: studentNo,
                        scores: scores,
                        status: 'pending'
                    });
                }
                
                if (state.excelData.length === 0) {
                    log('Excel dosyasında geçerli öğrenci bulunamadı!', 'error');
                    return;
                }
                
                elements.studentCount.textContent = `📋 ${state.excelData.length} Öğrenci Yüklendi`;
                log(`✅ ${state.excelData.length} öğrenci başarıyla yüklendi`, 'success');
                
                // Butonları aktif et
                elements.startBtn.disabled = false;
                elements.clearBtn.disabled = false;
                
                // Öğrenci listesini göster
                displayStudentList();
                
            } catch (error) {
                log(`❌ Excel okuma hatası: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = function() {
            log('❌ Dosya okuma hatası!', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    }

    function displayStudentList() {
        elements.studentTableBody.innerHTML = '';
        elements.studentListContainer.style.display = 'block';
        
        state.excelData.forEach((student, index) => {
            const row = document.createElement('tr');
            
            const statusClass = {
                'pending': 'status-pending',
                'processing': 'status-processing',
                'completed': 'status-completed',
                'error': 'status-error'
            }[student.status] || 'status-pending';
            
            const statusText = {
                'pending': 'Bekliyor',
                'processing': 'İşleniyor',
                'completed': 'Tamamlandı',
                'error': 'Hata'
            }[student.status] || 'Bekliyor';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${student.no}</strong></td>
                <td>${student.scores.join(', ')}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;
            
            elements.studentTableBody.appendChild(row);
        });
    }

    // Level Calculation
    function calculateLevel(score, allScores) {
        if (allScores.length === 0) return 2;
        
        const min = Math.min(...allScores);
        const max = Math.max(...allScores);
        const range = max - min;
        
        if (range === 0) return 2; // Tüm puanlar aynıysa "Geliştirilmeli"
        
        const normalized = (score - min) / range;
        
        // Puan aralıklarına göre düzey belirleme
        if (normalized >= 0.75) return 4; // Pekiştirilmeli
        if (normalized >= 0.50) return 3; // Yeterli
        if (normalized >= 0.25) return 2; // Geliştirilmeli
        return 1; // Başlangıç
    }

    function addRandomVariation(level) {
        const rand = Math.random();
        
        if (rand < 0.10) { // %10 ihtimalle 2 düzey kaydır
            let newLevel = Math.random() < 0.5 ? level - 2 : level + 2;
            return Math.max(1, Math.min(4, newLevel));
        } else if (rand < 0.35) { // %25 ihtimalle 1 düzey kaydır
            let newLevel = Math.random() < 0.5 ? level - 1 : level + 1;
            return Math.max(1, Math.min(4, newLevel));
        }
        
        return level;
    }

    // Main Processing Logic
    async function processStudents() {
        if (state.excelData.length === 0) {
            log('⚠️ Önce Excel dosyası yükleyin!', 'warning');
            return;
        }
        
        state.isRunning = true;
        state.isPaused = false;
        state.currentIndex = -1;
        state.totalProcessed = 0;
        state.totalErrors = 0;
        
        updateButtonStates();
        log('🚀 İşlem başlatıldı...', 'info');
        
        const themeIndices = parseRange(state.themeRange);
        log(`📝 İşlenecek temalar: ${themeIndices.map(i => i + 1).join(', ')}`, 'info');
        
        // Her öğrenci için işlem yap
        for (let i = 0; i < state.excelData.length; i++) {
            if (!state.isRunning) {
                log('⏹ İşlem durduruldu', 'warning');
                break;
            }
            
            while (state.isPaused) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            state.currentIndex = i;
            const student = state.excelData[i];
            student.status = 'processing';
            
            updateProgress();
            displayStudentList();
            
            log(`🔄 İşleniyor: ${student.no}`, 'info');
            
            try {
                // Her tema için işlem yap
                for (const themeIdx of themeIndices) {
                    const score = student.scores[themeIdx] || student.scores[0] || 0;
                    const allScores = state.excelData.map(s => s.scores[themeIdx] || s.scores[0] || 0);
                    
                    let level = calculateLevel(score, allScores);
                    level = addRandomVariation(level);
                    
                    log(`  Tema ${themeIdx + 1}: Puan=${score}, Düzey=${level}`, 'info');
                    
                    // Simülasyon: Gerçek uygulamada burada e-Okul'a veri gönderilir
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                student.status = 'completed';
                state.totalProcessed++;
                log(`✅ Tamamlandı: ${student.no}`, 'success');
                
            } catch (error) {
                student.status = 'error';
                state.totalErrors++;
                log(`❌ Hata: ${student.no} - ${error.message}`, 'error');
            }
            
            displayStudentList();
        }
        
        state.isRunning = false;
        updateButtonStates();
        updateProgress();
        
        log(`🏁 İşlem tamamlandı! Başarılı: ${state.totalProcessed}, Hata: ${state.totalErrors}`, 'success');
    }

    function updateButtonStates() {
        if (state.isRunning) {
            if (state.isPaused) {
                elements.startBtn.innerHTML = '<span>▶</span><span>DEVAM ET</span>';
                elements.startBtn.className = 'btn btn-warning';
            } else {
                elements.startBtn.innerHTML = '<span>⏸</span><span>DURAKLAT</span>';
                elements.startBtn.className = 'btn btn-secondary';
            }
            elements.pauseBtn.disabled = false;
            elements.clearBtn.disabled = true;
            elements.excelFile.disabled = true;
        } else {
            elements.startBtn.innerHTML = '<span>▶</span><span>BAŞLAT</span>';
            elements.startBtn.className = 'btn';
            elements.startBtn.disabled = state.excelData.length === 0;
            elements.pauseBtn.disabled = true;
            elements.clearBtn.disabled = state.excelData.length === 0;
            elements.excelFile.disabled = false;
        }
    }

    // Event Listeners
    elements.excelFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            processExcelFile(file);
        }
    });

    elements.themeRange.addEventListener('input', function(e) {
        state.themeRange = e.target.value;
    });

    elements.autoNextClass.addEventListener('change', function(e) {
        state.autoNextClass = e.target.checked;
    });

    elements.autoConfirm.addEventListener('change', function(e) {
        state.autoConfirm = e.target.checked;
    });

    elements.startBtn.addEventListener('click', function() {
        if (!state.isRunning) {
            processStudents();
        } else if (state.isPaused) {
            state.isPaused = false;
            updateButtonStates();
            log('▶ İşlem devam ediyor...', 'info');
        } else {
            state.isPaused = true;
            updateButtonStates();
            log('⏸ İşlem duraklatıldı', 'warning');
        }
    });

    elements.pauseBtn.addEventListener('click', function() {
        if (state.isRunning) {
            state.isRunning = false;
            state.isPaused = false;
            updateButtonStates();
            log('⏹ İşlem durduruldu', 'warning');
        }
    });

    elements.clearBtn.addEventListener('click', function() {
        if (confirm('Tüm yüklenen verileri temizlemek istediğinize emin misiniz?')) {
            state.excelData = [];
            state.currentIndex = -1;
            state.totalProcessed = 0;
            state.totalErrors = 0;
            
            elements.studentCount.textContent = '📋 Excel Yüklenmedi';
            elements.studentListContainer.style.display = 'none';
            elements.progressBar.style.width = '0%';
            elements.excelFile.value = '';
            
            updateButtonStates();
            log('🗑 Tüm veriler temizlendi', 'info');
        }
    });

    // e-Okul URL kopyalama
    elements.eokulUrl.addEventListener('click', function() {
        this.select();
        document.execCommand('copy');
        log('📋 URL kopyalandı', 'success');
    });

    // Initialize
    log('✨ e-Okul Sihirbazı Web Versiyonu hazır', 'success');
    log('ℹ️ Bu web versiyonu simülasyon modunda çalışır', 'info');
    log('ℹ️ Gerçek e-Okul entegrasyonu için Android uygulamasını kullanın', 'info');
    updateButtonStates();

})();
