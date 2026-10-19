// ==UserScript==
// @name         LSS-Helfer
// @namespace    lss-helfer
// @version      0.3.2
// @description  Einsatzliste, Sprechwunsch-Helfer, LSS-weite Aktionen (Toggles, In-Page-Modals, Sachsen-Kürzel, manuelles Werben)
// @author       Du
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://github.com/Amaan5347/LSS/lss-helfer.user.js
// @updateURL    https://github.com/Amaan5347/LSS/lss-helfer.user.js
// ==/UserScript==

// Version: v0.3.2

(function () {
    'use strict';
    if (window.top !== window.self) return;

    const DESIGN = {
        bg: '#1c1a17', panel: '#221f19', border: '#2e2a24',
        text: '#e4e0d8', textDim: '#b8b2a4',
        accent: '#b8862b', accentText: '#16140f',
        radius: '3px', font: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    };

    const ICON_CDN = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.48.0/dist/tabler-icons.min.css';
    function loadIcons() {
        if (document.querySelector(`link[href="${ICON_CDN}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = ICON_CDN;
        l.onerror = () => console.error('[LSS-Helfer] Icon-CDN fehlgeschlagen.');
        document.head.appendChild(l);
    }
    function ensureStyles() {
        if (document.getElementById('lss-helfer-styles')) return;
        const s = document.createElement('style');
        s.id = 'lss-helfer-styles';
        s.textContent = `
            @keyframes lsh-fade-in { from { opacity:0; transform: translate(-50%, -45%);} to {opacity:1; transform: translate(-50%, -50%);} }
            @keyframes lsh-slide-in { from { transform: translateX(-8px); opacity:0;} to {transform: translateX(0);opacity:1;} }
            .lsh-tpl-code { background: #2a2620; color: ${DESIGN.accent}; padding: 1px 5px; border-radius: 2px; font-family: ${DESIGN.mono}; font-size: 10px; border: 1px solid ${DESIGN.border}; display: inline-block; margin: 1px; }
        `;
        document.head.appendChild(s);
    }

    // ===== STORE =====
    const MODULES_KEY = 'lssHelfer.modules';
    const FEATURES_KEY = 'lssHelfer.features';
    const AKTION_STATE_KEY = 'lssHelfer.aktionState.v3';
    const CITY_ABBREV_KEY = 'lssHelfer.cityAbbrev';
    const Store = {
        loadModules() { try { return JSON.parse(localStorage.getItem(MODULES_KEY)) || {}; } catch { return {}; } },
        setModuleActive(id, active) { const s = this.loadModules(); s[id] = !!active; try { localStorage.setItem(MODULES_KEY, JSON.stringify(s)); } catch {} },
        isModuleActive(id) { return !!this.loadModules()[id]; },
        getFeature(m, f, d) { try { const all = JSON.parse(localStorage.getItem(FEATURES_KEY)) || {}; const s = all[m] || {}; return s[f] !== undefined ? s[f] : d; } catch { return d; } },
        setFeature(m, f, v) { try { const all = JSON.parse(localStorage.getItem(FEATURES_KEY)) || {}; all[m] = all[m] || {}; all[m][f] = v; localStorage.setItem(FEATURES_KEY, JSON.stringify(all)); } catch {} },
        loadAktionState() { try { return JSON.parse(localStorage.getItem(AKTION_STATE_KEY)) || {}; } catch { return {}; } },
        saveAktionState(st) { try { localStorage.setItem(AKTION_STATE_KEY, JSON.stringify(st)); } catch {} },
        loadCityAbbrev() { try { return JSON.parse(localStorage.getItem(CITY_ABBREV_KEY)) || {}; } catch { return {}; } },
        saveCityAbbrev(obj) { try { localStorage.setItem(CITY_ABBREV_KEY, JSON.stringify(obj)); } catch {} },
    };

    // ===== REGISTRY =====
    const Registry = {
        modules: new Map(),
        register(id, meta) { this.modules.set(id, { id, ...meta }); return this; },
        all() { return Array.from(this.modules.values()); },
        get(id) { return this.modules.get(id); },
        activate(id) {
            const m = this.modules.get(id);
            if (!m) { console.error('[LSS-Helfer] ' + id + ' unbekannt.'); return; }
            Store.setModuleActive(id, true);
            try { m.onActivate && m.onActivate(); } catch (e) { console.error(e); }
        },
        deactivate(id) {
            const m = this.modules.get(id);
            if (!m) { console.error('[LSS-Helfer] ' + id + ' unbekannt.'); return; }
            Store.setModuleActive(id, false);
            try { m.onDeactivate && m.onDeactivate(); } catch (e) { console.error(e); }
        },
    };

    // ===== HELPERS =====
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function getCsrf() { const m = document.querySelector('meta[name="csrf-token"]'); return m ? m.content : ''; }
    async function apiGet(url) { return fetch(url, { credentials: 'same-origin' }); }
    async function apiPost(url, data) {
        const csrf = getCsrf();
        const params = new URLSearchParams(data);
        if (csrf) params.set('authenticity_token', csrf);
        return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    }
    function applyTemplate(tpl, vars) { return tpl.replace(/\{(\w+)\}/g, (m, key) => vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : m); }

    const BUILDING_TYPE_SHORT = {
        0:'Feuerwache', 1:'FW-Schule', 2:'Rettungswache', 3:'RS', 4:'Krankenhaus', 5:'RTH-Station', 6:'Polizeiwache',
        7:'Leitstelle', 8:'Pol-Schule', 9:'THW', 10:'THW-Schule', 11:'BePo',
        12:'SEG', 13:'PolHubschr', 15:'Wasserrettung', 17:'PolSE', 18:'SEG Bergwacht',
        20:'Bergrettungswache', 21:'RHS', 24:'Wasserrettung Seenot', 25:'Bergrettungswache', 26:'Seenotrettungswache',
        27:'Seenot-Hubschr', 28:'Seenot-Hubschr', 29:'Autobahnpolizei',
    };
    const TYPE_WORDS = new Set(['fw','feuerwache','fw-schule','rw','rettungswache','rs','kh','krankenhaus','thw','thw-schule','pol','polizei','polizeiwache','lst','leitstelle','seg','bepo','bereitschaftspolizei','wache','schule','feuerwehrschule','rettungsschule','polizeischule','bundesschule','hubschrauber','rth','rth-station','polizeihubschrauber','wasserrettung','bergrettung','bergrettungswache','seenotrettung','seenotrettungswache','autobahnpolizei','polse','sew','nord','sued','ost','west','mitte']);

    // ===== SACHSEN KFZ-KÜRZEL (erweitert) =====
    const CITY_ABBREV_SACHSEN = {
        // Kreisfreie Städte
        'dresden':'DD', 'leipzig':'L', 'chemnitz':'C',
        // Landkreise und Städte (alphabetisch)
        'annaberg':'ANA', 'annaberg-buchholz':'ANA',
        'auerbach':'AE', 'aue':'AU', 'aue-bad schlema':'AU',
        'bautzen':'BZ', 'bischofswerda':'BIW', 'borna':'BNA', 'brand-erbisdorf':'BED',
        'delitzsch':'DZ', 'dippoldiswalde':'DW', 'dobeln':'DL', 'döbeln':'DL',
        'eilenburg':'EB', 'erzgebirge':'ERZ', 'erzgebirgskreis':'ERZ',
        'floha':'FLÖ', 'flöha':'FLÖ', 'freiberg':'FG', 'freital':'FTL',
        'geithain':'GHA', 'glauchau':'GC', 'gorlitz':'GR', 'görlitz':'GR',
        'grimma':'GRM', 'grossenhain':'GRH', 'großenhain':'GRH',
        'hainichen':'HC', 'hohenstein-ernstthal':'HOT', 'hoyerswerda':'HY',
        'kamenz':'KM',
        'lobau':'LÖB', 'löbau':'LÖB',
        'marienberg':'MAB', 'meissen':'MEI', 'meißen':'MEI', 'mittweida':'MW',
        'niesky':'NY',
        'oschatz':'OZ',
        'pirna':'PIR', 'plauen':'PL',
        'reichenbach':'RC', 'riesa':'RIE', 'rochlitz':'RL',
        'sebnitz':'SEB', 'schwarzenberg':'SZB', 'stollberg':'STL',
        'torgau':'TG',
        'vogtland':'V', 'vogtlandkreis':'V',
        'werdau':'WDA', 'weisswasser':'WSW', 'weißwasser':'WSW', 'wurzen':'WUR',
        'zittau':'ZI', 'zschopau':'ZP', 'zwickau':'Z',
        // Auslaufende/ältere Kennzeichen
        'asz':'ASZ', 'mek':'MEK', 'mtl':'MTL', 'ovl':'OVL', 'rg':'RG', 'to':'TO', 'tdо':'TDO',
    };

    function extractCity(buildingName) {
        if (!buildingName) return '';
        const parts = String(buildingName).split(/[\s\-_]+/);
        const candidates = parts.filter(p => p.length > 1 && !/^\d+$/.test(p) && !TYPE_WORDS.has(p.toLowerCase()));
        return candidates.length > 0 ? candidates[0] : '';
    }
    function abbrevCity(city) {
        if (!city) return '';
        const lower = city.toLowerCase().trim();
        // 1. Lokale (vom Nutzer gespeicherte) Kürzel
        const userMap = Store.loadCityAbbrev();
        if (userMap[lower]) return userMap[lower];
        // 2. Sachsen-Karte
        if (CITY_ABBREV_SACHSEN[lower]) return CITY_ABBREV_SACHSEN[lower];
        // 3. Fallback: erste 2 Buchstaben
        return city.substring(0, 2).toUpperCase();
    }

    function findCol(el) {
        let cur = el;
        while (cur) { if (cur.className && /\bcol-(xs|sm|md|lg)-\d+\b/.test(cur.className)) return cur; cur = cur.parentElement; }
        return null;
    }
    function creditColor(v) {
        if (v >= 10000) return { text: '#000000', bg: '#ff7a00' };
        if (v >= 5000)  return { text: '#f0e5ff', bg: '#7a55a8' };
        if (v >= 2000)  return { text: '#dbe9f5', bg: '#3f6d9c' };
        if (v >= 1000)  return { text: '#dff0d8', bg: '#5a8a4a' };
        return { text: '#e4e0d8', bg: '#4a4438' };
    }
    function detectError(html) {
        if (!html) return null;
        if (/class="[^"]*alert-(danger|error|warning)[^"]*"/i.test(html)) {
            const m = html.match(/class="[^"]*alert-(danger|error|warning)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p|span)>/i);
            const t = m && m[2] ? m[2].replace(/<[^>]+>/g, '').trim() : '';
            return t ? t.slice(0, 200) : 'Server meldet Fehler';
        }
        const pats = [/nicht\s+genügend[^<]{0,120}/i, /zu\s+wenig[^<]{0,120}/i, /nicht\s+möglich[^<]{0,120}/i, /nicht\s+verfügbar[^<]{0,80}/i];
        for (const p of pats) { const m = html.match(p); if (m) return m[0].trim().slice(0, 200); }
        return null;
    }
    function centerToast(text, isError) {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${DESIGN.panel};border:2px solid ${isError ? '#a14040' : DESIGN.accent};border-radius:${DESIGN.radius};padding:12px 18px;font-family:${DESIGN.fontFamily};font-size:13px;font-weight:600;color:${DESIGN.text};z-index:10001;box-shadow:0 6px 20px rgba(0,0,0,.6);animation:lsh-fade-in .2s ease;max-width:340px;text-align:center;`;
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
    function hashText(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return String(h); }

    // ===== IN-PAGE MODAL (ersetzt confirm/alert) =====
    function showModal(title, bodyEl, buttons) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:10002;display:flex;align-items:center;justify-content:center;`;
        const modal = document.createElement('div');
        modal.style.cssText = `background:${DESIGN.panel};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:20px;max-width:420px;width:90%;font-family:${DESIGN.fontFamily};font-size:${DESIGN.font};color:${DESIGN.text};box-shadow:0 8px 30px rgba(0,0,0,.7);`;
        const titleEl = document.createElement('div');
        titleEl.style.cssText = `font-weight:600;font-size:14px;margin-bottom:12px;color:${DESIGN.text};`;
        titleEl.textContent = title;
        modal.appendChild(titleEl);
        modal.appendChild(bodyEl);
        const btnRow = document.createElement('div');
        btnRow.style.cssText = `display:flex;gap:8px;justify-content:flex-end;margin-top:16px;`;
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            btn.style.cssText = `background:${b.primary ? DESIGN.accent : 'transparent'};color:${b.primary ? DESIGN.accentText : DESIGN.textDim};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:6px 14px;font-size:12px;cursor:pointer;font-family:${DESIGN.fontFamily};font-weight:${b.primary ? '600' : '400'};`;
            btn.addEventListener('click', () => { overlay.remove(); if (b.action) b.action(); });
            btnRow.appendChild(btn);
        });
        modal.appendChild(btnRow);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        return overlay;
    }

    // ===== PANELS =====
    const panels = { module: null, settings: null };
    function buildShell(id, title) {
        const el = document.createElement('div');
        el.id = id;
        el.style.cssText = `position:fixed;top:70px;right:20px;width:560px;max-height:75vh;background:${DESIGN.panel};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};color:${DESIGN.text};font-family:${DESIGN.fontFamily};font-size:${DESIGN.font};z-index:9999;display:none;flex-direction:column;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.55);`;
        const head = document.createElement('div');
        head.className = 'lss-helfer-head';
        head.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid ${DESIGN.border};background:${DESIGN.bg};cursor:move;user-select:none;touch-action:none;`;
        head.innerHTML = `<span style="font-weight:600;display:flex;align-items:center;gap:6px;"><i class="ti ti-layout-sidebar" style="color:${DESIGN.accent};"></i>LSS-Helfer — ${title}</span><span class="lss-helfer-close" style="cursor:pointer;color:${DESIGN.textDim};font-size:18px;line-height:1;">&times;</span>`;
        el.appendChild(head);
        const body = document.createElement('div');
        body.className = 'lss-helfer-body';
        body.style.cssText = `padding:16px;overflow-y:auto;flex:1;`;
        el.appendChild(body);
        document.body.appendChild(el);
        makeDraggable(el, head);
        return el;
    }
    function makeDraggable(el, handle) {
        let dragging = false, ox = 0, oy = 0;
        function start(cx, cy) { dragging = true; const r = el.getBoundingClientRect(); ox = cx - r.left; oy = cy - r.top; el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.right = 'auto'; }
        function move(cx, cy) { if (!dragging) return; let x = cx - ox, y = cy - oy; const w = el.offsetWidth, h = el.offsetHeight; if (x < 0) x = 0; if (y < 0) y = 0; if (x > window.innerWidth - w) x = window.innerWidth - w; if (y > window.innerHeight - h) y = window.innerHeight - h; el.style.left = x + 'px'; el.style.top = y + 'px'; }
        handle.addEventListener('mousedown', (e) => { if (e.target.closest('.lss-helfer-close')) return; start(e.clientX, e.clientY); e.preventDefault(); });
        document.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
        document.addEventListener('mouseup', () => { dragging = false; });
        handle.addEventListener('touchstart', (e) => { if (e.target.closest('.lss-helfer-close')) return; const t = e.touches[0]; if (!t) return; start(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchmove', (e) => { if (!dragging) return; const t = e.touches[0]; if (!t) return; move(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchend', () => { dragging = false; });
        document.addEventListener('touchcancel', () => { dragging = false; });
    }

    function openPanel(which) {
        if (which === 'module') {
            if (!panels.module) { panels.module = buildShell('lss-helfer-module-panel', 'Module'); renderModuleList(); }
            panels.module.style.display = 'flex';
        } else if (which === 'settings') {
            if (!panels.settings) { panels.settings = buildShell('lss-helfer-settings-panel', 'Einstellungen'); renderSettings(); }
            panels.settings.style.display = 'flex';
        } else if (which === 'actions') {
            if (!Store.isModuleActive('lss-weite-aktionen')) return;
            AktionenModule.open();
        }
    }

    function renderModuleList() {
        if (!panels.module) return;
        const body = panels.module.querySelector('.lss-helfer-body');
        body.innerHTML = '';
        const list = Registry.all();
        if (list.length === 0) { body.innerHTML = `<div style="text-align:center;color:${DESIGN.textDim};padding:24px 0;">Keine Module vorhanden.</div>`; return; }
        const grid = document.createElement('div');
        grid.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;`;
        list.forEach(m => {
            const active = Store.isModuleActive(m.id);
            const tile = document.createElement('div');
            tile.style.cssText = `background:${DESIGN.bg};border:1px solid ${active ? DESIGN.accent : DESIGN.border};border-radius:${DESIGN.radius};padding:10px;display:flex;flex-direction:column;gap:6px;`;
            const top = document.createElement('div');
            top.style.cssText = `display:flex;align-items:center;gap:8px;`;
            top.innerHTML = `<i class="ti ${m.icon || 'ti-puzzle'}" style="color:${active ? DESIGN.accent : DESIGN.textDim};font-size:18px;"></i><span style="font-weight:600;">${m.name}</span>`;
            tile.appendChild(top);
            const desc = document.createElement('div');
            desc.style.cssText = `color:${DESIGN.textDim};font-size:11px;min-height:28px;`;
            desc.textContent = m.description || '';
            tile.appendChild(desc);
            const row = document.createElement('div');
            row.style.cssText = `display:flex;align-items:center;justify-content:space-between;margin-top:4px;`;
            row.innerHTML = `<span style="font-size:11px;color:${active ? DESIGN.accent : DESIGN.textDim};">${active ? 'Aktiv' : 'Inaktiv'}</span>`;
            const toggle = document.createElement('span');
            toggle.style.cssText = `position:relative;display:inline-block;width:34px;height:18px;border-radius:3px;cursor:pointer;background:${active ? DESIGN.accent : DESIGN.border};transition:background .15s;`;
            toggle.innerHTML = `<span style="position:absolute;top:2px;left:${active ? 18 : 2}px;width:14px;height:14px;background:${active ? DESIGN.accentText : DESIGN.textDim};border-radius:1px;transition:left .15s;"></span>`;
            toggle.addEventListener('click', () => {
                if (Store.isModuleActive(m.id)) Registry.deactivate(m.id); else Registry.activate(m.id);
                renderModuleList(); if (panels.settings) renderSettings();
            });
            row.appendChild(toggle); tile.appendChild(row); grid.appendChild(tile);
        });
        body.appendChild(grid);
    }

    function renderSettings() {
        if (!panels.settings) return;
        const body = panels.settings.querySelector('.lss-helfer-body');
        body.innerHTML = '';
        const mods = Registry.all().filter(m => typeof m.renderSettings === 'function');
        if (mods.length === 0) { body.innerHTML = `<div style="color:${DESIGN.textDim};text-align:center;padding:24px 0;">Keine Einstellungen verfügbar.</div>`; return; }
        mods.forEach(m => {
            const s = document.createElement('div');
            s.style.cssText = `margin-bottom:16px;padding:12px;background:${DESIGN.bg};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};`;
            try { m.renderSettings(s); } catch (e) { console.error(e); }
            body.appendChild(s);
        });
    }

    // ===== DROPDOWN =====
    let dropdownEl = null, navAnchorEl = null;
    function buildDropdown() {
        if (dropdownEl) { dropdownEl.remove(); dropdownEl = null; }
        const dd = document.createElement('div');
        dd.id = 'lss-helfer-dropdown';
        dd.style.cssText = `position:absolute;display:none;background:${DESIGN.panel};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};min-width:180px;z-index:10000;box-shadow:0 6px 20px rgba(0,0,0,.55);font-family:${DESIGN.fontFamily};font-size:${DESIGN.font};color:${DESIGN.text};overflow:hidden;`;
        const items = [
            { id: 'module', icon: 'ti-layout-grid', label: 'Module' },
            { id: 'settings', icon: 'ti-adjustments', label: 'Einstellungen' },
        ];
        if (Store.isModuleActive('lss-weite-aktionen')) {
            items.push({ id: 'actions', icon: 'ti-bolt', label: 'Aktionen' });
        }
        items.forEach(it => {
            const row = document.createElement('div');
            row.style.cssText = `padding:9px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;`;
            row.innerHTML = `<i class="ti ${it.icon}" style="color:${DESIGN.accent};"></i><span>${it.label}</span>`;
            row.addEventListener('mouseenter', () => { row.style.background = DESIGN.bg; });
            row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
            row.addEventListener('click', () => { hideDropdown(); openPanel(it.id); });
            dd.appendChild(row);
        });
        document.body.appendChild(dd);
        return dd;
    }
    function showDropdown(a) {
        dropdownEl = buildDropdown();
        const r = a.getBoundingClientRect();
        dropdownEl.style.left = (r.right + window.scrollX - 180) + 'px';
        dropdownEl.style.top = (r.bottom + window.scrollY + 4) + 'px';
        dropdownEl.style.display = 'block';
    }
    function hideDropdown() { if (dropdownEl) dropdownEl.style.display = 'none'; }
    function toggleDropdown(a) {
        if (dropdownEl && dropdownEl.style.display === 'block') { hideDropdown(); return; }
        showDropdown(a);
    }

    function addNavbarEntry() {
        let targetUl = null;
        const pl = document.querySelector('#menu_profile');
        if (pl) { const li = pl.closest('li'); if (li && li.parentElement && li.parentElement.tagName === 'UL') targetUl = li.parentElement; }
        if (!targetUl) { const uls = document.querySelectorAll('ul.nav.navbar-nav, ul.navbar-nav'); if (uls.length) targetUl = uls[uls.length-1]; }
        if (!targetUl) { const nt = document.querySelector('#navigation_top'); if (nt) targetUl = nt; }
        if (!targetUl) { console.error('[LSS-Helfer] Navbar nicht gefunden.'); return; }
        const isUl = targetUl.tagName.toLowerCase() === 'ul';
        const wrapper = document.createElement(isUl ? 'li' : 'div');
        wrapper.id = 'lss-helfer-nav-entry';
        const a = document.createElement('a');
        a.href = '#';
        a.style.cssText = `color:#ffffff;font-weight:500;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:15px;line-height:20px;`;
        a.innerHTML = '<i class="ti ti-layout-sidebar"></i><span>LSS-Helfer</span>';
        a.addEventListener('mouseenter', () => { a.style.color = '#d8d3c9'; });
        a.addEventListener('mouseleave', () => { a.style.color = '#ffffff'; });
        a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleDropdown(a); });
        wrapper.appendChild(a); targetUl.appendChild(wrapper); navAnchorEl = a;
        document.addEventListener('click', (e) => {
            if (!dropdownEl) return;
            if (dropdownEl.contains(e.target)) return;
            if (navAnchorEl && navAnchorEl.contains(e.target)) return;
            hideDropdown();
        });
    }
    document.addEventListener('click', (e) => {
        if (!e.target.classList || !e.target.classList.contains('lss-helfer-close')) return;
        const p = e.target.closest('div[id^="lss-helfer-"][id$="-panel"]');
        if (p) p.style.display = 'none';
    });

    // ===== MODUL: Verbesserte Einsatzliste =====
    const MISSION_FEATURES = [
        { id: 'karte', name: 'Karte ausblenden', default: true },
        { id: 'credits', name: 'Credits anzeigen', default: true },
        { id: 'beteiligung', name: 'Eigene Beteiligung (Verband/Event)', default: true },
    ];
    const MissionModule = {
        id: 'verbesserte-einsatzliste',
        name: 'Verbesserte Einsatzliste',
        description: 'Karte ausblenden, Credits, eigene Beteiligung',
        icon: 'ti-list-details',
        observer: null, localTimer: null, apiTimer: null,
        vehiclesByMission: new Map(), vehiclesPromise: null,
        isFeatureEnabled(f) { const x = MISSION_FEATURES.find(a => a.id === f); return Store.getFeature(this.id, f, x ? x.default : false); },
        setFeature(f, v) { Store.setFeature(this.id, f, v); if (Store.isModuleActive(this.id)) this.applyAll(); },
        onActivate() { this.applyAll(); this.startObserver(); this.startLocalTick(); this.startApiTick(); this.refreshVehicles(); },
        onDeactivate() { this.stopObserver(); this.stopLocalTick(); this.stopApiTick(); this.revertAll(); },
        applyAll() { if (this.isFeatureEnabled('karte')) this.applyKarte(); else this.revertKarte(); this.applyBadges(); },
        revertAll() { this.revertKarte(); this.clearBadges(); },
        applyKarte() {
            const m = document.querySelector('#map');
            if (m) { const c = findCol(m); if (c) c.style.display = 'none'; }
            const mo = document.querySelector('#missions_outer');
            if (mo) { const c = findCol(mo); if (c) { c.style.flex = '0 0 100%'; c.style.maxWidth = '100%'; c.style.width = '100%'; } }
        },
        revertKarte() {
            const m = document.querySelector('#map');
            if (m) { const c = findCol(m); if (c) c.style.display = ''; }
            const mo = document.querySelector('#missions_outer');
            if (mo) { const c = findCol(mo); if (c) { c.style.flex = ''; c.style.maxWidth = ''; c.style.width = ''; } }
        },
        isAllianceMission(caption) { return /\[\s*(?:Verband|Event)\s*\]/i.test(caption.textContent || ''); },
        applyBadges() {
            document.querySelectorAll('.missionSideBarEntry[mission_id]').forEach(entry => {
                const caption = entry.querySelector('[id^="mission_caption_"]') || entry;
                const mid = entry.getAttribute('mission_id');
                if (this.isFeatureEnabled('credits')) this.ensureCreditBadge(entry, caption); else this.removeBadge(entry, 'lss-helfer-credit-badge');
                const isAlliance = caption !== entry && this.isAllianceMission(caption);
                const vSet = this.vehiclesByMission.get(String(mid));
                const hasVehicle = !!(vSet && vSet.size > 0);
                if (this.isFeatureEnabled('beteiligung') && isAlliance && hasVehicle) this.ensureParticipationBadge(entry, caption);
                else this.removeBadge(entry, 'lss-helfer-participation-badge');
            });
        },
        ensureCreditBadge(entry, caption) {
            if (entry.querySelector('.lss-helfer-credit-badge')) return;
            const sortable = entry.getAttribute('data-sortable-by');
            if (!sortable) return;
            let credits = null;
            try { const decoded = sortable.replace(/&quot;/g, '"').replace(/&amp;/g, '&'); const d = JSON.parse(decoded); if (d && d.average_credits) credits = d.average_credits; } catch { return; }
            if (!credits) return;
            const c = creditColor(credits);
            const badge = document.createElement('span');
            badge.className = 'lss-helfer-credit-badge';
            badge.textContent = '~ ' + Math.round(credits).toLocaleString('de-DE') + ' Cr';
            badge.style.cssText = `display:inline-block;padding:1px 6px;margin-left:6px;border-radius:2px;font-size:10px;font-weight:600;white-space:nowrap;vertical-align:middle;color:${c.text};background:${c.bg};`;
            caption.appendChild(badge);
        },
        ensureParticipationBadge(entry, caption) {
            if (entry.querySelector('.lss-helfer-participation-badge')) return;
            const badge = document.createElement('span');
            badge.className = 'lss-helfer-participation-badge';
            badge.innerHTML = '<i class="ti ti-check"></i>';
            badge.title = 'Eigenes Fahrzeug im Einsatz';
            badge.style.cssText = `display:inline-block;padding:1px 5px;margin-right:6px;border-radius:2px;font-size:10px;font-weight:700;background:#ffffff;color:#000000;border:1px solid #000000;white-space:nowrap;vertical-align:middle;`;
            caption.insertBefore(badge, caption.firstChild);
        },
        removeBadge(entry, cls) { const b = entry.querySelector('.' + cls); if (b) b.remove(); },
        clearBadges() { document.querySelectorAll('.lss-helfer-credit-badge, .lss-helfer-participation-badge').forEach(b => b.remove()); },
        async refreshVehicles() {
            if (this.vehiclesPromise) return this.vehiclesPromise;
            this.vehiclesPromise = (async () => {
                const map = new Map();
                let url = '/api/v2/vehicles?limit=1000';
                try {
                    while (url) {
                        const res = await apiGet(url);
                        if (!res.ok) { console.warn('[LSS-Helfer] Fahrzeug-Abfrage HTTP', res.status); break; }
                        const data = await res.json();
                        if (Array.isArray(data.result)) data.result.forEach(v => {
                            let mid = null;
                            if (v.target && typeof v.target.type === 'string' && v.target.type.indexOf('mission') !== -1) mid = v.target.id;
                            else if (v.target_type === 'mission') mid = v.target_id;
                            else if (v.mission_id != null) mid = v.mission_id;
                            if (mid != null && mid > 0) { const k = String(mid); if (!map.has(k)) map.set(k, new Set()); map.get(k).add(String(v.id)); }
                        });
                        const next = data.paging && data.paging.next_page;
                        if (!next) break;
                        url = (typeof next === 'string' && (next.charAt(0) === '/' || next.indexOf('http') === 0)) ? next : '/api/v2/vehicles?limit=1000&page=' + next;
                    }
                } catch (e) { console.warn('[LSS-Helfer] Fahrzeug-Abfrage fehlgeschlagen.', e); }
                this.vehiclesByMission = map;
                this.vehiclesPromise = null;
                if (Store.isModuleActive(this.id)) this.applyBadges();
            })();
            return this.vehiclesPromise;
        },
        startLocalTick() { if (this.localTimer) return; this.localTimer = setInterval(() => { if (Store.isModuleActive(this.id)) this.applyBadges(); }, 2000); },
        stopLocalTick() { if (this.localTimer) { clearInterval(this.localTimer); this.localTimer = null; } },
        startApiTick() { if (this.apiTimer) return; this.apiTimer = setInterval(() => { if (Store.isModuleActive(this.id)) this.refreshVehicles(); }, 60000); },
        stopApiTick() { if (this.apiTimer) { clearInterval(this.apiTimer); this.apiTimer = null; } },
        startObserver() {
            if (this.observer) return;
            const t = document.querySelector('#missions_outer') || document.body;
            this.observer = new MutationObserver(() => {
                if (!Store.isModuleActive(this.id)) return;
                if (this.isFeatureEnabled('karte')) this.applyKarte();
                this.applyBadges();
            });
            this.observer.observe(t, { childList: true, subtree: true });
        },
        stopObserver() { if (this.observer) { this.observer.disconnect(); this.observer = null; } },
        renderSettings(container) {
            const head = document.createElement('div');
            head.style.cssText = `font-weight:600;margin-bottom:10px;color:${DESIGN.text};display:flex;align-items:center;gap:6px;`;
            head.innerHTML = `<i class="ti ${this.icon}" style="color:${DESIGN.accent};"></i>${this.name}`;
            container.appendChild(head);
            MISSION_FEATURES.forEach(f => {
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-top:1px solid ${DESIGN.border};`;
                const label = document.createElement('span'); label.textContent = f.name; label.style.color = DESIGN.textDim; row.appendChild(label);
                const en = Store.getFeature(this.id, f.id, f.default);
                const t = document.createElement('span');
                t.style.cssText = `position:relative;display:inline-block;width:34px;height:18px;border-radius:3px;cursor:pointer;background:${en ? DESIGN.accent : DESIGN.border};transition:background .15s;`;
                t.innerHTML = `<span style="position:absolute;top:2px;left:${en ? 18 : 2}px;width:14px;height:14px;background:${en ? DESIGN.accentText : DESIGN.textDim};border-radius:1px;transition:left .15s;"></span>`;
                t.addEventListener('click', () => { this.setFeature(f.id, !Store.getFeature(this.id, f.id, f.default)); renderSettings(); });
                row.appendChild(t); container.appendChild(row);
            });
        },
    };

    // ===== MODUL: Sprechwunsch-Helfer (flackerfrei + auto-hide) =====
    const SprechModule = {
        id: 'sprechwunsch-helfer',
        name: 'Sprechwunsch-Helfer',
        description: 'Offene Sprechwünsche, Senden zum nächsten Ziel',
        icon: 'ti-urgent',
        pollTimer: null,
        popupEl: null, listEl: null, countEl: null, moreEl: null, emptyEl: null,
        rowEls: new Map(),
        seen: new Map(),
        sent: new Map(),
        isHover: false,
        visible: false,

        onActivate() {
            this.seen.clear(); this.sent.clear(); this.rowEls.clear();
            this.buildPopup();
            this.poll();
            this.pollTimer = setInterval(() => this.poll(), 2000);
        },
        onDeactivate() {
            if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
            if (this.popupEl) { this.popupEl.remove(); this.popupEl = null; }
            this.rowEls.clear(); this.seen.clear(); this.sent.clear();
            this.visible = false;
        },
        buildPopup() {
            if (this.popupEl) return;
            const el = document.createElement('div');
            el.id = 'lss-helfer-sprech-popup';
            el.style.cssText = `position:fixed;top:20px;left:20px;z-index:9998;background:${DESIGN.panel};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:10px;width:270px;font-family:${DESIGN.fontFamily};font-size:11px;color:${DESIGN.text};box-shadow:0 4px 14px rgba(0,0,0,.5);opacity:.5;transition:opacity .2s;display:none;`;
            el.addEventListener('mouseenter', () => { el.style.opacity = '1'; this.isHover = true; });
            el.addEventListener('mouseleave', () => { el.style.opacity = '.5'; this.isHover = false; this.poll(); });
            const head = document.createElement('div');
            head.style.cssText = `font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;`;
            head.innerHTML = `<span>Sprechwünsche</span><span class="lsh-count" style="color:${DESIGN.accent};">0</span>`;
            el.appendChild(head);
            const list = document.createElement('div');
            list.className = 'lsh-list';
            list.style.cssText = `display:flex;flex-direction:column;gap:6px;`;
            el.appendChild(list);
            const more = document.createElement('div');
            more.className = 'lsh-more';
            more.style.cssText = `margin-top:6px;text-align:center;font-size:10px;color:${DESIGN.textDim};display:none;`;
            el.appendChild(more);
            document.body.appendChild(el);
            this.popupEl = el;
            this.listEl = list;
            this.countEl = head.querySelector('.lsh-count');
            this.moreEl = more;
        },
        findRadioEntries() {
            const result = [];
            const handled = new Set();
            const selectors = ['#radio_messages_important > li','#radio_messages > li','#radio_messages_important li','#radio_messages li','[id*="radio_messages"] li'];
            selectors.forEach(sel => {
                let nodes; try { nodes = document.querySelectorAll(sel); } catch { return; }
                nodes.forEach(li => {
                    if (handled.has(li)) return; handled.add(li);
                    let isFms5 = false;
                    const cls = li.className || '';
                    if (/building_list_fms_5|(^|\s)fms_5(\s|$)/.test(cls)) isFms5 = true;
                    if (!isFms5 && li.querySelector('[class*="fms_5"]')) isFms5 = true;
                    if (!isFms5) { const txt = (li.textContent || '').toLowerCase(); if (/\bsprechwunsch\b/.test(txt)) isFms5 = true; }
                    if (!isFms5) return;
                    const vid = this.extractVehicleId(li);
                    result.push({ li, vid: vid ? String(vid) : null, text: (li.textContent || '').trim() });
                });
            });
            return result;
        },
        extractVehicleId(li) {
            const img = li.querySelector('img.vehicle_search[vehicle_id]');
            if (img) return img.getAttribute('vehicle_id');
            const dv = li.querySelector('[data-vehicle-id]');
            if (dv) return dv.getAttribute('data-vehicle-id');
            const a = li.querySelector('a[href*="/vehicles/"]');
            if (a) { const m = a.getAttribute('href').match(/\/vehicles\/(\d+)/); if (m) return m[1]; }
            if (li.hasAttribute('data-vehicle-id')) return li.getAttribute('data-vehicle-id');
            if (li.hasAttribute('vehicle_id')) return li.getAttribute('vehicle_id');
            const m = li.outerHTML.match(/\/vehicles\/(\d+)/);
            if (m) return m[1];
            return null;
        },
        extractVehicleName(li) {
            const a = li.querySelector('a[href*="/vehicles/"]');
            if (a && a.textContent.trim()) return a.textContent.trim();
            const n = li.querySelector('.vehicle_name, .caption, strong');
            if (n && n.textContent.trim()) return n.textContent.trim();
            return null;
        },
        poll() {
            if (!Store.isModuleActive(this.id)) return;
            const now = Date.now();
            for (const [k, ts] of this.sent) if (now - ts > 5 * 60 * 1000) this.sent.delete(k);
            const entries = this.findRadioEntries();
            const currentKeys = new Set();
            entries.forEach(e => {
                const key = e.vid || ('t_' + hashText(e.text));
                currentKeys.add(key);
                if (this.sent.has(key)) return;
                if (!this.seen.has(key)) {
                    this.seen.set(key, {
                        discovered: now, vid: e.vid,
                        name: e.vid ? (this.extractVehicleName(e.li) || ('Fahrzeug ' + e.vid)) : (e.text.substring(0, 50) || 'Unbekannt'),
                    });
                }
            });
            for (const k of Array.from(this.seen.keys())) {
                if (!currentKeys.has(k) && !this.sent.has(k)) this.seen.delete(k);
            }
            this.renderPopup();
        },
        renderPopup() {
            if (!this.popupEl) return;
            const items = Array.from(this.seen.entries()).filter(([k]) => !this.sent.has(k)).sort((a, b) => a[1].discovered - b[1].discovered);
            const countStr = String(items.length);
            if (this.countEl.textContent !== countStr) this.countEl.textContent = countStr;

            if (items.length === 0 && !this.isHover) {
                if (this.visible) { this.popupEl.style.display = 'none'; this.visible = false; }
                for (const [, rowData] of this.rowEls) rowData.el.remove();
                this.rowEls.clear();
                return;
            }
            if (!this.visible) { this.popupEl.style.display = 'block'; this.visible = true; }

            if (this.isHover) return;

            const visible = items.slice(0, 3);
            const visibleKeys = new Set(visible.map(([k]) => k));

            for (const [key, rowData] of Array.from(this.rowEls)) {
                if (!visibleKeys.has(key)) { rowData.el.remove(); this.rowEls.delete(key); }
            }

            visible.forEach(([key, info], idx) => {
                let rowData = this.rowEls.get(key);
                if (!rowData) {
                    rowData = this.createRow(key, info);
                    this.rowEls.set(key, rowData);
                } else if (rowData.nameHash !== info.name) {
                    rowData.nameEl.textContent = info.name;
                    rowData.nameEl.title = info.name;
                    rowData.nameHash = info.name;
                }
                const currentIdx = Array.from(this.listEl.children).indexOf(rowData.el);
                if (currentIdx !== idx) {
                    if (idx >= this.listEl.children.length) this.listEl.appendChild(rowData.el);
                    else this.listEl.insertBefore(rowData.el, this.listEl.children[idx]);
                }
            });

            if (items.length > 3) {
                const t = '+ ' + (items.length - 3) + ' weitere';
                if (this.moreEl.textContent !== t) this.moreEl.textContent = t;
                if (this.moreEl.style.display !== 'block') this.moreEl.style.display = 'block';
            } else {
                if (this.moreEl.style.display !== 'none') this.moreEl.style.display = 'none';
            }
        },
        createRow(key, info) {
            const el = document.createElement('div');
            el.style.cssText = `display:flex;align-items:center;gap:6px;padding:6px;background:${DESIGN.bg};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};animation:lsh-slide-in .2s ease;`;
            const nameEl = document.createElement('div');
            nameEl.style.cssText = `flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${DESIGN.text};`;
            nameEl.textContent = info.name;
            nameEl.title = info.name;
            el.appendChild(nameEl);
            const btn = document.createElement('button');
            btn.textContent = 'Senden';
            btn.style.cssText = `background:${DESIGN.accent};color:${DESIGN.accentText};border:none;border-radius:${DESIGN.radius};padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:${DESIGN.fontFamily};`;
            if (!info.vid) {
                btn.disabled = true; btn.style.opacity = '.4'; btn.style.cursor = 'not-allowed'; btn.title = 'Fahrzeug-ID nicht erkannt';
            } else {
                btn.addEventListener('click', async () => {
                    btn.disabled = true; btn.textContent = '…'; btn.style.opacity = '.6'; btn.style.cursor = 'wait';
                    try {
                        const result = await this.sendVehicle(info.vid);
                        this.sent.set(key, Date.now());
                        this.seen.delete(key);
                        centerToast((result.kind === 'patient' ? 'Patient' : 'Gefangener') + ' → ' + result.name, false);
                        this.poll();
                    } catch (err) {
                        console.error('[LSS-Helfer] Senden:', err);
                        centerToast('Fehler: ' + (err.message || 'unbekannt'), true);
                        btn.disabled = false; btn.textContent = 'Senden'; btn.style.opacity = ''; btn.style.cursor = 'pointer';
                    }
                });
            }
            el.appendChild(btn);
            return { el, nameEl, nameHash: info.name };
        },
        async sendVehicle(vid) {
            const vRes = await apiGet('/vehicles/' + vid);
            if (!vRes.ok) throw new Error('Fahrzeugseite HTTP ' + vRes.status);
            const vHtml = await vRes.text();
            const doc = new DOMParser().parseFromString(vHtml, 'text/html');
            const trEls = doc.querySelectorAll('[data-transport-request-type]');
            const trType = trEls.length ? trEls[trEls.length - 1].getAttribute('data-transport-request-type') : null;
            const vtEl = doc.querySelector('[data-vehicle-type]');
            const vType = vtEl ? vtEl.getAttribute('data-vehicle-type') : '';
            const vnEl = doc.querySelector('#vehicle_caption, h1, .vehicle_name');
            const vName = vnEl ? (vnEl.textContent || '').trim() : '';
            const isGefKw = /gefkw|prisoner|gefangenen/i.test(vType) || /GefKw|Gefangenenkraftwagen/i.test(vName);
            let kind = null;
            if (trType) { if (/patient/i.test(trType)) kind = 'patient'; else if (/prison|gefangen/i.test(trType)) kind = 'prisoner'; }
            if (!kind) kind = isGefKw ? 'prisoner' : 'patient';
            let targetUrl = null, targetName = null;
            if (kind === 'patient') {
                const links = doc.querySelectorAll('a[href*="/patient/"]');
                const candidates = [];
                links.forEach(link => {
                    const row = link.closest('tr, li') || link.parentElement;
                    if (!row) return;
                    const rowText = row.textContent || '';
                    const dm = rowText.match(/([\d.,]+)\s*km/i);
                    const cm = rowText.match(/(\d+)\s*%/);
                    const nameEl = row.querySelector('a:not([href*="/patient/"]), strong');
                    const hName = nameEl ? (nameEl.textContent || '').trim() : rowText.trim().substring(0, 40);
                    candidates.push({ url: link.getAttribute('href'), name: hName, distance: dm ? parseFloat(dm[1].replace(',', '.')) : 9999, capacity: cm ? parseInt(cm[1], 10) : 100 });
                });
                if (candidates.length === 0) throw new Error('Kein Krankenhaus gefunden');
                candidates.sort((a, b) => a.distance - b.distance);
                const best = candidates.find(c => c.capacity > 0) || candidates[0];
                targetUrl = best.url; targetName = best.name;
            } else {
                const missionLink = doc.querySelector('a[href^="/missions/"]');
                let missionId = null;
                if (missionLink) { const m = missionLink.getAttribute('href').match(/\/missions\/(\d+)/); if (m) missionId = m[1]; }
                if (!missionId) throw new Error('Missions-ID nicht gefunden');
                const pRes = await apiGet('/building/load_prisons?mission_id=' + missionId);
                if (!pRes.ok) throw new Error('Gefängnisliste HTTP ' + pRes.status);
                const pData = await pRes.json();
                const prisons = [...(pData.prisons || []), ...(pData.alliance_prisons || [])];
                if (prisons.length === 0) throw new Error('Kein Gefängnis gefunden');
                prisons.sort((a, b) => a.distance_in_km - b.distance_in_km);
                const best = prisons.find(p => p.free_cells > 0) || prisons[0];
                targetUrl = '/vehicles/' + vid + '/gefangener/' + best.id + '?load_all_prisons=false&show_only_available=false';
                targetName = best.name;
            }
            const sRes = await apiGet(targetUrl);
            if (!sRes.ok) throw new Error('Zuweisung HTTP ' + sRes.status);
            const sHtml = await sRes.text();
            const err = detectError(sHtml);
            if (err) throw new Error(err);
            return { kind, name: targetName };
        },
        debugSprech() {
            console.log('=== Sprechwunsch Debug ===');
            const all = document.querySelectorAll('#radio_messages_important li, #radio_messages li, [id*="radio_messages"] li');
            console.log('Gesamt li-Einträge:', all.length);
            const entries = this.findRadioEntries();
            console.log('Erkannte Sprechwünsche:', entries.length);
        },
    };

    // ===== MODUL: LSS-weite Aktionen =====
    const AktionenModule = {
        id: 'lss-weite-aktionen',
        name: 'LSS-weite Aktionen',
        description: 'Wachentypen umschalten, manuelles Werben, Umbenennen',
        icon: 'ti-bolt',
        panelEl: null,
        buildings: [],
        buildingsLoaded: false,
        activeTab: 'toggle',
        running: false,
        abortFlag: false,
        progressStatus: null,
        progressFill: null,
        // Zustand
        toggleTarget: 'off',
        toggleTypes: new Set(),
        renameTypes: new Set(),
        buildingTemplate: '{typ} {stadt} {nummer}',
        vehicleTemplate: '{stadtkuerzel} {typ} {nummer}',
        alsoRenameVehicles: true,

        onActivate() {},
        onDeactivate() {
            if (this.panelEl) { this.panelEl.remove(); this.panelEl = null; }
            this.running = false;
            this.abortFlag = true;
        },

        open() {
            if (!this.panelEl) this.panelEl = buildShell('lss-helfer-aktionen-panel', 'LSS-weite Aktionen');
            this.panelEl.style.display = 'flex';
            this.loadState();
            if (!this.buildingsLoaded) this.loadBuildings().then(() => this.render());
            else this.render();
        },

        loadState() {
            const st = Store.loadAktionState();
            if (st.toggleTarget) this.toggleTarget = st.toggleTarget;
            if (Array.isArray(st.toggleTypes)) this.toggleTypes = new Set(st.toggleTypes);
            if (Array.isArray(st.renameTypes)) this.renameTypes = new Set(st.renameTypes);
            if (st.buildingTemplate !== undefined) this.buildingTemplate = st.buildingTemplate;
            if (st.vehicleTemplate !== undefined) this.vehicleTemplate = st.vehicleTemplate;
            if (st.alsoRenameVehicles !== undefined) this.alsoRenameVehicles = st.alsoRenameVehicles;
        },
        saveState() {
            Store.saveAktionState({
                toggleTarget: this.toggleTarget,
                toggleTypes: Array.from(this.toggleTypes),
                renameTypes: Array.from(this.renameTypes),
                buildingTemplate: this.buildingTemplate,
                vehicleTemplate: this.vehicleTemplate,
                alsoRenameVehicles: this.alsoRenameVehicles,
            });
        },

        async loadBuildings() {
            try {
                const res = await apiGet('/api/buildings');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                this.buildings = await res.json();
                this.buildingsLoaded = true;
            } catch (e) { console.error('[LSS-Helfer] Gebäude laden:', e); }
        },

        render() {
            if (!this.panelEl) return;
            const body = this.panelEl.querySelector('.lss-helfer-body');
            body.innerHTML = '';
            if (this.running) { this.renderProgress(body); return; }

            const tabsEl = document.createElement('div');
            tabsEl.style.cssText = `display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid ${DESIGN.border};padding-bottom:8px;flex-wrap:wrap;`;
            [{ id: 'toggle', label: 'Wachentypen umschalten' }, { id: 'hire', label: 'Werbung' }, { id: 'rename', label: 'Umbenennen' }].forEach(t => {
                const btn = document.createElement('button');
                btn.textContent = t.label;
                const active = this.activeTab === t.id;
                btn.style.cssText = `background:${active ? DESIGN.accent : 'transparent'};color:${active ? DESIGN.accentText : DESIGN.textDim};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:6px 10px;font-size:11px;cursor:pointer;font-family:${DESIGN.fontFamily};`;
                btn.addEventListener('click', () => { this.activeTab = t.id; this.render(); });
                tabsEl.appendChild(btn);
            });
            body.appendChild(tabsEl);

            if (this.activeTab === 'toggle') this.renderToggle(body);
            else if (this.activeTab === 'hire') this.renderHire(body);
            else if (this.activeTab === 'rename') this.renderRename(body);
        },

        renderProgress(body) {
            const c = document.createElement('div');
            c.style.cssText = `padding:24px 12px;text-align:center;`;
            const st = document.createElement('div');
            st.className = 'prog-status';
            st.style.cssText = `margin-bottom:12px;color:${DESIGN.text};`;
            st.textContent = 'Vorbereitung…';
            c.appendChild(st);
            const bar = document.createElement('div');
            bar.style.cssText = `height:8px;background:${DESIGN.border};border-radius:4px;overflow:hidden;margin-bottom:12px;`;
            const fill = document.createElement('div');
            fill.className = 'prog-fill';
            fill.style.cssText = `height:100%;width:0;background:${DESIGN.accent};transition:width .2s;`;
            bar.appendChild(fill);
            c.appendChild(bar);
            const abort = document.createElement('button');
            abort.textContent = 'Abbrechen';
            abort.style.cssText = `background:#a14040;color:#fff;border:none;border-radius:${DESIGN.radius};padding:6px 14px;font-size:11px;cursor:pointer;font-family:${DESIGN.fontFamily};`;
            abort.addEventListener('click', () => { this.abortFlag = true; });
            c.appendChild(abort);
            body.appendChild(c);
            this.progressStatus = st;
            this.progressFill = fill;
        },
        updateProgress(text, current, total) {
            if (this.progressStatus) this.progressStatus.textContent = text;
            if (this.progressFill) this.progressFill.style.width = ((current / total) * 100) + '%';
        },

        // ===== Werkzeug 1: Wachentypen umschalten (Toggle-Switches) =====
        renderToggle(body) {
            const info = document.createElement('div');
            info.style.cssText = `color:${DESIGN.textDim};font-size:11px;margin-bottom:12px;line-height:1.4;`;
            info.textContent = 'Wähle Wachentypen per Toggle. Alle Wachen des Typs werden umgeschaltet. Wachen im Zielzustand werden übersprungen.';
            body.appendChild(info);

            const targetRow = document.createElement('div');
            targetRow.style.cssText = `display:flex;gap:10px;margin-bottom:12px;align-items:center;`;
            targetRow.innerHTML = `<span style="color:${DESIGN.text};font-weight:600;">Ziel:</span>`;
            [{ v: 'on', l: 'Aktivieren' }, { v: 'off', l: 'Deaktivieren' }].forEach(o => {
                const lab = document.createElement('label');
                lab.style.cssText = `display:flex;align-items:center;gap:4px;cursor:pointer;color:${DESIGN.textDim};font-size:11px;`;
                const r = document.createElement('input');
                r.type = 'radio'; r.name = 'toggleTarget';
                r.checked = this.toggleTarget === o.v;
                r.addEventListener('change', () => { this.toggleTarget = o.v; this.saveState(); });
                lab.appendChild(r); lab.appendChild(document.createTextNode(o.l));
                targetRow.appendChild(lab);
            });
            body.appendChild(targetRow);

            if (!this.buildingsLoaded) {
                body.insertAdjacentHTML('beforeend', `<div style="color:${DESIGN.textDim};padding:12px;text-align:center;">Lade Gebäude…</div>`);
                return;
            }

            const typeStats = {};
            this.buildings.forEach(b => {
                const t = b.building_type;
                if (!typeStats[t]) typeStats[t] = { total: 0, enabled: 0, disabled: 0 };
                typeStats[t].total++;
                if (b.enabled !== false) typeStats[t].enabled++;
                else typeStats[t].disabled++;
            });

            const typeList = document.createElement('div');
            typeList.style.cssText = `background:${DESIGN.bg};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:8px;max-height:280px;overflow-y:auto;`;

            Object.keys(typeStats).map(Number).sort((a, b) => a - b).forEach(t => {
                const s = typeStats[t];
                const checked = this.toggleTypes.has(t);
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 4px;border-bottom:1px solid ${DESIGN.border};`;
                const left = document.createElement('div');
                left.style.cssText = `display:flex;flex-direction:column;gap:2px;`;
                const nameEl = document.createElement('span');
                nameEl.style.cssText = `color:${DESIGN.text};font-size:12px;font-weight:500;`;
                nameEl.textContent = BUILDING_TYPE_SHORT[t] || ('Typ ' + t);
                left.appendChild(nameEl);
                const statEl = document.createElement('span');
                statEl.style.cssText = `color:${DESIGN.textDim};font-size:10px;`;
                statEl.textContent = `${s.total} Wachen (${s.enabled} aktiv, ${s.disabled} inaktiv)`;
                left.appendChild(statEl);
                row.appendChild(left);

                const toggle = document.createElement('span');
                toggle.style.cssText = `position:relative;display:inline-block;width:36px;height:20px;border-radius:3px;cursor:pointer;background:${checked ? DESIGN.accent : DESIGN.border};transition:background .15s;flex-shrink:0;`;
                toggle.innerHTML = `<span style="position:absolute;top:2px;left:${checked ? 18 : 2}px;width:16px;height:16px;background:${checked ? DESIGN.accentText : DESIGN.textDim};border-radius:2px;transition:left .15s;"></span>`;
                toggle.addEventListener('click', () => {
                    if (this.toggleTypes.has(t)) this.toggleTypes.delete(t); else this.toggleTypes.add(t);
                    this.saveState();
                    this.render();
                });
                row.appendChild(toggle);
                typeList.appendChild(row);
            });
            body.appendChild(typeList);

            const sumRow = document.createElement('div');
            sumRow.style.cssText = `margin-top:8px;color:${DESIGN.textDim};font-size:11px;`;
            const totalSelected = Array.from(this.toggleTypes).reduce((acc, t) => acc + (typeStats[t] ? typeStats[t].total : 0), 0);
            sumRow.textContent = `${this.toggleTypes.size} Typen ausgewählt → ${totalSelected} Wachen betroffen`;
            body.appendChild(sumRow);

            const runRow = document.createElement('div');
            runRow.style.cssText = `margin-top:12px;`;
            const runBtn = document.createElement('button');
            runBtn.textContent = 'Ausführen';
            runBtn.style.cssText = `background:${DESIGN.accent};color:${DESIGN.accentText};border:none;border-radius:${DESIGN.radius};padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:${DESIGN.fontFamily};`;
            runBtn.addEventListener('click', () => this.runToggle());
            runRow.appendChild(runBtn);
            body.appendChild(runRow);
        },

        async runToggle() {
            const targetState = this.toggleTarget === 'on';
            const targets = this.buildings.filter(b => this.toggleTypes.has(b.building_type));
            const toToggle = targets.filter(b => { const isActive = b.enabled !== false; return isActive !== targetState; });
            if (toToggle.length === 0) { centerToast('Alle ausgewählten Wachen bereits im Zielzustand.', false); return; }

            const content = document.createElement('div');
            content.style.cssText = `color:${DESIGN.textDim};font-size:12px;line-height:1.5;`;
            content.textContent = `${toToggle.length} Wachen ${targetState ? 'aktivieren' : 'deaktivieren'}?`;
            showModal('Bestätigung', content, [
                { label: 'Abbrechen' },
                { label: 'Ja, ausführen', primary: true, action: async () => {
                    this.running = true; this.abortFlag = false; this.render();
                    let ok = 0, fail = 0;
                    for (let i = 0; i < toToggle.length; i++) {
                        if (this.abortFlag) break;
                        this.updateProgress(`${i + 1}/${toToggle.length}: ${toToggle[i].caption}`, i + 1, toToggle.length);
                        try { const res = await apiGet('/buildings/' + toToggle[i].id + '/active'); if (res.ok) ok++; else fail++; }
                        catch { fail++; }
                        if (i < toToggle.length - 1) await sleep(400);
                    }
                    this.running = false;
                    await this.loadBuildings();
                    this.render();
                    centerToast(`${ok} umgeschaltet${fail ? ', ' + fail + ' Fehler' : ''}`, fail > 0);
                }},
            ]);
        },

        // ===== Werkzeug 2: Werbung (manuell pro Wache) =====
        renderHire(body) {
            if (!this.buildingsLoaded) {
                body.insertAdjacentHTML('beforeend', `<div style="color:${DESIGN.textDim};padding:12px;text-align:center;">Lade Gebäude…</div>`);
                return;
            }
            const info = document.createElement('div');
            info.style.cssText = `color:${DESIGN.textDim};font-size:11px;margin-bottom:12px;line-height:1.4;`;
            info.textContent = 'Klicke „Werben“ bei einer Wache, um 3 Tage Personalwerbung manuell zu starten. Bereits laufende Werbung wird serverseitig ignoriert.';
            body.appendChild(info);

            const list = document.createElement('div');
            list.style.cssText = `background:${DESIGN.bg};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:8px;max-height:360px;overflow-y:auto;`;

            this.buildings.forEach(b => {
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 4px;border-bottom:1px solid ${DESIGN.border};gap:8px;`;
                const name = document.createElement('span');
                name.style.cssText = `flex:1;color:${DESIGN.text};font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
                name.textContent = b.caption;
                row.appendChild(name);

                const btn = document.createElement('button');
                btn.textContent = 'Werben';
                btn.style.cssText = `background:transparent;color:${DESIGN.accent};border:1px solid ${DESIGN.accent};border-radius:${DESIGN.radius};padding:3px 10px;font-size:10px;font-weight:600;cursor:pointer;font-family:${DESIGN.fontFamily};flex-shrink:0;`;
                btn.addEventListener('click', async () => {
                    btn.disabled = true; btn.textContent = '…'; btn.style.opacity = '.5';
                    try {
                        const res = await apiGet('/buildings/' + b.id + '/hire_do/3');
                        if (res.ok) {
                            const html = await res.text();
                            const err = detectError(html);
                            if (err) { centerToast('Fehler: ' + err, true); btn.textContent = 'Werben'; btn.disabled = false; btn.style.opacity = ''; }
                            else { centerToast('Werbung gestartet: ' + b.caption, false); btn.textContent = '✓'; btn.style.color = '#5a8a4a'; btn.style.borderColor = '#5a8a4a'; }
                        } else { centerToast('HTTP ' + res.status, true); btn.textContent = 'Werben'; btn.disabled = false; btn.style.opacity = ''; }
                    } catch (e) { centerToast('Fehler: ' + e.message, true); btn.textContent = 'Werben'; btn.disabled = false; btn.style.opacity = ''; }
                    await sleep(400);
                });
                row.appendChild(btn);
                list.appendChild(row);
            });
            body.appendChild(list);
        },

        // ===== Werkzeug 3: Umbenennen (nur Wachentypen) =====
        renderRename(body) {
            const codeSpan = (txt) => `<span class="lsh-tpl-code">${txt}</span>`;

            const info = document.createElement('div');
            info.style.cssText = `color:${DESIGN.textDim};font-size:11px;margin-bottom:10px;line-height:1.7;`;
            info.innerHTML = `<b style="color:${DESIGN.text};">Gebäude:</b> ${codeSpan('{typ}')} ${codeSpan('{stadt}')} ${codeSpan('{stadtkuerzel}')} ${codeSpan('{nummer}')} ${codeSpan('{leitstelle}')} ${codeSpan('{alt}')}<br>
                <b style="color:${DESIGN.text};">Fahrzeuge:</b> ${codeSpan('{typ}')} ${codeSpan('{stadt}')} ${codeSpan('{stadtkuerzel}')} ${codeSpan('{nummer}')} ${codeSpan('{wache}')} ${codeSpan('{alt}')}`;
            body.appendChild(info);

            const makeInput = (label, val, cb) => {
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:8px;`;
                const l = document.createElement('span');
                l.textContent = label;
                l.style.cssText = `width:120px;color:${DESIGN.textDim};font-size:11px;`;
                const i = document.createElement('input');
                i.type = 'text'; i.value = val;
                i.style.cssText = `flex:1;background:${DESIGN.bg};color:${DESIGN.text};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:5px 8px;font-size:11px;font-family:${DESIGN.mono};`;
                i.addEventListener('input', () => { cb(i.value); this.saveState(); this.updatePreview(); });
                row.appendChild(l); row.appendChild(i);
                return row;
            };
            body.appendChild(makeInput('Gebäude-Muster', this.buildingTemplate, v => this.buildingTemplate = v));
            body.appendChild(makeInput('Fahrzeug-Muster', this.vehicleTemplate, v => this.vehicleTemplate = v));

            const vRow = document.createElement('label');
            vRow.style.cssText = `display:flex;align-items:center;gap:6px;margin:8px 0;cursor:pointer;color:${DESIGN.textDim};font-size:11px;`;
            const vCb = document.createElement('input');
            vCb.type = 'checkbox'; vCb.checked = this.alsoRenameVehicles;
            vCb.addEventListener('change', () => { this.alsoRenameVehicles = vCb.checked; this.saveState(); this.updatePreview(); });
            vRow.appendChild(vCb);
            vRow.appendChild(document.createTextNode('Fahrzeuge ebenfalls umbenennen'));
            body.appendChild(vRow);

            if (!this.buildingsLoaded) {
                body.insertAdjacentHTML('beforeend', `<div style="color:${DESIGN.textDim};padding:12px;text-align:center;">Lade Gebäude…</div>`);
                return;
            }

            const typeStats = {};
            this.buildings.forEach(b => {
                const t = b.building_type;
                if (!typeStats[t]) typeStats[t] = { total: 0 };
                typeStats[t].total++;
            });

            const typeList = document.createElement('div');
            typeList.style.cssText = `background:${DESIGN.bg};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:8px;max-height:200px;overflow-y:auto;margin-bottom:12px;`;

            Object.keys(typeStats).map(Number).sort((a, b) => a - b).forEach(t => {
                const s = typeStats[t];
                const checked = this.renameTypes.has(t);
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 4px;border-bottom:1px solid ${DESIGN.border};`;
                const left = document.createElement('div');
                left.style.cssText = `display:flex;flex-direction:column;gap:2px;`;
                const nameEl = document.createElement('span');
                nameEl.style.cssText = `color:${DESIGN.text};font-size:12px;font-weight:500;`;
                nameEl.textContent = BUILDING_TYPE_SHORT[t] || ('Typ ' + t);
                left.appendChild(nameEl);
                const statEl = document.createElement('span');
                statEl.style.cssText = `color:${DESIGN.textDim};font-size:10px;`;
                statEl.textContent = `${s.total} Wachen`;
                left.appendChild(statEl);
                row.appendChild(left);

                const toggle = document.createElement('span');
                toggle.style.cssText = `position:relative;display:inline-block;width:36px;height:20px;border-radius:3px;cursor:pointer;background:${checked ? DESIGN.accent : DESIGN.border};transition:background .15s;flex-shrink:0;`;
                toggle.innerHTML = `<span style="position:absolute;top:2px;left:${checked ? 18 : 2}px;width:16px;height:16px;background:${checked ? DESIGN.accentText : DESIGN.textDim};border-radius:2px;transition:left .15s;"></span>`;
                toggle.addEventListener('click', () => {
                    if (this.renameTypes.has(t)) this.renameTypes.delete(t); else this.renameTypes.add(t);
                    this.saveState();
                    this.render();
                });
                row.appendChild(toggle);
                typeList.appendChild(row);
            });
            body.appendChild(typeList);

            const previewEl = document.createElement('div');
            previewEl.className = 'lsh-preview';
            previewEl.style.cssText = `max-height:180px;overflow-y:auto;background:${DESIGN.bg};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:8px;font-size:11px;color:${DESIGN.textDim};`;
            body.appendChild(previewEl);
            this._previewEl = previewEl;

            const runRow = document.createElement('div');
            runRow.style.cssText = `margin-top:12px;`;
            const runBtn = document.createElement('button');
            runBtn.textContent = 'Umbenennen starten';
            runBtn.style.cssText = `background:${DESIGN.accent};color:${DESIGN.accentText};border:none;border-radius:${DESIGN.radius};padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:${DESIGN.fontFamily};`;
            runBtn.addEventListener('click', () => this.runRename());
            runRow.appendChild(runBtn);
            body.appendChild(runRow);

            this.updatePreview();
        },

        updatePreview() {
            if (!this._previewEl) return;
            this._previewEl.innerHTML = '';
            const targets = this.buildings.filter(b => this.renameTypes.has(b.building_type));
            if (targets.length === 0) { this._previewEl.textContent = 'Keine Wachentypen ausgewählt.'; return; }

            targets.forEach((b, i) => {
                const lS = this.buildings.find(x => x.id === b.leitstelle_building_id);
                const stadt = extractCity(b.caption);
                const newName = applyTemplate(this.buildingTemplate, {
                    name: b.caption, alt: b.caption,
                    typ: BUILDING_TYPE_SHORT[b.building_type] || 'Geb',
                    stadt: stadt, stadtkuerzel: abbrevCity(stadt),
                    nummer: String(i + 1).padStart(2, '0'),
                    leitstelle: lS ? lS.caption : '',
                });
                const row = document.createElement('div');
                row.style.cssText = `padding:2px 0;`;
                row.textContent = `${b.caption} → ${newName}`;
                if (b.caption === newName) row.style.opacity = '.5';
                this._previewEl.appendChild(row);
            });

            if (this.alsoRenameVehicles) {
                const vh = document.createElement('div');
                vh.style.cssText = `margin-top:6px;padding-top:6px;border-top:1px solid ${DESIGN.border};font-weight:600;color:${DESIGN.text};`;
                vh.textContent = 'Fahrzeuge werden bei Ausführung ebenfalls umbenannt.';
                this._previewEl.appendChild(vh);
            }
        },

        async runRename() {
            const targets = this.buildings.filter(b => this.renameTypes.has(b.building_type));
            if (targets.length === 0) { centerToast('Keine Wachentypen ausgewählt.', true); return; }

            // Stadtkürzel-Prüfung: Unbekannte Städte → Modal
            const unknownCities = [];
            targets.forEach(b => {
                const stadt = extractCity(b.caption);
                if (stadt && !CITY_ABBREV_SACHSEN[stadt.toLowerCase()] && !Store.loadCityAbbrev()[stadt.toLowerCase()]) {
                    if (!unknownCities.includes(stadt)) unknownCities.push(stadt);
                }
            });

            const proceed = async () => {
                const buildingRenames = targets.map((b, i) => {
                    const lS = this.buildings.find(x => x.id === b.leitstelle_building_id);
                    const stadt = extractCity(b.caption);
                    const newName = applyTemplate(this.buildingTemplate, {
                        name: b.caption, alt: b.caption,
                        typ: BUILDING_TYPE_SHORT[b.building_type] || 'Geb',
                        stadt: stadt, stadtkuerzel: abbrevCity(stadt),
                        nummer: String(i + 1).padStart(2, '0'),
                        leitstelle: lS ? lS.caption : '',
                    });
                    return { building: b, newName, stadt };
                });

                let vehicleRenames = [];
                if (this.alsoRenameVehicles) {
                    const vMap = await this.loadVehiclesByBuilding();
                    buildingRenames.forEach(({ building, newName, stadt }) => {
                        const vs = vMap.get(building.id) || [];
                        vs.forEach((vh, vi) => {
                            const newVName = applyTemplate(this.vehicleTemplate, {
                                name: vh.caption, alt: vh.caption,
                                typ: (vh.caption || '').split(' ')[0] || 'Fzg',
                                stadt: stadt, stadtkuerzel: abbrevCity(stadt),
                                nummer: String(vi + 1).padStart(2, '0'),
                                wache: newName,
                            });
                            vehicleRenames.push({ vehicle: vh, newName });
                        });
                    });
                }

                const totalOps = buildingRenames.length + vehicleRenames.length;
                const content = document.createElement('div');
                content.style.cssText = `color:${DESIGN.textDim};font-size:12px;line-height:1.5;`;
                content.textContent = `${buildingRenames.length} Wachen${vehicleRenames.length ? ' + ' + vehicleRenames.length + ' Fahrzeuge' : ''} umbenennen?`;
                showModal('Bestätigung', content, [
                    { label: 'Abbrechen' },
                    { label: 'Ja, umbenennen', primary: true, action: () => this.executeRename(buildingRenames, vehicleRenames, totalOps) },
                ]);
            };

            if (unknownCities.length > 0) {
                this.promptCityAbbrev(unknownCities, proceed);
            } else {
                await proceed();
            }
        },

        promptCityAbbrev(cities, callback) {
            const content = document.createElement('div');
            content.style.cssText = `color:${DESIGN.textDim};font-size:12px;line-height:1.6;`;
            content.innerHTML = `Für folgende Städte ist kein Kürzel bekannt. Bitte gib es ein (wird für die Sitzung gespeichert):<br><br>`;

            const inputs = {};
            cities.forEach(city => {
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:6px;`;
                const label = document.createElement('span');
                label.textContent = city + ':';
                label.style.cssText = `color:${DESIGN.text};font-size:12px;min-width:100px;`;
                row.appendChild(label);
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.placeholder = 'z.B. XY';
                inp.maxLength = 4;
                inp.style.cssText = `flex:1;background:${DESIGN.bg};color:${DESIGN.text};border:1px solid ${DESIGN.border};border-radius:${DESIGN.radius};padding:4px 8px;font-size:11px;font-family:${DESIGN.mono};text-transform:uppercase;`;
                row.appendChild(inp);
                inputs[city.toLowerCase()] = inp;
                content.appendChild(row);
            });

            showModal('Stadtkürzel eingeben', content, [
                { label: 'Abbrechen' },
                { label: 'Speichern & fortfahren', primary: true, action: () => {
                    const map = Store.loadCityAbbrev();
                    Object.keys(inputs).forEach(city => {
                        const val = inputs[city].value.trim().toUpperCase();
                        if (val) map[city] = val;
                    });
                    Store.saveCityAbbrev(map);
                    callback();
                }},
            ]);
        },

        async executeRename(buildingRenames, vehicleRenames, totalOps) {
            this.running = true; this.abortFlag = false; this.render();
            let ok = 0, fail = 0, cur = 0;
            const errors = [];

            for (const { building, newName } of buildingRenames) {
                if (this.abortFlag) break;
                cur++;
                this.updateProgress(`Wache ${cur}/${totalOps}: ${building.caption}`, cur, totalOps);
                try {
                    const res = await apiPost('/buildings/' + building.id, { '_method': 'patch', 'building[name]': newName });
                    if (res.ok) {
                        const html = await res.text();
                        const err = detectError(html);
                        if (err) { fail++; errors.push(building.caption + ': ' + err); } else ok++;
                    } else fail++;
                } catch { fail++; }
                await sleep(400);
            }

            for (const { vehicle, newName } of vehicleRenames) {
                if (this.abortFlag) break;
                cur++;
                this.updateProgress(`Fahrzeug ${cur}/${totalOps}: ${vehicle.caption}`, cur, totalOps);
                try {
                    const getRes = await apiGet('/vehicles/' + vehicle.id + '/edit');
                    if (!getRes.ok) { fail++; continue; }
                    const html = await getRes.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const fields = { '_method': 'patch' };
                    doc.querySelectorAll('form input[name^="vehicle["], form select[name^="vehicle["], form textarea[name^="vehicle["]').forEach(el => {
                        const n = el.getAttribute('name');
                        if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) fields[n] = el.value || '1'; }
                        else { const v = el.tagName === 'SELECT' ? (el.querySelector('option[selected]')?.value ?? el.value ?? '') : (el.getAttribute('value') ?? el.value ?? ''); if (v !== '') fields[n] = v; }
                    });
                    fields['vehicle[caption]'] = newName;
                    const postRes = await apiPost('/vehicles/' + vehicle.id, fields);
                    if (postRes.ok) {
                        const phtml = await postRes.text();
                        const err = detectError(phtml);
                        if (err) { fail++; errors.push(vehicle.caption + ': ' + err); } else ok++;
                    } else fail++;
                } catch { fail++; }
                await sleep(400);
            }

            this.running = false;
            await this.loadBuildings();
            this.render();
            if (errors.length) console.warn('[LSS-Helfer] Fehler:', errors);
            centerToast(`${ok} umbenannt${fail ? ', ' + fail + ' Fehler (Konsole)' : ''}`, fail > 0);
        },

        async loadVehiclesByBuilding() {
            const map = new Map();
            let url = '/api/v2/vehicles?limit=1000';
            try {
                while (url) {
                    const res = await apiGet(url);
                    if (!res.ok) break;
                    const data = await res.json();
                    if (Array.isArray(data.result)) data.result.forEach(v => { if (!map.has(v.building_id)) map.set(v.building_id, []); map.get(v.building_id).push(v); });
                    const next = data.paging && data.paging.next_page;
                    if (!next) break;
                    url = (typeof next === 'string' && (next.charAt(0) === '/' || next.indexOf('http') === 0)) ? next : '/api/v2/vehicles?limit=1000&page=' + next;
                }
            } catch (e) { console.error(e); }
            return map;
        },
    };

    // ===== REGISTER & START =====
    loadIcons(); ensureStyles();

    Registry.register(MissionModule.id, {
        name: MissionModule.name, description: MissionModule.description, icon: MissionModule.icon,
        onActivate: () => MissionModule.onActivate(), onDeactivate: () => MissionModule.onDeactivate(),
        renderSettings: (c) => MissionModule.renderSettings(c),
    });
    Registry.register(SprechModule.id, {
        name: SprechModule.name, description: SprechModule.description, icon: SprechModule.icon,
        onActivate: () => SprechModule.onActivate(), onDeactivate: () => SprechModule.onDeactivate(),
    });
    Registry.register(AktionenModule.id, {
        name: AktionenModule.name, description: AktionenModule.description, icon: AktionenModule.icon,
        onActivate: () => AktionenModule.onActivate(), onDeactivate: () => AktionenModule.onDeactivate(),
    });

    setTimeout(() => {
        addNavbarEntry();
        Registry.all().forEach(m => {
            if (Store.isModuleActive(m.id) && typeof m.onActivate === 'function') {
                try { m.onActivate(); } catch (e) { console.error(e); }
            }
        });
    }, 500);

    window.LSS_Helfer = {
        Registry, Store, openPanel,
        debugSprech: () => SprechModule.debugSprech(),
        abbrevCity, extractCity,
        cityAbbrevSachsen: CITY_ABBREV_SACHSEN,
    };
})();
