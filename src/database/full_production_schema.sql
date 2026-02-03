--Kwafer Platform - Full Production Schema
-- Consolidated Database Setup Script

-- 1. Enable Necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up existing tables (Optional - Use with caution)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS subscription_requests CASCADE;
-- DROP TABLE IF EXISTS salon_gallery CASCADE;
-- DROP TABLE IF EXISTS site_settings CASCADE;
-- DROP TABLE IF EXISTS pages CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS offers CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS salons CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users Table (Comprehensive)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Nullable for Social Login
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer, owner, admin
    google_id VARCHAR(255),
    avatar TEXT,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    phone_verification_code VARCHAR(10),
    phone_verification_expires TIMESTAMP,
    recovery_key VARCHAR(50),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    subscription_expires_at TIMESTAMP,
    trial_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Salons Table (Comprehensive)
CREATE TABLE IF NOT EXISTS salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    image_url TEXT,
    rating DECIMAL(2,1) DEFAULT 0.0,
    price_start INTEGER DEFAULT 0,
    distance_km DECIMAL(5,2) DEFAULT 0.0,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Subscription Fields
    subscription_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_status VARCHAR(20) DEFAULT 'trial', -- active, expired, trial
    subscription_plan VARCHAR(20) DEFAULT '7days',
    bonus_days INTEGER DEFAULT 0,
    
    -- Special Features
    bridal_title VARCHAR(255) DEFAULT 'باقة العروس الملكية',
    bridal_desc TEXT DEFAULT 'استعدي لليلة العمر مع باقة متكاملة تشمل المكياج، الشعر، والعناية بالبشرة.',
    bridal_discount INTEGER DEFAULT 30,
    bridal_price INTEGER DEFAULT 3000,
    bridal_services TEXT DEFAULT 'مكياج عروس، تصفيف شعر ملكي، تنظيف بشرة، مانيكير وباديكير',
    booking_policy TEXT DEFAULT 'نرجو الالتزام بالموعد المحدد. في حالة التأخير لأكثر من 15 دقيقة، يحق للصالون إلغاء الحجز.',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Services Table
CREATE TABLE IF NOT EXISTS services (
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

-- 7. Offers Table
CREATE TABLE IF NOT EXISTS offers (
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

-- 8. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME, -- Optional during request
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    amount INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
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

-- 10. Salon Gallery Table
CREATE TABLE IF NOT EXISTS salon_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info', -- success, error, info, warning
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Subscription Requests Table
CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. CMS: Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. CMS: Pages Table
CREATE TABLE IF NOT EXISTS pages (
    slug VARCHAR(50) PRIMARY KEY,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    content_ar TEXT,
    content_en TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Initial Seed Data
-- 15.1 Categories
INSERT INTO categories (name, description, icon) VALUES
('كوافير', 'تصفيف وصبغ', 'content_cut'),
('مكياج', 'مكياج احترافي', 'face_5'),
('عناية بالبشرة', 'تنظيف وترطيب', 'spa'),
('مانيكير وباديكير', 'العناية بالأظافر', 'back_hand'),
('حنة', 'رسم حنة', 'draw')
ON CONFLICT DO NOTHING;

-- 15.2 Admin User (master@kwafer.com / password123)
-- Hash generated via bcrypt
INSERT INTO users (name, email, password, role, is_phone_verified) VALUES
('إدارة الموقع', 'master@kwafer.com', '$2b$10$mBUqkEkzYBszPG5M8drbGeEvgdFMyAZllm/633shbD03HcXuf4M.a', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 15.3 Site Settings
INSERT INTO site_settings (key, value) VALUES
('facebook_url', 'https://facebook.com/kwafer'),
('instagram_url', 'https://instagram.com/kwafer_app'),
('whatsapp_number', '+201234567890'),
('contact_email', 'support@kwafer.com'),
('contact_phone', '19000'),
('subs_month_price', '150'),
('subs_3months_price', '400'),
('subs_6months_price', '750'),
('subs_year_price', '1400')
ON CONFLICT (key) DO NOTHING;

-- 15.4 Default Pages
INSERT INTO pages (slug, title_ar, title_en, content_ar, content_en) VALUES
('about', 'من نحن', 'About Us', 'منصة كوافير هي الرائدة في مجال حجز صالونات التجميل...', 'Kwafer is the leading platform for beauty salon bookings...'),
('how-it-works', 'كيف نعمل', 'How it Works', 'بيئة عمل سهلة وبسيطة...', 'Simple and easy ecosystem...'),
('join', 'انضمي كشريكة', 'Join as Partner', 'سجلي صالونك الآن وضاعفي أرباحك...', 'Register your salon now and double your profits...'),
('faq', 'الأسئلة الشائعة', 'FAQ', 'هنا تجدين إجابات لأكثر الأسئلة شيوعاً...', 'Here you find answers to most common questions...'),
('privacy', 'سياسة الخصوصية', 'Privacy Policy', 'نحن نحترم خصوصيتك...', 'We respect your privacy...'),
('contact', 'اتصل بنا', 'Contact Us', 'نحن هنا لمساعدتك دائماً...', 'We are always here to help you...')
ON CONFLICT (slug) DO NOTHING;

-- 16. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_salon ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_offers_salon ON offers(salon_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_salon ON salon_gallery(salon_id);
