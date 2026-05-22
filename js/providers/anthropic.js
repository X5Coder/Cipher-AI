/**
 * Anthropic (Claude) — official Messages API
 * POST https://api.anthropic.com/v1/messages
 */
(function (global) {
    'use strict';

    const S = global.CipherProvidersShared;

    const MODELS = [
        'claude-3-5-haiku-latest',
        'claude-3-5-sonnet-latest',
        'claude-3-opus-20240229'
    ];

    async function send(apiKey, model, messages) {
        const systemParts = messages.filter(function (m) { return m.role === 'system'; });
        const chatMessages = messages
            .filter(function (m) { return m.role !== 'system'; })
            .map(function (m) {
                return {
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                };
            });

        const body = {
            model: model,
            max_tokens: 4096,
            messages: chatMessages
        };
        if (systemParts.length) {
            body.system = systemParts.map(function (m) { return m.content; }).join('\n\n');
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(await S.parseErrorResponse(response));
        const data = await response.json();
        let text = null;
        if (data.content && data.content.length) {
            for (let i = 0; i < data.content.length; i++) {
                if (data.content[i].type === 'text' && data.content[i].text) {
                    text = data.content[i].text;
                    break;
                }
            }
        }
        if (!text) throw new Error('Empty response from Anthropic');
        return text;
    }

    global.CipherProviderAnthropic = {
        id: 'anthropic',
        label: 'Claude (Anthropic)',
        models: MODELS,
        priority: 2,
        matchKey: function (key) { return key.startsWith('sk-ant-'); },
        send: send
    };
})(typeof window !== 'undefined' ? window : global);
