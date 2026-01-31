// ==UserScript==
// @name         Steam Dev Filter
// @namespace    https://github.com/gbzret4d/steam-dev-filter
// @version      1.7.0
// @description  Warns about fraudulent Steam developers (Rug pulls, Asset Flips, etc.) based on a community database.
// @author       Steam Dev Filter Community
// @match        https://store.steampowered.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/gbzret4d/steam-dev-filter/main/steam_dev_filter.user.js
// @updateURL    https://raw.githubusercontent.com/gbzret4d/steam-dev-filter/main/steam_dev_filter.user.js
// @connect      raw.githubusercontent.com
// @run-at       document-end
// ==/UserScript==

/*
 * LEGAL DISCLAIMER:
 * This script and the associated database are community-maintained projects.
 * They are NOT affiliated with, endorsed by, or connected to Valve Corporation or Steam.
 * All trademarks, logos, and brand names are the property of their respective owners.
 * The data is provided "as is" based on community research and public sources.
 */


(function () {
    'use strict';

    // --- Configuration ---
    const DB_URL = 'https://raw.githubusercontent.com/gbzret4d/steam-dev-filter/main/database.json';
    const CACHE_KEY = 'steam_dev_filter_db_v5';
    const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours
    const SETTINGS_KEY = 'steam_dev_filter_settings';

    // Default Settings
    const DEFAULT_SETTINGS = {
        langOverride: 'auto', // 'auto', 'en', 'de', ...
        disabledCategories: [] // Array of disabled types, e.g. ['ABANDONWARE']
    };

    function getSettings() {
        const stored = GM_getValue(SETTINGS_KEY);
        return { ...DEFAULT_SETTINGS, ...stored };
    }

    function saveSettings(settings) {
        GM_setValue(SETTINGS_KEY, settings);
    }

    const currentSettings = getSettings();

    // --- Localization ---
    // --- Localization ---
    // Helper to detect language
    function getLang() {
        if (currentSettings.langOverride !== 'auto') {
            return currentSettings.langOverride;
        }
        const navLang = navigator.language.slice(0, 2).toLowerCase();
        const supported = ['de', 'en', 'fr', 'es', 'ru', 'zh', 'it', 'pt', 'pl', 'tr', 'ja', 'ko'];
        return supported.includes(navLang) ? navLang : 'en';
    }

    const LANG = getLang();
    const I18N = {
        de: {
            RUG_PULL: "Geld genommen & abgehauen",
            ASSET_FLIP: "Billiger Asset-Flip",
            MALICIOUS: "Schädlich / Bann",
            ABANDONWARE: "Verwaisters Projekt",
            HOSTILE_DEV: "Feindseliger Entwickler",
            BROKEN_PROMISES: "Leere Versprechungen",
            UNKNOWN: "Unbekannte Warnung",
            LOADING: "Lade Daten...",
            PROOF: "Beweis ansehen"
        },
        en: {
            RUG_PULL: "Rug Pull / Scam",
            ASSET_FLIP: "Cheap Asset Flip",
            MALICIOUS: "Malicious / Banned",
            ABANDONWARE: "Abandonware",
            HOSTILE_DEV: "Hostile Developer",
            BROKEN_PROMISES: "Broken Promises",
            UNKNOWN: "Unknown Warning",
            LOADING: "Loading Data...",
            PROOF: "View Proof"
        },
        fr: {
            RUG_PULL: "Arnaque / Rug Pull",
            ASSET_FLIP: "Asset Flip bon marché",
            MALICIOUS: "Malveillant / Banni",
            ABANDONWARE: "Abandonware",
            HOSTILE_DEV: "Développeur hostile",
            BROKEN_PROMISES: "Promesses non tenues",
            UNKNOWN: "Avertissement inconnu",
            LOADING: "Chargement des données...",
            PROOF: "Voir la preuve"
        },
        es: {
            RUG_PULL: "Estafa / Rug Pull",
            ASSET_FLIP: "Asset Flip barato",
            MALICIOUS: "Malicioso / Prohibido",
            ABANDONWARE: "Abandonware",
            HOSTILE_DEV: "Desarrollador hostil",
            BROKEN_PROMISES: "Promesas rotas",
            UNKNOWN: "Advertencia desconocida",
            LOADING: "Cargando datos...",
            PROOF: "Ver prueba"
        },
        ru: {
            RUG_PULL: "Мошенничество / Rug Pull",
            ASSET_FLIP: "Дешёвый Asset Flip",
            MALICIOUS: "Вредоносный / Забанен",
            ABANDONWARE: "Брошенный проект",
            HOSTILE_DEV: "Враждебный разработчик",
            BROKEN_PROMISES: "Нарушенные обещания",
            UNKNOWN: "Неизвестное предупреждение",
            LOADING: "Загрузка данных...",
            PROOF: "Посмотреть доказательство"
        },
        zh: {
            RUG_PULL: "卷款跑路 / Rug Pull",
            ASSET_FLIP: "劣质素材翻新",
            MALICIOUS: "恶意 / 已封禁",
            ABANDONWARE: "遗弃软件",
            HOSTILE_DEV: "敌对开发者",
            BROKEN_PROMISES: "违背承诺",
            UNKNOWN: "未知警告",
            LOADING: "正在加载数据...",
            PROOF: "查看证据"
        },
        it: {
            RUG_PULL: "Truffa / Rug Pull",
            ASSET_FLIP: "Asset Flip scadente",
            MALICIOUS: "Dannoso / Bannato",
            ABANDONWARE: "Abbandonato",
            HOSTILE_DEV: "Sviluppatore ostile",
            BROKEN_PROMISES: "Promesse non mantenute",
            UNKNOWN: "Avviso sconosciuto",
            LOADING: "Caricamento dati...",
            PROOF: "Guarda la prova"
        },
        pt: {
            RUG_PULL: "Golpe / Rug Pull",
            ASSET_FLIP: "Asset Flip barato",
            MALICIOUS: "Malicioso / Banido",
            ABANDONWARE: "Abandonware",
            HOSTILE_DEV: "Desenvolvedor hostil",
            BROKEN_PROMISES: "Promessas quebradas",
            UNKNOWN: "Aviso desconhecido",
            LOADING: "Carregando dados...",
            PROOF: "Ver prova"
        },
        pl: {
            RUG_PULL: "Oszustwo / Rug Pull",
            ASSET_FLIP: "Tani Asset Flip",
            MALICIOUS: "Szkodliwy / Zbanowany",
            ABANDONWARE: "Porzucony projekt",
            HOSTILE_DEV: "Wrogi deweloper",
            BROKEN_PROMISES: "Złamane obietnice",
            UNKNOWN: "Nieznane ostrzeżenie",
            LOADING: "Ładowanie danych...",
            PROOF: "Zobacz dowód"
        },
        tr: {
            RUG_PULL: "Dolandırıcılık / Rug Pull",
            ASSET_FLIP: "Ucuz Asset Flip",
            MALICIOUS: "Kötü Amaçlı / Yasaklı",
            ABANDONWARE: "Terk Edilmiş Yazılım",
            HOSTILE_DEV: "Düşman Geliştirici",
            BROKEN_PROMISES: "Tutulmayan Sözler",
            UNKNOWN: "Bilinmeyen Uyarı",
            LOADING: "Veriler Yükleniyor...",
            PROOF: "Kanıtı Gör"
        },
        ja: {
            RUG_PULL: "ラグプル / 詐欺",
            ASSET_FLIP: "安っぽいアセットフリップ",
            MALICIOUS: "悪質 / BAN済み",
            ABANDONWARE: "開発放棄",
            HOSTILE_DEV: "敵対的な開発者",
            BROKEN_PROMISES: "破られた約束",
            UNKNOWN: "不明な警告",
            LOADING: "読み込み中...",
            PROOF: "証拠を見る"
        },
        ko: {
            RUG_PULL: "먹튀 / 사기",
            ASSET_FLIP: "저질 에셋 플립",
            MALICIOUS: "악성 / 차단됨",
            ABANDONWARE: "유기된 프로젝트",
            HOSTILE_DEV: "적대적인 개발자",
            BROKEN_PROMISES: "지켜지지 않은 약속",
            UNKNOWN: "알 수 없는 경고",
            LOADING: "데이터 로딩 중...",
            PROOF: "증거 보기"
        }
    };

    // --- Styles ---
    const STYLES = `
        .sw-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            margin-left: 8px;
            border-radius: 2px;
            font-size: 11px;
            font-weight: bold;
            color: #fff;
            cursor: help;
            vertical-align: middle;
            text-transform: uppercase;
            box-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        .sw-badge.critical { background-color: #a03030; border: 1px solid #c9302c; } /* Darker Red */
        .sw-badge.warning { background-color: #d39e00; border: 1px solid #c69500; } /* Darker Orange */
        .sw-badge.info { background-color: #17a2b8; border: 1px solid #138496; } /* Darker Blue */
        
        .sw-badge:hover { opacity: 0.9; box-shadow: 0 0 5px rgba(255,0,0,0.5); }

        /* Icon styling */
        .sw-icon { margin-right: 4px; font-size: 1.2em; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

        /* Settings Modal */
        .sw-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 9999;
            display: flex; justify-content: center; align-items: center;
        }
        .sw-modal {
            background: #1b2838; color: #c6d4df; padding: 20px;
            border-radius: 4px; border: 1px solid #4b6680;
            width: 500px; max-width: 90%; font-family: "Motiva Sans", Sans-serif;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
        }
        .sw-modal h2 { margin-top: 0; border-bottom: 1px solid #4b6680; padding-bottom: 10px; }
        .sw-setting-row { margin-bottom: 15px; }
        .sw-setting-label { display: block; font-weight: bold; margin-bottom: 5px; }
        .sw-btn {
            background: #2a475e; color: #fff; border: none; padding: 8px 12px;
            cursor: pointer; border-radius: 2px; margin-right: 10px;
        }
        .sw-btn:hover { background: #67c1f5; }
        .sw-btn.save { background: #66c0f4; color: #fff; }
        .sw-checkbox-group label { display: block; margin-bottom: 5px; cursor: pointer; }
        .sw-textarea { width: 100%; height: 100px; background: #000; color: #fff; border: 1px solid #4b6680; }
        .sw-close { float: right; cursor: pointer; font-size: 20px; }

        /* Steam Layout Fixes */
        .glance_ctn_responsive_left .dev_row .summary {
            overflow: visible !important;
            white-space: normal !important;
            text-overflow: clip !important;
        }
    `;

    // --- Icons & Config ---
    const CATEGORIES = {
        RUG_PULL: { icon: "💸", severity: "critical" },
        ASSET_FLIP: { icon: "🗑️", severity: "critical" },
        MALICIOUS: { icon: "☣️", severity: "critical" },
        ABANDONWARE: { icon: "🕸️", severity: "warning" },
        HOSTILE_DEV: { icon: "🤐", severity: "warning" },
        BROKEN_PROMISES: { icon: "🚧", severity: "warning" },
        AI_SLOP: { icon: "🤖", severity: "warning" }
    };

    function getWorstCategory(categoryKeys) {
        if (!Array.isArray(categoryKeys)) categoryKeys = [categoryKeys];

        const severityLevels = { critical: 2, warning: 1, info: 0 };
        let worst = null;
        let maxSeverity = -1;

        for (const key of categoryKeys) {
            const cat = CATEGORIES[key];
            if (!cat) continue;

            const severityLevel = severityLevels[cat.severity] || 0;
            if (severityLevel > maxSeverity) {
                maxSeverity = severityLevel;
                worst = { ...cat, key };
            }
        }
        return worst;
    }

    // Add styles to head
    const styleSheet = document.createElement("style");
    styleSheet.innerText = STYLES;
    document.head.appendChild(styleSheet);


    // --- Core Logic ---

    async function loadDatabase() {
        const cached = GM_getValue(CACHE_KEY);
        const now = Date.now();

        if (cached && (now - cached.timestamp < CACHE_TIME)) {
            console.log('[Steam Dev Filter] Loaded from cache');
            return cached.data;
        }

        console.log('[Steam Dev Filter] Fetching database...');
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: DB_URL,
                onload: function (response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        GM_setValue(CACHE_KEY, { timestamp: now, data: data });
                        resolve(data);
                    } catch (e) {
                        console.error('[Steam Dev Filter] Failed to parse DB', e);
                        resolve({}); // Fail gracefully
                    }
                },
                onerror: function () {
                    console.error('[Steam Dev Filter] Network error');
                    resolve({});
                }
            });
        });
    }

    function getDeveloperId() {
        // Try to find specific markers in the DOM that contain the developer ID
        // Strategy 1: Link in the right column (app page)
        const devRows = document.querySelectorAll('.glance_ctn_responsive_left .dev_row a, #developers_list a');
        for (let link of devRows) {
            const match = link.href.match(/(?:developer|publisher|curator)\/(.+?)\/?$/);
            if (match) return match[1];
            // Also handle ?id= parameters if present in some old URLs
            const urlParams = new URL(link.href).searchParams;
            if (urlParams.has('id')) return urlParams.get('id');
        }
        return null; // Fallback
    }

    function getDeveloperNames() {
        const names = [];
        const devRows = document.querySelectorAll('.glance_ctn_responsive_left .dev_row .summary, #developers_list a');
        devRows.forEach(el => names.push(el.innerText.trim()));
        return names;
    }

    function createBadge(entry, id) {
        if (!entry) return null;
        if (currentSettings.disabledCategories.includes(entry.type)) return null;

        const typeList = Array.isArray(entry.type) ? entry.type : [entry.type];
        const primaryCatKey = getWorstCategory(typeList)?.key || typeList[0];
        const catConfig = CATEGORIES[primaryCatKey] || { icon: "⚠️", severity: "info" };
        const labelText = I18N[LANG][primaryCatKey] || primaryCatKey;

        const badge = document.createElement("span");
        badge.className = `sw-badge ${entry.severity || catConfig.severity}`;
        badge.innerHTML = `<span class="sw-icon">${catConfig.icon}</span> ${labelText}`;

        // Tooltip logic
        // Use typeList to show all categories
        const allLabels = typeList.map(t => I18N[LANG][t] || t).join(', ');
        const proofUrl = entry.proof_url || `https://github.com/gbzret4d/steam-dev-filter/blob/main/PROOFS.md#${id}`;
        badge.title = `${entry.name}\nFlags: ${allLabels}\n\n${entry.notes}\n\n${I18N[LANG].PROOF}`;

        // Click to open proof
        badge.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(proofUrl, '_blank');
        };

        return badge;
    }

    function processPage(db) {
        // We need to match developer elements.
        // Primary Target: "Developer" field in the Store Page
        const devElements = document.querySelectorAll('.glance_ctn_responsive_left .dev_row, .apphub_AppName, #developers_list');

        // Try precise ID match first
        // This is tricky because the ID isn't always explicitly in the DOM as a plain string, 
        // usually it's part of the href.

        // Iterate over all links that point to developer/publisher pages OR search pages for devs
        const devLinks = document.querySelectorAll('a[href*="/developer/"], a[href*="/publisher/"], a[href*="/curator/"], a[href*="/search/?developer="], a[href*="/search/?publisher="]');

        devLinks.forEach(link => {
            // Avoid double injection
            if (link.nextElementSibling && link.nextElementSibling.classList.contains('sw-badge')) return;

            let matchedEntry = null;

            // 1. ID Match from URL
            // Supports: /developer/ID, /publisher/ID, /curator/ID
            const urlMatch = link.href.match(/\/(?:developer|publisher|curator)\/([^\/?]+)/);
            if (urlMatch) {
                const id = urlMatch[1];
                if (db[id]) matchedEntry = db[id];
            }

            // 1b. Search Param Match (e.g. ?developer=Name or ?id=ID)
            if (!matchedEntry) {
                try {
                    const urlObj = new URL(link.href);
                    const searchParams = urlObj.searchParams;

                    // Check 'id' param
                    if (searchParams.has('id')) {
                        const id = searchParams.get('id');
                        if (db[id]) matchedEntry = db[id];
                    }

                    // Check 'developer' or 'publisher' param (Search links)
                    // these are usually Names, not IDs.
                    if (!matchedEntry) {
                        const devName = searchParams.get('developer') || searchParams.get('publisher');
                        if (devName) {
                            const name = devName.trim().toLowerCase();
                            for (const [id, entry] of Object.entries(db)) {
                                if (entry.name.toLowerCase() === name ||
                                    (entry.aliases && entry.aliases.some(a => a.toLowerCase() === name))) {
                                    matchedEntry = entry;
                                    break;
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            }

            // 2. Name Match (Fallback from link text)
            if (!matchedEntry) {
                const name = link.innerText.trim().toLowerCase();
                for (const [id, entry] of Object.entries(db)) {
                    if (entry.name.toLowerCase() === name ||
                        (entry.aliases && entry.aliases.some(a => a.toLowerCase() === name))) {
                        matchedEntry = entry;
                        break;
                    }
                }
            }

            if (matchedEntry) {
                // Find ID again if we only have the entry object (inefficient but safe)
                let matchedId = null;
                for (const [id, entry] of Object.entries(db)) {
                    if (entry === matchedEntry) {
                        matchedId = id;
                        break;
                    }
                }

                if (matchedId) {
                    const badge = createBadge(matchedEntry, matchedId);
                    if (badge) {
                        link.parentNode.insertBefore(badge, link.nextSibling);
                    }
                }
            }
        });
    }

    async function main() {
        const db = await loadDatabase();

        // Initial run
        processPage(db);

        // MutationObserver for infinite scrolling / dynamic content
        const observer = new MutationObserver((mutations) => {
            let shouldReprocess = false;
            for (let mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldReprocess = true;
                    break;
                }
            }
            if (shouldReprocess) {
                processPage(db);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Add Settings Menu Link (e.g. into the global header or footer if possible, or just floating)
        if (typeof GM_registerMenuCommand !== 'undefined') {
            GM_registerMenuCommand("Steam Dev Filter Settings", openSettingsModal);
        }
    }

    // --- Settings UI ---
    function openSettingsModal() {
        if (document.getElementById('sw-settings-modal')) return;

        const overlay = document.createElement('div');
        overlay.id = 'sw-settings-modal';
        overlay.className = 'sw-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'sw-modal';

        let categoriesHtml = '';
        for (const type of Object.keys(CATEGORIES)) {
            const checked = !currentSettings.disabledCategories.includes(type) ? 'checked' : '';
            categoriesHtml += `<label><input type="checkbox" data-type="${type}" ${checked}> Show ${I18N[LANG][type] || type}</label>`;
        }

        const languages = ['auto', 'de', 'en', 'fr', 'es', 'ru', 'zh', 'it', 'pt', 'pl', 'tr', 'ja', 'ko'];
        const langOptions = languages.map(l => `<option value="${l}" ${currentSettings.langOverride === l ? 'selected' : ''}>${l === 'auto' ? 'Auto-Detect' : l.toUpperCase()}</option>`).join('');

        modal.innerHTML = `
            <span class="sw-close">&times;</span>
            <h2>Steam Dev Filter Settings</h2>
            
            <div class="sw-setting-row">
                <span class="sw-setting-label">Language</span>
                <select id="sw-lang-select">${langOptions}</select>
            </div>

            <div class="sw-setting-row">
                <span class="sw-setting-label">Enabled Warnings</span>
                <div class="sw-checkbox-group" id="sw-cat-group">
                    ${categoriesHtml}
                </div>
            </div>

            <div class="sw-setting-row">
                <span class="sw-setting-label">Export / Import (JSON)</span>
                <textarea id="sw-export-area" class="sw-textarea" placeholder="Paste settings JSON here to import..."></textarea>
                <div style="margin-top: 5px;">
                    <button class="sw-btn" id="sw-export-btn">Export Current</button>
                    <button class="sw-btn" id="sw-import-btn">Import</button>
                </div>
            </div>

            <div style="text-align: right; margin-top: 20px;">
                <button class="sw-btn save" id="sw-save-btn">Save & Reload</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event Listeners
        overlay.querySelector('.sw-close').onclick = () => overlay.remove();

        overlay.querySelector('#sw-save-btn').onclick = () => {
            const lang = document.getElementById('sw-lang-select').value;
            const unchecked = Array.from(document.querySelectorAll('#sw-cat-group input:not(:checked)')).map(el => el.getAttribute('data-type'));

            saveSettings({
                langOverride: lang,
                disabledCategories: unchecked
            });
            window.location.reload();
        };

        overlay.querySelector('#sw-export-btn').onclick = () => {
            // Export both Settings and maybe custom database overrides in future?
            // For now just settings
            const data = {
                settings: getSettings(),
                timestamp: Date.now()
            };
            document.getElementById('sw-export-area').value = JSON.stringify(data, null, 2);
        };

        overlay.querySelector('#sw-import-btn').onclick = () => {
            try {
                const json = JSON.parse(document.getElementById('sw-export-area').value);
                if (json.settings) {
                    saveSettings(json.settings);
                    alert("Settings imported successfully! Reloading...");
                    window.location.reload();
                } else {
                    alert("Invalid JSON format.");
                }
            } catch (e) {
                alert("Error parsing JSON.");
            }
        };

        // Close on click outside
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    }

    main();
})();
