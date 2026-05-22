/**
 * Cipher Ai — parse full AI responses into text / code segments
 */
(function (global) {
    'use strict';

    var CODE_WRAP_V3_OPEN = '\u00D7\u00D7\u00D7';
    var CODE_WRAP_V3_CLOSE = '\u00D7\u00D7\u00D7';
    var CODE_WRAP_V2_OPEN = '\u00D7\u00D7';
    var CODE_WRAP_V2_CLOSE = '\u00D7\u00D7';
    var CODE_LINE_MARK = '\u00A7';
    var LANG_PATTERN = '[\\w#+\\-.]+';

    function escapeRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /** Remove stray ` from plain text only (never inside code blocks). */
    function sanitizePlainText(text) {
        return String(text || '').replace(/`/g, '');
    }

    function preprocessResponse(text) {
        if (!text) return '';
        return String(text).replace(/\r\n/g, '\n').replace(/\uFEFF/g, '');
    }

    /**
     * Strip backticks outside code blocks / fences.
     */
    function sanitizePlainTextInResponse(rawText) {
        var text = preprocessResponse(rawText);
        if (!text) return '';

        var markers = filterNonOverlapping(collectMarkers(text));
        if (!markers.length) return sanitizePlainText(text);

        var out = '';
        var lastIndex = 0;
        markers.forEach(function (mark) {
            if (mark.index > lastIndex) {
                out += sanitizePlainText(text.substring(lastIndex, mark.index));
            }
            out += text.substring(mark.index, mark.end);
            lastIndex = mark.end;
        });
        if (lastIndex < text.length) {
            out += sanitizePlainText(text.substring(lastIndex));
        }
        return out;
    }

    function collectMarkers(text) {
        var markers = [];
        var m;

        var open3 = escapeRegex(CODE_WRAP_V3_OPEN);
        var close3 = escapeRegex(CODE_WRAP_V3_CLOSE);
        var cipherV3Re = new RegExp(
            open3 + '(' + LANG_PATTERN + ')\u00D7\\s*\\n([\\s\\S]*?)' + close3,
            'gi'
        );
        while ((m = cipherV3Re.exec(text)) !== null) {
            markers.push({
                index: m.index,
                end: m.index + m[0].length,
                lang: m[1],
                code: m[2],
                kind: 'cipher-v3'
            });
        }

        var open2 = escapeRegex(CODE_WRAP_V2_OPEN);
        var close2 = escapeRegex(CODE_WRAP_V2_CLOSE);
        var cipherV2Re = new RegExp(
            open2 + '(' + LANG_PATTERN + ')\\s*\\n([\\s\\S]*?)' + close2,
            'gi'
        );
        while ((m = cipherV2Re.exec(text)) !== null) {
            markers.push({
                index: m.index,
                end: m.index + m[0].length,
                lang: m[1],
                code: m[2],
                kind: 'cipher-v2'
            });
        }

        var fenceRe = /```([\w#+\-.]*)\s*\n([\s\S]*?)```/g;
        while ((m = fenceRe.exec(text)) !== null) {
            markers.push({
                index: m.index,
                end: m.index + m[0].length,
                lang: m[1] || 'code',
                code: m[2],
                kind: 'fence'
            });
        }

        markers.sort(function (a, b) {
            if (a.index !== b.index) return a.index - b.index;
            return b.end - a.end;
        });
        return markers;
    }

    function filterNonOverlapping(markers) {
        var filtered = [];
        var lastEnd = 0;
        for (var i = 0; i < markers.length; i++) {
            var mark = markers[i];
            if (mark.index < lastEnd) continue;
            filtered.push(mark);
            lastEnd = mark.end;
        }
        return filtered;
    }

    function normalizeCodeText(code) {
        return String(code || '')
            .split(CODE_LINE_MARK).join('\n')
            .replace(/\u00A7/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]+\n/g, '\n')
            .trim();
    }

    function stripTextFormatting(text) {
        var t = sanitizePlainText(text);
        if (global.CipherTextFormatter) {
            t = CipherTextFormatter.stripForCopy(t);
        }
        return t.trim();
    }

    function parseContentSegments(rawText) {
        var text = sanitizePlainTextInResponse(preprocessResponse(rawText));
        if (!text) return [];

        var markers = filterNonOverlapping(collectMarkers(text));
        var segments = [];
        var lastIndex = 0;

        markers.forEach(function (mark) {
            if (mark.index > lastIndex) {
                var chunk = text.substring(lastIndex, mark.index).trim();
                if (chunk) segments.push({ type: 'text', content: chunk });
            }
            var code = normalizeCodeText(mark.code);
            if (code) {
                segments.push({
                    type: 'code',
                    lang: mark.lang || 'code',
                    code: code
                });
            }
            lastIndex = mark.end;
        });

        if (lastIndex < text.length) {
            var tail = text.substring(lastIndex).trim();
            if (tail) segments.push({ type: 'text', content: tail });
        }

        if (segments.length === 0 && text) {
            segments.push({ type: 'text', content: text });
        }

        return segments;
    }

    function getMessageCopyText(rawText) {
        var segments = parseContentSegments(rawText);
        var codeParts = [];
        var textParts = [];

        segments.forEach(function (seg) {
            if (seg.type === 'code') codeParts.push(seg.code);
            else {
                var plain = stripTextFormatting(seg.content);
                if (plain) textParts.push(plain);
            }
        });

        var hasCode = codeParts.length > 0;
        var hasText = textParts.length > 0;

        if (hasCode && !hasText) return codeParts.join('\n\n');

        if (hasCode && hasText) {
            var out = [];
            segments.forEach(function (seg) {
                if (seg.type === 'code') out.push(seg.code);
                else {
                    var p = stripTextFormatting(seg.content);
                    if (p) out.push(p);
                }
            });
            return out.join('\n\n');
        }

        return stripTextFormatting(rawText);
    }

    global.CipherContentParser = {
        CODE_WRAP_V3_OPEN: CODE_WRAP_V3_OPEN,
        CODE_WRAP_V3_CLOSE: CODE_WRAP_V3_CLOSE,
        CODE_WRAP_V2_OPEN: CODE_WRAP_V2_OPEN,
        CODE_WRAP_V2_CLOSE: CODE_WRAP_V2_CLOSE,
        CODE_LINE_MARK: CODE_LINE_MARK,
        sanitizePlainText: sanitizePlainText,
        sanitizePlainTextInResponse: sanitizePlainTextInResponse,
        preprocessResponse: preprocessResponse,
        parseContentSegments: parseContentSegments,
        normalizeCodeText: normalizeCodeText,
        getMessageCopyText: getMessageCopyText,
        stripTextFormatting: stripTextFormatting
    };
})(typeof window !== 'undefined' ? window : global);
