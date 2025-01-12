/**
 * booking-page.js
 * Gestione prenotazioni: visualizzazione, modifica e cancellazione
 */

document.addEventListener('DOMContentLoaded', function() {
    // Cache elementi DOM
    const bookingsList = document.getElementById('bookingsList');
    const editBookingModal = document.getElementById('bookingDetailsModal');
    const editDateInput = document.getElementById('editDate');
    const editTimeSelect = document.getElementById('editTime');
    const editTimeSlotSelect = document.getElementById('editTimeSlot');
    const editGuestsInput = document.getElementById('editGuests');
    const editTableSelect = document.getElementById('editTable');
    const editNotesTextarea = document.getElementById('editNotes');
    const refreshButton = document.getElementById('refreshButton');
    const dateFilter = document.getElementById('dateFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    let currentBookings = []; 

    // Event listeners per filtri data/stato
    dateFilter.addEventListener('change', (e) => {
        statusFilter.disabled = !!e.target.value;
        if (e.target.value) statusFilter.value = 'all';
        renderBookings(filterBookings(currentBookings));
    });

    statusFilter.addEventListener('change', (e) => {
        dateFilter.disabled = e.target.value !== 'all';
        if (e.target.value !== 'all') dateFilter.value = '';
        renderBookings(filterBookings(currentBookings));
    });

    // Funzioni utility
    function showMessage(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        bookingsList.insertAdjacentElement('beforebegin', alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('it-IT');
    }

    function isBookingPast(booking) {
        const bookingDateTime = new Date(`${booking.date} ${booking.time}`);
        return bookingDateTime < new Date();
    }

    // Funzione filtro prenotazioni
    function filterBookings(bookings) {
        const dateFilterValue = dateFilter.value;
        const statusFilterValue = statusFilter.value;
        const timeSlotFilter = document.getElementById('timeSlotFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            const bookingHour = parseInt(booking.time.split(':')[0]);
            
            if (dateFilterValue && booking.date !== dateFilterValue) return false;
            
            if (!dateFilterValue && statusFilterValue !== 'all') {
                const today = new Date();
                today.setHours(0,0,0,0);
                bookingDate.setHours(0,0,0,0);
                
                if (statusFilterValue === 'future' && bookingDate <= today) return false;
                if (statusFilterValue === 'past' && bookingDate >= today) return false;
                if (statusFilterValue === 'today' && bookingDate.getTime() !== today.getTime()) return false;
            }
            
            if (timeSlotFilter === 'lunch' && bookingHour >= 17) return false;
            if (timeSlotFilter === 'dinner' && bookingHour < 17) return false;
            if (searchFilter && !booking.user_email.toLowerCase().includes(searchFilter)) return false;
            
            return true;
        });
    }

    // Eventi filtri ricerca aggiuntivi
    document.getElementById('timeSlotFilter').addEventListener('change', () => {
        renderBookings(filterBookings(currentBookings));
    });

    document.getElementById('searchFilter').addEventListener('input', () => {
        renderBookings(filterBookings(currentBookings));
    });

    // Apertura modal modifica prenotazione
    async function openEditModal(bookingId) {
        try {
            const booking = currentBookings.find(b => b.id === parseInt(bookingId));
            if (!booking) throw new Error('Prenotazione non trovata');
            if (isBookingPast(booking)) throw new Error('Non puoi modificare prenotazioni passate');
        
            // Popola form
            document.getElementById('bookingId').value = booking.id;
            editDateInput.value = booking.date;
            editGuestsInput.value = booking.guests;
            editNotesTextarea.value = booking.notes || '';
        
            // Determina fascia oraria
            const bookingHour = parseInt(booking.time.split(':')[0]);
            const timeSlot = bookingHour < 17 ? 'lunch' : 'dinner';
            
            // Inizializza fasce orarie
            const response = await APIClient.getAvailableHours(booking.date);
            editTimeSlotSelect.innerHTML = '<option value="">Seleziona fascia oraria</option>';
            
            if (response.lunch?.available) {
                editTimeSlotSelect.add(new Option('Pranzo', 'lunch', timeSlot === 'lunch', timeSlot === 'lunch'));
            }
            if (response.dinner?.available) {
                editTimeSlotSelect.add(new Option('Cena', 'dinner', timeSlot === 'dinner', timeSlot === 'dinner'));
            }
            
            // Aggiorna orari disponibili
            const availableHours = response.hours || [];
            editTimeSelect.innerHTML = '<option value="">Seleziona orario</option>';
            
            availableHours.forEach(time => {
                const hour = parseInt(time.split(':')[0]);
                const isLunchTime = hour < 17;
                
                if ((timeSlot === 'lunch' && isLunchTime) || (timeSlot === 'dinner' && !isLunchTime)) {
                    editTimeSelect.add(new Option(time, time, time === booking.time, time === booking.time));
                }
            });
            
            // Aggiorna tavoli disponibili
            await updateAvailableTables(booking.date, booking.time, booking.guests, booking.id);
            editTableSelect.value = booking.table_id;
        
            const modal = new bootstrap.Modal(editBookingModal);
            modal.show();
        
        } catch (error) {
            showMessage(error.message, 'danger');
        }
    }

    // Carica lista prenotazioni
    async function loadBookings() {
        try {
            refreshButton.disabled = true;
            const response = await APIClient.getBookings();
            currentBookings = response.bookings;
            
            if (currentBookings.length === 0) {
                bookingsList.innerHTML = `
                    <div class="alert alert-info">
                        Non hai ancora effettuato nessuna prenotazione.
                        <a href="/tables/availability" class="btn btn-wood mt-2">Prenota un tavolo</a>
                    </div>`;
                return;
            }
            renderBookings(currentBookings);
        } catch (error) {
            showMessage(error.message, 'danger');
            bookingsList.innerHTML = `
                <div class="alert alert-danger">
                    Errore nel caricamento delle prenotazioni. Riprova più tardi.
                </div>`;
        } finally {
            refreshButton.disabled = false;
        }
    }

    // Aggiorna tavoli disponibili
    async function updateAvailableTables(date, time, guests, bookingId = null) {
        if (!editTableSelect) return;

        editTableSelect.disabled = true;
        editTableSelect.innerHTML = '<option value="">Caricamento tavoli...</option>';

        try {
            const response = await APIClient.checkAvailability(date, time, guests);
            editTableSelect.innerHTML = '<option value="">Seleziona tavolo</option>';
            
            if (!response.tables || response.tables.length === 0) {
                editTableSelect.innerHTML += '<option value="" disabled>Nessun tavolo disponibile</option>';
                return;
            }

            response.tables.forEach(table => {
                editTableSelect.add(new Option(
                    `Tavolo ${table.number} (${table.seats} posti)`,
                    table.id
                ));
            });
        } catch (error) {
            console.error('Errore caricamento tavoli:', error);
            editTableSelect.innerHTML = '<option value="">Errore caricamento tavoli</option>';
        } finally {
            editTableSelect.disabled = false;
        }
    }

    // Render lista prenotazioni
    function renderBookings(bookings) {
        const bookingsHTML = bookings
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(booking => `
                <div class="card h-100 mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title">Tavolo ${booking.table_number}</h5>
                                <p class="card-text">
                                    <strong>Data:</strong> ${formatDate(booking.date)}<br>
                                    <strong>Orario:</strong> ${booking.time}<br>
                                    <strong>Persone:</strong> ${booking.guests}<br>
                                    <strong>Email:</strong> ${booking.user_email}<br>
                                    <strong>Note:</strong> <span class="text-muted">${booking.notes || '-'}</span>
                                </p>
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-outline-primary btn-sm edit-booking-btn" 
                                        data-booking-id="${booking.id}"
                                        ${isBookingPast(booking) ? 'disabled' : ''}>
                                    <i class="fas fa-edit"></i> Modifica
                                </button>
                                <button class="btn btn-outline-danger btn-sm cancel-booking-btn" 
                                        data-booking-id="${booking.id}"
                                        ${isBookingPast(booking) ? 'disabled' : ''}>
                                    <i class="fas fa-times"></i> Cancella
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

        bookingsList.innerHTML = bookingsHTML;

        // Eventi bottoni azioni
        document.querySelectorAll('.edit-booking-btn').forEach(button => {
            button.addEventListener('click', () => openEditModal(button.dataset.bookingId));
        });

        document.querySelectorAll('.cancel-booking-btn').forEach(button => {
            button.addEventListener('click', handleCancelBooking);
        });
    }

    // Gestione cancellazione
    async function handleCancelBooking(e) {
        const button = e.target.closest('.cancel-booking-btn');
        const bookingId = button.dataset.bookingId;
        const booking = currentBookings.find(b => b.id === parseInt(bookingId));

        if (!booking) {
            showMessage('Prenotazione non trovata', 'error');
            return;
        }

        if (isBookingPast(booking)) {
            showMessage('Non è possibile cancellare prenotazioni passate', 'warning');
            return;
        }

        if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
            return;
        }

        button.disabled = true;

        try {
            await APIClient.deleteBooking(bookingId);
            await loadBookings();
            showMessage('Prenotazione cancellata con successo', 'success');
        } catch (error) {
            showMessage(error.message, 'danger');
            button.disabled = false;
        }
    }

    // Eventi bottoni e form
    refreshButton.addEventListener('click', () => {
        // Memorizza i valori dei filtri
        const filters = {
            date: dateFilter.value,
            status: statusFilter.value,
            timeSlot: document.getElementById('timeSlotFilter').value,
            search: document.getElementById('searchFilter').value
        };
        
        loadBookings().then(() => {
            // Ripristina i filtri
            dateFilter.value = filters.date;
            statusFilter.value = filters.status;
            document.getElementById('timeSlotFilter').value = filters.timeSlot;
            document.getElementById('searchFilter').value = filters.search;
            
            // Riapplica i filtri
            renderBookings(filterBookings(currentBookings));
            
            // Mantieni lo stato disabled dei filtri
            statusFilter.disabled = !!filters.date;
            dateFilter.disabled = filters.status !== 'all';
        });
    });

    document.getElementById('saveBookingBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const button = e.target;
        button.disabled = true;
    
        try {
            const bookingId = document.getElementById('bookingId').value;
            const tableId = editTableSelect.value;
            
            if (!tableId) {
                throw new Error('Seleziona un tavolo');
            }
    
            const formData = {
                date: editDateInput.value,
                time: editTimeSelect.value,
                table_id: parseInt(tableId),
                guests: parseInt(editGuestsInput.value),
                notes: editNotesTextarea.value || ''
            };
    
            await APIClient.updateBooking(bookingId, formData);
            const modal = bootstrap.Modal.getInstance(editBookingModal);
            modal.hide();
            
            await loadBookings();
            showMessage('Prenotazione modificata con successo', 'success');
        } catch (error) {
            showMessage(error.message, 'danger');
        } finally {
            button.disabled = false;
        }
    });

    // Event listeners modal modifica
editTimeSlotSelect.addEventListener('change', async (e) => {
    editTimeSelect.value = '';
    editTimeSelect.disabled = true;
    
    if (editDateInput.value && e.target.value) {
        const response = await APIClient.getAvailableHours(editDateInput.value);
        editTimeSelect.innerHTML = '<option value="">Seleziona orario</option>';
        
        const availableHours = response.hours || [];
        availableHours.forEach(time => {
            const hour = parseInt(time.split(':')[0]);
            const isLunchTime = hour < 17;
            
            if ((e.target.value === 'lunch' && isLunchTime) ||
                (e.target.value === 'dinner' && !isLunchTime)) {
                editTimeSelect.add(new Option(time, time));
            }
        });
        editTimeSelect.disabled = false;
    }
});

editDateInput.addEventListener('change', async () => {
    editTimeSlotSelect.value = '';
    editTimeSelect.value = '';
    editTimeSelect.disabled = true;
    editTimeSlotSelect.disabled = true;

    const date = editDateInput.value;
    if (!date) return;

    try {
        const response = await APIClient.getAvailableHours(date);
        editTimeSlotSelect.innerHTML = '<option value="">Seleziona fascia oraria</option>';
        
        if (response.lunch?.available) editTimeSlotSelect.add(new Option('Pranzo', 'lunch'));
        if (response.dinner?.available) editTimeSlotSelect.add(new Option('Cena', 'dinner'));
        
        editTimeSlotSelect.disabled = !response.lunch?.available && !response.dinner?.available;
    } catch (error) {
        showMessage(error.message, 'danger');
    }
});

// Aggiornamento tavoli al cambio parametri
[editDateInput, editTimeSelect, editGuestsInput].forEach(element => {
    element.addEventListener('change', () => {
        if (editDateInput.value && editTimeSelect.value && editGuestsInput.value) {
            updateAvailableTables(
                editDateInput.value,
                editTimeSelect.value, 
                editGuestsInput.value,
                document.getElementById('bookingId').value
            );
        }
    });
});

    // Caricamento iniziale
    loadBookings();
});