/**
* hours-management.js
* Gestione orari apertura ristorante area admin
*/

document.addEventListener('DOMContentLoaded', function() {
    const hoursForm = document.getElementById('hoursForm');
    const resetButton = document.getElementById('resetButton');
 
    // Mostra messaggi all'utente
    function showMessage(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        hoursForm.insertAdjacentElement('beforebegin', alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }
 
    // Aggiorna display orari per giorno
    function updateHoursDisplay(dayIndex) {
        const currentHoursElement = document.getElementById(`current_hours_${dayIndex}`);
        
        const isLunchClosed = document.getElementById(`lunch_closed_${dayIndex}`).checked;
        const lunchOpeningTime = document.querySelector(`.lunch-opening-time[data-day="${dayIndex}"]`).value;
        const lunchClosingTime = document.querySelector(`.lunch-closing-time[data-day="${dayIndex}"]`).value;
        
        const isDinnerClosed = document.getElementById(`dinner_closed_${dayIndex}`).checked;
        const dinnerOpeningTime = document.querySelector(`.dinner-opening-time[data-day="${dayIndex}"]`).value;
        const dinnerClosingTime = document.querySelector(`.dinner-closing-time[data-day="${dayIndex}"]`).value;
 
        // Aggiorna UI stato attuale
        currentHoursElement.innerHTML = `
            <strong>Stato attuale:</strong><br>
            <span class="me-3">
                Pranzo: 
                ${isLunchClosed 
                    ? '<span class="badge bg-danger">Chiuso</span>'
                    : `<span class="badge bg-success">${lunchOpeningTime} - ${lunchClosingTime}</span>`
                }
            </span>
            <span>
                Cena: 
                ${isDinnerClosed
                    ? '<span class="badge bg-danger">Chiuso</span>'
                    : `<span class="badge bg-success">${dinnerOpeningTime} - ${dinnerClosingTime}</span>`
                }
            </span>
        `;
 
        // Toggle visibilità selettori orari
        document.getElementById(`lunch_times_${dayIndex}`).style.display = isLunchClosed ? 'none' : 'block';
        document.getElementById(`dinner_times_${dayIndex}`).style.display = isDinnerClosed ? 'none' : 'block';
    }
 
    // Event listeners checkbox pranzo
    document.querySelectorAll('.is-lunch-closed').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            updateHoursDisplay(e.target.dataset.day);
        });
    });
 
    // Event listeners checkbox cena
    document.querySelectorAll('.is-dinner-closed').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            updateHoursDisplay(e.target.dataset.day);
        });
    });
 
    // Validazione orari pranzo
    document.querySelectorAll('select.lunch-opening-time, select.lunch-closing-time').forEach(select => {
        select.addEventListener('change', (e) => {
            const dayIndex = e.target.dataset.day;
            const openingTime = document.querySelector(`.lunch-opening-time[data-day="${dayIndex}"]`).value;
            const closingTime = document.querySelector(`.lunch-closing-time[data-day="${dayIndex}"]`).value;
            
            if (openingTime >= closingTime) {
                showMessage('L\'orario di apertura pranzo deve essere precedente all\'orario di chiusura', 'danger');
                e.target.value = e.target.defaultValue;
            }
            updateHoursDisplay(dayIndex);
        });
    });
 
    // Validazione orari cena  
    document.querySelectorAll('select.dinner-opening-time, select.dinner-closing-time').forEach(select => {
        select.addEventListener('change', (e) => {
            const dayIndex = e.target.dataset.day;
            const openingTime = document.querySelector(`.dinner-opening-time[data-day="${dayIndex}"]`).value;
            const closingTime = document.querySelector(`.dinner-closing-time[data-day="${dayIndex}"]`).value;
            
            if (openingTime >= closingTime) {
                showMessage('L\'orario di apertura cena deve essere precedente all\'orario di chiusura', 'danger');
                e.target.value = e.target.defaultValue;
            }
            updateHoursDisplay(dayIndex);
        });
    });
 
    // Salvataggio orari
    hoursForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
 
        try {
            const hours = [];
 
            // Raccogli orari per ogni giorno
            for (let i = 0; i < 7; i++) {
                const dayData = {
                    day_of_week: i,
                    is_lunch_closed: document.getElementById(`lunch_closed_${i}`).checked,
                    is_dinner_closed: document.getElementById(`dinner_closed_${i}`).checked,
                    lunch_opening_time: document.querySelector(`.lunch-opening-time[data-day="${i}"]`).value,
                    lunch_closing_time: document.querySelector(`.lunch-closing-time[data-day="${i}"]`).value,
                    dinner_opening_time: document.querySelector(`.dinner-opening-time[data-day="${i}"]`).value,
                    dinner_closing_time: document.querySelector(`.dinner-closing-time[data-day="${i}"]`).value
                };
                hours.push(dayData);
            }
 
            await RestaurantHoursManager.updateHours(hours);
            showMessage('Orari aggiornati con successo');
 
        } catch (error) {
            showMessage(error.message, 'danger');
        } finally {
            submitButton.disabled = false;
        }
    });
 
    // Reset orari predefiniti
    resetButton.addEventListener('click', async () => {
        if (!confirm('Sei sicuro di voler ripristinare gli orari predefiniti?')) {
            return;
        }
 
        try {
            resetButton.disabled = true;
            const defaultHours = [];
            
            // Imposta orari default per ogni giorno
            for (let i = 0; i < 7; i++) {
                defaultHours.push({
                    day_of_week: i,
                    lunch_opening_time: '12:00',
                    lunch_closing_time: '15:00',
                    dinner_opening_time: '19:00',
                    dinner_closing_time: '23:00',
                    is_lunch_closed: false,
                    is_dinner_closed: false
                });
            }
 
            await RestaurantHoursManager.updateHours(defaultHours);
            showMessage('Orari ripristinati ai valori predefiniti');
 
            // Aggiorna UI
            for (let i = 0; i < 7; i++) {
                document.getElementById(`lunch_closed_${i}`).checked = false;
                document.getElementById(`dinner_closed_${i}`).checked = false;
                document.querySelector(`.lunch-opening-time[data-day="${i}"]`).value = '12:00';
                document.querySelector(`.lunch-closing-time[data-day="${i}"]`).value = '15:00';
                document.querySelector(`.dinner-opening-time[data-day="${i}"]`).value = '19:00';
                document.querySelector(`.dinner-closing-time[data-day="${i}"]`).value = '23:00';
                updateHoursDisplay(i);
            }
 
        } catch (error) {
            showMessage(error.message, 'danger');
        } finally {
            resetButton.disabled = false;
        }
    });
 
    // Inizializzazione display orari
    for (let i = 0; i < 7; i++) {
        updateHoursDisplay(i);
    }
 });