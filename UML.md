# Restaurant Booking System - Class Diagram

## User Class
- **Attributes**:
  - `id`: Integer (Primary Key)
  - `email`: String
  - `password_hash`: String
  - `is_admin`: Boolean
  - `created_at`: DateTime

- **Methods**:
  - `set_password(password)`: Sets a hashed password
  - `check_password(password)`: Validates password
  - `to_dict()`: Converts user data to dictionary

## Table Class
- **Attributes**:
  - `id`: Integer (Primary Key)
  - `number`: Integer
  - `seats`: Integer
  - `is_active`: Boolean
  - `created_at`: DateTime

- **Methods**:
  - `to_dict()`: Converts table data to dictionary

## Booking Class
- **Attributes**:
  - `id`: Integer (Primary Key)
  - `user_id`: Integer (Foreign Key to User)
  - `table_id`: Integer (Foreign Key to Table)
  - `date`: Date
  - `time`: Time
  - `guests`: Integer
  - `notes`: Text
  - `status`: String
  - `created_at`: DateTime
  - `modified_at`: DateTime

- **Methods**:
  - `to_dict()`: Converts booking data to dictionary
  - `is_past()`: Checks if booking is in the past

## RestaurantHours Class
- **Attributes**:
  - `id`: Integer (Primary Key)
  - `day_of_week`: Integer
  - `lunch_opening_time`: Time
  - `lunch_closing_time`: Time
  - `dinner_opening_time`: Time
  - `dinner_closing_time`: Time
  - `is_lunch_closed`: Boolean
  - `is_dinner_closed`: Boolean
  - `created_at`: DateTime
  - `modified_at`: DateTime

- **Methods**:
  - `get_default_hours()`: Retrieves default restaurant hours
  - `to_dict()`: Converts hours data to dictionary

## RestaurantInfo Class
- **Attributes**:
  - `id`: Integer (Primary Key)
  - `name`: String
  - `show_restaurant_name`: Boolean
  - `welcome_text`: Text
  - `description`: Text
  - `phone`: String
  - `email`: String
  - `address`: String
  - `parking_info`: Text
  - `primary_color`: String
  - `secondary_color`: String
  - `background_color`: String
  - `font_family`: String
  - `base_font_size`: String
  - `heading_font_size`: String
  - `font_weight`: String
  - `border_radius`: String
  - `box_shadow`: String
  - `logo_url`: String
  - `navbar_title`: String
  - `created_at`: DateTime
  - `modified_at`: DateTime

- **Methods**:
  - `get_default_info()`: Retrieves default restaurant information
  - `to_dict()`: Converts restaurant info to dictionary

## Relationships
- One User can have multiple Bookings (1:*)
- One Table can have multiple Bookings (1:*)
