/**
* api-client.js
* Client HTTP centralizzato per chiamate API REST
*/

const APIClient = {
    /** 
     * Effettua chiamata API con gestione errori standard
     * @param {string} endpoint - URL API 
     * @param {object} options - Opzioni fetch
     */
    async request(endpoint, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
 
        try {
            const response = await fetch(`/api/${endpoint}`, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers }
            });
 
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            this.showError(error.message);
            throw error;
        }
    },
 
    /** Mostra errore all'utente */
    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show fixed-bottom m-3';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    },
 
    // API Autenticazione
    
    /** Login utente */
    async login(credentials) {
        return this.request('auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },
 
    /** Registrazione nuovo utente */
    async register(userData) {
        return this.request('auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
 
    /** Logout utente */
    async logout() {
        return this.request('auth/logout', { method: 'POST' });
    },
 
    // API Prenotazioni
    
    /** Lista prenotazioni utente/admin */
    async getBookings() {
        return this.request('bookings');
    },
 
    /** Crea nuova prenotazione */
    async createBooking(bookingData) {
        return this.request('bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },
 
    /** Aggiorna prenotazione esistente */
    async updateBooking(bookingId, bookingData) {
        return this.request(`bookings/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify(bookingData)
        });
    },
 
    /** Cancella prenotazione */
    async deleteBooking(bookingId) {
        return this.request(`bookings/${bookingId}`, { method: 'DELETE' });
    },
 
    // API Tavoli
    
    /** Lista tutti i tavoli */
    async getTables() {
        return this.request('tables');
    },
 
    /** Aggiunge nuovo tavolo */
    async addTable(tableData) {
        return this.request('tables', {
            method: 'POST',
            body: JSON.stringify(tableData)
        });
    },
 
    /** Aggiorna tavolo esistente */
    async updateTable(tableId, tableData) {
        return this.request(`tables/${tableId}`, {
            method: 'PUT',
            body: JSON.stringify(tableData)
        });
    },
 
    /** Elimina tavolo */
    async deleteTable(tableId) {
        return this.request(`tables/${tableId}`, { method: 'DELETE' });
    },
 
    /** Verifica disponibilità tavoli per data/ora/ospiti */
    async checkAvailability(date, time, guests) {
        const params = new URLSearchParams({ date, time, guests });
        return this.request(`tables/availability?${params}`);
    },
 
    // API Ristorante
    
    /** Lista orari apertura */
    async getRestaurantHours() {
        return this.request('restaurant/hours');
    },
 
    /** Aggiorna orari apertura */
    async updateRestaurantHours(hours) {
        return this.request('restaurant/hours', {
            method: 'PUT',
            body: JSON.stringify({ hours })
        });
    },
 
    /** Lista orari disponibili per data */
    async getAvailableHours(date, bookingId = null) {
        const params = new URLSearchParams({ date });
        if (bookingId) params.append('booking_id', bookingId);
        return this.request(`restaurant/available-hours?${params}`);
    },
 
    /** Dati info ristorante */
    async getRestaurantInfo() {
        return this.request('restaurant/info');
    },
 
    /** Aggiorna info ristorante */
    async updateRestaurantInfo(info) {
        return this.request('restaurant/info', {
            method: 'PUT',
            body: JSON.stringify(info)
        });
    },
 
    /** Statistiche dashboard admin */
    async getAdminStats() {
        return this.request('admin/stats');
    }
 };
 
 window.APIClient = APIClient;