/* ═══════════ RENDERING ═══════════ */
'use strict';

const chatMsgs = el('chatMsgs');
const chatWrap = el('chatWrap');

function renderList() {
    const sList = el('sList');
    sList.innerHTML = '';

    let filteredChats = chats;
    if (searchFilter) {
        const q = searchFilter.toLowerCase();
        filteredChats = chats.filter(c =>
            c.title.toLowerCase().includes(q) ||
            c.messages.some(m => m.content && m.content.toLowerCase().includes(q))
        );
    }

    if (!filteredChats.length) {
        sList.innerHTML = `<div class="s-empty">${searchFilter ? 'Nenhum resultado' : 'Nenhum chat ainda'}</div>`;
        return;
    }

    // Pinned first
    const pinned = filteredChats.filter(c => c.pinned);
    const unpinned = filteredChats.filter(c => !c.pinned);

    if (pinned.length) {
        const g = document.createElement('div');
        g.className = 's-group';
        g.textContent = '📌 Fixados';
        sList.appendChild(g);
        for (const c of pinned) renderSidebarItem(c, sList);
    }

    const now = Date.now();
    const groups = { 'Hoje': [], 'Ontem': [], '7 dias': [], '30 dias': [], 'Antigos': [] };

    for (const c of unpinned) {
        const d = now - c.createdAt;
        if (d < 864e5) groups['Hoje'].push(c);
        else if (d < 1728e5) groups['Ontem'].push(c);
        else if (d < 6048e5) groups['7 dias'].push(c);
        else if (d < 2592e6) groups['30 dias'].push(c);
        else groups['Antigos'].push(c);
    }

    for (const [label, items] of Object.entries(groups)) {
        if (!items.length) continue;
        const g = document.createElement('div');
        g.className = 's-group';
        g.textContent = label;
        sList.appendChild(g);
        for (const c of items) renderSidebarItem(c, sList);
    }
}

function renderSidebarItem(c, container) {
    const it = document.createElement('div');
    it.className = 's-item' + (c.id === activeId ? ' act' : '') + (c.pinned ? ' pinned' : '');
    const msgCount = c.messages.length;

    it.innerHTML = `
        <svg class="s-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${c.pinned
            ? '<line x1="12" y1="2" x2="12" y2="14"/><path d="M5 10h14l-1.5 4H6.5z"/><line x1="12" y1="14" x2="12" y2="22"/>'
            : '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'}
        </svg>
        <span class="s-item-text">${esc(c.title)}</span>
        <span class="s-item-count">${msgCount}</span>
        <div class="s-item-btns">
            <button class="s-item-btn pin" title="${c.pinned ? 'Desfixar' : 'Fixar'}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="14"/><path d="M5 10h14l-1.5 4H6.5z"/><line x1="12" y1="14" x2="12" y2="22"/></svg>
            </button>
            <button class="s-item-btn ren" title="Renomear">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
            </button>
            <button class="s-item-btn del" title="Excluir">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
        </div>`;

    it.addEventListener('click', e => { if (e.target.closest('.s-item-btn')) return; switchChat(c.id); });
    it.querySelector('.pin').addEventListener('click', () => pinChat(c.id));
    it.querySelector('.ren').addEventListener('click', () => renChat(c.id));
    it.querySelector('.del').addEventListener('click', () => { if (confirm('Excluir?')) delChat(c.id); });
    container.appendChild(it);
}

function renderMsgs() {
    const c = active();
    if (!c || !c.messages.length) { renderWelcome(); return; }
    chatMsgs.innerHTML = '';
    for (let i = 0; i < c.messages.length; i++) {
        addMsgDOM(c.messages[i], i);
    }
    scrollDown();
}

function renderWelcome() {
    chatMsgs.innerHTML = `
    <div class="welcome">
        <div class="w-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
        </div>
        <h1 class="w-title">Como posso ajudar?</h1>
        <p class="w-sub">Sou o RicinusAI. Pergunte qualquer coisa — código, textos, análises e mais.</p>
        <div class="w-cards">
            <div class="w-card" data-p="Explique como funciona machine learning de forma simples"><div class="w-card-t">🧠 Machine Learning</div><div class="w-card-d">Explicação simples</div></div>
            <div class="w-card" data-p="Escreva uma função JavaScript para ordenar um array de objetos"><div class="w-card-t">💻 Código JS</div><div class="w-card-d">Ordenar array</div></div>
            <div class="w-card" data-p="Quais as melhores práticas de segurança para APIs REST?"><div class="w-card-t">🔒 Segurança API</div><div class="w-card-d">Boas práticas REST</div></div>
            <div class="w-card" data-p="Crie um plano de 30 dias para aprender Python do zero"><div class="w-card-t">📚 Python</div><div class="w-card-d">Plano de estudos</div></div>
        </div>
    </div>`;

    chatMsgs.querySelectorAll('.w-card').forEach(c => {
        c.addEventListener('click', () => {
            el('inp').value = c.dataset.p;
            updBtn();
            send();
        });
    });
}

function addMsgDOM(m, msgIdx) {
    const d = document.createElement('div');
    d.className = 'msg';
    d.dataset.idx = msgIdx;
    const isU = m.role === 'user';
    const c = active();

    // Thinking block
    let thinkHTML = '';
    if (m.thinking) {
        const tid = 't' + Math.random().toString(36).substr(2, 6);
        const dur = m.meta?.dur ? `<span class="think-dur">${m.meta.dur}s</span>` : '';
        thinkHTML = `<div class="think-box"><div class="think-head" data-tid="${tid}"><span class="think-arrow" id="ar_${tid}">▶</span> Pensamento${dur}</div><div class="think-body" id="${tid}">${md(m.thinking)}</div></div>`;
    }

    // Images
    let imagesHTML = '';
    if (m.images && m.images.length > 0) {
        imagesHTML = '<div class="msg-images">';
        for (const img of m.images) {
            if (img.preview) {
                imagesHTML += `<img src="${img.preview}" alt="${esc(img.name || 'image')}" onclick="R.openLightbox(this.src)">`;
            }
        }
        imagesHTML += '</div>';
    }

    // Meta
    let metaHTML = '';
    if (m.meta && !isU) {
        const x = m.meta;
        metaHTML = `<div class="msg-meta">
            ${x.inTok ? `<span class="meta-i">📥 ${x.inTok} in</span>` : ''}
            ${x.outTok ? `<span class="meta-i">📤 ${x.outTok} out</span>` : ''}
            ${x.thinkTok ? `<span class="meta-i">🧠 ${x.thinkTok} think</span>` : ''}
            ${x.dur ? `<span class="meta-i">⏱️ ${x.dur}s</span>` : ''}
            ${x.model ? `<span class="meta-i">🤖 ${x.model}</span>` : ''}
            ${x.keyUsed !== undefined ? `<span class="meta-i">🔑 #${x.keyUsed + 1}</span>` : ''}
        </div>`;
    }

    const wc = wordCount(m.content);
    const wcHTML = `<div class="msg-word-count">${wc} palavra${wc !== 1 ? 's' : ''}</div>`;

    const forkHTML = c && msgIdx !== undefined
        ? `<button class="act-btn" data-fork="${msgIdx}">🔀 Bifurcar</button>` : '';

    d.innerHTML = `
    <div class="msg-av ${isU ? 'u' : 'a'}">
        ${isU ? SVG.userAvatar : SVG.botAvatar}
    </div>
    <div class="msg-body">
        <div class="msg-name">${isU ? 'Você' : 'RicinusAI'}</div>
        ${imagesHTML}
        ${thinkHTML}
        <div class="msg-text">${isU ? esc(m.content) : md(m.content)}</div>
        ${metaHTML}
        ${wcHTML}
        <div class="msg-acts">
            <button class="act-btn btn-copy-msg">📋 Copiar</button>
            ${!isU ? `<button class="act-btn btn-regen-msg">🔄 Regenerar</button>` : ''}
            ${forkHTML}
            ${isU ? `<button class="act-btn btn-edit-msg">✏️ Editar</button>` : ''}
        </div>
    </div>`;

    // Think toggle
    const thinkHead = d.querySelector('.think-head');
    if (thinkHead) {
        thinkHead.addEventListener('click', () => {
            const tid = thinkHead.dataset.tid;
            const body = el(tid);
            const arrow = el('ar_' + tid);
            if (body) body.classList.toggle('open');
            if (arrow) arrow.classList.toggle('open');
        });
    }

    // Copy
    d.querySelector('.btn-copy-msg')?.addEventListener('click', function () {
        navigator.clipboard.writeText(m.content || '').then(() => {
            this.textContent = '✅ Copiado!';
            setTimeout(() => this.textContent = '📋 Copiar', 2000);
        });
    });

    // Regen
    d.querySelector('.btn-regen-msg')?.addEventListener('click', () => regen());

    // Fork
    const forkBtn = d.querySelector('[data-fork]');
    if (forkBtn && c) {
        forkBtn.addEventListener('click', () => forkChat(c.id, parseInt(forkBtn.dataset.fork)));
    }

    // Edit
    const editBtn = d.querySelector('.btn-edit-msg');
    if (editBtn && isU) {
        editBtn.addEventListener('click', () => editMessage(c, msgIdx));
    }

    chatMsgs.appendChild(d);
    return d;
}

function scrollDown() {
    requestAnimationFrame(() => { chatWrap.scrollTop = chatWrap.scrollHeight; });
}
