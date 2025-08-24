import { GITHUB, fetchJSON, commitJSON, toast, Storage } from './utils.js';
import { initializeUsers, getUsers, deleteUser, isAdmin } from './users.js';

let mods = [];
let users = {};

async function init() {
    try {
        // Check if user is admin
        const currentUser = Storage.get('currentUser');
        users = await initializeUsers();
        
        if (!currentUser || !isAdmin(currentUser)) {
            toast('يجب أن تكون مديراً للوصول إلى هذه الصفحة', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }

        await loadMods();
        renderModsList();
        renderUsersList();
        setupEventListeners();

    } catch (error) {
        console.error('Admin init error:', error);
        toast('فشل تحميل لوحة التحكم', 'error');
    }
}

async function loadMods() {
    try {
        const modsData = await fetchJSON(GITHUB.modsPath);
        mods = Array.isArray(modsData) ? modsData : [];
    } catch (error) {
        console.error('Failed to load mods:', error);
        mods = JSON.parse(localStorage.getItem('minelux_mods') || '[]');
    }
}

async function addMod() {
    const name = document.getElementById('modName')?.value.trim();
    const version = document.getElementById('modVersion')?.value.trim();
    const type = document.getElementById('modType')?.value;
    const link = document.getElementById('modLink')?.value.trim();
    const desc = document.getElementById('modDesc')?.value.trim();
    const image = document.getElementById('modImage')?.value.trim();

    if (!name || !version || !type || !link) {
        toast('املأ جميع الحقول المطلوبة', 'error');
        return;
    }

    const newMod = {
        name,
        version,
        type,
        link,
        desc: desc || '',
        image: image || '',
        createdAt: new Date().toISOString()
    };

    try {
        const updatedMods = [...mods, newMod];
        
        // Try to save to GitHub first
        try {
            await commitJSON(GITHUB.modsPath, updatedMods, `تم إضافة مود: ${name}`);
        } catch (githubError) {
            // Fallback to local storage
            localStorage.setItem('minelux_mods', JSON.stringify(updatedMods));
        }

        mods = updatedMods;
        renderModsList();
        clearModForm();
        toast('تم إضافة المود بنجاح ✓', 'success');

    } catch (error) {
        console.error('Add mod error:', error);
        toast('فشل إضافة المود', 'error');
    }
}

async function addUser() {
    const username = document.getElementById('userName')?.value.trim();
    const password = document.getElementById('userPassword')?.value.trim();

    if (!username || !password) {
        toast('املأ جميع الحقول المطلوبة', 'error');
        return;
    }

    if (users[username]) {
        toast('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }

    try {
        users[username] = {
            password,
            image: '',
            role: 'user',
            createdAt: new Date().toISOString()
        };

        // Save to local storage
        localStorage.setItem('minelux_users', JSON.stringify(users));
        
        renderUsersList();
        clearUserForm();
        toast('تم إضافة المستخدم بنجاح ✓', 'success');

    } catch (error) {
        console.error('Add user error:', error);
        toast('فشل إضافة المستخدم', 'error');
    }
}

async function deleteMod(index) {
    if (!confirm('هل أنت متأكد من حذف هذا المود؟')) return;

    try {
        const modName = mods[index]?.name || 'مود';
        const updatedMods = mods.filter((_, i) => i !== index);
        
        // Try to save to GitHub first
        try {
            await commitJSON(GITHUB.modsPath, updatedMods, `تم حذف مود: ${modName}`);
        } catch (githubError) {
            // Fallback to local storage
            localStorage.setItem('minelux_mods', JSON.stringify(updatedMods));
        }

        mods = updatedMods;
        renderModsList();
        toast('تم حذف المود بنجاح ✓', 'success');

    } catch (error) {
        console.error('Delete mod error:', error);
        toast('فشل حذف المود', 'error');
    }
}

function renderModsList() {
    const container = document.getElementById('modsList');
    if (!container) return;

    if (mods.length === 0) {
        container.innerHTML = '<div class="empty-state">لا توجد مودات</div>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>اسم المود</th>
                        <th>الإصدار</th>
                        <th>النوع</th>
                        <th>الرابط</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${mods.map((mod, index) => `
                        <tr>
                            <td>${mod.name || 'بدون اسم'}</td>
                            <td><span class="badge">${mod.version || 'N/A'}</span></td>
                            <td><span class="badge">${mod.type || 'عام'}</span></td>
                            <td>${mod.link ? '✓' : '✗'}</td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="deleteMod(${index})">
                                    🗑️ حذف
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderUsersList() {
    const container = document.getElementById('usersList');
    if (!container) return;

    const usersArray = Object.entries(users);
    
    if (usersArray.length === 0) {
        container.innerHTML = '<div class="empty-state">لا يوجد مستخدمين</div>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>اسم المستخدم</th>
                        <th>الدور</th>
                        <th>تاريخ الإنشاء</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${usersArray.map(([username, userData]) => `
                        <tr>
                            <td>${username}</td>
                            <td><span class="badge ${userData.role === 'admin' ? 'badge-gold' : ''}">${userData.role === 'admin' ? 'مدير' : 'مستخدم'}</span></td>
                            <td>${new Date(userData.createdAt).toLocaleDateString('ar-SA')}</td>
                            <td>
                                ${username !== 'Minelux' ? `
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${username}')">
                                        🗑️ حذف
                                    </button>
                                ` : '<span class="text-muted">غير مسموح</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function clearModForm() {
    document.getElementById('modName').value = '';
    document.getElementById('modVersion').value = '';
    document.getElementById('modType').value = '';
    document.getElementById('modLink').value = '';
    document.getElementById('modDesc').value = '';
    document.getElementById('modImage').value = '';
}

function clearUserForm() {
    document.getElementById('userName').value = '';
    document.getElementById('userPassword').value = '';
}

function setupEventListeners() {
    // Enter key to submit forms
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (input.closest('#modsManagement')) {
                    addMod();
                } else if (input.closest('#usersManagement')) {
                    addUser();
                }
            }
        });
    });
}

// Global functions
window.goToHome = function() {
    window.location.href = 'index.html';
};

window.logout = function() {
    Storage.remove('currentUser');
    window.location.href = 'index.html';
};

window.addMod = addMod;
window.addUser = addUser;
window.deleteMod = deleteMod;
window.deleteUser = async function(username) {
    if (username === 'Minelux') {
        toast('لا يمكن حذف الأدمن الرئيسي', 'error');
        return;
    }

    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟`)) return;

    try {
        await deleteUser(username);
        users = getUsers();
        renderUsersList();
        toast('تم حذف المستخدم بنجاح ✓', 'success');
    } catch (error) {
        console.error('Delete user error:', error);
        toast(error.message || 'فشل حذف المستخدم', 'error');
    }
};

// Initialize admin panel
document.addEventListener('DOMContentLoaded', init);
