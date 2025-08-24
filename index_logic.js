import { GITHUB, fetchJSON, toast, debounce, DOM } from './utils.js';
import { getCurrentUser, initializeUsers, logout, getUserData, getUsers } from './users.js';

let allMods = [];
let currentUser = null;
let users = {};

// Initialize the application
async function init() {
    try {
        showLoading(true);
        
        // Initialize users
        users = await initializeUsers();
        currentUser = getCurrentUser();
        
        // Update UI
        updateUserInterface();
        await loadMods();
        setupEventListeners();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Initialization error:', error);
        toast('فشل تحميل التطبيق', 'error');
        showLoading(false);
    }
}

// Load mods from storage
async function loadMods() {
    try {
        if (window.USE_LOCAL_STORAGE) {
            allMods = JSON.parse(localStorage.getItem('minelux_mods') || '[]');
        } else {
            allMods = await fetchJSON(GITHUB.modsPath);
        }
        
        renderMods(allMods);
        updateStats();
        populateFilters();
        
    } catch (error) {
        console.error('Failed to load mods:', error);
        toast('فشل تحميل المودات', 'error');
        allMods = [];
        renderMods(allMods);
    }
}

// Render mods to the grid
function renderMods(mods) {
    const container = document.getElementById('modsContainer');
    if (!container) return;

    if (!mods || mods.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 3rem;">
                <div class="minecraft-icon" style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
                <h3 style="color: var
