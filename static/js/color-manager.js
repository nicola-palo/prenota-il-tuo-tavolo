/**
* color-manager.js
* Gestione colori tema UI
*/

const ColorManager = {
    // Recupera colori tema 
    async getColors() {
        const response = await APIClient.request('colors');
        return response.colors;
    },
 
    // Aggiorna colori tema
    async updateColors(colors) {
        return APIClient.request('colors', {
            method: 'PUT',
            body: JSON.stringify(colors)
        });
    },
 
    // Applica colori alle variabili CSS
    applyColors(colors) {
        document.documentElement.style.setProperty('--theme-primary', colors.primary);
        document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
        document.documentElement.style.setProperty('--theme-background', colors.background);
    }
 };