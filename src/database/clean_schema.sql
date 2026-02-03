-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS salons CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer, owner, admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salons Table
CREATE TABLE salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    image_url TEXT,
    rating DECIMAL(2,1) DEFAULT 0.0,
    price_start INTEGER,
    distance_km DECIMAL(5,2),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    bridal_title VARCHAR(255) DEFAULT 'باقة العروس الملكية',
    bridal_desc TEXT DEFAULT 'استعدي لليلة العمر مع باقة متكاملة تشمل المكياج، الشعر، والعناية بالبشرة.',
    bridal_discount INTEGER DEFAULT 30,
    bridal_price INTEGER DEFAULT 3000,
    bridal_services TEXT DEFAULT 'مكياج عروس، تصفيف شعر ملكي، تنظيف بشرة، مانيكير وباديكير',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    icon VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Offers Table
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount INTEGER NOT NULL, -- percentage
    price INTEGER DEFAULT 0,
    valid_until DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    amount INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    owner_reply TEXT,
    is_helpful BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
-- Categories
INSERT INTO categories (name, description, icon) VALUES
('كوافير', 'تصفيف وصبغ', 'content_cut'),
('مكياج', 'مكياج احترافي', 'face_5'),
('عناية بالبشرة', 'تنظيف وترطيب', 'spa'),
('مانيكير وباديكير', 'العناية بالأظافر', 'back_hand'),
('حنة', 'رسم حنة', 'draw');

-- Sample Admin User
INSERT INTO users (name, email, password, role) VALUES
('إدارة الموقع', 'master@kwafer.com', '$2b$10$mBUqkEkzYBszPG5M8drbGeEvgdFMyAZllm/633shbD03HcXuf4M.a', 'admin');

-- Create indexes for better performance
CREATE INDEX idx_salons_owner ON salons(owner_id);
CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_salon ON bookings(salon_id);
CREATE INDEX idx_reviews_salon ON reviews(salon_id);
CREATE INDEX idx_offers_salon ON offers(salon_id);
