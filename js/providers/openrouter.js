/**
 * OpenRouter — official Chat Completions API
 * POST https://openrouter.ai/api/v1/chat/completions
 */
(function (global) {
    'use strict';

    const S = global.CipherProvidersShared;

    const MODELS = [
        'openai/gpt-4o-mini',
        'openai/gpt-4o',
        'anthropic/claude-3.5-sonnet',
        'google/gemini-2.0-flash-001',
        'deepseek/deepseek-chat'
    ];

    async function send(apiKey, model, messages) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey,
                'HTTP-Referer': window.location.origin || 'https://cipher-ai.local',
                'X-OpenRouter-Title': 'Cipher Ai'
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
        if (!text) throw new Error('Empty response from OpenRouter');
        return text;
    }

    global.CipherProviderOpenRouter = {
        id: 'openrouter',
        label: 'OpenRouter',
        models: MODELS,
        priority: 0,
        matchKey: function (key) { return key.startsWith('sk-or-'); },
        send: send
    };
})(typeof window !== 'undefined' ? window : global);
