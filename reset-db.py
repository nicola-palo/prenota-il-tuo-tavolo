"""
reset-db.py
Script per inizializzare il database con dati predefiniti
"""
from app import app, db
from models import User, Table, Booking, RestaurantHours, RestaurantInfo
from werkzeug.security import generate_password_hash
from datetime import datetime, time

"""Reset completo DB con dati di default:
   - Admin (admin@example.com)
   - 8 tavoli con capacità variabile in base al numero
   - Orari settimanali (12-15 pranzo, 19-23 cena)
   - Info ristorante base
   """
def reset_db():
    with app.app_context():
        # Drop and recreate all tables
        db.drop_all()
        db.create_all()

        # Create admin user
        admin = User(
            email='admin@example.com',
            is_admin=True
        )
        admin.set_password('Admin@123')
        db.session.add(admin)

        # Create sample tables
        tables = [
            Table(number=1, seats=2),
            Table(number=2, seats=2),
            Table(number=3, seats=4),
            Table(number=4, seats=4),
            Table(number=5, seats=6),
            Table(number=6, seats=6),
            Table(number=7, seats=7),
            Table(number=8, seats=8),
            Table(number=9, seats=9)
        ]
        for table in tables:
            db.session.add(table)

        # Create default hours for all days of the week
        default_hours = []
        for day in range(7):  # 0 = Monday, 6 = Sunday
            # Weekday hours (Monday-Friday)
            if day < 5:
                hours = RestaurantHours(
                    day_of_week=day,
                    lunch_opening_time=time(12, 0),
                    lunch_closing_time=time(15, 0),
                    dinner_opening_time=time(19, 0),
                    dinner_closing_time=time(23, 0),
                    is_lunch_closed=False,
                    is_dinner_closed=False
                )
            # Weekend hours (Saturday-Sunday)
            else:
                hours = RestaurantHours(
                    day_of_week=day,
                    lunch_opening_time=time(12, 0),
                    lunch_closing_time=time(16, 0),  # Longer lunch on weekends
                    dinner_opening_time=time(19, 0),
                    dinner_closing_time=time(23, 30),  # Longer dinner on weekends
                    is_lunch_closed=False,
                    is_dinner_closed=False
                )
            db.session.add(hours)

        # Create default restaurant information
        restaurant_info = RestaurantInfo(
            name="La Tavola Italiana",
            show_restaurant_name=True,  # Added new column
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
        db.session.add(restaurant_info)

        # Commit changes
        db.session.commit()

        print("\nDatabase reset successfully!")
        print("\nAdmin credentials:")
        print("Email: admin@example.com")
        print("Password: Admin@123")
        print("\nDefault hours:")
        print("Weekdays (Mon-Fri):")
        print("- Lunch: 12:00-15:00")
        print("- Dinner: 19:00-23:00")
        print("Weekends (Sat-Sun):")
        print("- Lunch: 12:00-16:00")
        print("- Dinner: 19:00-23:30")

if __name__ == '__main__':
    reset_db()