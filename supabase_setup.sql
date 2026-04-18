-- =============================================
-- Al-Khumaisi Bean House — Supabase Setup SQL
-- =============================================
-- Jalankan script ini di Supabase SQL Editor

-- 1. Table: admins
CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: products
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Arabica',
  price DECIMAL(12,2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'gr',
  stock DECIMAL(10,2) DEFAULT 0,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT DEFAULT ''
);

-- 4. Insert default admin (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admins (email, password_hash, name) VALUES 
('alkhumaisi@bean.com', '$2b$10$3QFciBwcCuEb0teN505kne37XPq9RzRRvwLyENgoZb1oY2qrjfq5e', 'Admin Al-Khumaisi')
ON CONFLICT (email) DO NOTHING;

-- 5. Insert default settings
INSERT INTO settings (key, value) VALUES
('store_name', 'Al-Khumaisi Bean House'),
('store_tagline', 'Biji Kopi Premium, Langsung dari Petani!'),
('store_description', 'Biji kopi berkualitas tinggi dari perkebunan terbaik Indonesia. Dipanggang sempurna untuk menghasilkan aroma dan rasa terbaik.'),
('store_address', 'Jakarta, Indonesia'),
('whatsapp_number', '6281234567890'),
('delivery_areas', 'Seluruh Indonesia via JNE, J&T, SiCepat'),
('operating_hours', 'Senin - Sabtu: 08:00 - 20:00'),
('payment_bank_name', 'BCA'),
('payment_bank_account', '1234567890'),
('payment_bank_holder', 'Al-Khumaisi'),
('payment_shopeepay', ''),
('payment_dana', '')
ON CONFLICT (key) DO NOTHING;

-- 6. Create Storage Bucket (run this manually in Supabase Dashboard > Storage)
-- Bucket name: products
-- Public: Yes
