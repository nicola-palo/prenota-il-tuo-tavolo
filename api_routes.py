"""
api_routes.py
API REST per il sistema di gestione ristorante.
Gestisce tutte le operazioni CRUD e logica business.
"""
from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user, login_user, login_required, logout_user
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, time, date, timedelta
from models import db, Booking, Table, RestaurantHours, RestaurantInfo, User
from functools import wraps
import os
from werkzeug.utils import secure_filename

# Configurazione e utilities
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}

def validate_logo(file):
    if file.content_length > MAX_FILE_SIZE:
        raise ValueError('File troppo grande (max 5MB)')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

api = Blueprint('api', __name__)

"""Formatta risposte JSON in modo consistente"""
def json_response(data=None, status=200, error=None):
    response = {}
    if error:
        response['error'] = error
    if data is not None:
        response.update(data if isinstance(data, dict) else {'data': data})
    return jsonify(response), status

"""Decorator per proteggere endpoints admin"""
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return json_response(error='Accesso non autorizzato', status=403)
        return f(*args, **kwargs)
    return decorated_function

"""Validazione requisiti password"""
def validate_password(password):
    if len(password) < 8:
        raise ValueError('La password deve contenere almeno 8 caratteri')
    if not any(c.isupper() for c in password):
        raise ValueError('La password deve contenere una lettera maiuscola')
    if not any(c.islower() for c in password):
        raise ValueError('La password deve contenere una lettera minuscola')
    if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
        raise ValueError('La password deve contenere un carattere speciale')
    return True

# Autenticazione

"""Login utente con email/password"""
@api.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return json_response(error='Email e password richiesti', status=400)
        
        user = User.query.filter_by(email=data['email']).first()
        if user and user.check_password(data['password']):
            login_user(user)
            return json_response({'user': user.to_dict()})
        
        return json_response(error='Credenziali non valide', status=401)
    except Exception as e:
        return json_response(error=str(e), status=500)

"""Registrazione nuovo utente"""
@api.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return json_response(error='Email e password richiesti', status=400)
        
        try:
            validate_password(data['password'])
        except ValueError as e:
            return json_response(error=str(e), status=400)
        
        if User.query.filter_by(email=data['email']).first():
            return json_response(error='Email già registrata', status=400)
        
        user = User(email=data['email'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        
        return json_response({'message': 'Registrazione completata'}, status=201)
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

"""Logout utente"""
@api.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return json_response({'message': 'Logout effettuato con successo'})

# Gestione prenotazioni

"""Lista prenotazioni (filtrata per ruolo)"""
@api.route('/bookings', methods=['GET'])
@login_required
def get_bookings():
    try:
        if current_user.is_admin:
            bookings = Booking.query.order_by(Booking.date.desc(), Booking.time.desc()).all()
        else:
            bookings = Booking.query.filter_by(user_id=current_user.id).order_by(Booking.date.desc(), Booking.time.desc()).all()
        return json_response({'bookings': [booking.to_dict() for booking in bookings]})
    except Exception as e:
        return json_response(error=str(e), status=500)

"""Crea nuova prenotazione con validazioni"""
@api.route('/bookings', methods=['POST'])
@login_required
def create_booking():
    try:
        data = request.get_json()
        if not data:
            return json_response(error='Dati non forniti', status=400)

        required_fields = ['table_id', 'date', 'time', 'guests']
        if not all(field in data for field in required_fields):
            return json_response(error='Dati incompleti', status=400)
        
        booking_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        booking_time = datetime.strptime(data['time'], '%H:%M').time()
        
        day_of_week = booking_date.weekday()
        hours = RestaurantHours.query.filter_by(day_of_week=day_of_week).first()
        
        is_lunch_time = booking_time >= hours.lunch_opening_time and booking_time <= hours.lunch_closing_time
        is_dinner_time = booking_time >= hours.dinner_opening_time and booking_time <= hours.dinner_closing_time
        
        existing_booking = Booking.query.filter(
            Booking.table_id == data['table_id'],
            Booking.date == booking_date,
            Booking.time == booking_time
        ).first()
        
        if existing_booking:
            return json_response(error='Tavolo già prenotato per questo orario', status=400)
        
        booking = Booking(
            user_id=current_user.id,
            table_id=data['table_id'],
            date=booking_date,
            time=booking_time,
            guests=data['guests'],
            notes=data.get('notes', '')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return json_response({'booking': booking.to_dict()}, status=201)
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

"""Aggiorna una prenotazione esistente con validazioni orari e tavoli"""
@api.route('/bookings/<int:booking_id>', methods=['PUT'])
@login_required
def update_booking(booking_id):
    try:
        booking = Booking.query.get_or_404(booking_id)
        if booking.user_id != current_user.id and not current_user.is_admin:
            return json_response(error='Non autorizzato', status=403)
        
        data = request.get_json()
        if not data:
            return json_response(error='Dati non forniti', status=400)
        
        booking_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        booking_time = datetime.strptime(data['time'], '%H:%M').time()
        
        # Check availability
        day_of_week = booking_date.weekday()
        hours = RestaurantHours.query.filter_by(day_of_week=day_of_week).first()
        
        if not hours:
            return json_response(error='Orari non configurati per questo giorno', status=400)
        
        # Check if time falls within lunch or dinner hours
        is_lunch_time = booking_time >= hours.lunch_opening_time and booking_time <= hours.lunch_closing_time
        is_dinner_time = booking_time >= hours.dinner_opening_time and booking_time <= hours.dinner_closing_time
        
        if not (is_lunch_time or is_dinner_time):
            return json_response(error='Orario fuori dall\'orario di apertura', status=400)
        
        if (is_lunch_time and hours.is_lunch_closed) or (is_dinner_time and hours.is_dinner_closed):
            return json_response(error='Il ristorante è chiuso in questo orario', status=400)
        
        # Check table availability
        existing_booking = Booking.query.filter(
            Booking.table_id == data['table_id'],
            Booking.date == booking_date,
            Booking.time == booking_time,
            Booking.id != booking_id
        ).first()
        
        if existing_booking:
            return json_response(error='Tavolo già prenotato per questo orario', status=400)
        
        booking.table_id = data['table_id']
        booking.date = booking_date
        booking.time = booking_time
        booking.guests = data['guests']
        booking.notes = data.get('notes', '')
        
        db.session.commit()
        return json_response({'booking': booking.to_dict()})
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

"""Elimina una prenotazione se l'utente è autorizzato"""
@api.route('/bookings/<int:booking_id>', methods=['DELETE'])
@login_required
def delete_booking(booking_id):
    try:
        booking = Booking.query.get_or_404(booking_id)
        if booking.user_id != current_user.id and not current_user.is_admin:
            return json_response(error='Non autorizzato', status=403)
        
        db.session.delete(booking)
        db.session.commit()
        return json_response({'message': 'Prenotazione cancellata'})
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

# Gestione tavoli

"""Lista tutti i tavoli"""
@api.route('/tables', methods=['GET'])
def get_tables():
    try:
        tables = Table.query.order_by(Table.number).all()
        return json_response({'tables': [table.to_dict() for table in tables]})
    except Exception as e:
        return json_response(error=str(e), status=500)

"""Verifica disponibilità tavoli con filtri"""    
@api.route('/tables', methods=['POST'])
@login_required
@admin_required
def create_table():
    try:
        data = request.get_json()
        if not data or 'number' not in data or 'seats' not in data:
            return json_response(error='Dati incompleti', status=400)

        if Table.query.filter_by(number=data['number']).first():
            return json_response(error='Numero tavolo già esistente', status=400)

        table = Table(
            number=data['number'],
            seats=data['seats']
        )
        db.session.add(table)
        db.session.commit()
        
        return json_response({'table': table.to_dict()}, status=201)
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

"""Aggiorna informazioni tavolo con controllo duplicati"""
@api.route('/tables/<int:table_id>', methods=['PUT'])
@login_required
@admin_required
def update_table(table_id):
    try:
        table = Table.query.get_or_404(table_id)
        data = request.get_json()
        
        if 'number' in data and data['number'] != table.number:
            if Table.query.filter_by(number=data['number']).first():
                return json_response(error='Numero tavolo già esistente', status=400)
        
        if 'number' in data:
            table.number = data['number']
        if 'seats' in data:
            table.seats = data['seats']
            
        db.session.commit()
        return json_response({'table': table.to_dict()})
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

"""Elimina tavolo se non ha prenotazioni future"""
@api.route('/tables/<int:table_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_table(table_id):
    try:
        table = Table.query.get_or_404(table_id)
        
        # Controlla prenotazioni future
        future_bookings = Booking.query.filter(
            Booking.table_id == table_id,
            Booking.date >= date.today()
        ).count()
        
        if future_bookings > 0:
            return json_response(
                error='Impossibile eliminare: ci sono prenotazioni future per questo tavolo',
                status=400
            )
            
        db.session.delete(table)
        db.session.commit()
        return json_response({'message': 'Tavolo eliminato'})
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

"""Verifica disponibilità tavoli per data/ora/ospiti con validazioni"""
@api.route('/tables/availability', methods=['GET'])
def check_availability():
    try:
        # Ottieni parametri dalla richiesta
        date_str = request.args.get('date')
        time_str = request.args.get('time') 
        guests = request.args.get('guests', type=int)
        
        # Verifica parametri necessari
        if not all([date_str, time_str, guests]):
            return json_response(error='Parametri mancanti', status=400)
            
        if guests < 1:
            return json_response(error='Numero ospiti deve essere maggiore di 0', status=400)
        
        # Per gruppi grandi (10+ persone) mostra info contatto ristorante
        if guests >= 10:
            info = RestaurantInfo.query.first()
            return json_response(
                error=f'Per prenotazioni con 10+ persone contattare il ristorante direttamente:\n'
                      f'Tel: {info.phone}\nEmail: {info.email}', 
                status=400
            )

        # Converti e valida la data
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        if booking_date < date.today():
            return json_response(error='Non puoi prenotare per date passate', status=400)
            
        booking_time = datetime.strptime(time_str, '%H:%M').time()
        
        # Validazione orari apertura
        day_of_week = booking_date.weekday()
        hours = RestaurantHours.query.filter_by(day_of_week=day_of_week).first()
        
        if not hours:
            hours = RestaurantHours.get_default_hours()[day_of_week]
            db.session.add(hours)
            db.session.commit()

        # Determina la fascia oraria (pranzo/cena)
        booking_hour = int(time_str.split(':')[0])
        is_lunch = booking_hour < 17
            
        # Imposta periodo di occupazione
        if is_lunch:
            start_time = hours.lunch_opening_time
            end_time = hours.lunch_closing_time
            if hours.is_lunch_closed:
                return json_response(error='Il ristorante è chiuso a pranzo in questa data', status=400)
        else:
            start_time = hours.dinner_opening_time
            end_time = hours.dinner_closing_time
            if hours.is_dinner_closed:
                return json_response(error='Il ristorante è chiuso a cena in questa data', status=400)
                
        if booking_time < start_time or booking_time > end_time:
            return json_response(error='Orario fuori dall\'orario di apertura', status=400)

        # Trova tavoli con capacità adeguata
        available_tables = Table.query.filter(
            Table.seats >= guests,
            Table.seats <= guests + 2
        ).all()
        
        # Filtra tavoli già prenotati nel periodo
        available_tables = [
            table for table in available_tables
            if not Booking.query.filter(
                Booking.table_id == table.id,
                Booking.date == booking_date,
                Booking.time >= start_time,
                Booking.time <= end_time
            ).first()
        ]

        return json_response({
            'tables': [t.to_dict() for t in available_tables],
            'restaurant_hours': {
                'lunch': {
                    'opening_time': hours.lunch_opening_time.strftime('%H:%M'),
                    'closing_time': hours.lunch_closing_time.strftime('%H:%M'),
                    'is_closed': hours.is_lunch_closed
                },
                'dinner': {
                    'opening_time': hours.dinner_opening_time.strftime('%H:%M'),
                    'closing_time': hours.dinner_closing_time.strftime('%H:%M'),
                    'is_closed': hours.is_dinner_closed
                }
            }
        })
    except ValueError:
        return json_response(error='Formato data o ora non valido', status=400)
    except Exception as e:
        return json_response(error=str(e), status=500)

# Gestione orari

"""GET/PUT orari apertura"""
@api.route('/restaurant/hours', methods=['GET'])
def get_restaurant_hours():
    try:
        hours = {}
        for day in range(7):
            day_hours = RestaurantHours.query.filter_by(day_of_week=day).first()
            if day_hours:
                hours[day] = day_hours.to_dict()
            else:
                default = RestaurantHours(
                    day_of_week=day,
                    lunch_opening_time=time(12, 0),
                    lunch_closing_time=time(15, 0),
                    dinner_opening_time=time(19, 0),
                    dinner_closing_time=time(23, 0),
                    is_lunch_closed=False,
                    is_dinner_closed=False
                )
                db.session.add(default)
                hours[day] = default.to_dict()
        db.session.commit()
        return json_response({'hours': hours})
    except Exception as e:
        return json_response(error=str(e), status=500)

"""Valida che gli orari di pranzo e cena non si sovrappongano"""
def validate_hours(lunch_start, lunch_end, dinner_start, dinner_end):
    if lunch_end >= dinner_start:
        raise ValueError('Gli orari di pranzo e cena si sovrappongono')
    if lunch_start >= lunch_end or dinner_start >= dinner_end:
        raise ValueError('L\'orario di apertura deve precedere la chiusura')

@api.route('/restaurant/hours', methods=['PUT'])
@login_required
@admin_required
def update_restaurant_hours():
    try:
        data = request.get_json()
        if not data or 'hours' not in data:
            return json_response(error='Dati orari mancanti', status=400)
        
        RestaurantHours.query.delete()
        
        for day_data in data['hours']:
            try:
                lunch_opening = datetime.strptime(day_data['lunch_opening_time'], '%H:%M').time()
                lunch_closing = datetime.strptime(day_data['lunch_closing_time'], '%H:%M').time()
                dinner_opening = datetime.strptime(day_data['dinner_opening_time'], '%H:%M').time()
                dinner_closing = datetime.strptime(day_data['dinner_closing_time'], '%H:%M').time()
                
                if not day_data['is_lunch_closed'] and lunch_opening >= lunch_closing:
                    return json_response(
                        error=f'Orario pranzo non valido per il giorno {day_data["day_of_week"]}: '
                              'l\'apertura deve essere precedente alla chiusura',
                        status=400
                    )
                
                if not day_data['is_dinner_closed']:
                    if dinner_opening >= dinner_closing:
                        return json_response(
                            error=f'Orario cena non valido per il giorno {day_data["day_of_week"]}: '
                                  'l\'apertura deve essere precedente alla chiusura',
                            status=400
                        )
                    
                    if not day_data['is_lunch_closed'] and dinner_opening <= lunch_closing:
                        return json_response(
                            error=f'Gli orari di pranzo e cena si sovrappongono nel giorno {day_data["day_of_week"]}',
                            status=400
                        )
                
                hours = RestaurantHours(
                    day_of_week=day_data['day_of_week'],
                    lunch_opening_time=lunch_opening,
                    lunch_closing_time=lunch_closing,
                    dinner_opening_time=dinner_opening,
                    dinner_closing_time=dinner_closing,
                    is_lunch_closed=day_data.get('is_lunch_closed', False),
                    is_dinner_closed=day_data.get('is_dinner_closed', False)
                )
                db.session.add(hours)
                
            except ValueError as e:
                return json_response(
                    error=f'Formato orario non valido per il giorno {day_data["day_of_week"]}',
                    status=400
                )
        
        db.session.commit()
        
        updated_hours = {}
        for day in range(7):
            hours = RestaurantHours.query.filter_by(day_of_week=day).first()
            if hours:
                updated_hours[day] = hours.to_dict()
        
        return json_response({
            'message': 'Orari aggiornati con successo',
            'hours': updated_hours
        })
        
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)

# Gestione tema/info

"""GET/PUT informazioni ristorante"""
@api.route('/restaurant/info', methods=['GET', 'PUT'])
@login_required
@admin_required
def restaurant_info():
    try:
        info = RestaurantInfo.query.first()
        if not info:
            info = RestaurantInfo(**RestaurantInfo.get_default_info())
            db.session.add(info)
            db.session.commit()

        if request.method == 'PUT':
            data = request.get_json()
            if not data:
                return json_response(error='Dati mancanti', status=400)
            
            for key, value in data.items():
                if hasattr(info, key):
                    setattr(info, key, value)
            
            db.session.commit()
        
        return json_response({'info': info.to_dict()})
    except Exception as e:
        if request.method == 'PUT':
            db.session.rollback()
        return json_response(error=str(e), status=500)

"""Restituisce gli slot orari disponibili per una data specifica"""
@api.route('/restaurant/available-hours', methods=['GET'])
def get_available_hours():
    try:
        date_str = request.args.get('date')
        booking_id = request.args.get('booking_id')
        
        if not date_str:
            return json_response(error='Data richiesta', status=400)
            
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        day_of_week = booking_date.weekday()
        
        hours = RestaurantHours.query.filter_by(day_of_week=day_of_week).first()
        if not hours:
            hours = RestaurantHours(
                day_of_week=day_of_week,
                lunch_opening_time=time(12, 0),
                lunch_closing_time=time(15, 0),
                dinner_opening_time=time(19, 0),
                dinner_closing_time=time(23, 0),
                is_lunch_closed=False,
                is_dinner_closed=False
            )
            db.session.add(hours)
            db.session.commit()
        
        if hours.is_lunch_closed and hours.is_dinner_closed:
            return json_response({'hours': [], 'message': 'Il ristorante è chiuso in questa data'})
        
        available_hours = []
        
        def generate_time_slots(start_time, end_time):
            slots = []
            current = datetime.combine(booking_date, start_time)
            end = datetime.combine(booking_date, end_time)
            while current <= end - timedelta(minutes=30):
                slots.append(current.time().strftime('%H:%M'))
                current += timedelta(minutes=30)
            return slots
        
        if not hours.is_lunch_closed:
            available_hours.extend(generate_time_slots(hours.lunch_opening_time, hours.lunch_closing_time))
        
        if not hours.is_dinner_closed:
            available_hours.extend(generate_time_slots(hours.dinner_opening_time, hours.dinner_closing_time))
        
        return json_response({
            'hours': available_hours,
            'lunch': {
                'available': not hours.is_lunch_closed,
                'opening_time': hours.lunch_opening_time.strftime('%H:%M') if not hours.is_lunch_closed else None,
                'closing_time': hours.lunch_closing_time.strftime('%H:%M') if not hours.is_lunch_closed else None
            },
            'dinner': {
                'available': not hours.is_dinner_closed,
                'opening_time': hours.dinner_opening_time.strftime('%H:%M') if not hours.is_dinner_closed else None,
                'closing_time': hours.dinner_closing_time.strftime('%H:%M') if not hours.is_dinner_closed else None
            }
        })
        
    except Exception as e:
        return json_response(error=str(e), status=500)

"""Gestisce upload logo con validazioni formato e dimensioni"""
@api.route('/upload-logo', methods=['POST'])
@login_required
@admin_required
def upload_logo():
    if 'logo' not in request.files:
        return json_response(error='Nessun file caricato', status=400)
    
    file = request.files['logo']
    if file.filename == '':
        return json_response(error='Nessun file selezionato', status=400)
    
    try:
        validate_logo(file)
        if not allowed_file(file.filename):
            return json_response(error='Formato file non supportato', status=400)
            
        filename = secure_filename(file.filename)
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        info = RestaurantInfo.query.first()
        if info and info.logo_url:
            old_file = os.path.join(current_app.config['UPLOAD_FOLDER'], 
                                  os.path.basename(info.logo_url))
            if os.path.exists(old_file):
                os.remove(old_file)
                    
        file.save(upload_path)
        info.logo_url = f'/static/uploads/{filename}'
        db.session.commit()
        
        return json_response({'url': info.logo_url})
        
    except ValueError as e:
        return json_response(error=str(e), status=400)
    except Exception as e:
        return json_response(error=str(e), status=500)

"""Recupera statistiche per dashboard amministratore"""
@api.route('/admin/stats', methods=['GET'])
@login_required
@admin_required
def get_admin_stats():
    try:
        today = date.today()
        return json_response({
            'total_bookings': Booking.query.count(),
            'today_bookings': Booking.query.filter_by(date=today).count(),
            'total_users': User.query.filter_by(is_admin=False).count(),
            'total_tables': Table.query.count(),
            'recent_bookings': [
                booking.to_dict() for booking in 
                Booking.query.filter(Booking.date >= today - timedelta(days=5))
                .order_by(Booking.date.desc(), Booking.time.desc())
                .limit(10).all()
            ]
        })
    except Exception as e:
        return json_response(error=str(e), status=500)
        
"""Configurazione tema UI"""
@api.route('/theme', methods=['GET'])
def get_theme():
    try:
        info = RestaurantInfo.query.first()
        if not info:
            info = RestaurantInfo(**RestaurantInfo.get_default_info())
            db.session.add(info)
            db.session.commit()
        
        theme_data = {
            'theme': {
                'colors': {
                    'primary': info.primary_color,
                    'secondary': info.secondary_color,
                    'background': info.background_color
                },
                'typography': {
                    'fontFamily': info.font_family,
                    'baseFontSize': info.base_font_size,
                    'headingFontSize': info.heading_font_size,
                    'fontWeight': info.font_weight
                },
                'components': {
                    'borderRadius': info.border_radius,
                    'boxShadow': info.box_shadow
                },
                'showRestaurantName': info.show_restaurant_name
            }
        }
        return json_response(theme_data)
    except Exception as e:
        return json_response(error=str(e), status=500)

"""Aggiorna configurazione tema UI"""
@api.route('/theme/update', methods=['PUT'])
@login_required
@admin_required
def update_theme():
    try:
        data = request.get_json()
        info = RestaurantInfo.query.first()
        
        if 'colors' in data:
            info.primary_color = data['colors']['primary']
            info.secondary_color = data['colors']['secondary']
            info.background_color = data['colors']['background']

        if 'typography' in data:
            info.font_family = data['typography']['fontFamily']
            info.base_font_size = data['typography']['baseFontSize']
            info.heading_font_size = data['typography']['headingFontSize']
            info.font_weight = data['typography']['fontWeight']

        if 'components' in data:
            info.border_radius = data['components']['borderRadius']
            info.box_shadow = data['components']['boxShadow']
            
        if 'showRestaurantName' in data:
            info.show_restaurant_name = data['showRestaurantName']

        db.session.commit()
        return json_response({'theme': info.to_dict()})
    except Exception as e:
        db.session.rollback()
        return json_response(error=str(e), status=500)