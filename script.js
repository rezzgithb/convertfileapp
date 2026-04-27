/* ============================================
   FileTools — Script Utama
   Semua logika berjalan di frontend
   ============================================ */
document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Toast ---------- */
    var toastBox = document.getElementById('toastBox');
    function showToast(msg, type) {
        if (!toastBox) return;
        type = type || 'info';
        var icons = { error: 'fa-circle-xmark', success: 'fa-circle-check', info: 'fa-circle-info' };
        var t = document.createElement('div');
        t.className = 'toast t-' + type;
        t.innerHTML = '<i class="fa-solid ' + icons[type] + '"></i><span>' + msg + '</span>';
        toastBox.appendChild(t);
        setTimeout(function () {
            t.classList.add('out');
            setTimeout(function () { t.remove(); }, 300);
        }, 3200);
    }

    /* ---------- Hamburger Menu ---------- */
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    var mobileOverlay = document.getElementById('mobileOverlay');

    function openMenu() {
        hamburger.classList.add('open');
        mobileMenu.classList.add('show');
        if (mobileOverlay) mobileOverlay.classList.add('show');
    }
    function closeMenu() {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('show');
        if (mobileOverlay) mobileOverlay.classList.remove('show');
    }
    if (hamburger) {
        hamburger.addEventListener('click', function () {
            if (mobileMenu.classList.contains('show')) closeMenu();
            else openMenu();
        });
    }
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMenu);
    }
    /* Tutup menu saat klik link mobile */
    if (mobileMenu) {
        mobileMenu.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });
    }
    /* ---------- TOOLS PAGE ---------- */
    var uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return; // Bukan halaman tools, stop di sini

    var fileInput = document.getElementById('fileInput');
    var fileInfo = document.getElementById('fileInfo');
    var fiName = document.getElementById('fiName');
    var fiSize = document.getElementById('fiSize');
    var fiRemove = document.getElementById('fiRemove');
    var upIcon = uploadZone.querySelector('.up-icon');
    var upTitle = uploadZone.querySelector('h3');
    var upHint = uploadZone.querySelector('.up-hint');
    var btnConvert = document.getElementById('btnConvert');
    var btnSplit = document.getElementById('btnSplit');
    var progressWrap = document.getElementById('progressWrap');
    var progressFill = document.getElementById('progressFill');
    var progressPct = document.getElementById('progressPct');
    var progressLabel = document.getElementById('progressLabel');
    var resultWrap = document.getElementById('resultWrap');
    var rsTotal = document.getElementById('rsTotal');
    var rsFiles = document.getElementById('rsFiles');
    var resultTitle = document.getElementById('resultTitle');
    var btnDownload = document.getElementById('btnDownload');

    var currentFile = null;
    var resultBlob = null;
    var resultFileName = '';

    /* Format ukuran file */
    function fmtSize(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }
    /* Cek library tersedia */
    function checkLibs() {
        if (typeof XLSX === 'undefined') {
            showToast('Library XLSX belum dimuat. Pastikan koneksi internet untuk pertama kali.', 'error');
            return false;
        }
        if (typeof JSZip === 'undefined') {
            showToast('Library JSZip belum dimuat. Pastikan koneksi internet untuk pertama kali.', 'error');
            return false;
        }
        return true;
    }

    /* --- Upload Zone Events --- */
    uploadZone.addEventListener('click', function () { fileInput.click(); });
    uploadZone.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    uploadZone.addEventListener('dragover', function (e) {
        e.preventDefault(); uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', function (e) {
        e.preventDefault(); uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', function (e) {
        e.preventDefault(); uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function () {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });
    fiRemove.addEventListener('click', function (e) {
        e.stopPropagation(); clearFile();
    });
/* --- Handle File Select --- */
    function handleFile(file) {
        var name = file.name.toLowerCase();
        if (!name.endsWith('.xlsx') && !name.endsWith('.txt')) {
            showToast('Format tidak didukung. Hanya .xlsx dan .txt', 'error');
            return;
        }
        currentFile = file;
        fiName.textContent = file.name;
        fiSize.textContent = fmtSize(file.size);
        fileInfo.classList.add('show');
        uploadZone.classList.add('has-file');
        upIcon.innerHTML = '<i class="fa-solid fa-file-circle-check"></i>';
        upTitle.textContent = 'File siap diproses';
        upHint.textContent = 'Pilih aksi di bawah';

        /* Aktifkan tombol sesuai format */
        if (name.endsWith('.xlsx')) {
            btnConvert.classList.remove('disabled');
            btnSplit.classList.remove('disabled');
        } else {
            btnConvert.classList.add('disabled');
            btnSplit.classList.remove('disabled');
        }
        resultWrap.classList.remove('show');
        progressWrap.classList.remove('show');
        resultBlob = null;
    }
function clearFile() {
        currentFile = null;
        fileInput.value = '';
        fileInfo.classList.remove('show');
        uploadZone.classList.remove('has-file');
        upIcon.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i>';
        upTitle.textContent = 'Seret file ke sini';
        upHint.textContent = 'atau tap untuk memilih file';
        btnConvert.classList.add('disabled');
        btnSplit.classList.add('disabled');
        resultWrap.classList.remove('show');
        progressWrap.classList.remove('show');
        resultBlob = null;
    }

    /* --- Progress UI --- */
    function showProgress(label) {
        progressWrap.classList.add('show');
        resultWrap.classList.remove('show');
        progressLabel.textContent = label || 'Memproses...';
        progressFill.style.width = '0%';
        progressPct.textContent = '0%';
    }
    function setProgress(pct, label) {
        pct = Math.min(100, Math.max(0, Math.round(pct)));
        progressFill.style.width = pct + '%';
        progressPct.textContent = pct + '%';
        if (label) progressLabel.textContent = label;
    }
    function hideProgress() { progressWrap.classList.remove('show'); }
/* --- Result UI --- */
    function showResult(total, files, title) {
        rsTotal.textContent = total.toLocaleString('id-ID');
        rsFiles.textContent = files;
        resultTitle.textContent = title;
        resultWrap.classList.add('show');
    }

    /* --- Download --- */
    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 200);
    }

    btnDownload.addEventListener('click', function () {
        if (!resultBlob) return;
        downloadBlob(resultBlob, resultFileName);
        showToast('Download dimulai...', 'success');
    });
    /* =============================================
       CONVERT: XLSX → TXT
       ============================================= */
    btnConvert.addEventListener('click', function () {
        if (btnConvert.classList.contains('disabled') || !currentFile) return;
        if (!checkLibs()) return;
        doConvert();
    });

    function doConvert() {
        var file = currentFile;
        showProgress('Membaca file Excel...');
        setProgress(10);

        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                setProgress(30);
                var data = new Uint8Array(e.target.result);
                var wb = XLSX.read(data, { type: 'array' });
                var ws = wb.Sheets[wb.SheetNames[0]];
                var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                setProgress(50);

                /* Baca kolom pertama saja */
                var lines = [];
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i] && rows[i].length > 0) {
                        var val = String(rows[i][0]).trim();
                        if (val !== '') lines.push(val);
                    }
                }
                setProgress(75);
                if (lines.length === 0) {
                    hideProgress();
                    showToast('File Excel tidak mengandung data di kolom pertama', 'error');
                    return;
                }

                var text = lines.join('\n');
                var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                setProgress(95);

                var baseName = file.name.replace(/\.[^.]+$/, '');
                resultBlob = blob;
                resultFileName = baseName + '.txt';

                setTimeout(function () {
                    setProgress(100);
                    hideProgress();
                    showResult(lines.length, 1, 'Convert Berhasil!');
                    showToast(lines.length + ' data berhasil dikonversi', 'success');
                }, 250);

            } catch (err) {
                hideProgress();
                showToast('Gagal membaca file: ' + err.message, 'error');
            }
        };
        reader.onerror = function () {
            hideProgress();
            showToast('Gagal membaca file', 'error');
        };
        reader.readAsArrayBuffer(file);
    }
    /* =============================================
       PECAH FILE: XLSX/TXT → ZIP (per 1000 baris)
       ============================================= */
    btnSplit.addEventListener('click', function () {
        if (btnSplit.classList.contains('disabled') || !currentFile) return;
        if (!checkLibs()) return;
        doSplit();
    });

    function doSplit() {
        var file = currentFile;
        var name = file.name.toLowerCase();
        showProgress('Membaca data...');
        setProgress(5);

        if (name.endsWith('.xlsx')) {
            readXlsxSplit(file);
        } else {
            readTxtSplit(file);
        }
    }
    function readXlsxSplit(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                setProgress(20);
                var data = new Uint8Array(e.target.result);
                var wb = XLSX.read(data, { type: 'array' });
                var ws = wb.Sheets[wb.SheetNames[0]];
                var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                setProgress(40);

                var lines = [];
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i] && rows[i].length > 0) {
                        var val = String(rows[i][0]).trim();
                        if (val !== '') lines.push(val);
                    }
                }
                setProgress(50);
                buildZip(lines, file.name);
            } catch (err) {
                hideProgress();
                showToast('Gagal membaca Excel: ' + err.message, 'error');
            }
        };
        reader.onerror = function () { hideProgress(); showToast('Gagal membaca file', 'error'); };
        reader.readAsArrayBuffer(file);
    }
function readTxtSplit(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                setProgress(30);
                var text = e.target.result;
                var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
                setProgress(50);
                buildZip(lines, file.name);
            } catch (err) {
                hideProgress();
                showToast('Gagal membaca TXT: ' + err.message, 'error');
            }
        };
        reader.onerror = function () { hideProgress(); showToast('Gagal membaca file', 'error'); };
        reader.readAsText(file);
    }

    function buildZip(lines, originalName) {
        if (lines.length === 0) {
            hideProgress();
            showToast('File tidak mengandung data', 'error');
            return;
        }

        var perFile = 1000;
        var totalFiles = Math.ceil(lines.length / perFile);
        var baseName = originalName.replace(/\.[^.]+$/, '');

        showProgress('Membuat ' + totalFiles + ' file...');
        setProgress(55);
        var zip = new JSZip();
        for (var i = 0; i < totalFiles; i++) {
            var start = i * perFile;
            var end = Math.min(start + perFile, lines.length);
            var chunk = lines.slice(start, end).join('\n');
            zip.file(baseName + '_' + (i + 1) + '.txt', chunk);
            setProgress(55 + Math.round((i / totalFiles) * 30), 'Membuat file ' + (i + 1) + '/' + totalFiles + '...');
        }

        setProgress(90, 'Mengompres ke ZIP...');

        zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
            .then(function (blob) {
                setProgress(100);
                resultBlob = blob;
                resultFileName = baseName + '_split.zip';

                setTimeout(function () {
                    hideProgress();
                    showResult(lines.length, totalFiles, 'Pecah File Berhasil!');
                    showToast(totalFiles + ' file berhasil dibuat dalam ZIP', 'success');
                }, 250);
            })
            .catch(function (err) {
                hideProgress();
                showToast('Gagal membuat ZIP: ' + err.message, 'error');
            });
    }

});