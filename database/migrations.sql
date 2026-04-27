-- ============================================================
-- NutriTracker Database Schema
-- PostgreSQL 15+
-- ============================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy search

-- ============================================================
-- TABLE: users
-- Dados biométricos e configuração de metas
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Biometrics
  weight_kg FLOAT NOT NULL,
  height_cm FLOAT NOT NULL,
  age_years INTEGER NOT NULL,
  activity_factor FLOAT NOT NULL DEFAULT 1.55,
  tmb_base FLOAT NOT NULL,  -- Basal Metabolic Rate
  
  -- Configuration
  goal VARCHAR(20) DEFAULT 'maintenance' CHECK (goal IN ('deficit', 'maintenance', 'surplus')),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email ON users(email),
  INDEX idx_active ON users(is_active)
);

-- ============================================================
-- TABLE: daily_targets
-- Metas diárias de macros para cada usuário
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Daily macros
  tdee FLOAT NOT NULL,        -- Total Daily Energy Expenditure
  protein_g FLOAT NOT NULL,
  carbs_g FLOAT NOT NULL,
  fat_g FLOAT NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, date),
  INDEX idx_user_date ON daily_targets(user_id, date)
);

-- ============================================================
-- TABLE: meal_logs
-- Registro de refeições
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Food identification
  food_id VARCHAR(255) NOT NULL,  -- barcode or recipe ID
  food_name VARCHAR(255) NOT NULL,
  
  -- When eaten
  date DATE NOT NULL,
  meal_type VARCHAR(20),  -- breakfast, lunch, dinner, snack
  
  -- Quantity & nutrition
  quantity FLOAT NOT NULL DEFAULT 1.0,  -- portion multiplier
  kcal FLOAT NOT NULL,
  protein_g FLOAT NOT NULL,
  carbs_g FLOAT NOT NULL,
  fat_g FLOAT NOT NULL,
  
  -- Extra info
  metadata JSONB,  -- OCR source, barcode, image URL, etc
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_date ON meal_logs(user_id, date),
  INDEX idx_food_id ON meal_logs(food_id),
  INDEX idx_created_at ON meal_logs(created_at)
);

-- ============================================================
-- TABLE: scanned_foods_cache
-- Cache de alimentos da API externa (OpenFoodFacts)
-- ============================================================
CREATE TABLE IF NOT EXISTS scanned_foods_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  barcode VARCHAR(50) NOT NULL UNIQUE,
  food_name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  portion_size VARCHAR(50) DEFAULT '100g',
  
  -- Nutrition
  kcal FLOAT NOT NULL,
  protein_g FLOAT NOT NULL,
  carbs_g FLOAT NOT NULL,
  fat_g FLOAT NOT NULL,
  fiber_g FLOAT,
  sodium_mg FLOAT,
  
  -- Source & metadata
  source VARCHAR(50) DEFAULT 'openfoodfacts' CHECK (source IN ('openfoodfacts', 'fatsecret', 'manual')),
  raw_data JSONB,  -- Full API response
  
  ttl_expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_barcode ON scanned_foods_cache(barcode),
  INDEX idx_ttl ON scanned_foods_cache(ttl_expires),
  INDEX idx_food_name_trgm ON scanned_foods_cache USING GIN(food_name gin_trgm_ops)
);

-- ============================================================
-- TABLE: app_curated_recipes
-- Biblioteca de receitas do aplicativo
-- ============================================================
CREATE TABLE IF NOT EXISTS app_curated_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Ingredients (JSONB array)
  ingredients JSONB NOT NULL,  -- [{name, quantity, unit}, ...]
  instructions JSONB,          -- [step1, step2, ...]
  
  -- Nutrition per serving
  kcal FLOAT NOT NULL,
  protein_g FLOAT NOT NULL,
  carbs_g FLOAT NOT NULL,
  fat_g FLOAT NOT NULL,
  
  -- Metadata
  tags JSONB,  -- ['quick', 'vegan', 'high-protein', ...]
  preparation_time_min INTEGER,
  servings INTEGER DEFAULT 1,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name ON app_curated_recipes(name),
  INDEX idx_active ON app_curated_recipes(is_active)
);

-- ============================================================
-- TABLE: subscription_logs
-- Histórico de assinaturas (In-App Purchases via RevenueCat/Stripe)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'pro', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  
  provider VARCHAR(50),  -- 'stripe', 'revenucat', 'manual'
  external_transaction_id VARCHAR(255),
  
  started_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  
  price FLOAT,
  currency VARCHAR(3),  -- 'BRL', 'USD', etc
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_date ON subscription_logs(user_id, started_at)
);

-- ============================================================
-- SAMPLE DATA (Development only)
-- ============================================================

-- Insert sample recipe
INSERT INTO app_curated_recipes (
  name, 
  description, 
  ingredients, 
  kcal, 
  protein_g, 
  carbs_g, 
  fat_g, 
  tags, 
  preparation_time_min, 
  servings, 
  is_active
) VALUES (
  'Frango Grelhado com Brócolis e Batata Doce',
  'Refeição equilibrada com proteína magra, carboidratos complexos e fibras',
  '[
    {"name": "Peito de Frango", "quantity": 200, "unit": "g"},
    {"name": "Brócolis", "quantity": 150, "unit": "g"},
    {"name": "Batata Doce", "quantity": 150, "unit": "g"},
    {"name": "Azeite de Oliva", "quantity": 1, "unit": "colher"}
  ]'::JSONB,
  450,
  45,
  35,
  12,
  '["high-protein", "balanced", "quick", "grilled"]'::JSONB,
  20,
  1,
  TRUE
) ON CONFLICT DO NOTHING;

-- ============================================================
-- FUNCTIONS (Utilities)
-- ============================================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to daily_targets table
CREATE TRIGGER update_daily_targets_updated_at BEFORE UPDATE ON daily_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to meal_logs table
CREATE TRIGGER update_meal_logs_updated_at BEFORE UPDATE ON meal_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to app_curated_recipes table
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON app_curated_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Query Examples for Development
-- ============================================================

-- Get today's meals for a user
-- SELECT * FROM meal_logs WHERE user_id = 'YOUR_USER_ID' AND date = CURRENT_DATE;

-- Calculate daily consumption
-- SELECT 
--   SUM(kcal) as total_kcal,
--   SUM(protein_g) as total_protein,
--   SUM(carbs_g) as total_carbs,
--   SUM(fat_g) as total_fat
-- FROM meal_logs
-- WHERE user_id = 'YOUR_USER_ID' AND date = CURRENT_DATE;

-- Fuzzy search foods (e.g., typos: "Frango" vs  "Franngo")
-- SELECT food_name, similarity(food_name, 'Frango') as similarity
-- FROM scanned_foods_cache
-- WHERE food_name % 'Frango'
-- ORDER BY similarity DESC
-- LIMIT 10;
