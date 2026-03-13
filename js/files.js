/* ═══════════ FILES, IMAGES, IMPORT/EXPORT ═══════════ */
'use strict';

function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 20 * 1024 * 1024) {
            reject(new Error('Imagem muito grande (máx 20MB)'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
                mimeType: file.type,
                data: base64,
                name: file.name,
                size: file.size,
                preview: reader.result
            });
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

function renderAttachPreview() {
    const preview = el('attachPreview');
    if (pendingImages.length === 0) {
        preview.style.display = 'none';
        preview.innerHTML = '';
        return;
    }
    preview.style.display = 'flex';
    preview.innerHTML = '';

    pendingImages.forEach((img, i) => {
        const item = document.createElement('div');
        item.className = 'attach-item';
        const sizeKB = Math.round(img.size / 1024);
        item.innerHTML = `📷 ${esc(img.name)} (${sizeKB}KB) <button class="attach-rm" data-idx="${i}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>`;
        item.querySelector('.attach-rm').addEventListener('click', () => {
            pendingImages.splice(i, 1);
            renderAttachPreview();
            updBtn();
        });
        preview.appendChild(item);
    });
    updBtn();
}

async function handleFiles(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            toast('Apenas imagens são suportadas', '⚠️');
            continue;
        }
        if (pendingImages.length >= 5) {
            toast('Máximo 5 imagens por mensagem', '⚠️');
            break;
        }
        try {
            const imgData = await imageToBase64(file);
            pendingImages.push(imgData);
        } catch (e) {
            toast(e.message, '❌');
        }
    }
    renderAttachPreview();
}

function exportChats() {
    if (!chats.length) { toast('Nada para exportar', '⚠️'); return; }

    const exportData = {
        app: 'RicinusAI',
        version: 2,
        exported: new Date().toISOString(),
        chats: chats.map(c => ({
            ...c,
            messages: c.messages.map(m => {
                const clean = { ...m };
                if (clean.images) {
                    clean.images = clean.images.map(img => ({
                        name: img.name,
                        mimeType: img.mimeType,
                        size: img.size
                    }));
                }
                return clean;
            })
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ricinusai_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Exportado!', '✅');
}

function importChats() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.chats || !Array.isArray(data.chats)) {
                throw new Error('Formato inválido');
            }
            const count = data.chats.length;
            if (!confirm(`Importar ${count} chat${count > 1 ? 's' : ''}?`)) return;

            const existingIds = new Set(chats.map(c => c.id));
            let imported = 0;
            for (const c of data.chats) {
                if (existingIds.has(c.id)) c.id = uid();
                chats.push(c);
                imported++;
            }

            save();
            renderList();
            renderMsgs();
            toast(`${imported} chat${imported > 1 ? 's' : ''} importado${imported > 1 ? 's' : ''}!`, '✅');
        } catch (e) {
            toast('Erro ao importar: ' + e.message, '❌');
        }
    });
    input.click();
}

function clearAll() {
    if (confirm('Excluir TODOS os chats?')) {
        chats = [];
        activeId = null;
        save();
        renderList();
        renderMsgs();
        toast('Tudo limpo', '🗑️');
    }
}
