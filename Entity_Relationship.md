# Restaurant Database Schema

## User
- `id` (PK, Integer)
- `email` (String(120), Unique, Not Null)
- `password_hash` (String(128))
- `is_admin` (Boolean, Default: False)
- `created_at` (DateTime, Default: datetime.utcnow)

## Table
- `id` (PK, Integer)
- `number` (Integer, Unique, Not Null)
- `seats` (Integer, Not Null)
- `is_active` (Boolean, Default: True)
- `created_at` (DateTime, Default: datetime.utcnow)

## Booking
- `id` (PK, Integer)
- `user_id` (FK → User.id, Integer, Not Null)
- `table_id` (FK → Table.id, Integer, Not Null)
- `date` (Date, Not Null)
- `time` (Time, Not Null)
- `guests` (Integer, Not Null)
- `notes` (Text, Nullable)
- `status` (String(20), Default: 'confirmed')
- `created_at` (DateTime, Default: datetime.utcnow)
- `modified_at` (DateTime, Default: datetime.utcnow, OnUpdate: datetime.utcnow)

## RestaurantHours
- `id` (PK, Integer)
- `day_of_week` (Integer, Not Null)
- `lunch_opening_time` (Time, Not Null)
- `lunch_closing_time` (Time, Not Null)
- `dinner_opening_time` (Time, Not Null)
- `dinner_closing_time` (Time, Not Null)
- `is_lunch_closed` (Boolean, Default: False)
- `is_dinner_closed` (Boolean, Default: False)
- `created_at` (DateTime, Default: datetime.utcnow)
- `modified_at` (DateTime, Default: datetime.utcnow, OnUpdate: datetime.utcnow)

## RestaurantInfo
- `id` (PK, Integer)
- `name` (String(100), Not Null)
- `show_restaurant_name` (Boolean, Not Null, Default: True)
- `welcome_text` (Text, Not Null)
- `description` (Text, Not Null)
- `phone` (String(20), Not Null)
- `email` (String(120), Not Null)
- `address` (String(200), Not Null)
- `parking_info` (Text, Nullable)
- `primary_color` (String(7), Not Null, Default: '#8B4513')
- `secondary_color` (String(7), Not Null, Default: '#DEB887')
- `background_color` (String(7), Not Null, Default: '#FFF8DC')
- `font_family` (String(50), Not Null, Default: 'system-ui')
- `base_font_size` (String(10), Not Null, Default: '16px')
- `heading_font_size` (String(10), Not Null, Default: '24px')
- `font_weight` (String(10), Not Null, Default: '400')
- `border_radius` (String(10), Not Null, Default: '8px')
- `box_shadow` (String(100), Not Null, Default: '0 2px 4px rgba(0,0,0,0.1)')
- `logo_url` (String(200), Nullable)
- `navbar_title` (String(100), Not Null, Default: 'Ristorante')
- `created_at` (DateTime, Default: datetime.utcnow)
- `modified_at` (DateTime, Default: datetime.utcnow, OnUpdate: datetime.utcnow)

## Relationships
- User → Booking (One-to-Many)
  - A User can have multiple Bookings
  - Booking references User through user_id foreign key
- Table → Booking (One-to-Many)
  - A Table can have multiple Bookings
  - Booking references Table through table_id foreign key
