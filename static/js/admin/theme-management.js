/**
* theme-management.js
* Gestione tema UI: colori, tipografia, componenti 
*/

document.addEventListener('DOMContentLoaded', function() {
    // Cache elementi DOM
    const elements = {
        preview: {
            card: document.querySelector('.col-md-4 > .card'),
            header: document.querySelector('.col-md-4 > .card > .card-header'),
            content: document.getElementById('themePreview')
        },
        controls: {
            form: document.getElementById('themeForm'),
            primaryColor: document.getElementById('primaryColor'),
            secondaryColor: document.getElementById('secondaryColor'),
            backgroundColor: document.getElementById('backgroundColor'),
            fontFamily: document.getElementById('fontFamily'),
            baseFontSize: document.getElementById('baseFontSize'),
            headingFontSize: document.getElementById('headingFontSize'),
            fontWeight: document.getElementById('fontWeight'),
            borderRadius: document.getElementById('borderRadius'),
            shadowIntensity: document.getElementById('shadowIntensity'),
            showRestaurantName: document.getElementById('showRestaurantName')
        },
        displays: {
            baseFontSize: document.getElementById('baseFontSizeValue'),
            headingFontSize: document.getElementById('headingFontSizeValue'),
            borderRadius: document.getElementById('borderRadiusValue'),
            shadowIntensity: document.getElementById('shadowIntensityValue')
        }
    };
 
    // Aggiorna valori display
    function updateDisplayValues() {
        elements.displays.baseFontSize.textContent = `${elements.controls.baseFontSize.value}px`;
        elements.displays.headingFontSize.textContent = `${elements.controls.headingFontSize.value}px`;
        elements.displays.borderRadius.textContent = `${elements.controls.borderRadius.value}px`;
        elements.displays.shadowIntensity.textContent = `${elements.controls.shadowIntensity.value}%`;
    }
 
    // Genera valore box-shadow
    function createShadow(intensity) {
        return `0 2px ${intensity/2}px rgba(0,0,0,${intensity/100})`;
    }
 
    // Aggiorna preview tema
    function updatePreview() {
        const {
            primaryColor, secondaryColor, backgroundColor,
            fontFamily, baseFontSize, headingFontSize,
            fontWeight, borderRadius, shadowIntensity
        } = elements.controls;
 
        // Card preview
        elements.preview.card.style.backgroundColor = backgroundColor.value;
        elements.preview.card.style.border = `1px solid ${primaryColor.value}`;
        elements.preview.card.style.borderRadius = `${borderRadius.value}px`;
        elements.preview.card.style.boxShadow = createShadow(shadowIntensity.value);
        elements.preview.card.style.fontFamily = fontFamily.value;
        elements.preview.card.style.fontSize = `${baseFontSize.value}px`;
        elements.preview.card.style.fontWeight = fontWeight.value;
 
        // Header preview
        elements.preview.header.style.backgroundColor = primaryColor.value;
        elements.preview.header.style.borderTopLeftRadius = `${borderRadius.value}px`;
        elements.preview.header.style.borderTopRightRadius = `${borderRadius.value}px`;
        elements.preview.header.querySelector('h5').style.fontSize = `${headingFontSize.value}px`;
 
        // Content preview
        const previewHeading = elements.preview.content.querySelector('.preview-heading');
        previewHeading.style.fontSize = `${headingFontSize.value}px`;
        previewHeading.style.color = primaryColor.value;
        previewHeading.style.fontFamily = fontFamily.value;
        previewHeading.style.fontWeight = fontWeight.value;
 
        const previewText = elements.preview.content.querySelector('.preview-text');
        previewText.style.fontSize = `${baseFontSize.value}px`;
        previewText.style.fontFamily = fontFamily.value;
        previewText.style.fontWeight = fontWeight.value;
 
        const previewCard = elements.preview.content.querySelector('.preview-card');
        previewCard.style.backgroundColor = backgroundColor.value;
        previewCard.style.borderRadius = `${borderRadius.value}px`;
        previewCard.style.boxShadow = createShadow(shadowIntensity.value);
        previewCard.style.border = `1px solid ${primaryColor.value}`;
        previewCard.style.fontFamily = fontFamily.value;
 
        // Button preview
        const button = elements.preview.content.querySelector('.btn-wood');
        button.style.backgroundColor = primaryColor.value;
        button.style.borderRadius = `${borderRadius.value}px`;
        button.style.fontFamily = fontFamily.value;
        button.style.fontSize = `${baseFontSize.value}px`;
        button.style.fontWeight = fontWeight.value;
        
        button.onmouseenter = () => {
            button.style.backgroundColor = secondaryColor.value;
            button.style.color = '#212529';
        };
        button.onmouseleave = () => {
            button.style.backgroundColor = primaryColor.value;
            button.style.color = '#ffffff';
        };
 
        updateDisplayValues();
    }
 
    // Carica tema corrente
    async function loadTheme() {
        try {
            const {theme} = await APIClient.request('theme');
            
            elements.controls.primaryColor.value = theme.colors.primary;
            elements.controls.secondaryColor.value = theme.colors.secondary;
            elements.controls.backgroundColor.value = theme.colors.background;
            elements.controls.fontFamily.value = theme.typography.fontFamily;
            elements.controls.baseFontSize.value = parseInt(theme.typography.baseFontSize);
            elements.controls.headingFontSize.value = parseInt(theme.typography.headingFontSize);
            elements.controls.fontWeight.value = theme.typography.fontWeight;
            elements.controls.borderRadius.value = parseInt(theme.components.borderRadius);
            elements.controls.shadowIntensity.value = parseInt(theme.components.shadowIntensity || 10);
            elements.controls.showRestaurantName.checked = theme.showRestaurantName ?? true;
            
            updatePreview();
        } catch (error) {
            console.error('Errore nel caricamento del tema:', error);
            showMessage('Errore nel caricamento del tema', 'danger');
        }
    }
 
    // Gestione messaggi
    function showMessage(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        elements.controls.form.insertAdjacentElement('beforebegin', alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }
 
    // Handler form salvataggio
    elements.controls.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
 
        try {
            await APIClient.request('theme/update', {
                method: 'PUT',
                body: JSON.stringify({
                    colors: {
                        primary: elements.controls.primaryColor.value,
                        secondary: elements.controls.secondaryColor.value,
                        background: elements.controls.backgroundColor.value
                    },
                    typography: {
                        fontFamily: elements.controls.fontFamily.value,
                        baseFontSize: `${elements.controls.baseFontSize.value}px`,
                        headingFontSize: `${elements.controls.headingFontSize.value}px`,
                        fontWeight: elements.controls.fontWeight.value
                    },
                    components: {
                        borderRadius: `${elements.controls.borderRadius.value}px`,
                        boxShadow: createShadow(elements.controls.shadowIntensity.value)
                    },
                    showRestaurantName: elements.controls.showRestaurantName.checked
                })
            });
            showMessage('Tema aggiornato con successo');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            console.error('Errore nel salvataggio del tema:', error);
            showMessage('Errore nel salvataggio del tema', 'danger');
        } finally {
            submitButton.disabled = false;
        }
    });
 
    // Event listeners controlli tema
    Object.values(elements.controls).forEach(control => {
        if (control instanceof HTMLElement && control.type !== 'submit') {
            ['input', 'change'].forEach(event => {
                control.addEventListener(event, updatePreview);
            });
        }
    });
 
    // Caricamento iniziale
    loadTheme();
 });