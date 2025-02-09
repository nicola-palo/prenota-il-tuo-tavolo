Documentazione API Ristorante - Sistema di Gestione Prenotazioni

Formato delle Risposte:

Tutte le risposte API sono in formato JSON. Le risposte di successo
(status code 200, 201) generalmente contengono un campo data o un campo
specifico per la risorsa (es. booking, tables, hours, info), o un campo
message per operazioni completate con successo. Le risposte di errore
(status code 4xx, 500) contengono un campo error con una descrizione
dell\'errore. Autenticazione

La maggior parte degli endpoint amministrativi e alcuni endpoint utente
richiedono l\'autenticazione.

Autenticazione Basata su Sessione: L\'API utilizza l\'autenticazione
basata su sessione tramite Flask-Login. Dopo un login riuscito, la
sessione utente viene mantenuta tramite cookie. Ruoli Utente: Utente
Normale: Può gestire le proprie prenotazioni (visualizzare, creare,
modificare, cancellare le proprie prenotazioni). Admin: Ha tutti i
privilegi dell\'utente normale più la gestione di tavoli, orari
ristorante, informazioni ristorante e accesso a statistiche
amministrative. Endpoint Autenticazione

POST /auth/login: Login Utente

Richiede Autenticazione: No. Corpo della Richiesta (JSON): JSON

{ \"email\": \"string\", // Email dell\'utente \"password\": \"string\"
// Password dell\'utente } Risposta di Successo (200 OK): JSON

{ \"user\": { // Oggetto User serializzato (vedi modello User) \"id\":
integer, \"email\": \"string\", \"is_admin\": boolean, \"created_at\":
\"string (YYYY-MM-DD HH:MM:SS)\" } } Risposta di Errore (400 Bad
Request, 401 Unauthorized, 500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Email
e password richiesti. Password non valida (requisiti password non
rispettati). Email già registrata (in caso di registrazione - corretto
nel register endpoint). 401 Unauthorized: Credenziali non valide. 500
Internal Server Error: Errore generico del server. Note: Valida le
credenziali dell\'utente e, in caso di successo, imposta la sessione di
login. POST /auth/register: Registrazione Nuovo Utente

Richiede Autenticazione: No. Corpo della Richiesta (JSON): JSON

{ \"email\": \"string\", // Email per la registrazione \"password\":
\"string\" // Password per la registrazione (con requisiti) } Risposta
di Successo (201 Created): JSON

{ \"message\": \"Registrazione completata\" // Messaggio di successo }
Risposta di Errore (400 Bad Request, 500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Email
e password richieste. Password non valida (requisiti password non
rispettati: lunghezza minima 8 caratteri, almeno una maiuscola, una
minuscola, un carattere speciale). Email già registrata. 500 Internal
Server Error: Errore generico del server. Note: Registra un nuovo utente
nel sistema. Valida la password secondo criteri di sicurezza. POST
/auth/logout: Logout Utente

Richiede Autenticazione: Sì (Utente Loggato). Corpo della Richiesta:
Nessuno. Risposta di Successo (200 OK): JSON

{ \"message\": \"Logout effettuato con successo\" // Messaggio di
successo } Risposta di Errore (500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } Note: Effettua il
logout dell\'utente corrente, invalidando la sessione. Endpoint Gestione
Prenotazioni (/bookings)

GET /bookings: Lista Prenotazioni

Richiede Autenticazione: Sì (Utente Loggato). Parametri Query: Nessuno.
Risposta di Successo (200 OK): JSON

{ \"bookings\": \[ // Lista di oggetti Booking serializzati (vedi
modello Booking) { \"id\": integer, \"user_id\": integer,
\"user_email\": \"string\", \"table_id\": integer, \"date\": \"string
(YYYY-MM-DD)\", \"time\": \"string (HH:MM)\", \"guests\": integer,
\"notes\": \"string\", \"status\": \"string\", \"table_number\":
integer, \"table_seats\": integer, \"created_at\": \"string (YYYY-MM-DD
HH:MM:SS)\", \"modified_at\": \"string (YYYY-MM-DD HH:MM:SS)\" }, \...
\] } Risposta di Errore (500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } Note: Se l\'utente è
admin, restituisce tutte le prenotazioni ordinate per data e ora
decrescenti. Se l\'utente è normale, restituisce solo le prenotazioni
associate al suo ID utente, ordinate per data e ora decrescenti. POST
/bookings: Crea Nuova Prenotazione

Richiede Autenticazione: Sì (Utente Loggato). Corpo della Richiesta
(JSON): JSON

{ \"table_id\": integer, // ID del tavolo prenotato \"date\": \"string
(YYYY-MM-DD)\", // Data della prenotazione \"time\": \"string (HH:MM)\",
// Ora della prenotazione \"guests\": integer, // Numero di ospiti
\"notes\": \"string (opzionale)\" // Note aggiuntive (opzionale) }
Risposta di Successo (201 Created): JSON

{ \"booking\": { // Oggetto Booking serializzato della prenotazione
creata (vedi modello Booking) \"id\": integer, \"user_id\": integer,
\"user_email\": \"string\", \"table_id\": integer, \"date\": \"string
(YYYY-MM-DD)\", \"time\": \"string (HH:MM)\", \"guests\": integer,
\"notes\": \"string\", \"status\": \"string\", \"table_number\":
integer, \"table_seats\": integer, \"created_at\": \"string (YYYY-MM-DD
HH:MM:SS)\", \"modified_at\": \"string (YYYY-MM-DD HH:MM:SS)\" } }
Risposta di Errore (400 Bad Request, 500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Dati
non forniti. Dati incompleti (mancano table_id, date, time, guests).
Tavolo già prenotato per questo orario. Orario fuori dall\'orario di
apertura. Il ristorante è chiuso in questo orario. Orari non configurati
per questo giorno. 500 Internal Server Error: Errore generico del
server. Note: Valida i dati in input (presenza campi obbligatori,
formato data/ora, orari di apertura, disponibilità tavolo). Crea una
nuova prenotazione associata all\'utente loggato. PUT
/bookings/\<int:booking_id\>: Aggiorna Prenotazione Esistente

Richiede Autenticazione: Sì (Utente Loggato). Parametri URL: booking_id
(ID della prenotazione da aggiornare). Corpo della Richiesta (JSON):
JSON

{ \"table_id\": integer, // Nuovo ID del tavolo \"date\": \"string
(YYYY-MM-DD)\", // Nuova data \"time\": \"string (HH:MM)\", // Nuova ora
\"guests\": integer, // Nuovo numero di ospiti \"notes\": \"string
(opzionale)\" // Nuove note (opzionale) } Risposta di Successo (200 OK):
JSON

{ \"booking\": { // Oggetto Booking serializzato della prenotazione
aggiornata (vedi modello Booking) \"id\": integer, \"user_id\": integer,
\"user_email\": \"string\", \"table_id\": integer, \"date\": \"string
(YYYY-MM-DD)\", \"time\": \"string (HH:MM)\", \"guests\": integer,
\"notes\": \"string\", \"status\": \"string\", \"table_number\":
integer, \"table_seats\": integer, \"created_at\": \"string (YYYY-MM-DD
HH:MM:SS)\", \"modified_at\": \"string (YYYY-MM-DD HH:MM:SS)\" } }
Risposta di Errore (400 Bad Request, 403 Forbidden, 404 Not Found, 500
Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Dati
non forniti. Orario fuori dall\'orario di apertura. Il ristorante è
chiuso in questo orario. Tavolo già prenotato per questo orario. Orari
non configurati per questo giorno. 403 Forbidden: Non autorizzato (se
l\'utente non è il proprietario della prenotazione o non è admin). 404
Not Found: Prenotazione non trovata (se booking_id non esiste). 500
Internal Server Error: Errore generico del server. Note: Valida i dati
in input (orari, disponibilità tavolo, etc.). Aggiorna la prenotazione
specificata. Solo l\'utente che ha creato la prenotazione o un admin può
modificarla. DELETE /bookings/\<int:booking_id\>: Elimina Prenotazione

Richiede Autenticazione: Sì (Utente Loggato). Parametri URL: booking_id
(ID della prenotazione da eliminare). Corpo della Richiesta: Nessuno.
Risposta di Successo (200 OK): JSON

{ \"message\": \"Prenotazione cancellata\" // Messaggio di successo }
Risposta di Errore (403 Forbidden, 404 Not Found, 500 Internal Server
Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 403 Forbidden: Non
autorizzato (se l\'utente non è il proprietario della prenotazione o non
è admin). 404 Not Found: Prenotazione non trovata (se booking_id non
esiste). 500 Internal Server Error: Errore generico del server. Note:
Elimina la prenotazione specificata. Solo l\'utente che ha creato la
prenotazione o un admin può cancellarla. Endpoint Gestione Tavoli
(/tables)

GET /tables: Lista Tavoli

Richiede Autenticazione: No. Parametri Query: Nessuno. Risposta di
Successo (200 OK): JSON

{ \"tables\": \[ // Lista di oggetti Table serializzati (vedi modello
Table) { \"id\": integer, \"number\": integer, \"seats\": integer,
\"is_active\": boolean, \"created_at\": \"string (YYYY-MM-DD HH:MM:SS)\"
}, \... \] } Risposta di Errore (500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } Note: Restituisce la
lista di tutti i tavoli, ordinati per numero. Endpoint pubblico (non
richiede autenticazione). POST /tables: Crea Nuovo Tavolo

Richiede Autenticazione: Sì (Admin). Corpo della Richiesta (JSON): JSON

{ \"number\": integer, // Numero del tavolo (univoco) \"seats\": integer
// Numero di posti a sedere } Risposta di Successo (201 Created): JSON

{ \"table\": { // Oggetto Table serializzato del tavolo creato (vedi
modello Table) \"id\": integer, \"number\": integer, \"seats\": integer,
\"is_active\": boolean, \"created_at\": \"string (YYYY-MM-DD HH:MM:SS)\"
} } Risposta di Errore (400 Bad Request, 403 Forbidden, 500 Internal
Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Dati
incompleti (mancano number, seats). Numero tavolo già esistente. 403
Forbidden: Accesso non autorizzato (se l\'utente non è admin). 500
Internal Server Error: Errore generico del server. Note: Crea un nuovo
tavolo. Richiede ruolo amministratore. Valida l\'unicità del numero del
tavolo. PUT /tables/\<int:table_id\>: Aggiorna Tavolo Esistente

Richiede Autenticazione: Sì (Admin). Parametri URL: table_id (ID del
tavolo da aggiornare). Corpo della Richiesta (JSON): JSON

{ \"number\": integer (opzionale), // Nuovo numero del tavolo
(opzionale) \"seats\": integer (opzionale) // Nuovo numero di posti
(opzionale) } Risposta di Successo (200 OK): JSON

{ \"table\": { // Oggetto Table serializzato del tavolo aggiornato (vedi
modello Table) \"id\": integer, \"number\": integer, \"seats\": integer,
\"is_active\": boolean, \"created_at\": \"string (YYYY-MM-DD HH:MM:SS)\"
} } Risposta di Errore (400 Bad Request, 403 Forbidden, 404 Not Found,
500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Numero
tavolo già esistente (se si tenta di modificare il numero con uno già
esistente). 403 Forbidden: Accesso non autorizzato (se l\'utente non è
admin). 404 Not Found: Tavolo non trovato (se table_id non esiste). 500
Internal Server Error: Errore generico del server. Note: Aggiorna le
informazioni di un tavolo esistente. Richiede ruolo amministratore.
Valida l\'unicità del numero del tavolo se viene modificato. DELETE
/tables/\<int:table_id\>: Elimina Tavolo

Richiede Autenticazione: Sì (Admin). Parametri URL: table_id (ID del
tavolo da eliminare). Corpo della Richiesta: Nessuno. Risposta di
Successo (200 OK): JSON

{ \"message\": \"Tavolo eliminato\" // Messaggio di successo } Risposta
di Errore (400 Bad Request, 403 Forbidden, 404 Not Found, 500 Internal
Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request:
Impossibile eliminare: ci sono prenotazioni future per questo tavolo.
403 Forbidden: Accesso non autorizzato (se l\'utente non è admin). 404
Not Found: Tavolo non trovato (se table_id non esiste). 500 Internal
Server Error: Errore generico del server. Note: Elimina un tavolo.
Richiede ruolo amministratore. Impedisce l\'eliminazione se ci sono
prenotazioni future per quel tavolo. GET /tables/availability: Verifica
Disponibilità Tavoli

Richiede Autenticazione: No. Parametri Query: date: \"string
(YYYY-MM-DD)\" - Data per la verifica disponibilità. time: \"string
(HH:MM)\" - Ora per la verifica disponibilità. guests: integer - Numero
di ospiti. Risposta di Successo (200 OK): JSON

{ \"tables\": \[ // Lista di oggetti Table serializzati disponibili
(vedi modello Table) { \"id\": integer, \"number\": integer, \"seats\":
integer, \"is_active\": boolean, \"created_at\": \"string (YYYY-MM-DD
HH:MM:SS)\" }, \... \], \"restaurant_hours\": { // Orari di apertura
ristorante per la data richiesta \"lunch\": { \"opening_time\": \"string
(HH:MM)\", \"closing_time\": \"string (HH:MM)\", \"is_closed\": boolean
}, \"dinner\": { \"opening_time\": \"string (HH:MM)\", \"closing_time\":
\"string (HH:MM)\", \"is_closed\": boolean } } } Risposta di Errore (400
Bad Request, 500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request:
Parametri mancanti (date, time, guests). Numero ospiti deve essere
maggiore di 0. Per prenotazioni con 10+ persone contattare il ristorante
direttamente (restituisce info contatto). Non puoi prenotare per date
passate. Orario fuori dall\'orario di apertura. Il ristorante è chiuso a
pranzo/cena in questa data. Formato data o ora non valido. 500 Internal
Server Error: Errore generico del server. Note: Verifica la
disponibilità dei tavoli per una data, ora e numero di ospiti
specificati. Restituisce una lista di tavoli disponibili che possono
ospitare il numero di ospiti richiesto. Include anche gli orari di
apertura del ristorante per la data specificata. Gestisce il caso di
prenotazioni per gruppi numerosi (10+ persone) indirizzando a contatto
diretto. Endpoint Gestione Orari Ristorante (/restaurant/hours)

GET /restaurant/hours: Recupera Orari di Apertura Ristorante

Richiede Autenticazione: No. Parametri Query: Nessuno. Risposta di
Successo (200 OK): JSON

{ \"hours\": { // Oggetto contenente gli orari di apertura per ogni
giorno della settimana (0-6, Lunedì-Domenica) \"0\": { // Lunedì \"id\":
integer, \"day_of_week\": integer (0-6), \"lunch_opening_time\":
\"string (HH:MM)\", \"lunch_closing_time\": \"string (HH:MM)\",
\"dinner_opening_time\": \"string (HH:MM)\", \"dinner_closing_time\":
\"string (HH:MM)\", \"is_lunch_closed\": boolean, \"is_dinner_closed\":
boolean, \"created_at\": \"string (YYYY-MM-DD HH:MM:SS)\",
\"modified_at\": \"string (YYYY-MM-DD HH:MM:SS)\" }, \"1\": { // Martedì
\... }, \... \"6\": { // Domenica \... } } } Risposta di Errore (500
Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } Note: Restituisce gli
orari di apertura del ristorante per ogni giorno della settimana. Se gli
orari non sono configurati per un giorno, vengono restituiti gli orari
predefiniti. PUT /restaurant/hours: Aggiorna Orari di Apertura
Ristorante

Richiede Autenticazione: Sì (Admin). Corpo della Richiesta (JSON): JSON

{ \"hours\": \[ // Array di oggetti che definiscono gli orari per ogni
giorno della settimana (0-6, Lunedì-Domenica) { \"day_of_week\": integer
(0-6), // Giorno della settimana (0=Lunedì, 6=Domenica)
\"lunch_opening_time\": \"string (HH:MM)\", \"lunch_closing_time\":
\"string (HH:MM)\", \"dinner_opening_time\": \"string (HH:MM)\",
\"dinner_closing_time\": \"string (HH:MM)\", \"is_lunch_closed\":
boolean (opzionale), // Indica se il pranzo è chiuso per quel giorno
(default: false) \"is_dinner_closed\": boolean (opzionale) // Indica se
la cena è chiusa per quel giorno (default: false) }, \... (uno per ogni
giorno della settimana) \] } Risposta di Successo (200 OK): JSON

{ \"message\": \"Orari aggiornati con successo\", // Messaggio di
successo \"hours\": { // Oggetto con gli orari aggiornati (come nella
risposta GET /restaurant/hours) \"0\": { \... }, \"1\": { \... }, \...
\"6\": { \... } } } Risposta di Errore (400 Bad Request, 403 Forbidden,
500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Dati
orari mancanti. Formato orario non valido per un giorno specifico.
Orario pranzo non valido per un giorno (apertura dopo chiusura). Orario
cena non valido per un giorno (apertura dopo chiusura). Orari pranzo e
cena si sovrappongono per un giorno. 403 Forbidden: Accesso non
autorizzato (se l\'utente non è admin). 500 Internal Server Error:
Errore generico del server. Note: Aggiorna gli orari di apertura del
ristorante per tutti i giorni della settimana. Richiede ruolo
amministratore. Valida la correttezza degli orari (formato, non
sovrapposizione pranzo/cena, apertura precedente alla chiusura). GET
/restaurant/available-hours: Recupera Slot Orari Disponibili per Data

Richiede Autenticazione: No. Parametri Query: date: \"string
(YYYY-MM-DD)\" - Data per cui recuperare gli slot orari. booking_id
(opzionale): integer - ID di una prenotazione esistente (per modifica
prenotazione, esclude l\'orario corrente dalla lista, non implementato
nel codice fornito). Risposta di Successo (200 OK): JSON

{ \"hours\": \[ \"string (HH:MM)\", \"string (HH:MM)\", \... \], //
Lista di slot orari disponibili (ogni 30 minuti) \"message\": \"string
(opzionale)\", // Messaggio informativo se il ristorante è chiuso per
quel giorno \"lunch\": { // Informazioni sulla fascia oraria del pranzo
per la data richiesta \"available\": boolean, // Indica se il pranzo è
disponibile per quel giorno \"opening_time\": \"string (HH:MM)\"
(opzionale), // Orario di apertura pranzo (se disponibile)
\"closing_time\": \"string (HH:MM)\" (opzionale) // Orario di chiusura
pranzo (se disponibile) }, \"dinner\": { // Informazioni sulla fascia
oraria della cena per la data richiesta \"available\": boolean, //
Indica se la cena è disponibile per quel giorno \"opening_time\":
\"string (HH:MM)\" (opzionale), // Orario di apertura cena (se
disponibile) \"closing_time\": \"string (HH:MM)\" (opzionale) // Orario
di chiusura cena (se disponibile) } } Risposta di Errore (400 Bad
Request, 500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Data
richiesta (parametro date mancante). 500 Internal Server Error: Errore
generico del server. Note: Restituisce gli slot orari disponibili
(intervalli di 30 minuti) per la data specificata, basandosi sugli orari
di apertura del ristorante per quel giorno. Include informazioni sulla
disponibilità e orari di pranzo e cena per la data. Se il ristorante è
completamente chiuso per quel giorno, restituisce un messaggio
informativo. Endpoint Gestione Informazioni Ristorante
(/restaurant/info)

GET /restaurant/info: Recupera Informazioni Ristorante

Richiede Autenticazione: Sì (Admin). Parametri Query: Nessuno. Risposta
di Successo (200 OK): JSON

{ \"info\": { // Oggetto RestaurantInfo serializzato (vedi modello
RestaurantInfo) \"id\": integer, \"name\": \"string\", \"welcome_text\":
\"string\", \"description\": \"string\", \"phone\": \"string\",
\"email\": \"string\", \"address\": \"string\", \"parking_info\":
\"string\", \"colors\": { \"primary\": \"string (es. #RRGGBB)\",
\"secondary\": \"string (es. #RRGGBB)\", \"background\": \"string (es.
#RRGGBB)\" }, \"typography\": { \"fontFamily\": \"string\",
\"baseFontSize\": \"string (es. 16px)\", \"headingFontSize\": \"string
(es. 24px)\", \"fontWeight\": \"string\" }, \"components\": {
\"borderRadius\": \"string (es. 8px)\", \"boxShadow\": \"string\" },
\"logo_url\": \"string\", \"navbar_title\": \"string\", \"created_at\":
\"string (YYYY-MM-DD HH:MM:SS)\", \"modified_at\": \"string (YYYY-MM-DD
HH:MM:SS)\" } } Risposta di Errore (500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } Note: Restituisce le
informazioni generali del ristorante, inclusi dati di contatto e
configurazione tema UI. Richiede ruolo amministratore. Se non esistono
informazioni, vengono create quelle predefinite. PUT /restaurant/info:
Aggiorna Informazioni Ristorante

Richiede Autenticazione: Sì (Admin). Corpo della Richiesta (JSON): JSON

{ \"name\": \"string (opzionale)\", \"welcome_text\": \"string
(opzionale)\", \"description\": \"string (opzionale)\", \"phone\":
\"string (opzionale)\", \"email\": \"string (opzionale)\", \"address\":
\"string (opzionale)\", \"parking_info\": \"string (opzionale)\",
\"colors\": { // Oggetto opzionale per aggiornare i colori del tema
\"primary\": \"string (es. #RRGGBB) (opzionale)\", \"secondary\":
\"string (es. #RRGGBB) (opzionale)\", \"background\": \"string (es.
#RRGGBB) (opzionale)\" }, \"typography\": { // Oggetto opzionale per
aggiornare la tipografia del tema \"fontFamily\": \"string
(opzionale)\", \"baseFontSize\": \"string (es. 16px) (opzionale)\",
\"headingFontSize\": \"string (es. 24px) (opzionale)\", \"fontWeight\":
\"string (opzionale)\" }, \"components\": { // Oggetto opzionale per
aggiornare i componenti UI del tema \"borderRadius\": \"string (es. 8px)
(opzionale)\", \"boxShadow\": \"string (opzionale)\" },
\"navbar_title\": \"string (opzionale)\" } Risposta di Successo (200
OK): JSON

{ \"info\": { // Oggetto RestaurantInfo serializzato aggiornato (vedi
modello RestaurantInfo) \... // Campi RestaurantInfo aggiornati } }
Risposta di Errore (400 Bad Request, 403 Forbidden, 500 Internal Server
Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Dati
mancanti (se la richiesta PUT viene fatta senza corpo). 403 Forbidden:
Accesso non autorizzato (se l\'utente non è admin). 500 Internal Server
Error: Errore generico del server. Note: Aggiorna le informazioni del
ristorante. Richiede ruolo amministratore. Permette di aggiornare
parzialmente le informazioni inviando solo i campi da modificare.
Endpoint Upload Logo (/upload-logo)

POST /upload-logo: Upload Logo Ristorante Richiede Autenticazione: Sì
(Admin). Corpo della Richiesta (FormData): logo: file (immagine) - File
immagine del logo (formati supportati: png, jpg, jpeg, gif, svg,
dimensione massima 5MB). Risposta di Successo (200 OK): JSON

{ \"url\": \"string\" // URL del logo appena caricato (es.
/static/uploads/nomefile.png) } Risposta di Errore (400 Bad Request, 403
Forbidden, 500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 400 Bad Request: Nessun
file caricato. Nessun file selezionato. File troppo grande (max 5MB).
Formato file non supportato. 403 Forbidden: Accesso non autorizzato (se
l\'utente non è admin). 500 Internal Server Error: Errore generico del
server. Note: Permette di caricare un nuovo logo per il ristorante.
Richiede ruolo amministratore. Valida il formato e la dimensione del
file. Sostituisce il logo precedente se esistente. Endpoint Statistiche
Amministrative (/admin/stats)

GET /admin/stats: Recupera Statistiche Amministrative Richiede
Autenticazione: Sì (Admin). Parametri Query: Nessuno. Risposta di
Successo (200 OK): JSON

{ \"total_bookings\": integer, // Numero totale di prenotazioni
\"today_bookings\": integer, // Numero di prenotazioni per la data
odierna \"total_users\": integer, // Numero totale di utenti (esclusi
admin) \"total_tables\": integer, // Numero totale di tavoli
\"recent_bookings\": \[ // Lista delle ultime 10 prenotazioni recenti
(ultimi 5 giorni), ordinate per data e ora decrescenti { \"id\":
integer, \"user_id\": integer, \"user_email\": \"string\", \"table_id\":
integer, \"date\": \"string (YYYY-MM-DD)\", \"time\": \"string
(HH:MM)\", \"guests\": integer, \"notes\": \"string\", \"status\":
\"string\", \"table_number\": integer, \"table_seats\": integer,
\"created_at\": \"string (YYYY-MM-DD HH:MM:SS)\", \"modified_at\":
\"string (YYYY-MM-DD HH:MM:SS)\" }, \... (fino a 10 prenotazioni) \] }
Risposta di Errore (403 Forbidden, 500 Internal Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 403 Forbidden: Accesso
non autorizzato (se l\'utente non è admin). 500 Internal Server Error:
Errore generico del server. Note: Restituisce statistiche generali per
la dashboard amministratore. Richiede ruolo amministratore. Include
totali di prenotazioni, utenti, tavoli e una lista delle prenotazioni
recenti. Endpoint Gestione Tema UI (/theme)

GET /theme: Recupera Configurazione Tema UI

Richiede Autenticazione: No. Parametri Query: Nessuno. Risposta di
Successo (200 OK): JSON

{ \"theme\": { // Oggetto contenente la configurazione del tema UI
\"colors\": { \"primary\": \"string (es. #RRGGBB)\", \"secondary\":
\"string (es. #RRGGBB)\", \"background\": \"string (es. #RRGGBB)\" },
\"typography\": { \"fontFamily\": \"string\", \"baseFontSize\": \"string
(es. 16px)\", \"headingFontSize\": \"string (es. 24px)\",
\"fontWeight\": \"string\" }, \"components\": { \"borderRadius\":
\"string (es. 8px)\", \"boxShadow\": \"string\" },
\"showRestaurantName\": boolean } } Risposta di Errore (500 Internal
Server Error): JSON

{ \"error\": \"string\" // Messaggio di errore } Note: Restituisce la
configurazione del tema UI (colori, tipografia, componenti). Endpoint
pubblico (non richiede autenticazione). PUT /theme/update: Aggiorna
Configurazione Tema UI

Richiede Autenticazione: Sì (Admin). Corpo della Richiesta (JSON): JSON

{ \"colors\": { // Oggetto opzionale per aggiornare i colori del tema
\"primary\": \"string (es. #RRGGBB) (opzionale)\", \"secondary\":
\"string (es. #RRGGBB) (opzionale)\", \"background\": \"string (es.
#RRGGBB) (opzionale)\" }, \"typography\": { // Oggetto opzionale per
aggiornare la tipografia del tema \"fontFamily\": \"string
(opzionale)\", \"baseFontSize\": \"string (es. 16px) (opzionale)\",
\"headingFontSize\": \"string (es. 24px) (opzionale)\", \"fontWeight\":
\"string (opzionale)\" }, \"components\": { // Oggetto opzionale per
aggiornare i componenti UI del tema \"borderRadius\": \"string (es. 8px)
(opzionale)\", \"boxShadow\": \"string (opzionale)\" },
\"showRestaurantName\": boolean (opzionale) } Risposta di Successo (200
OK): JSON

{ \"theme\": { // Oggetto con la configurazione del tema UI aggiornata
(come nella risposta GET /theme) \... // Configurazione tema UI
aggiornata } } Risposta di Errore (403 Forbidden, 500 Internal Server
Error): JSON

{ \"error\": \"string\" // Messaggio di errore } 403 Forbidden: Accesso
non autorizzato (se l\'utente non è admin). 500 Internal Server Error:
Errore generico del server. Note: Aggiorna la configurazione del tema
UI. Richiede ruolo amministratore. Permette di aggiornare parzialmente
la configurazione inviando solo le sezioni da modificare (colors,
typography, components, showRestaurantName).
