/**
* tables-management.js
* Gestione CRUD tavoli per area admin
*/

document.addEventListener('DOMContentLoaded', function() {
    const addTableForm = document.getElementById('addTableForm');
    const tablesList = document.getElementById('tablesList');
    const editTableModal = new bootstrap.Modal(document.getElementById('editTableModal'));
    
    let currentTables = [];
 
    function showMessage(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        const container = document.querySelector('.card-body');
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    }
 
    // Caricamento lista tavoli
    async function loadTables() {
        try {
            const response = await APIClient.getTables();
            currentTables = response.tables.sort((a, b) => a.number - b.number);
            
            if (currentTables.length === 0) {
                tablesList.innerHTML = `
                    <div class="alert alert-info">
                        Nessun tavolo presente. Aggiungi il tuo primo tavolo!
                    </div>`;
                return;
            }
 
            renderTablesList();
 
        } catch (error) {
            tablesList.innerHTML = `
                <div class="alert alert-danger">
                    Errore nel caricamento dei tavoli: ${error.message}
                </div>`;
        }
    }
 
    // Rendering lista tavoli
    function renderTablesList() {
        tablesList.innerHTML = `
            <div class="table-responsive">
                <table class="table">
                    <thead class="bg-wood text-white">
                        <tr>
                            <th>Numero</th>
                            <th>Posti</th>
                            <th class="text-center">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentTables.map(renderTableRow).join('')}
                    </tbody>
                </table>
            </div>`;
 
        addTableEventListeners();
    }
 
    function renderTableRow(table) {
        return `
            <tr>
                <td>${table.number}</td>
                <td>${table.seats}</td>
                <td class="text-center">
                    <button class="btn btn-primary btn-sm edit-table me-2" 
                            data-table-id="${table.id}">
                        <i class="fas fa-edit"></i> Modifica
                    </button>
                    <button class="btn btn-danger btn-sm delete-table" 
                            data-table-id="${table.id}">
                        <i class="fas fa-trash"></i> Elimina
                    </button>
                </td>
            </tr>`;
    }
 
    function addTableEventListeners() {
        document.querySelectorAll('.edit-table').forEach(button => {
            button.addEventListener('click', () => handleEditTable(button.dataset.tableId));
        });
 
        document.querySelectorAll('.delete-table').forEach(button => {
            button.addEventListener('click', () => handleDeleteTable(button.dataset.tableId));
        });
    }
 
    // Gestione eliminazione tavolo
    async function handleDeleteTable(tableId) {
        if (!confirm('Sei sicuro di voler eliminare questo tavolo?')) return;
        
        try {
            await APIClient.deleteTable(tableId);
            showMessage('Tavolo eliminato con successo');
            await loadTables();
        } catch (error) {
            showMessage(error.message, 'danger');
        }
    }
 
    // Gestione modifica tavolo
    function handleEditTable(tableId) {
        const table = currentTables.find(t => t.id === parseInt(tableId));
        if (!table) return;
        
        document.getElementById('editTableId').value = table.id;
        document.getElementById('editTableNumber').value = table.number;
        document.getElementById('editTableSeats').value = table.seats;
        
        editTableModal.show();
    }
 
    // Handler salvataggio modifiche
    document.getElementById('saveTableBtn').addEventListener('click', async () => {
        const button = document.getElementById('saveTableBtn');
        button.disabled = true;
 
        try {
            const tableId = document.getElementById('editTableId').value;
            const formData = {
                number: parseInt(document.getElementById('editTableNumber').value),
                seats: parseInt(document.getElementById('editTableSeats').value)
            };
 
            if (!formData.number || !formData.seats) {
                throw new Error('Compila tutti i campi');
            }
 
            if (formData.seats < 2) {
                throw new Error('Il numero di posti deve essere almeno 2');
            }
 
            await APIClient.updateTable(tableId, formData);
            editTableModal.hide();
            showMessage('Tavolo modificato con successo');
            await loadTables();
        } catch (error) {
            showMessage(error.message, 'danger');
        } finally {
            button.disabled = false;
        }
    });
 
    // Handler creazione nuovo tavolo
    addTableForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
 
        try {
            const formData = {
                number: parseInt(document.getElementById('table_number').value),
                seats: parseInt(document.getElementById('table_seats').value)
            };
 
            if (!formData.number || !formData.seats) {
                throw new Error('Compila tutti i campi');
            }
 
            if (formData.seats < 2) {
                throw new Error('Il numero di posti deve essere almeno 2');
            }
 
            await APIClient.addTable(formData);
            showMessage('Tavolo aggiunto con successo');
            addTableForm.reset();
            await loadTables();
        } catch (error) {
            showMessage(error.message, 'danger');
        } finally {
            submitButton.disabled = false;
        }
    });
 
    // Caricamento iniziale
    loadTables();
 });