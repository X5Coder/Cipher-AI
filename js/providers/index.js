/**
 * Cipher Ai — provider router (real API probes, official endpoints)
 */
(function (global) {
    'use strict';

    const S = global.CipherProvidersShared;

    const PROVIDERS = [
        global.CipherProviderOpenRouter,
        global.CipherProviderOpenAI,
        global.CipherProviderAnthropic,
        global.CipherProviderDeepSeek,
        global.CipherProviderGemini
    ].filter(Boolean);

    const PROVIDER_META = {};
    PROVIDERS.forEach(function (p) {
        PROVIDER_META[p.id] = { label: p.label, order: p.priority };
    });

    /**
     * Key-prefix routing — only try providers that can match this key shape.
     */
    function getEligibleProviders(apiKey) {
        const k = (apiKey || '').trim();
        const matched = PROVIDERS.filter(function (p) {
            try {
                return p.matchKey(k);
            } catch (e) {
                return false;
            }
        });

        if (matched.length) {
            return matched.slice().sort(function (a, b) {
                return a.priority - b.priority;
            });
        }

        return PROVIDERS.slice().sort(function (a, b) {
            return a.priority - b.priority;
        });
    }

    function buildAttemptList(apiKey, preferredProviderId) {
        const eligible = getEligibleProviders(apiKey);
        const order = eligible.map(function (p) { return p.id; });

        if (preferredProviderId && order.indexOf(preferredProviderId) >= 0) {
            order.splice(order.indexOf(preferredProviderId), 1);
            order.unshift(preferredProviderId);
        }

        const detected = S.loadDetected();
        if (detected.providerId && order.indexOf(detected.providerId) > 0) {
            order.splice(order.indexOf(detected.providerId), 1);
            order.unshift(detected.providerId);
        }

        const attempts = [];
        order.forEach(function (providerId) {
            const provider = PROVIDERS.find(function (p) { return p.id === providerId; });
            if (!provider) return;
            let models = provider.models.slice();
            if (detected.providerId === providerId && detected.model && models.indexOf(detected.model) > 0) {
                models.splice(models.indexOf(detected.model), 1);
                models.unshift(detected.model);
            }
            models.forEach(function (model) {
                attempts.push({ providerId: providerId, model: model, provider: provider });
            });
        });
        return attempts;
    }

    async function sendWithAutoDetect(apiKey, messages, options) {
        const key = (apiKey || '').trim();
        if (!key) {
            throw new Error('Please paste your API key in the sidebar to start chatting.');
        }
        options = options || {};
        const attempts = buildAttemptList(key, options.preferredProviderId || null);
        const tried = [];
        const errors = [];

        for (let i = 0; i < attempts.length; i++) {
            const attempt = attempts[i];
            const label = PROVIDER_META[attempt.providerId].label;
            tried.push(label + ' (' + attempt.model + ')');
            try {
                const text = await attempt.provider.send(key, attempt.model, messages);
                S.saveDetected(attempt.providerId, attempt.model);
                console.info('[CipherProviders] Connected:', attempt.providerId, attempt.model);
                return {
                    text: text,
                    providerId: attempt.providerId,
                    model: attempt.model,
                    label: label
                };
            } catch (err) {
                const msg = err && err.message ? err.message : String(err);
                errors.push(label + ': ' + msg);
                console.warn('[CipherProviders] Failed:', attempt.providerId, attempt.model, msg);
            }
        }

        throw new Error(
            'No provider accepted this API key.\nTried: ' + tried.join(' → ') +
            (errors.length ? '\n' + errors.slice(0, 3).join('\n') : '')
        );
    }

    global.CipherProviders = {
        sendWithAutoDetect: sendWithAutoDetect,
        loadDetected: S.loadDetected,
        saveDetected: S.saveDetected,
        clearDetected: S.clearDetected,
        getEligibleProviders: getEligibleProviders,
        PROVIDER_META: PROVIDER_META,
        PROVIDERS: PROVIDERS
    };
})(typeof window !== 'undefined' ? window : global);
