/**
 * Shared helpers for Cipher provider modules
 */
(function (global) {
    'use strict';

    const STORAGE_PROVIDER = 'cipher_detected_provider';
    const STORAGE_MODEL = 'cipher_detected_model';

    async function parseErrorResponse(response) {
        try {
            const data = await response.json();
            return data.error?.message || data.error?.type || data.message || response.statusText;
        } catch (e) {
            return response.statusText || 'Request failed';
        }
    }

    function loadDetected() {
        try {
            return {
                providerId: localStorage.getItem(STORAGE_PROVIDER) || null,
                model: localStorage.getItem(STORAGE_MODEL) || null
            };
        } catch (e) {
            return { providerId: null, model: null };
        }
    }

    function saveDetected(providerId, model) {
        try {
            localStorage.setItem(STORAGE_PROVIDER, providerId);
            localStorage.setItem(STORAGE_MODEL, model);
        } catch (e) {}
    }

    function clearDetected() {
        try {
            localStorage.removeItem(STORAGE_PROVIDER);
            localStorage.removeItem(STORAGE_MODEL);
        } catch (e) {}
    }

    global.CipherProvidersShared = {
        STORAGE_PROVIDER: STORAGE_PROVIDER,
        STORAGE_MODEL: STORAGE_MODEL,
        parseErrorResponse: parseErrorResponse,
        loadDetected: loadDetected,
        saveDetected: saveDetected,
        clearDetected: clearDetected
    };
})(typeof window !== 'undefined' ? window : global);
