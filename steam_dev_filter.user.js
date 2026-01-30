// ==UserScript==
// @name         Steam Dev Filter
// @namespace    https://github.com/gbzret4d/steam-dev-filter
// @version      1.4
// @description  Warns about fraudulent Steam developers (Rug pulls, Asset Flips, etc.) based on a community database.
// @author       Steam Dev Filter Community
// @match        https://store.steampowered.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
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
    const DB_URL = 'https://raw.githubusercontent.com/gbzret4d/steam-dev-filter/main/database.json'; // TODO: Replace USERNAME with actual owner
    const CACHE_KEY = 'steam_dev_filter_db_v2';
    const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

    // --- Localization ---
    // --- Localization ---
    // Helper to detect language
    function getLang() {
        const navLang = navigator.language.slice(0, 2).toLowerCase();
        const supported = ['de', 'en', 'fr', 'es', 'ru', 'zh'];
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
        .sw-badge.critical { background-color: #d9534f; border: 1px solid #b52b27; } /* Red */
        .sw-badge.warning { background-color: #f0ad4e; border: 1px solid #eb9316; } /* Orange */
        .sw-badge.info { background-color: #5bc0de; border: 1px solid #46b8da; } /* Blue/Netural */
        
        .sw-badge:hover { opacity: 0.9; }

        /* Icon styling */
        .sw-icon { margin-right: 4px; }
    `;

    // --- Icons & Config ---
    const CATEGORIES = {
        RUG_PULL: { icon: "💸", severity: "critical" },
        ASSET_FLIP: { icon: "🗑️", severity: "critical" },
        MALICIOUS: { icon: "☣️", severity: "critical" }, // Black often hard to read, mapping to critical/red for visibility or custom black style
        ABANDONWARE: { icon: "🕸️", severity: "warning" },
        HOSTILE_DEV: { icon: "🤐", severity: "warning" },
        BROKEN_PROMISES: { icon: "🚧", severity: "warning" }
    };

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

        const catConfig = CATEGORIES[entry.type] || { icon: "⚠️", severity: "info" };
        const labelText = I18N[LANG][entry.type] || entry.type;

        const badge = document.createElement("span");
        badge.className = `sw-badge ${entry.severity || catConfig.severity}`;
        badge.innerHTML = `<span class="sw-icon">${catConfig.icon}</span> ${labelText}`;

        // Tooltip logic
        const proofUrl = `https://github.com/gbzret4d/steam-dev-filter/blob/main/PROOFS.md#${id}`;
        badge.title = `${entry.notes}\n\n${I18N[LANG].PROOF}`;

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
    }

    main();
})();
