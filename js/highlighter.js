/**
 * Cipher Ai — syntax highlighting (Highlight.js + language aliases)
 */
(function (global) {
    'use strict';

    var LANG_ALIASES = {
        'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript',
        'ts': 'typescript', 'tsx': 'typescript', 'mts': 'typescript',
        'py': 'python', 'python3': 'python', 'python2': 'python',
        'rb': 'ruby', 'rs': 'rust', 'kt': 'kotlin', 'kts': 'kotlin',
        'cs': 'csharp', 'c#': 'csharp', 'dotnet': 'csharp',
        'cpp': 'cpp', 'c++': 'cpp', 'cc': 'cpp', 'hpp': 'cpp', 'h': 'cpp',
        'c': 'c', 'objc': 'objectivec', 'objective-c': 'objectivec', 'swift': 'swift',
        'go': 'go', 'golang': 'go', 'java': 'java', 'php': 'php',
        'sh': 'bash', 'shell': 'bash', 'zsh': 'bash', 'bash': 'bash',
        'ps1': 'powershell', 'pwsh': 'powershell', 'powershell': 'powershell',
        'yml': 'yaml', 'dockerfile': 'docker', 'md': 'markdown', 'markdown': 'markdown',
        'html': 'xml', 'htm': 'xml', 'svg': 'xml', 'xml': 'xml', 'vue': 'xml',
        'sql': 'sql', 'mysql': 'sql', 'pgsql': 'pgsql', 'postgresql': 'pgsql',
        'json': 'json', 'jsonc': 'json', 'css': 'css', 'scss': 'scss', 'sass': 'scss', 'less': 'less',
        'lua': 'lua', 'r': 'r', 'matlab': 'matlab', 'scala': 'scala', 'perl': 'perl', 'pl': 'perl',
        'dart': 'dart', 'elixir': 'elixir', 'ex': 'elixir', 'exs': 'elixir',
        'haskell': 'haskell', 'hs': 'haskell', 'clojure': 'clojure', 'clj': 'clojure',
        'wasm': 'wasm', 'zig': 'zig', 'nim': 'nim', 'gdscript': 'gdscript', 'gd': 'gdscript',
        'graphql': 'graphql', 'gql': 'graphql', 'protobuf': 'protobuf', 'proto': 'protobuf',
        'terraform': 'hcl', 'tf': 'hcl', 'hcl': 'hcl',
        'makefile': 'makefile', 'make': 'makefile',
        'ini': 'ini', 'toml': 'ini', 'conf': 'ini',
        'asm': 'x86asm', 'nasm': 'x86asm', 'armasm': 'armasm',
        'latex': 'latex', 'tex': 'latex',
        'code': 'plaintext', 'text': 'plaintext', 'plaintext': 'plaintext', 'txt': 'plaintext'
    };

    function normalizeLanguage(lang) {
        if (!lang) return 'plaintext';
        var raw = String(lang).trim().toLowerCase();
        if (!raw) return 'plaintext';
        if (LANG_ALIASES[raw]) return LANG_ALIASES[raw];
        if (global.hljs && typeof global.hljs.getLanguage === 'function' && global.hljs.getLanguage(raw)) {
            return raw;
        }
        return raw;
    }

    function formatLanguageLabel(lang) {
        if (!lang) return 'CODE';
        return String(lang).trim().toUpperCase();
    }

    function highlightCode(code, lang) {
        var text = String(code || '');
        var normalized = normalizeLanguage(lang);

        if (global.hljs && typeof global.hljs.highlight === 'function') {
            try {
                if (normalized !== 'plaintext' && global.hljs.getLanguage(normalized)) {
                    return {
                        html: global.hljs.highlight(text, { language: normalized, ignoreIllegals: true }).value,
                        language: normalized,
                        detected: normalized
                    };
                }
                var auto = global.hljs.highlightAuto(text, [
                    'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
                    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'bash', 'json',
                    'xml', 'css', 'yaml', 'markdown', 'dart', 'lua', 'r', 'scala', 'haskell'
                ]);
                return {
                    html: auto.value,
                    language: auto.language || normalized,
                    detected: auto.language || 'auto'
                };
            } catch (e) {
                console.warn('[CipherHighlighter]', e);
            }
        }

        return {
            html: escapeHtml(text),
            language: normalized,
            detected: normalized
        };
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function applyToElement(codeEl, code, lang) {
        var result = highlightCode(code, lang);
        codeEl.innerHTML = result.html;
        codeEl.classList.remove('hljs');
        codeEl.classList.add('hljs');
        if (result.language && result.language !== 'plaintext') {
            codeEl.classList.add('language-' + result.language);
        }
        return result;
    }

    global.CipherHighlighter = {
        normalizeLanguage: normalizeLanguage,
        formatLanguageLabel: formatLanguageLabel,
        highlightCode: highlightCode,
        applyToElement: applyToElement,
        LANG_ALIASES: LANG_ALIASES
    };
})(typeof window !== 'undefined' ? window : global);
