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
        const modsData = await fetchJSON(GITHUB.modsPath);
        allMods = Array.isArray(modsData) ? modsData : [];
        renderMods(allMods);
        updateStats();
        populateFilters();
        
    } catch (error) {
        console.error('Failed to load mods:', error);
        // Fallback to local storage
        const localMods = localStorage.getItem('minelux_mods');
        allMods = localMods ? JSON.parse(localMods) : [];
        renderMods(allMods);
        updateStats();
        populateFilters();
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
                <h3 style="color: var(--text-secondary); margin-bottom: 1rem;">لا توجد مودات متاحة بعد</h3>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">كن أول من يضيف مود إلى المنصة!</p>
                ${currentUser === 'Minelux' ? 
                    '<button class="btn btn-primary" onclick="goToAdmin()">➕ إضافة مودات</button>' : 
                    '<button class="btn btn-secondary" onclick="goToLogin()">🔐 تسجيل الدخول</button>'
                }
            </div>
        `;
        return;
    }

    const filteredMods = filterMods(mods);
    
    container.innerHTML = `
        <div class="mods-grid">
            ${filteredMods.map(mod => `
                <div class="mod-card" onclick="window.open('${mod.link || '#'}', '_blank')">
                    <div class="mod-image-container">
                        <img src="${mod.image || 'https://placehold.co/400x225/2c2c2c/ffffff?text=No+Image'}" 
                             alt="${mod.name}" class="mod-image"
                             onerror="this.src='https://placehold.co/400x225/ff4444/ffffff?text=Error+Loading'">
                        <div class="mod-overlay">
                            <span class="mod-version">${mod.version || '1.0.0'}</span>
                        </div>
                    </div>
                    
                    <div class="mod-content">
                        <div class="mod-header">
                            <h3 class="mod-name">${mod.name || 'بدون اسم'}</h3>
                            <span class="mod-type">${mod.type || 'عام'}</span>
                        </div>
                        
                        <p class="mod-description">${mod.desc || 'لا يوجد وصف للمود'}</p>
                        
                        <div class="mod-actions">
                            <a href="${mod.link || '#'}" class="mod-download" target="_blank" onclick="event.stopPropagation()">
                                ⬇️ تحميل المود
                            </a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Filter mods based on search and filters
function filterMods(mods) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const versionFilter = document.getElementById('versionFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    return mods.filter(mod => {
        const matchesSearch = searchTerm === '' || 
                            (mod.name && mod.name.toLowerCase().includes(searchTerm)) ||
                            (mod.desc && mod.desc.toLowerCase().includes(searchTerm));
        
        const matchesVersion = versionFilter === '' || mod.version === versionFilter;
        const matchesType = typeFilter === '' || mod.type === typeFilter;

        return matchesSearch && matchesVersion && matchesType;
    });
}

// Populate filter dropdowns
function populateFilters() {
    const versionSelect = document.getElementById('versionFilter');
    const typeSelect = document.getElementById('typeFilter');

    if (!versionSelect || !typeSelect) return;

    // Get unique versions and types
    const versions = [...new Set(allMods.map(mod => mod.version).filter(Boolean))];
    const types = [...new Set(allMods.map(mod => mod.type).filter(Boolean))];

    // Populate version filter
    versionSelect.innerHTML = '<option value="">كل الإصدارات</option>';
    versions.forEach(version => {
        versionSelect.innerHTML += `<option value="${version}">${version}</option>`;
    });

    // Populate type filter
    typeSelect.innerHTML = '<option value="">كل الأنواع</option>';
    types.forEach(type => {
        typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
    });
}

// Update statistics
function updateStats() {
    document.getElementById('modsCount').textContent = allMods.length;
    document.getElementById('usersCount').textContent = Object.keys(users).length;
}

// Update user interface
function updateUserInterface() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userStatus = document.getElementById('userStatus');
    const adminBtn = document.getElementById('adminBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');

    if (currentUser && users[currentUser]) {
        const userData = users[currentUser];
        
        // Update avatar
        if (userAvatar) {
            userAvatar.src = userData.image || 'https://placehold.co/80x80/2c2c2c/ffffff?text=User';
            userAvatar.alt = currentUser;
        }

        // Update user info
        if (userName) userName.textContent = currentUser;
        if (userStatus) {
            userStatus.textContent = userData.role === 'admin' ? 'مدير النظام' : 'مستخدم';
            userStatus.style.color = userData.role === 'admin' ? 'var(--mc-gold)' : 'var(--text-secondary)';
        }

        // Update buttons
        DOM.hide(loginBtn);
        DOM.show(logoutBtn);
        DOM.show(changeAvatarBtn);
        
        if (userData.role === 'admin') {
            DOM.show(adminBtn);
        } else {
            DOM.hide(adminBtn);
        }

    } else {
        // Guest user
        if (userAvatar) userAvatar.src = 'https://placehold.co/80x80/2c2c2c/ffffff?text=?';
        if (userName) userName.textContent = 'زائر';
        if (userStatus) {
            userStatus.textContent = 'غير مسجل الدخول';
            userStatus.style.color = 'var(--text-muted)';
        }

        DOM.show(loginBtn);
        DOM.hide(logoutBtn);
        DOM.hide(adminBtn);
        DOM.hide(changeAvatarBtn);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    const versionFilter = document.getElementById('versionFilter');
    const typeFilter = document.getElementById('typeFilter');

    const debouncedSearch = debounce(() => {
        renderMods(allMods);
    }, 300);

    if (searchInput) {
        searchInput.addEventListener('input', debouncedSearch);
    }
    if (versionFilter) {
        versionFilter.addEventListener('change', debouncedSearch);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', debouncedSearch);
    }

    // Avatar upload
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
}

// Handle avatar upload
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast('الملف يجب أن يكون صورة', 'error');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        toast('حجم الصورة يجب أن يكون أقل من 2MB', 'error');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const imageData = e.target.result;
            
            // Update local storage immediately
            if (users[currentUser]) {
                users[currentUser].image = imageData;
                localStorage.setItem('minelux_users', JSON.stringify(users));
                
                // Update UI
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) {
                    userAvatar.src = imageData;
                }
                
                toast('تم تحديث الصورة بنجاح', 'success');
            }
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Avatar upload error:', error);
        toast('فشل تحميل الصورة', 'error');
    }
}

// Show/hide loading
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const modsContainer = document.getElementById('modsContainer');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
    if (modsContainer && show) {
        modsContainer.innerHTML = '';
    }
}

// Global functions
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
};

window.goToAdmin = function() {
    if (currentUser && users[currentUser]?.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        toast('يجب أن تكون مديراً للوصول إلى هذه الصفحة', 'error');
    }
};

window.goToLogin = function() {
    window.location.href = 'login.html';
};

window.logout = function() {
    logout();
};

window.changeAvatar = function() {
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.click();
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
