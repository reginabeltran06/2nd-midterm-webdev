const BACKEND_BASE = (window.BACKEND_BASE || "http://localhost:3000").replace(/\/$/, "");


const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));


const DEFAULT_IMG = "https://placehold.co/600x400?text=No+Image";

function setList(listEl, items) {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!items || !items.length) {
        const li = document.createElement("li");
        li.className = "list-inline-item text-secondary";
        li.textContent = "—";
        listEl.appendChild(li);
        return;
    }
    items.filter(Boolean).forEach((val) => {
        const li = document.createElement("li");
        li.className = "list-inline-item";
        li.textContent = val;
        listEl.appendChild(li);
    });
}

function showAlert(type, message, withReset = false) {
    const area = qs("#alert-area");
    area.innerHTML = `
        <div class="alert alert-${type} d-flex justify-content-between align-items-center">
            <span>${message}</span>
            ${withReset ? '<button id="reset-btn" class="btn btn-sm btn-outline-light">Go to beginning</button>' : ""}
        </div>`;
    const resetBtn = qs("#reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            await loadBeginning();
            area.innerHTML = "";
        }); 
    }
}

function clearAlert() {
    qs("#alert-area").innerHTML = "";
}

function renderCharacter(c) {
    qs('#char-image').src = c.image || DEFAULT_IMG;
    qs('#char-image').onerror = () => (qs('#char-image').src = DEFAULT_IMG);

    qs('#char-fullname').textContent = c.fullName || `${c.firstName} ${c.lastName}`.trim() || 'Unknown';
    qs('#char-id').textContent = c.id ?? '—';
    qs('#char-first').textContent = c.firstName || 'Unknown';
    qs('#char-last').textContent = c.lastName || '';
    qs('#char-title').textContent = c.title || 'Unknown';
    qs('#char-family').textContent = c.family || 'Unknown';
    qs('#char-born').textContent = c.born || 'Unknown';
    qs('#char-died').textContent = c.died || 'Unknown';
    setList(qs('#char-titles-list'), c.title);
    setList(qs('#char-aliases'), c.aliases);
    qs('#char-crest').textContent = c.familyCrest || 'Unknown';
}

// === API Calls ===
async function api(path) {
    const res = await fetch(`${BACKEND_BASE}${path}`);
    if (!res.ok) throw res;
    return res.json();
}

async function nextCharacter() {
    const data = await api('/characters/next');
    return data;
}

async function prevCharacter() {
    const data = await api('/characters/prev');
    return data;
}

async function searchCharacter(name) {
    const url = `/characters/search?name=${encodeURIComponent(name)}`;
    const res = await fetch(`${BACKEND_BASE}${url}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw err;
    }
    return res.json();
}

async function loadBeginning() {
    const data = await api('/characters/reset');
    renderCharacter(data);  
}

// === Event wiring ===
document.addEventListener('DOMContentLoaded', async () => {
    // Buttons
    qs('#next-btn').addEventListener('click', async () => {
        clearAlert();
    try { renderCharacter(await nextCharacter()); }
    catch { showAlert('danger', 'Could not load next character.'); }
});

    qs('#prev-btn').addEventListener('click', async () => {
        clearAlert();
        try { renderCharacter(await prevCharacter()); }
        catch { showAlert('danger', 'Could not load previous character.'); }
    });

    // Search form
    qs('#search-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();
        const term = qs('#search-input').value.trim();
        if (!term) {
            showAlert('warning', 'Type a name to search.');
            return;
        }
        try {
            const result = await searchCharacter(term);
            renderCharacter(result);
        } catch (err) {
            const msg = err?.error === 'Character not found' ? 'Character not found.' : 'Search failed.';
            showAlert('warning', `${msg} You can go back to the beginning.`, true);
        }
    });

    // Initial load
    try { await loadBeginning(); }
     catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
            showAlert('danger', 'Failed to connect to backend server. Ensure it is running on localhost:3000.');
        } else {
            showAlert('danger', 'Failed to load initial character.');
        }
    }
});