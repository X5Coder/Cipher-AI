/**
 * DeepSeek — official Chat Completions API
 * POST https://api.deepseek.com/chat/completions
 */
(function (global) {
    'use strict';

    const S = global.CipherProvidersShared;

    const MODELS = [
        'deepseek-chat',
        'deepseek-reasoner'
    ];

    async function send(apiKey, model, messages) {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096,
                stream: false
            })
        });
        if (!response.ok) throw new Error(await S.parseErrorResponse(response));
        const data = await response.json();
        const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!text) throw new Error('Empty response from DeepSeek');
        return text;
    }

    global.CipherProviderDeepSeek = {
        id: 'deepseek',
        label: 'DeepSeek',
        models: MODELS,
        priority: 3,
        matchKey: function (key) {
            var k = (key || '').trim();
            return k.startsWith('sk-') && !k.startsWith('sk-ant-') && !k.startsWith('sk-or-');
        },
        send: send
    };
})(typeof window !== 'undefined' ? window : global);
