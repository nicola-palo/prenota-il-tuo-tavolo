RESTAURANT MANAGER PRO
====================

Sistema completo di gestione prenotazioni per ristoranti sviluppato con Flask e SQLAlchemy.

AVVIO RAPIDO
------------
Dopo aver clonato il repository, il sistema dovrebbe essere già pronto all'uso.
Basta avviare:

python app.py

Accedi all'applicazione su: http://127.0.0.1:5000

Credenziali Admin:
- Email: admin@example.com
- Password: Admin@123

FUNZIONALITÀ PRINCIPALI
----------------------
- Sistema prenotazione tavoli con controllo disponibilità
- Dashboard amministratore per gestione prenotazioni, tavoli e orari
- Tema e stile personalizzabili
- Design responsive
- Autenticazione e autorizzazione utenti
- API REST per tutte le operazioni

REQUISITI
---------
- Python 3.10 o superiore
- Accesso Internet per scaricare le dipendenze pip (se necessario)

INSTALLAZIONE LOCALE (SE NECESSARIO)
----------------------------------
Se l'avvio diretto non funziona, seguire questi passaggi:

1. Crea e attiva ambiente virtuale:
   python -m venv venv
   
   Linux/Mac:
   source venv/bin/activate
   
   Windows:
   venv\Scripts\activate

2. Installa dipendenze:
   pip install -r requirements.txt

3. Avvia il server:
   python app.py

TEST FUNZIONALI
--------------
python test.py

Il test verifica:
- Login utente
- Creazione prenotazioni
- Controllo disponibilità tavoli

Usa un database SQLite temporaneo in memoria per i test.

RESET DATABASE
-------------
python reset-db.py

Questo script:
- Elimina il database se esiste
- Crea nuovo database con schema aggiornato
- Inserisce:
  * Admin (admin@example.com/Admin@123)
  * 9 tavoli (da 2 a 9 posti)
  * Orari: pranzo 12-15, cena 19-23
  * Info base ristorante

NOTA
----
Se l'installazione da problemi, eliminare la cartella venv (se presente) e ripetere la procedura di installazione.
