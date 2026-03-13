/* ═══════════ API CALLS ═══════════ */
'use strict';

function getValidKeys() {
    return S.apiKeys.filter(k => k && k.trim().length >= 30);
}

function buildBody(messages) {
    const contents = [];

    const body = {
        contents,
        generationConfig: {
            temperature: S.temperature,
            maxOutputTokens: S.maxTokens,
            topP: S.topP
        }
    };

    // Native system instruction
    if (S.systemPrompt && S.systemPrompt.trim()) {
        body.systemInstruction = {
            parts: [{ text: S.systemPrompt }]
        };
    }

    for (const m of messages) {
        const parts = [];
        if (m.content) parts.push({ text: m.content });
        if (m.images && m.images.length > 0) {
            for (const img of m.images) {
                if (img.data) {
                    parts.push({
                        inlineData: {
                            mimeType: img.mimeType,
                            data: img.data
                        }
                    });
                }
            }
        }
        contents.push({ role: m.role === 'user' ? 'user' : 'model', parts });
    }

    if (S.thinking && S.model.includes('2.5')) {
        body.generationConfig.thinkingConfig = { thinkingBudget: S.thinkingBudget };
    }

    return body;
}

async function callAPI(messages) {
    const validKeys = getValidKeys();
    if (validKeys.length === 0) throw new Error('Nenhuma chave API válida configurada');

    const body = buildBody(messages);
    const startIdx = S.currentKeyIdx % validKeys.length;
    let tried = 0;

    while (tried < validKeys.length) {
        const keyIdx = (startIdx + tried) % validKeys.length;
        const key = validKeys[keyIdx];
        const stream = S.streaming;
        const action = stream ? 'streamGenerateContent' : 'generateContent';
        const extra = stream ? '&alt=sse' : '';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${S.model}:${action}?key=${key}${extra}`;

        aborter = new AbortController();

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: aborter.signal
            });

            if (res.ok) {
                S.currentKeyIdx = keyIdx;
                save();
                if (stream) return { stream: res.body, isStream: true, keyUsed: keyIdx };
                const data = await res.json();
                return { data, isStream: false, keyUsed: keyIdx };
            }

            const err = await res.json().catch(() => ({}));
            const errMsg = err.error?.message || '';
            console.warn(`Key #${keyIdx + 1} failed (${res.status}): ${errMsg}`);

            if (res.status === 429 || res.status === 403 ||
                errMsg.toLowerCase().includes('quota') ||
                errMsg.toLowerCase().includes('rate')) {
                toast(`Chave #${keyIdx + 1} sem quota, tentando próxima...`, '🔄');
                tried++;
                continue;
            }

            throw new Error(errMsg || `Erro HTTP ${res.status}`);
        } catch (e) {
            if (e.name === 'AbortError') throw e;
            if (tried < validKeys.length - 1) {
                tried++;
                continue;
            }
            throw e;
        }
    }

    throw new Error('Todas as chaves API falharam.');
}

async function* parseSSE(stream) {
    const reader = stream.getReader();
    const dec = new TextDecoder();
    let buf = '';
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
                const t = line.trim();
                if (t.startsWith('data: ')) {
                    const j = t.slice(6);
                    if (j === '[DONE]') return;
                    try { yield JSON.parse(j); } catch (e) { }
                }
            }
        }
        // Process remaining buffer
        if (buf.trim()) {
            const t = buf.trim();
            if (t.startsWith('data: ')) {
                const j = t.slice(6);
                if (j !== '[DONE]') {
                    try { yield JSON.parse(j); } catch (e) { }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}
