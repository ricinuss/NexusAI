/* ═══════════ STATE MANAGEMENT ═══════════ */
'use strict';

const DEFAULTS = {
    apiKeys: [''],
    currentKeyIdx: 0,
    systemPrompt: '',
    temperature: 1,
    maxTokens: 8192,
    topP: 0.95,
    model: 'gemini-2.5-flash',
    thinking: true,
    thinkingBudget: 8192,
    streaming: true,
    theme: 'dark'
};

let S = { ...DEFAULTS, apiKeys: [''] };
let chats = [];
let activeId = null;
let generating = false;
let aborter = null;
let pendingImages = [];
let searchFilter = '';

// DOM helpers
const el = id => document.getElementById(id);

function save() {
    try {
        localStorage.setItem('rai_s', JSON.stringify(S));
        localStorage.setItem('rai_c', JSON.stringify(chats));
        localStorage.setItem('rai_a', activeId);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            toast('Armazenamento cheio! Exclua chats antigos.', '⚠️');
        }
    }
}

function load() {
    try {
        const s = localStorage.getItem('rai_s');
        if (s) S = { ...DEFAULTS, ...JSON.parse(s) };
        if (!Array.isArray(S.apiKeys)) S.apiKeys = S.apiKeys ? [S.apiKeys] : [''];

        const c = localStorage.getItem('rai_c');
        if (c) chats = JSON.parse(c);

        const a = localStorage.getItem('rai_a');
        if (a && chats.find(x => x.id === a)) activeId = a;
    } catch (e) {
        console.warn('Failed to load state:', e);
    }
}
