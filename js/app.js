/* ═══════════ APP INITIALIZATION ═══════════ */
'use strict';

(function init() {
    load();
    document.documentElement.setAttribute('data-theme', S.theme);
    el('selModel').value = S.model;
    updBadge();
    renderList();
    renderMsgs();
    initScrollWatcher();
    if (window.innerWidth <= 768) sidebar.classList.add('hide');
    el('inp').focus();

    console.log('%c⚡ RicinusAI v2.0 inicializado!', 'color:#8b5cf6;font-weight:bold;font-size:14px');
})();

// ═══════════ EVENT BINDINGS ═══════════

// Input
const inp = el('inp');

inp.addEventListener('input', () => {
    inp.style.height = 'auto';
    inp.style.height = Math.min(inp.scrollHeight, 180) + 'px';
    updBtn();
    updCharCount();
});

inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (generating) stopGen();
        else send();
    }
});

// Send button - single handler, no onclick conflict
btnSend.addEventListener('click', e => {
    e.preventDefault();
    if (generating) stopGen();
    else send();
});

// Sidebar
el('btnNew').addEventListener('click', () => newChat());
el('btnMenu').addEventListener('click', toggleSidebar);
sOverlay.addEventListener('click', closeMobile);

// Model selector
el('selModel').addEventListener('change', () => {
    S.model = el('selModel').value;
    save();
});

// Settings
el('btnOpenSet').addEventListener('click', openSet);
el('btnClsSet').addEventListener('click', closeSet);
el('btnCancel').addEventListener('click', closeSet);
el('btnSave').addEventListener('click', saveSet);
el('btnReset').addEventListener('click', resetSet);
setModal.addEventListener('click', e => { if (e.target === setModal) closeSet(); });

// Sliders
el('tempSl').addEventListener('input', function () { el('tempV').textContent = parseFloat(this.value).toFixed(1); });
el('tokSl').addEventListener('input', function () { el('tokV').textContent = this.value; });
el('topSl').addEventListener('input', function () { el('topV').textContent = parseFloat(this.value).toFixed(2); });
el('thinkTog').addEventListener('change', function () { el('thinkBudgetGrp').style.display = this.checked ? 'flex' : 'none'; });
el('thinkSl').addEventListener('input', function () { el('thinkV').textContent = this.value; });

// API keys
el('btnAddKey').addEventListener('click', () => {
    if (S.apiKeys.length >= 10) { toast('Máximo 10 chaves', '⚠️'); return; }
    S.apiKeys.push('');
    renderKeysList();
});

// Import/Export
el('btnExport').addEventListener('click', exportChats);
el('btnImport').addEventListener('click', importChats);
el('btnClear').addEventListener('click', clearAll);

// Scroll to bottom
btnScrollBottom.addEventListener('click', () => scrollDown());

// Search
el('searchChats').addEventListener('input', e => {
    searchFilter = e.target.value.trim();
    renderList();
});

// Themes
document.querySelectorAll('.theme-opt').forEach(t => {
    t.addEventListener('click', () => setTheme(t.dataset.theme));
});

// File attachment
el('btnAttach').addEventListener('click', () => el('fileInput').click());
el('fileInput').addEventListener('change', e => {
    handleFiles(e.target.files);
    e.target.value = '';
});

// Drag & Drop
document.addEventListener('dragover', e => {
    e.preventDefault();
    el('dropOverlay').classList.add('show');
});

document.addEventListener('dragleave', e => {
    if (e.relatedTarget === null) el('dropOverlay').classList.remove('show');
});

document.addEventListener('drop', e => {
    e.preventDefault();
    el('dropOverlay').classList.remove('show');
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
});

// Lightbox
el('lightbox').addEventListener('click', () => {
    el('lightbox').classList.remove('show');
    el('lbImg').src = '';
});

// Paste images
inp.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
        }
    }
    if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'N') { e.preventDefault(); newChat(); }
    if (e.ctrlKey && e.key === '/') { e.preventDefault(); toggleSidebar(); }
    if (e.key === 'Escape') {
        if (el('lightbox').classList.contains('show')) {
            el('lightbox').classList.remove('show');
            el('lbImg').src = '';
        } else {
            closeSet();
        }
    }
});
