/**
 * main.js
 * Funzioni di utilità globali e gestione autenticazione
 */

// Helper per chiamate API
async function fetchAPI(endpoint, options = {}) {
    try {
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
 
        const response = await fetch(`/api/${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });
 
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Errore nella richiesta');
        }
 
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
 
/**
 * Mostra messaggi all'utente 
 * @param {string} message - Testo messaggio
 * @param {string} type - Tipo alert (success, danger, etc)
 * @param {Element} container - Elemento DOM contenitore
 * @param {boolean} autoDismiss - Rimuovi automaticamente dopo 5s 
 */
function showMessage(message, type = 'danger', container, autoDismiss = false) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.insertAdjacentElement('beforebegin', alertDiv);
    
    if (autoDismiss) {
        setTimeout(() => alertDiv.remove(), 5000);
    }
}
 
// Gestione form login
async function handleLogin(event) {
    event.preventDefault();
    try {
        const response = await fetchAPI('auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            })
        });
        window.location.href = '/';
    } catch (error) {
        const container = document.getElementById('loginForm');
        showMessage(error.message, 'danger', container, true);
    }
}
 
// Gestione form registrazione 
async function handleRegister(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const container = document.getElementById('registerForm');
 
    if (password !== confirmPassword) {
        showMessage('Le password non coincidono', 'danger', container, true);
        return;
    }
 
    try {
        await fetchAPI('auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('email').value,
                password: password
            })
        });
        window.location.href = '/login';
    } catch (error) {
        showMessage(error.message, 'danger', container, true);
    }
}
 
// Event listeners al caricamento pagina
document.addEventListener('DOMContentLoaded', function() {
    // Form login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
 
    // Form registrazione
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});
 
// Esporta funzioni globali
window.showMessage = showMessage;