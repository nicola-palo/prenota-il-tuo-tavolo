/**
* restaurant-hours-manager.js
* Gestione orari apertura ristorante con cache
*/

const RestaurantHoursManager = {
    _hoursCache: null,
    _lastFetch: null,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minuti
 
    // Recupera orari con gestione cache
    async getHours(forceRefresh = false) {
        if (!forceRefresh && this._hoursCache && 
            (Date.now() - this._lastFetch) < this.CACHE_DURATION) {
            return this._hoursCache;
        }
 
        try {
            const response = await APIClient.getRestaurantHours();
            this._hoursCache = response.hours;
            this._lastFetch = Date.now();
            return this._hoursCache;
        } catch (error) {
            console.error('Error fetching restaurant hours:', error);
            throw error;
        }
    },
 
    // Recupera slot disponibili per data
    async getAvailableTimeSlots(date, excludeBookingId = null) {
        const hours = await this.getHours();
        const dayOfWeek = new Date(date).getDay();
        const dayHours = hours[dayOfWeek];
 
        if (!dayHours || (dayHours.is_lunch_closed && dayHours.is_dinner_closed)) {
            return {
                available: false,
                reason: 'closed',
                slots: []
            };
        }
 
        try {
            const params = new URLSearchParams({ date });
            if (excludeBookingId) {
                params.append('booking_id', excludeBookingId);
            }
            const availableHours = await APIClient.getAvailableHours(date);
 
            // Organizza slot per fascia oraria
            const lunchSlots = [];
            const dinnerSlots = [];
 
            if (!dayHours.is_lunch_closed) {
                const lunchStart = this._parseTime(dayHours.lunch_opening_time);
                const lunchEnd = this._parseTime(dayHours.lunch_closing_time);
                availableHours.hours.forEach(time => {
                    const slotTime = this._parseTime(time);
                    if (slotTime >= lunchStart && slotTime <= lunchEnd) {
                        lunchSlots.push(time);
                    }
                });
            }
 
            if (!dayHours.is_dinner_closed) {
                const dinnerStart = this._parseTime(dayHours.dinner_opening_time);
                const dinnerEnd = this._parseTime(dayHours.dinner_closing_time);
                availableHours.hours.forEach(time => {
                    const slotTime = this._parseTime(time);
                    if (slotTime >= dinnerStart && slotTime <= dinnerEnd) {
                        dinnerSlots.push(time);
                    }
                });
            }
 
            return {
                available: true,
                lunch: {
                    available: !dayHours.is_lunch_closed,
                    openingTime: dayHours.lunch_opening_time,
                    closingTime: dayHours.lunch_closing_time,
                    slots: lunchSlots
                },
                dinner: {
                    available: !dayHours.is_dinner_closed,
                    openingTime: dayHours.dinner_opening_time,
                    closingTime: dayHours.dinner_closing_time,
                    slots: dinnerSlots
                }
            };
        } catch (error) {
            console.error('Error getting available time slots:', error);
            throw error;
        }
    },
 
    // Converte orario in minuti
    _parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },
 
    // Popola select orari disponibili
    async populateTimeSelect(selectElement, date, selectedTime = null, excludeBookingId = null) {
        selectElement.disabled = true;
        selectElement.innerHTML = '<option value="">Caricamento orari...</option>';
 
        try {
            const timeSlots = await this.getAvailableTimeSlots(date, excludeBookingId);
            selectElement.innerHTML = '<option value="">Seleziona un orario</option>';
 
            if (!timeSlots.available) {
                selectElement.innerHTML += `
                    <option value="" disabled>Il ristorante è chiuso in questa data</option>`;
                return;
            }
 
            // Aggiunge orari pranzo
            if (timeSlots.lunch.available && timeSlots.lunch.slots.length > 0) {
                const lunchOptgroup = document.createElement('optgroup');
                lunchOptgroup.label = 'Pranzo';
                timeSlots.lunch.slots.forEach(time => {
                    const option = new Option(time, time, time === selectedTime, time === selectedTime);
                    lunchOptgroup.appendChild(option);
                });
                selectElement.appendChild(lunchOptgroup);
            }
 
            // Aggiunge orari cena
            if (timeSlots.dinner.available && timeSlots.dinner.slots.length > 0) {
                const dinnerOptgroup = document.createElement('optgroup');
                dinnerOptgroup.label = 'Cena';
                timeSlots.dinner.slots.forEach(time => {
                    const option = new Option(time, time, time === selectedTime, time === selectedTime);
                    dinnerOptgroup.appendChild(option);
                });
                selectElement.appendChild(dinnerOptgroup);
            }
 
            if ((!timeSlots.lunch.available || timeSlots.lunch.slots.length === 0) && 
                (!timeSlots.dinner.available || timeSlots.dinner.slots.length === 0)) {
                selectElement.innerHTML += `
                    <option value="" disabled>Nessun orario disponibile per questa data</option>`;
            }
 
        } catch (error) {
            selectElement.innerHTML = `<option value="">Errore caricamento orari</option>`;
            console.error('Error populating time select:', error);
        } finally {
            selectElement.disabled = false;
        }
    },
 
    // Verifica disponibilità slot orario
    async isTimeSlotAvailable(date, time, excludeBookingId = null) {
        try {
            const timeSlots = await this.getAvailableTimeSlots(date, excludeBookingId);
            if (!timeSlots.available) return false;
 
            const timeMinutes = this._parseTime(time);
            const hours = await this.getHours();
            const dayOfWeek = new Date(date).getDay();
            const dayHours = hours[dayOfWeek];
 
            if (!dayHours.is_lunch_closed) {
                const lunchStart = this._parseTime(dayHours.lunch_opening_time);
                const lunchEnd = this._parseTime(dayHours.lunch_closing_time);
                if (timeMinutes >= lunchStart && timeMinutes <= lunchEnd) {
                    return timeSlots.lunch.slots.includes(time);
                }
            }
 
            if (!dayHours.is_dinner_closed) {
                const dinnerStart = this._parseTime(dayHours.dinner_opening_time);
                const dinnerEnd = this._parseTime(dayHours.dinner_closing_time);
                if (timeMinutes >= dinnerStart && timeMinutes <= dinnerEnd) {
                    return timeSlots.dinner.slots.includes(time);
                }
            }
 
            return false;
        } catch (error) {
            console.error('Error checking time slot availability:', error);
            return false;
        }
    },
 
    // Aggiorna orari apertura
    async updateHours(hoursData) {
        try {
            const response = await APIClient.updateRestaurantHours(hoursData);
            this._hoursCache = response.hours;
            this._lastFetch = Date.now();
            return response;
        } catch (error) {
            console.error('Error updating restaurant hours:', error);
            throw error;
        }
    }
 };
 
 window.RestaurantHoursManager = RestaurantHoursManager;