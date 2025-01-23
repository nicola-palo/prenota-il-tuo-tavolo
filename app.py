"""
app.py
File principale dell'applicazione Flask per gestione ristorante.
Gestisce configurazione, autenticazione e routing di base.
"""
# Importazione moduli e configurazione base Flask
from flask import Flask, render_template, redirect, url_for, flash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from datetime import datetime, date, timedelta, time
from models import db, User, RestaurantInfo, RestaurantHours
from functools import wraps
from api_routes import api as api_blueprint
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static/uploads')

db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.register_blueprint(api_blueprint, url_prefix='/api')

# Decorator per verificare permessi admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Accesso non autorizzato')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Utility per ottenere orari ristorante
def get_restaurant_hours(day):
    hours = RestaurantHours.query.filter_by(day_of_week=day).first()
    if not hours:
        return RestaurantHours(
            day_of_week=day,
            lunch_opening_time=datetime.strptime('12:00', '%H:%M').time(),
            lunch_closing_time=datetime.strptime('15:00', '%H:%M').time(),
            dinner_opening_time=datetime.strptime('19:00', '%H:%M').time(),
            dinner_closing_time=datetime.strptime('23:00', '%H:%M').time(),
            is_lunch_closed=False,
            is_dinner_closed=False
        )
    return hours

@app.context_processor
def utility_processor():
    return dict(
        get_restaurant_hours=get_restaurant_hours,
        get_restaurant_info=get_restaurant_info
    )

def get_restaurant_info():
    with app.app_context():
        info = RestaurantInfo.query.first()
        if not info:
            info = RestaurantInfo(**RestaurantInfo.get_default_info())
            db.session.add(info)
            db.session.commit()
        return info

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# Routes pubbliche
@app.route('/')
def index():
    info = get_restaurant_info()
    return render_template('index.html', info=info)

@app.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logout effettuato con successo')
    return redirect(url_for('index'))

@app.route('/tables/availability')
@login_required
def tables_availability():
    today = date.today()
    max_date = today + timedelta(days=60)
    return render_template(
        'tables_availability.html',
        today=today,
        max_date=max_date,
        timedelta=timedelta
    )

# Routes protette (richiedono login)
@app.route('/booking')
@login_required
def booking():
    return render_template('booking.html', today=date.today(), timedelta=timedelta)

# Routes admin (richiedono login + admin)
@app.route('/admin/dashboard')
@login_required
@admin_required
def admin_dashboard():
    return render_template('admin/dashboard.html')

@app.route('/admin/restaurant-info')
@login_required
@admin_required
def admin_restaurant_info():
    info = get_restaurant_info()
    return render_template('admin/restaurant_info.html', info=info)

@app.route('/admin/hours')
@login_required
@admin_required
def admin_hours():
    with app.app_context():
        hours = {}
        for day in range(7):
            day_hours = RestaurantHours.query.filter_by(day_of_week=day).first()
            if not day_hours:
                day_hours = RestaurantHours(
                    day_of_week=day,
                    lunch_opening_time=time(12, 0),
                    lunch_closing_time=time(15, 0),
                    dinner_opening_time=time(19, 0),
                    dinner_closing_time=time(23, 0),
                    is_lunch_closed=False,
                    is_dinner_closed=False
                )
                db.session.add(day_hours)
        db.session.commit()
        
        hours = {day: RestaurantHours.query.filter_by(day_of_week=day).first() for day in range(7)}
        
        return render_template('admin/hours.html', hours=hours)

@app.route('/admin/tables')
@login_required
@admin_required
def admin_tables():
    return render_template('admin/tables.html')

@app.route('/admin/theme')
@login_required
@admin_required
def admin_theme():
    return render_template('admin/theme.html')

# Inizializzazione DB e admin di default
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Crea admin se non esiste
        admin = User.query.filter_by(email='admin@example.com').first()
        if not admin:
            admin = User(email='admin@example.com', is_admin=True)
            admin.set_password('admin')
            db.session.add(admin)
            db.session.commit()
            print("\nAdmin credentials created:")
            print("Email: admin@example.com")
            print("Password: admin")
        
        print("\nServer started! Access at http://127.0.0.1:5000")
        app.run(debug=True)
