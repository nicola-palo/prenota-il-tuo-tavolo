"""
test.py 
Test unitari per le API principali
"""
import unittest
from app import app
from models import db, User, Table, Booking, RestaurantHours, RestaurantInfo
from datetime import datetime, date, timedelta, time

"""Configura ambiente test con:
       - DB SQLite in memoria
       - Utente test
       - Tavolo test 
       - Orari e info ristorante base
       """
class TestAPI(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
        self.client = app.test_client()
        
        with app.app_context():
            db.drop_all()
            db.create_all()
            
            # Setup base data
            user = User(email='test@test.com')
            user.set_password('password')
            db.session.add(user)
            
            table = Table(number=1, seats=4)
            db.session.add(table)
            
            # Setup restaurant
            info = RestaurantInfo(**RestaurantInfo.get_default_info())
            db.session.add(info)
            
            # Setup hours for test days
            for day in range(7):
                hours = RestaurantHours(
                    day_of_week=day,
                    lunch_opening_time=time(12,0),
                    lunch_closing_time=time(15,0),
                    dinner_opening_time=time(19,0),
                    dinner_closing_time=time(23,0),
                    is_lunch_closed=False,
                    is_dinner_closed=False
                )
                db.session.add(hours)
            
            db.session.commit()

        self.tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')

    def tearDown(self):
        with app.app_context():
            db.drop_all()

    """Verifica login con credenziali valide"""
    def test_login(self):
        response = self.client.post('/api/auth/login', json={
            'email': 'test@test.com',
            'password': 'password'
        })
        self.assertEqual(response.status_code, 200)
    
    """Verifica creazione prenotazione valida"""
    def test_create_booking(self):
        self.client.post('/api/auth/login', json={
            'email': 'test@test.com',
            'password': 'password'
        })
        
        response = self.client.post('/api/bookings', json={
            'table_id': 1,
            'date': self.tomorrow,
            'time': '19:00',
            'guests': 4
        })
        self.assertEqual(response.status_code, 201)

    """Verifica check disponibilità tavoli"""
    def test_availability(self):
        response = self.client.get(f'/api/tables/availability?date={self.tomorrow}&time=19:00&guests=4')
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()