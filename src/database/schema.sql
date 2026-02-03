-- Drop existing tables if they exist
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
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
    booking_policy TEXT DEFAULT 'نرجو الالتزام بالموعد المحدد. في حالة التأخير لأكثر من 15 دقيقة، يحق للصالون إلغاء الحجز.',
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
    visible_to_customer BOOLEAN DEFAULT TRUE,
    visible_to_salon BOOLEAN DEFAULT TRUE,
    visible_to_admin BOOLEAN DEFAULT TRUE,
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
    status VARCHAR(20) DEFAULT 'approved',
    owner_reply TEXT,
    is_helpful BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site Settings Table (CMS)
CREATE TABLE site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT
);

-- Pages Table (CMS)
CREATE TABLE pages (
    slug VARCHAR(50) PRIMARY KEY,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    content_ar TEXT,
    content_en TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert essential data
-- Categories
INSERT INTO categories (name, description, icon) VALUES
('كوافير', 'تصفيف وصبغ', 'content_cut'),
('مكياج', 'مكياج احترافي', 'face_5'),
('عناية بالبشرة', 'تنظيف وترطيب', 'spa'),
('مانيكير وباديكير', 'العناية بالأظافر', 'back_hand'),
('حنة', 'رسم حنة', 'draw');

-- Essential Admin User (master@kwafer.com / password123)
INSERT INTO users (name, email, password, role) VALUES
('إدارة الموقع', 'master@kwafer.com', '$2b$10$mBUqkEkzYBszPG5M8drbGeEvgdFMyAZllm/633shbD03HcXuf4M.a', 'admin');

-- Default Site Settings
INSERT INTO site_settings (key, value) VALUES
('facebook_url', 'https://facebook.com/kwafer'),
('instagram_url', 'https://instagram.com/kwafer_app'),
('whatsapp_number', '+201234567890'),
('contact_email', 'support@kwafer.com'),
('contact_phone', '19000');

-- Default Pages
INSERT INTO pages (slug, title_ar, title_en, content_ar, content_en) VALUES
('about', 'من نحن', 'About Us', 'منصة كوافير هي الرائدة في مجال حجز صالونات التجميل...', 'Kwafer is the leading platform for beauty salon bookings...'),
('how-it-works', 'كيف نعمل', 'How it Works', 'بيئة عمل سهلة وبسيطة...', 'Simple and easy ecosystem...'),
('join', 'انضمي كشريكة', 'Join as Partner', 'سجلي صالونك الآن وضاعفي أرباحك...', 'Register your salon now and double your profits...'),
('faq', 'الأسئلة الشائعة', 'FAQ', 'هنا تجدين إجابات لأكثر الأسئلة شيوعاً...', 'Here you find answers to most common questions...'),
('privacy', 'سياسة الخصوصية', 'Privacy Policy', 'نحن نحترم خصوصيتك...', 'We respect your privacy...'),
('contact', 'اتصل بنا', 'Contact Us', 'نحن هنا لمساعدتك دائماً...', 'We are always here to help you...');

-- Create indexes for better performance
CREATE INDEX idx_salons_owner ON salons(owner_id);
CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_salon ON bookings(salon_id);
CREATE INDEX idx_reviews_salon ON reviews(salon_id);
CREATE INDEX idx_offers_salon ON offers(salon_id);
