// Configuration
export const GITHUB = {
    owner: 'minelux',
    repo: 'Minelux',
    branch: 'main',
    usersPath: 'users.json',
    modsPath: 'mods.json'
};

const API_BASE = 'https://api.github.com';
const PERMANENT_TOKEN = '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';

// Token Management
export function getToken() {
    return PERMANENT_TOKEN;
}

export function setToken(token) {
    console.log('Using permanent token');
}

export function clearToken() {
    console.log('Permanent token cannot be cleared');
}

// API Functions
export async function fetchJSON(path) {
    try {
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${path}`;
        const response = await fetch(`${rawUrl}?t=${Date.now()}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${path}: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

async function getFileSHA(path) {
    try {
        const url = `${API_BASE}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}?ref=${GITHUB.branch}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Failed to get file SHA');

        const data = await response.json();
        return data.sha;
    } catch (error) {
        console.error('SHA error:', error);
        throw error;
    }
}

export async function commitJSON(path, content, message = 'Auto commit') {
    try {
        const url = `${API_BASE}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}`;
        const sha = await getFileSHA(path);
        
        const body = {
            message,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
            branch: GITHUB.branch
        };

        if (sha) body.sha = sha;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Commit failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Commit error:', error);
        throw error;
    }
}

// Toast Notification
export function toast(message, type = 'info', duration = 3000) {
    const toastElement = document.getElementById('toast');
    if (!toastElement) return;

    toastElement.textContent = message;
    toastElement.className = `toast show ${type}`;

    setTimeout(() => {
        toastElement.classList.remove('show');
    }, duration);
}

// Utility Functions
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

export function cleanGoogleDriveLink(link) {
    if (!link) return '';
    
    if (link.includes('drive.google.com')) {
        if (link.includes('/file/d/')) {
            const fileId = link.split('/file/d/')[1]?.split('/')[0];
            if (fileId) {
                return `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
        }
        if (link.includes('%3F0%3Dsharing')) {
            return link.replace('%3F0%3Dsharing', '?export=download');
        }
    }
    
    return link;
}

// Local Storage Utilities
export const Storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
};

// DOM Utilities
export const DOM = {
    show: (element) => {
        if (element) element.style.display = 'block';
    },
    
    hide: (element) => {
        if (element) element.style.display = 'none';
    },
    
    toggle: (element) => {
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    }
};
