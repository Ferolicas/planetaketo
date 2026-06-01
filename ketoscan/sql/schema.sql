-- ============================================================
-- Planeta Keto Scan - Esquema de base de datos PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  age INTEGER,
  gender VARCHAR(10),
  activity_level VARCHAR(20),
  target_weight_kg DECIMAL(5,2),
  target_weeks INTEGER,
  diet_type VARCHAR(20) DEFAULT 'keto',
  max_carbs_g INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  calories_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(8,2),
  carbs_per_100g DECIMAL(8,2),
  fat_per_100g DECIMAL(8,2),
  fiber_per_100g DECIMAL(8,2),
  sugar_per_100g DECIMAL(8,2),
  sodium_per_100g DECIMAL(8,2),
  saturated_fat_per_100g DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  grams DECIMAL(8,2) DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  food_name VARCHAR(200),
  grams DECIMAL(8,2),
  meal_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_user_id ON foods(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_menu_user_date ON daily_menu(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_user_week ON weekly_menu(user_id, week_start);

-- ============================================================
-- Trigger para mantener updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_foods_updated ON foods;
CREATE TRIGGER trg_foods_updated BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_daily_menu_updated ON daily_menu;
CREATE TRIGGER trg_daily_menu_updated BEFORE UPDATE ON daily_menu
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
