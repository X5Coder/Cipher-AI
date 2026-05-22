/**
 * Cipher Ai — hide real provider/model names in displayed text (not inside code blocks)
 */
(function (global) {
    'use strict';

    var BRAND_PATTERNS = [
        { re: /deep\s*seek/gi, to: 'AI' },
        { re: /deeseek/gi, to: 'AI' },
        { re: /depseek/gi, to: 'AI' },
        { re: /deepseek/gi, to: 'AI' },
        { re: /chat\s*gpt/gi, to: 'AI' },
        { re: /chatgpt/gi, to: 'AI' },
        { re: /open\s*ai/gi, to: 'AI' },
        { re: /openai/gi, to: 'AI' },
        { re: /anthropic/gi, to: 'AI' },
        { re: /\bclaude\s*ai\b/gi, to: 'AI' },
        { re: /google\s*gemini/gi, to: 'AI' },
        { re: /\bgemini\s*ai\b/gi, to: 'AI' },
        { re: /\bgemini\b/gi, to: 'AI' },
        { re: /open\s*router/gi, to: 'AI' },
        { re: /openrouter/gi, to: 'AI' },
        { re: /\bmeta\s*ai\b/gi, to: 'AI' },
        { re: /\bllama\s*\d*/gi, to: 'AI' },
        { re: /\bcopilot\b/gi, to: 'AI' },
        { re: /\bperplexity\b/gi, to: 'AI' },
        { re: /\bmistral\s*ai\b/gi, to: 'AI' },
        { re: /\bcohere\b/gi, to: 'AI' },
        { re: /\bxai\b/gi, to: 'AI' },
        { re: /\bgrok\b/gi, to: 'AI' }
    ];

    var MODEL_PATTERNS = [
        { re: /openai\/[\w.+-]+/gi, to: 'Model' },
        { re: /anthropic\/[\w.+-]+/gi, to: 'Model' },
        { re: /google\/[\w.+-]+/gi, to: 'Model' },
        { re: /deepseek\/[\w.+-]+/gi, to: 'Model' },
        { re: /gpt-[\w.+-]+/gi, to: 'Model' },
        { re: /o\d-[\w.+-]+/gi, to: 'Model' },
        { re: /claude-[\w.+-]+/gi, to: 'Model' },
        { re: /claude\s*[\d.]+/gi, to: 'Model' },
        { re: /gemini-[\w.+-]+/gi, to: 'Model' },
        { re: /gemini\s*[\d.]+/gi, to: 'Model' },
        { re: /deepseek-[\w.+-]+/gi, to: 'Model' },
        { re: /\bgpt\s*[\d.]+/gi, to: 'Model' },
        { re: /\bllama-[\w.+-]+/gi, to: 'Model' },
        { re: /\bmistral-[\w.+-]+/gi, to: 'Model' },
        { re: /\bcommand-[\w.+-]+/gi, to: 'Model' }
    ];

    function applyToPlainText(text) {
        var t = String(text || '');
        var i;
        for (i = 0; i < MODEL_PATTERNS.length; i++) {
            t = t.replace(MODEL_PATTERNS[i].re, MODEL_PATTERNS[i].to);
        }
        for (i = 0; i < BRAND_PATTERNS.length; i++) {
            t = t.replace(BRAND_PATTERNS[i].re, BRAND_PATTERNS[i].to);
        }
        return t;
    }

    function applyToResponse(rawText) {
        if (!rawText) return '';
        if (!global.CipherContentParser) {
            return applyToPlainText(rawText);
        }

        var text = CipherContentParser.preprocessResponse(rawText);
        var markers = [];
        var m;
        var open3 = '\u00D7\u00D7\u00D7';
        var close3 = '\u00D7\u00D7\u00D7';
        var cipherRe = /\u00D7\u00D7\u00D7([\w#+\-.]+)\u00D7\s*\n([\s\S]*?)\u00D7\u00D7\u00D7/gi;
        while ((m = cipherRe.exec(text)) !== null) {
            markers.push({ index: m.index, end: m.index + m[0].length });
        }
        var fenceRe = /```[\w#+\-.]*\s*\n[\s\S]*?```/g;
        while ((m = fenceRe.exec(text)) !== null) {
            markers.push({ index: m.index, end: m.index + m[0].length });
        }
        markers.sort(function (a, b) { return a.index - b.index; });

        var filtered = [];
        var lastEnd = 0;
        for (var j = 0; j < markers.length; j++) {
            if (markers[j].index >= lastEnd) {
                filtered.push(markers[j]);
                lastEnd = markers[j].end;
            }
        }

        if (!filtered.length) return applyToPlainText(text);

        var out = '';
        var lastIndex = 0;
        filtered.forEach(function (mark) {
            if (mark.index > lastIndex) {
                out += applyToPlainText(text.substring(lastIndex, mark.index));
            }
            out += text.substring(mark.index, mark.end);
            lastIndex = mark.end;
        });
        if (lastIndex < text.length) {
            out += applyToPlainText(text.substring(lastIndex));
        }
        return out;
    }

    global.CipherBrandFilter = {
        applyToPlainText: applyToPlainText,
        applyToResponse: applyToResponse,
        BRAND_PATTERNS: BRAND_PATTERNS,
        MODEL_PATTERNS: MODEL_PATTERNS
    };
})(typeof window !== 'undefined' ? window : global);
