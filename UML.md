# Restaurant Booking System Architecture

## Core Components

### App (`app.py`)
- Main Flask application
- Handles configuration and routing
- Database integration

### Models (`models.py`)
```python
class User:
  - id: Integer
  - username: String
  - email: String
  - role: String
  
class Table:
  - id: Integer
  - number: Integer
  - capacity: Integer
  
class Booking:
  - id: Integer
  - user_id: Integer
  - table_id: Integer
  - date: DateTime
  - status: String
```

### API Routes (`api_routes.py`)
- CRUD operations
- Business logic for bookings
- Authentication handling

## Frontend Structure

### Static Files
```
static/
├── css/
│   └── style.css
├── js/
│   ├── api-client.js
│   ├── main.js
│   ├── booking-page.js
│   ├── table-booking-handler.js
│   ├── color-manager.js
│   └── restaurant-hours-manager.js
└── admin/
    ├── hours-management.js
    ├── tables-management.js
    └── theme-management.js
```

### Templates
```
templates/
├── base.html
├── booking.html
├── index.html
├── login.html
├── register.html
├── tables_availability.html
└── admin/
    ├── dashboard.html
    ├── hours.html
    ├── restaurant_info.html
    ├── tables.html
    └── theme.html
```

## Additional Files
- `requirements.txt`: Python dependencies
- `test.py`: Unit tests
- `reset-db.py`: Database initialization

## Class Relationships
- User -> Booking: One-to-Many
- Table -> Booking: One-to-Many
- App -> Models: Dependency
- APIRoutes -> Models: Dependency
