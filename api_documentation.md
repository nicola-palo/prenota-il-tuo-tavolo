# Documentazione API Sistema di Gestione Prenotazioni Ristorante

## Indice
- [Introduzione](#introduzione)
- [Guida Rapida](#guida-rapida)
- [Autenticazione](#autenticazione)
- [Best Practices](#best-practices)
- [Endpoints](#endpoints)
  - [Autenticazione](#endpoints-autenticazione)
  - [Prenotazioni](#endpoints-prenotazioni)
  - [Tavoli](#endpoints-tavoli)
  - [Orari Ristorante](#endpoints-orari)
  - [Informazioni Ristorante](#endpoints-informazioni)
  - [Upload Logo](#endpoint-logo)
  - [Statistiche Admin](#endpoints-statistiche)
  - [Tema UI](#endpoints-tema)
- [Sicurezza](#sicurezza)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Changelog](#changelog)

## Introduzione

Questa API fornisce un sistema completo di gestione prenotazioni per ristoranti. Tutte le risposte sono in formato JSON e utilizzano i seguenti codici di stato HTTP:
- 200: Successo
- 201: Creazione completata
- 400: Richiesta non valida
- 401: Non autorizzato
- 403: Accesso negato
- 404: Risorsa non trovata
- 500: Errore interno del server

## Guida Rapida

### Esempio di Prenotazione Base
```bash
# Login
curl -X POST http://api.esempio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Creazione Prenotazione
curl -X POST http://api.esempio.com/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "date": "2025-02-10",
    "time": "20:00",
    "guests": 4
  }'
```

## Autenticazione

L'API utilizza autenticazione basata su sessione tramite Flask-Login. La sessione viene mantenuta tramite cookie dopo il login.

### Ruoli Utente
- **Utente Standard**: Gestione delle proprie prenotazioni
- **Amministratore**: Accesso completo a tutte le funzionalità

### Requisiti Password
- Lunghezza minima: 8 caratteri
- Almeno una lettera maiuscola
- Almeno una lettera minuscola
- Almeno un carattere speciale

## Best Practices

1. **Gestione Prenotazioni**
   - Verificare sempre la disponibilità prima di creare una prenotazione
   - Implementare un sistema di retry in caso di errori di rete
   - Gestire correttamente i timezone

2. **Performance**
   - Implementare caching lato client
   - Utilizzare la paginazione per liste lunghe
   - Minimizzare il numero di richieste

3. **Sicurezza**
   - Utilizzare HTTPS
   - Implementare rate limiting
   - Validare tutti gli input

## Endpoints

### Endpoints Autenticazione

#### POST /auth/login
Effettua il login dell'utente

**Autenticazione Richiesta**: No

**Corpo Richiesta**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Risposta Successo (200 OK)**:
```json
{
  "user": {
    "id": "integer",
    "email": "string",
    "is_admin": "boolean",
    "created_at": "string (YYYY-MM-DD HH:MM:SS)"
  }
}
```

**Esempi di Errore**:
```json
{
  "error": "Email e password sono richiesti"
}
```
```json
{
  "error": "Credenziali non valide"
}
```

#### POST /auth/register
Registra un nuovo utente

**Autenticazione Richiesta**: No

**Corpo Richiesta**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Risposta Successo (201 Created)**:
```json
{
  "message": "Registrazione completata con successo"
}
```

### Endpoints Prenotazioni

#### GET /bookings
Recupera lista prenotazioni

**Autenticazione Richiesta**: Sì

**Risposta Successo (200 OK)**:
```json
{
  "bookings": [
    {
      "id": "integer",
      "user_id": "integer",
      "user_email": "string",
      "table_id": "integer",
      "date": "string (YYYY-MM-DD)",
      "time": "string (HH:MM)",
      "guests": "integer",
      "notes": "string",
      "status": "string",
      "table_number": "integer",
      "table_seats": "integer",
      "created_at": "string",
      "modified_at": "string"
    }
  ]
}
```

**Note**:
- Gli utenti standard vedono solo le proprie prenotazioni
- Gli admin vedono tutte le prenotazioni
- Le prenotazioni sono ordinate per data e ora decrescenti

#### POST /bookings
Crea una nuova prenotazione

**Autenticazione Richiesta**: Sì

**Corpo Richiesta**:
```json
{
  "table_id": "integer",
  "date": "string (YYYY-MM-DD)",
  "time": "string (HH:MM)",
  "guests": "integer",
  "notes": "string (opzionale)"
}
```

**Validazioni**:
- La data non può essere nel passato
- Il numero di ospiti deve essere maggiore di 0
- L'orario deve essere negli orari di apertura
- Il tavolo deve essere disponibile

### Endpoints Tavoli

#### GET /tables
Recupera lista tavoli

**Autenticazione Richiesta**: No

**Risposta Successo (200 OK)**:
```json
{
  "tables": [
    {
      "id": "integer",
      "number": "integer",
      "seats": "integer",
      "is_active": "boolean",
      "created_at": "string"
    }
  ]
}
```

#### GET /tables/availability
Verifica disponibilità tavoli

**Parametri Query**:
- date: "string (YYYY-MM-DD)"
- time: "string (HH:MM)"
- guests: "integer"

**Risposta Successo (200 OK)**:
```json
{
  "tables": [
    {
      "id": "integer",
      "number": "integer",
      "seats": "integer",
      "is_active": "boolean"
    }
  ],
  "restaurant_hours": {
    "lunch": {
      "opening_time": "string (HH:MM)",
      "closing_time": "string (HH:MM)",
      "is_closed": "boolean"
    },
    "dinner": {
      "opening_time": "string (HH:MM)",
      "closing_time": "string (HH:MM)",
      "is_closed": "boolean"
    }
  }
}
```

### Endpoints Orari

#### GET /restaurant/hours
Recupera orari del ristorante

**Autenticazione Richiesta**: No

**Risposta Successo (200 OK)**:
```json
{
  "hours": {
    "0": {
      "day_of_week": "integer (0-6)",
      "lunch_opening_time": "string (HH:MM)",
      "lunch_closing_time": "string (HH:MM)",
      "dinner_opening_time": "string (HH:MM)",
      "dinner_closing_time": "string (HH:MM)",
      "is_lunch_closed": "boolean",
      "is_dinner_closed": "boolean"
    }
  }
}
```

## Sicurezza

### Rate Limiting
- 100 richieste per minuto per IP
- 1000 richieste per ora per utente autenticato

### Protezione CSRF
- Token CSRF richiesto per tutte le richieste POST, PUT, DELETE
- Il token viene fornito nell'header X-CSRF-TOKEN

### Validazione Input
- Sanitizzazione di tutti gli input
- Validazione delle date
- Escape dei caratteri speciali

## FAQ

**D**: Come gestisco le prenotazioni per gruppi numerosi?
**R**: Per gruppi di 10 o più persone, il sistema suggerisce di contattare direttamente il ristorante.

**D**: Come funziona la cancellazione delle prenotazioni?
**R**: Le prenotazioni possono essere cancellate fino a 24 ore prima dell'orario prenotato.

## Troubleshooting

### Errori Comuni
1. "Tavolo non disponibile"
   - Verificare che la data/ora sia corretta
   - Controllare il numero di ospiti
   - Verificare gli orari di apertura

2. "Autenticazione fallita"
   - Verificare le credenziali
   - Controllare che il token di sessione sia valido
   - Verificare i cookie

## Testing

### Ambiente di Test
```bash
# Configurazione ambiente di test
export API_URL=http://api-test.esempio.com
export API_KEY=test_key_123

# Esecuzione test
npm run test
```

### Esempi di Test
```javascript
describe('Prenotazioni', () => {
  it('dovrebbe creare una nuova prenotazione', async () => {
    // Codice test
  });
});
```

## Changelog

### v1.0.0 (2025-02-09)
- Release iniziale
- Implementazione sistema base di prenotazioni
- Gestione tavoli e orari
- Sistema di autenticazione

### v1.1.0 (2025-02-10)
- Aggiunto sistema di notifiche
- Migliorata gestione errori
- Aggiunte statistiche admin
