/**
* table-booking-handler.js
* Gestione prenotazione tavoli: disponibilità e conferma
*/

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const availabilityForm = document.getElementById('availabilityForm');
    const dateInput = document.getElementById('date');
    const timeSlotSelect = document.getElementById('timeSlot');
    const timeSelect = document.getElementById('time');
    const resultsSection = document.getElementById('results-section');
    const tablesContainer = document.getElementById('tables-container');
    const confirmationSection = document.getElementById('confirmationSection');
    const bookingDetails = document.getElementById('bookingDetails');
    const changeTableBtn = document.getElementById('changeTableBtn');
    
    let currentBookings = [];
 
    // Formattazione date
    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('it-IT');
    }
 
    // Gestione messaggi utente
    function showMessage(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        availabilityForm.insertAdjacentElement('beforebegin', alertDiv);
        if (!message.includes('Per prenotazioni con 10+ persone')) {
            setTimeout(() => alertDiv.remove(), 5000);
        }
    }
 
    // Inizializza form con date valide
    async function initializeForm() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        dateInput.setAttribute('min', tomorrow.toISOString().split('T')[0]);
        
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 60);
        dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    }
 
    // Event handlers per cambi data e fascia oraria
    dateInput.addEventListener('change', async () => {
        // Reset selects
        timeSlotSelect.value = '';
        timeSelect.value = '';
        timeSelect.disabled = true;
        timeSlotSelect.disabled = true;
        resultsSection.style.display = 'none';
        
        if (!dateInput.value) return;
        
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate <= today) {
            showMessage('Seleziona una data futura', 'warning');
            return;
        }
        
        try {
            const response = await APIClient.getAvailableHours(dateInput.value);
            
            // Popola fasce orarie disponibili
            timeSlotSelect.innerHTML = '<option value="">Seleziona fascia oraria</option>';
            if (response.lunch?.available) {
                timeSlotSelect.add(new Option('Pranzo', 'lunch'));
            }
            if (response.dinner?.available) {
                timeSlotSelect.add(new Option('Cena', 'dinner'));
            }
            if (!response.lunch?.available && !response.dinner?.available) {
                timeSlotSelect.innerHTML = '<option value="">Ristorante chiuso in questa data</option>';
            } else {
                timeSlotSelect.disabled = false;
            }
        } catch (error) {
            showMessage(error.message);
        }
    });
 
    timeSlotSelect.addEventListener('change', async () => {
        // Reset orari e nascondi risultati
        timeSelect.value = '';
        timeSelect.disabled = true;
        resultsSection.style.display = 'none';
        
        if (!timeSlotSelect.value || !dateInput.value) return;
        
        try {
            const response = await APIClient.getAvailableHours(dateInput.value);
            const availableHours = response.hours || [];
            
            timeSelect.innerHTML = '<option value="">Seleziona orario</option>';
            
            if (availableHours.length > 0) {
                availableHours.forEach(time => {
                    const hour = parseInt(time.split(':')[0]);
                    const isLunchTime = hour < 17;
                    
                    if ((timeSlotSelect.value === 'lunch' && isLunchTime) ||
                        (timeSlotSelect.value === 'dinner' && !isLunchTime)) {
                        timeSelect.add(new Option(time, time));
                    }
                });
                timeSelect.disabled = false;
            } else {
                timeSelect.innerHTML = '<option value="">Nessun orario disponibile</option>';
            }
        } catch (error) {
            showMessage(error.message);
        }
    });
 
    // Gestione form ricerca disponibilità
    availabilityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
 
        try {
            // Validazione dati form
            const date = dateInput.value;
            const time = timeSelect.value;
            const guests = document.getElementById('guests').value;
            const timeSlot = timeSlotSelect.value;
 
            if (!date || !time || !guests || !timeSlot) {
                throw new Error('Compila tutti i campi');
            }
 
            // Richiesta tavoli disponibili
            const response = await APIClient.checkAvailability(date, time, guests);
            
            if (!response.tables || response.tables.length === 0) {
                resultsSection.innerHTML = `
                    <div class="alert alert-warning">
                        <h5>Nessun tavolo disponibile</h5>
                        <p>Non ci sono tavoli disponibili per il numero di persone 
                           selezionato in questa fascia oraria.</p>
                    </div>`;
                resultsSection.style.display = 'block';
                return;
            }
 
            // Mostra tavoli disponibili
            tablesContainer.innerHTML = response.tables.map(table => `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Tavolo ${table.number}</h5>
                            <p class="card-text">
                                <i class="fas fa-chair"></i> ${table.seats} posti<br>
                                <small class="text-muted">
                                    Adatto per ${Math.max(2, table.seats - 2)}-${table.seats} persone
                                </small>
                            </p>
                            <button class="btn btn-wood book-table-btn w-100" 
                                    data-table-id="${table.id}"
                                    data-table-number="${table.number}"
                                    data-table-seats="${table.seats}"
                                    data-date="${date}"
                                    data-time="${time}"
                                    data-time-slot="${timeSlot}"
                                    data-guests="${guests}">
                                Seleziona questo tavolo
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
 
            resultsSection.style.display = 'block';
            
            // Event listeners per bottoni selezione
            document.querySelectorAll('.book-table-btn').forEach(button => {
                button.addEventListener('click', handleTableSelection);
            });
 
        } catch (error) {
            showMessage(error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
 
    // Gestione selezione tavolo
    async function handleTableSelection(e) {
        const button = e.currentTarget;
        try {
            // Verifica disponibilità
            const response = await APIClient.checkAvailability(
                button.dataset.date,
                button.dataset.time,
                button.dataset.guests
            );
            
            if (!response.tables.some(t => t.id === parseInt(button.dataset.tableId))) {
                showMessage('Questo tavolo non è più disponibile per questa fascia oraria', 'warning');
                return;
            }
 
            // Mostra sezione conferma
            resultsSection.style.display = 'none';
            confirmationSection.style.display = 'block';
 
            const timeSlotText = button.dataset.timeSlot === 'lunch' ? 'Pranzo' : 'Cena';
            bookingDetails.innerHTML = `
                <div class="mb-3">
                    <strong>Tavolo:</strong> ${button.dataset.tableNumber} 
                    (${button.dataset.tableSeats} posti)<br>
                    <strong>Data:</strong> ${formatDate(button.dataset.date)}<br>
                    <strong>Fascia oraria:</strong> ${timeSlotText}<br>
                    <strong>Orario:</strong> ${button.dataset.time}<br>
                    <strong>Numero persone:</strong> ${button.dataset.guests}
                </div>
            `;
 
            // Handler conferma prenotazione
            const confirmForm = document.getElementById('confirmBookingForm');
            confirmForm.onsubmit = async (e) => {
                e.preventDefault();
                const confirmButton = confirmForm.querySelector('button[type="submit"]');
                confirmButton.disabled = true;
 
                try {
                    const formData = {
                        table_id: parseInt(button.dataset.tableId),
                        date: button.dataset.date,
                        time: button.dataset.time,
                        guests: parseInt(button.dataset.guests),
                        notes: document.getElementById('notes').value || ''
                    };
 
                    await APIClient.createBooking(formData);
                    window.location.href = '/booking';
                } catch (error) {
                    showMessage(error.message);
                    confirmButton.disabled = false;
                }
            };
        } catch (error) {
            showMessage(error.message);
        }
    }
 
    // Handler cambio tavolo
    changeTableBtn.addEventListener('click', () => {
        confirmationSection.style.display = 'none';
        resultsSection.style.display = 'block';
    });
 
    // Inizializza form al caricamento
    initializeForm();
 });