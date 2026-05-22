/**
 * OpenAI (ChatGPT) — official APIs
 * POST /v1/responses (primary) + POST /v1/chat/completions (fallback)
 */
(function (global) {
    'use strict';

    const S = global.CipherProvidersShared;

    const MODELS = [
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-3.5-turbo'
    ];

    function buildInput(messages) {
        const system = messages.filter(function (m) { return m.role === 'system'; });
        const rest = messages.filter(function (m) { return m.role !== 'system'; });
        const parts = [];
        if (system.length) {
            parts.push('System:\n' + system.map(function (m) { return m.content; }).join('\n'));
        }
        rest.forEach(function (m) {
            parts.push(m.role + ':\n' + m.content);
        });
        return parts.join('\n\n');
    }

    function extractResponses(data) {
        if (data.output_text) return data.output_text;
        const out = data.output;
        if (Array.isArray(out)) {
            for (let i = 0; i < out.length; i++) {
                const item = out[i];
                if (item.type === 'message' && item.content) {
                    for (let j = 0; j < item.content.length; j++) {
                        if (item.content[j].text) return item.content[j].text;
                    }
                }
            }
        }
        return null;
    }

    async function sendResponses(apiKey, model, messages) {
        const body = {
            model: model,
            input: buildInput(messages)
        };
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(await S.parseErrorResponse(response));
        const data = await response.json();
        const text = extractResponses(data);
        if (!text) throw new Error('Empty response from OpenAI Responses API');
        return text;
    }

    async function sendChatCompletions(apiKey, model, messages) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096
            })
        });
        if (!response.ok) throw new Error(await S.parseErrorResponse(response));
        const data = await response.json();
        const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!text) throw new Error('Empty response from OpenAI Chat Completions');
        return text;
    }

    async function send(apiKey, model, messages) {
        try {
            return await sendChatCompletions(apiKey, model, messages);
        } catch (e1) {
            return await sendResponses(apiKey, model, messages);
        }
    }

    global.CipherProviderOpenAI = {
        id: 'openai',
        label: 'ChatGPT (OpenAI)',
        models: MODELS,
        priority: 1,
        matchKey: function (key) {
            return key.startsWith('sk-') && !key.startsWith('sk-ant-') && !key.startsWith('sk-or-');
        },
        send: send
    };
})(typeof window !== 'undefined' ? window : global);
