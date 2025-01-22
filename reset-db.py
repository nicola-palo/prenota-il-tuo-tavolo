"""
reset-db.py
Script per inizializzare il database con dati predefiniti:
- Account amministratore
- Tavoli di esempio con diverse capacità
- Orari settimanali (diversi per feriali e weekend)
- Informazioni base del ristorante
"""
from app import app, db
from models import User, Table, Booking, RestaurantHours, RestaurantInfo
from werkzeug.security import generate_password_hash
from datetime import datetime, time

def reset_db():
    with app.app_context():
        # Elimina e ricrea tutte le tabelle
        db.drop_all()
        db.create_all()

        # Crea utente amministratore predefinito
        admin = User(
            email='admin@example.com',
            is_admin=True
        )
        admin.set_password('Admin@123')
        db.session.add(admin)

        # Crea tavoli di esempio con diverse capacità
        tavoli_default = [
            Table(number=1, seats=2),  # Tavolo per due
            Table(number=2, seats=2),  # Tavolo per due
            Table(number=3, seats=4),  # Tavolo per quattro
            Table(number=4, seats=4),  # Tavolo per quattro
            Table(number=5, seats=6),  # Tavolo per sei
            Table(number=6, seats=6),  # Tavolo per sei
            Table(number=7, seats=7),  # Tavolo per sette
            Table(number=8, seats=8),  # Tavolo per otto
            Table(number=9, seats=9)   # Tavolo per nove
        ]
        for tavolo in tavoli_default:
            db.session.add(tavolo)

        # Imposta orari di apertura per ogni giorno della settimana
        for giorno in range(7):  # 0 = Lunedì, 6 = Domenica
            # Orari giorni feriali (Lunedì-Venerdì)
            if giorno < 6:
                orari = RestaurantHours(
                    day_of_week=giorno,
                    # Orari pranzo feriali: 12:00-15:00
                    lunch_opening_time=time(12, 0),
                    lunch_closing_time=time(15, 0),
                    # Orari cena feriali: 19:00-23:00
                    dinner_opening_time=time(19, 0),
                    dinner_closing_time=time(23, 0),
                    is_lunch_closed=False,
                    is_dinner_closed=False
                )

        # Crea informazioni predefinite del ristorante
        info_ristorante = RestaurantInfo(
            name="La Tavola Italiana",
            show_restaurant_name=True,
            welcome_text="Benvenuti nel nostro ristorante, dove la tradizione italiana incontra l'innovazione",
            description="""
            La Tavola Italiana è un ristorante che celebra l'autentica cucina italiana
            con un tocco di modernità. I nostri chef esperti utilizzano ingredienti freschi
            e di alta qualità per creare piatti che delizieranno il vostro palato.
            L'ambiente accogliente e l'atmosfera elegante ma informale rendono
            il nostro ristorante il luogo perfetto per ogni occasione.
            """.strip(),
            phone="+39 123 456 7890",
            email="info@latavolaitaliana.it",
            address="Via Roma 123, 00100 Roma",
            parking_info="Ampio parcheggio gratuito disponibile per i nostri ospiti"
        )
        db.session.add(info_ristorante)

        # Salva tutte le modifiche nel database
        db.session.commit()

        # Stampa informazioni di conferma
        print("\nDatabase reinizializzato con successo!")
        print("\nCredenziali amministratore:")
        print("Email: admin@example.com")
        print("Password: Admin@123")
        print("\nOrari predefiniti:")
        print("Giorni feriali (Lun-Ven):")
        print("- Pranzo: 12:00-15:00")
        print("- Cena: 19:00-23:00")
        print("Weekend (Sab-Dom):")
        print("- Pranzo: 12:00-16:00")
        print("- Cena: 19:00-23:30")

# Esegui il reset solo se lo script viene eseguito direttamente
if __name__ == '__main__':
    reset_db()
