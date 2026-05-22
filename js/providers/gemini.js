/**
 * Google Gemini — official generateContent API
 * POST generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */
(function (global) {
    'use strict';

    const S = global.CipherProvidersShared;

    const MODELS = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash-lite'
    ];

    async function send(apiKey, model, messages) {
        const systemMessages = messages.filter(function (m) { return m.role === 'system'; });
        const otherMessages = messages.filter(function (m) { return m.role !== 'system'; });
        const contents = otherMessages.map(function (m) {
            return {
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            };
        });

        const body = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096
            }
        };
        if (systemMessages.length) {
            body.systemInstruction = {
                parts: [{ text: systemMessages.map(function (m) { return m.content; }).join('\n') }]
            };
        }

        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
            encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(await S.parseErrorResponse(response));
        const data = await response.json();
        const text = data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text;
        if (!text) throw new Error('Empty response from Gemini');
        return text;
    }

    global.CipherProviderGemini = {
        id: 'gemini',
        label: 'Gemini (Google)',
        models: MODELS,
        priority: 4,
        matchKey: function (key) { return key.startsWith('AIza'); },
        send: send
    };
})(typeof window !== 'undefined' ? window : global);
