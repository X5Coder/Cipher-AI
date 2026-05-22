/**
 * Cipher Ai — rich text formatting (display + plain copy)
 */
(function (global) {
    'use strict';

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        return escapeHtml(str).replace(/'/g, '&#39;');
    }

    function formatTextToHtml(text) {
        var t = escapeHtml(text);

        t = t.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<div class="fmt-math">$1</div>');
        t = t.replace(/\+\+([^+\n]+?)\+\+/g, function (_, url) {
            var href = url.trim();
            if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
            return '<button type="button" class="fmt-link-btn" data-href="' + escapeAttr(href) + '" aria-label="Open link">' +
                '<span class="fmt-link-btn-label">Open Link</span></button>';
        });
        t = t.replace(/\u00AE\u00AE([^\u00AE]+?)\u00AE\u00AE/g, '<span class="fmt-hl-yellow">$1</span>');
        t = t.replace(/\u00A9\u00A9([^\u00A9]+?)\u00A9\u00A9/g, '<span class="fmt-hl-green">$1</span>');
        t = t.replace(/\[\[([^\]]+?)\]\]/g, '<strong class="fmt-bold">$1</strong>');
        t = t.replace(/\*\*([^*\n]+?)\*\*/g, '<strong class="fmt-bold">$1</strong>');
        t = t.replace(/-(\d+)-\s+([^\n]+)/g, function (_, num, body) {
            return '<div class="fmt-step"><span class="fmt-step-num">' + num + '</span><span class="fmt-step-body">' + body + '</span></div>';
        });
        t = t.replace(/~~([^~]+?)~~/g, '<span class="fmt-dark">$1</span>');
        t = t.replace(/\^\^([^^]+?)\^\^/g, '<h3 class="fmt-title">$1</h3>');
        t = t.replace(/\u00A7\u00A7/g, '<br class="fmt-br">');

        return t;
    }

    function stripForCopy(text) {
        var t = String(text || '').replace(/`/g, '');
        t = t.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '$1');
        t = t.replace(/\+\+([^+\n]+?)\+\+/g, '$1');
        t = t.replace(/\u00AE\u00AE([^\u00AE]+?)\u00AE\u00AE/g, '$1');
        t = t.replace(/\u00A9\u00A9([^\u00A9]+?)\u00A9\u00A9/g, '$1');
        t = t.replace(/\[\[([^\]]+?)\]\]/g, '$1');
        t = t.replace(/\*\*([^*\n]+?)\*\*/g, '$1');
        t = t.replace(/-(\d+)-\s+/g, function (_, n) { return n + '. '; });
        t = t.replace(/~~([^~]+?)~~/g, '$1');
        t = t.replace(/\^\^([^^]+?)\^\^/g, '$1');
        t = t.replace(/\u00A7\u00A7/g, '\n');
        return t.trim();
    }

    function htmlToFragment(html) {
        var fragment = document.createDocumentFragment();
        var div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) fragment.appendChild(div.firstChild);
        return fragment;
    }

    function formatToFragment(text) {
        return htmlToFragment(formatTextToHtml(text));
    }

    function getStreamablePlainText(text) {
        return stripForCopy(text);
    }

    global.CipherTextFormatter = {
        escapeHtml: escapeHtml,
        formatTextToHtml: formatTextToHtml,
        formatToFragment: formatToFragment,
        stripForCopy: stripForCopy,
        getStreamablePlainText: getStreamablePlainText
    };
})(typeof window !== 'undefined' ? window : global);
