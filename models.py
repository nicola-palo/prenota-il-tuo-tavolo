"""
models.py
Modelli SQLAlchemy per il sistema di gestione ristorante.
Definisce struttura DB e relazioni tra entità.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, time

db = SQLAlchemy()


"""
   Utenti del sistema. 
   - Gestisce credenziali accesso
   - Distingue tra admin e utenti normali
   - Collegato alle prenotazioni
   """

class User(UserMixin, db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    bookings = db.relationship('Booking', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'is_admin': self.is_admin,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


"""
   Tavoli del ristorante.
   - Numero tavolo univoco
   - Capienza posti
   - Stato attivo/disattivo
   - Collegato alle prenotazioni
   """

class Table(db.Model):
    __tablename__ = 'table'
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, unique=True, nullable=False)
    seats = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    bookings = db.relationship('Booking', backref='table', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'seats': self.seats,
            'is_active': self.is_active,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

"""
   Prenotazioni tavoli.
   - Collegamenti a user e table
   - Data e ora prenotazione
   - Numero ospiti e note
   - Tracking stato e modifiche
   """

class Booking(db.Model):
    __tablename__ = 'booking'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    table_id = db.Column(db.Integer, db.ForeignKey('table.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    guests = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='confirmed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user.email,
            'table_id': self.table_id,
            'date': self.date.strftime('%Y-%m-%d'),
            'time': self.time.strftime('%H:%M'),
            'guests': self.guests,
            'notes': self.notes or '',
            'status': self.status,
            'table_number': self.table.number,
            'table_seats': self.table.seats,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'modified_at': self.modified_at.strftime('%Y-%m-%d %H:%M:%S')
        }

    def is_past(self):
        booking_datetime = datetime.combine(self.date, self.time)
        return booking_datetime < datetime.now()

"""
   Orari apertura ristorante.
   - Separati per giorno settimana
   - Gestione pranzo e cena
   - Flag chiusura per fascia
   - Orari predefiniti
   """

class RestaurantHours(db.Model):
    __tablename__ = 'restaurant_hours'
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.Integer, nullable=False)
    lunch_opening_time = db.Column(db.Time, nullable=False)
    lunch_closing_time = db.Column(db.Time, nullable=False)
    dinner_opening_time = db.Column(db.Time, nullable=False)
    dinner_closing_time = db.Column(db.Time, nullable=False)
    is_lunch_closed = db.Column(db.Boolean, default=False)
    is_dinner_closed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def get_default_hours():
        default_hours = []
        for day in range(7):
            default_hours.append(RestaurantHours(
                day_of_week=day,
                lunch_opening_time=time(12, 0),
                lunch_closing_time=time(15, 0),
                dinner_opening_time=time(19, 0),
                dinner_closing_time=time(23, 0),
                is_lunch_closed=False,
                is_dinner_closed=False
            ))
        return default_hours

    def to_dict(self):
        return {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'lunch_opening_time': self.lunch_opening_time.strftime('%H:%M'),
            'lunch_closing_time': self.lunch_closing_time.strftime('%H:%M'),
            'dinner_opening_time': self.dinner_opening_time.strftime('%H:%M'),
            'dinner_closing_time': self.dinner_closing_time.strftime('%H:%M'),
            'is_lunch_closed': self.is_lunch_closed,
            'is_dinner_closed': self.is_dinner_closed,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'modified_at': self.modified_at.strftime('%Y-%m-%d %H:%M:%S')
        }

"""
   Informazioni generali ristorante.
   - Dati di contatto e descrizione
   - Configurazione tema (colori, font, ecc)
   - Logo e personalizzazione UI
   - Valori predefiniti
   """

class RestaurantInfo(db.Model):
    __tablename__ = 'restaurant_info'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    show_restaurant_name = db.Column(db.Boolean, nullable=False, default=True) # Aggiungere qui
    welcome_text = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    parking_info = db.Column(db.Text, nullable=True)

    # Colors
    primary_color = db.Column(db.String(7), nullable=False, default='#8B4513')
    secondary_color = db.Column(db.String(7), nullable=False, default='#DEB887')
    background_color = db.Column(db.String(7), nullable=False, default='#FFF8DC')
    
    # Typography
    font_family = db.Column(db.String(50), nullable=False, default='system-ui')
    base_font_size = db.Column(db.String(10), nullable=False, default='16px')
    heading_font_size = db.Column(db.String(10), nullable=False, default='24px')
    font_weight = db.Column(db.String(10), nullable=False, default='400')
    
    # Components
    border_radius = db.Column(db.String(10), nullable=False, default='8px')
    box_shadow = db.Column(db.String(100), nullable=False, default='0 2px 4px rgba(0,0,0,0.1)')

    # Other
    logo_url = db.Column(db.String(200), nullable=True)
    navbar_title = db.Column(db.String(100), nullable=False, default='Ristorante')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def get_default_info():
        return {
            'name': 'Il Nostro Ristorante',
            'logo_url': '/static/img/placeholder.png',
            'welcome_text': 'Benvenuto al nostro ristorante',
            'description': 'Benvenuti nel nostro accogliente ristorante, dove la tradizione culinaria si fonde con un\'atmosfera moderna e confortevole.',
            'phone': '123-456789',
            'email': 'info@ristorante.it',
            'address': 'Via Roma 123, Città',
            'parking_info': 'Parcheggio disponibile gratuitamente per i clienti',
            'primary_color': '#8B4513',
            'secondary_color': '#DEB887',
            'background_color': '#FFF8DC',
            'font_family': 'system-ui',
            'base_font_size': '16px',
            'heading_font_size': '24px',
            'font_weight': '400',
            'border_radius': '8px',
            'box_shadow': '0 2px 4px rgba(0,0,0,0.1)',
            'navbar_title': 'Ristorante'
        }
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'welcome_text': self.welcome_text,
            'description': self.description,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'parking_info': self.parking_info or '',
            'colors': {
                'primary': self.primary_color,
                'secondary': self.secondary_color,
                'background': self.background_color
            },
            'typography': {
                'fontFamily': self.font_family,
                'baseFontSize': self.base_font_size,
                'headingFontSize': self.heading_font_size,
                'fontWeight': self.font_weight
            },
            'components': {
                'borderRadius': self.border_radius,
                'boxShadow': self.box_shadow
            },
            'logo_url': self.logo_url or '',
            'navbar_title': self.navbar_title,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'modified_at': self.modified_at.strftime('%Y-%m-%d %H:%M:%S')
        }