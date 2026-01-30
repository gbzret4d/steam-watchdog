// ==UserScript==
// @name         Steam Dev Filter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Warns about fraudulent Steam developers (Rug pulls, Asset Flips, etc.) based on a community database.
// @author       Steam Dev Filter Community
// @match        https://store.steampowered.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      raw.githubusercontent.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const DB_URL = 'https://raw.githubusercontent.com/USERNAME/steam-dev-filter/main/database.json'; // TODO: Replace USERNAME
    const CACHE_KEY = 'steam_dev_filter_db';
    const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

    // --- Localization ---
    const LANG = navigator.language.startsWith('de') ? 'de' : 'en';
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
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        GM_setValue(CACHE_KEY, { timestamp: now, data: data });
                        resolve(data);
                    } catch (e) {
                        console.error('[Steam Dev Filter] Failed to parse DB', e);
                        resolve({}); // Fail gracefully
                    }
                },
                onerror: function() {
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

    function createBadge(entry) {
        if (!entry) return null;

        const catConfig = CATEGORIES[entry.type] || { icon: "⚠️", severity: "info" };
        const labelText = I18N[LANG][entry.type] || entry.type;
        
        const badge = document.createElement("span");
        badge.className = `sw-badge ${entry.severity || catConfig.severity}`;
        badge.innerHTML = `<span class="sw-icon">${catConfig.icon}</span> ${labelText}`;
        
        // Tooltip logic
        badge.title = `${entry.notes}\n\n${I18N[LANG].PROOF}: ${entry.proof_url}`;
        
        // Click to open proof
        badge.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(entry.proof_url, '_blank');
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
        
        // Iterate over all links that point to developer/publisher pages
        const devLinks = document.querySelectorAll('a[href*="/developer/"], a[href*="/publisher/"], a[href*="/curator/"]');
        
        devLinks.forEach(link => {
            // Avoid double injection
            if (link.nextElementSibling && link.nextElementSibling.classList.contains('sw-badge')) return;

            let matchedEntry = null;
            
            // 1. ID Match from URL
            const urlMatch = link.href.match(/\/(?:developer|publisher|curator)\/([^\/]+)/);
            if (urlMatch) {
                const id = urlMatch[1];
                if (db[id]) matchedEntry = db[id];
            }

            // 2. Name Match (Fallback)
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
                const badge = createBadge(matchedEntry);
                if (badge) {
                     link.parentNode.insertBefore(badge, link.nextSibling);
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
