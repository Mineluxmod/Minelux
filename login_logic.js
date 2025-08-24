import { login, register, initializeUsers } from './users.js';
import { toast } from './utils.js';

let currentTab = 'login';

async function init() {
    try {
        await initializeUsers();
        setupEventListeners();
    } catch (error) {
        console.error('Login init error:', error);
        toast('فشل تحميل صفحة التسجيل', 'error');
    }
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activate current tab
    document.querySelector(`.tab-btn:nth-child(${tabName === 'login' ? 1 : 2})`).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

async function handleLogin() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!username || !password) {
        toast('املأ جميع الحقول', 'error');
        return;
    }

    try {
        if (login(username, password)) {
            toast('تم تسجيل الدخول بنجاح!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            toast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        toast('فشل تسجيل الدخول', 'error');
    }
}

async function handleRegister() {
    const username = document.getElementById('registerUsername')?.value.trim();
    const password = document.getElementById('registerPassword')?.value.trim();
    const confirm = document.getElementById('registerConfirm')?.value.trim();

    if (!username || !password || !confirm) {
        toast('املأ جميع الحقول', 'error');
        return;
    }

    if (password !== confirm) {
        toast('كلمة المرور غير متطابقة', 'error');
        return;
    }

    if (password.length < 6) {
        toast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }

    try {
        await register(username, password, '');
        toast('تم إنشاء الحساب بنجاح!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Register error:', error);
        toast(error.message || 'فشل إنشاء الحساب', 'error');
    }
}

function setupEventListeners() {
    // Enter key to submit forms
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (currentTab === 'login') {
                    handleLogin();
                } else {
                    handleRegister();
                }
            }
        });
    });
}

// Global functions
window.goToHome = function() {
    window.location.href = 'index.html';
};

window.switchTab = switchTab;
window.login = handleLogin;
window.register = handleRegister;

// Initialize login page
document.addEventListener('DOMContentLoaded', init);
