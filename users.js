import { GITHUB, fetchJSON, commitJSON, toast, Storage } from './utils.js';

let users = {};
const USE_LOCAL_STORAGE = true;

// User Management
export async function loadUsers() {
    if (USE_LOCAL_STORAGE) {
        users = Storage.get('minelux_users') || {};
        
        // Ensure admin user exists
        if (!users['Minelux']) {
            users['Minelux'] = { 
                password: 'admin1234', 
                image: '',
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            Storage.set('minelux_users', users);
        }
        
        return users;
    }

    try {
        users = await fetchJSON(GITHUB.usersPath);
        return users;
    } catch (error) {
        console.error('Failed to load users from GitHub:', error);
        toast('فشل تحميل المستخدمين', 'error');
        return {};
    }
}

export function login(username, password) {
    if (users[username] && users[username].password === password) {
        Storage.set('currentUser', username);
        return true;
    }
    return false;
}

export function logout() {
    Storage.remove('currentUser');
    window.location.href = 'index.html';
}

export async function register(username, password, image = '') {
    if (!username || !password) {
        throw new Error('يجب ملء جميع الحقول');
    }

    if (users[username]) {
        throw new Error('اسم المستخدم موجود مسبقاً');
    }

    if (username.length < 3) {
        throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    }

    if (password.length < 6) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    users[username] = {
        password,
        image,
        role: 'user',
        createdAt: new Date().toISOString()
    };

    if (USE_LOCAL_STORAGE) {
        Storage.set('minelux_users', users);
        toast('تم إنشاء الحساب بنجاح ✓', 'success');
    } else {
        try {
            await commitJSON(GITHUB.usersPath, users, `تم إضافة مستخدم: ${username}`);
            toast('تم إنشاء الحساب بنجاح ✓', 'success');
        } catch (error) {
            throw new Error('فشل إنشاء الحساب: تحقق من الاتصال');
        }
    }

    Storage.set('currentUser', username);
}

export async function deleteUser(username) {
    if (!users[username]) {
        throw new Error('المستخدم غير موجود');
    }

    if (username === 'Minelux') {
        throw new Error('لا يمكن حذف الأدمن الرئيسي');
    }

    delete users[username];

    if (USE_LOCAL_STORAGE) {
        Storage.set('minelux_users', users);
        toast('تم حذف المستخدم بنجاح ✓', 'success');
    } else {
        try {
            await commitJSON(GITHUB.usersPath, users, `تم حذف مستخدم: ${username}`);
            toast('تم حذف المستخدم بنجاح ✓', 'success');
        } catch (error) {
            throw new Error('فشل حذف المستخدم');
        }
    }
}

export async function updateUserImage(username, imageUrl) {
    if (!users[username]) {
        throw new Error('المستخدم غير موجود');
    }

    users[username].image = imageUrl;

    if (USE_LOCAL_STORAGE) {
        Storage.set('minelux_users', users);
        return true;
    } else {
        try {
            await commitJSON(GITHUB.usersPath, users, `تم تحديث صورة: ${username}`);
            return true;
        } catch (error) {
            toast('فشل حفظ الصورة على السيرفر', 'error');
            return false;
        }
    }
}

export function getCurrentUser() {
    return Storage.get('currentUser');
}

export function getUsers() {
    return users;
}

export function getUserData(username) {
    return users[username];
}

export function isAdmin(username) {
    return users[username]?.role === 'admin';
}

// Initialize users
export async function initializeUsers() {
    try {
        await loadUsers();
        return users;
    } catch (error) {
        console.error('Failed to initialize users:', error);
        return {};
    }
}
