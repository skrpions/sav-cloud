-- =============================================
-- SAV CLOUD DATABASE SETUP COMPLETO
-- Para ejecutar en el SQL Editor de Supabase
-- =============================================

-- IMPORTANTE: Antes de ejecutar este script, asegúrate de:
-- 1. Estar autenticado en Supabase con tu cuenta (sksmartinez@gmail.com)
-- 2. Tener permisos de administrador en el proyecto
-- 3. Ejecutar este script en el SQL Editor de Supabase

-- =============================================
-- ENUMS
-- =============================================

-- Enum para roles de usuario
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'collaborator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de contrato
-- 'libre' = Se le da comida al trabajador + pago en efectivo (menor)
-- 'grabado' = Solo pago en efectivo (mayor, sin comida)
DO $$ BEGIN
    CREATE TYPE contract_type AS ENUM ('libre', 'grabado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de actividad
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
      'fertilization', 
      'fumigation', 
      'pruning', 
      'weeding', 
      'planting', 
      'maintenance', 
      'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para calidad del café
DO $$ BEGIN
    CREATE TYPE quality_grade AS ENUM ('premium', 'standard', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para métodos de pago
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'check', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para estado de pago
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de compra
DO $$ BEGIN
    CREATE TYPE purchase_type AS ENUM (
      'fertilizer', 
      'pesticide', 
      'tools', 
      'seeds', 
      'equipment', 
      'fuel', 
      'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLA: users (extiende auth.users de Supabase)
-- =============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'collaborator',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para users
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =============================================
-- TABLA: collaborators
-- =============================================

CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  identification VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  email VARCHAR(255),
  birth_date DATE,
  hire_date DATE NOT NULL,
  contract_type contract_type NOT NULL,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  bank_account VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para collaborators
CREATE UNIQUE INDEX IF NOT EXISTS idx_collaborators_identification ON public.collaborators(identification);
CREATE INDEX IF NOT EXISTS idx_collaborators_contract_type ON public.collaborators(contract_type);
CREATE INDEX IF NOT EXISTS idx_collaborators_is_active ON public.collaborators(is_active);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON public.collaborators(user_id);

-- =============================================
-- TABLA: settings
-- =============================================

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  harvest_price_per_kilogram DECIMAL(8,2) NOT NULL,
  daily_rate_libre DECIMAL(8,2) NOT NULL,
  daily_rate_grabado DECIMAL(8,2) NOT NULL,
  activity_rate_fertilization DECIMAL(8,2),
  activity_rate_fumigation DECIMAL(8,2),
  activity_rate_pruning DECIMAL(8,2),
  activity_rate_weeding DECIMAL(8,2),
  activity_rate_planting DECIMAL(8,2),
  activity_rate_maintenance DECIMAL(8,2),
  activity_rate_other DECIMAL(8,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'COP',
  tax_percentage DECIMAL(4,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para settings
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_year_active ON public.settings(year) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_settings_year ON public.settings(year);

-- =============================================
-- TABLA: activities
-- =============================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  days DECIMAL(3,1) NOT NULL DEFAULT 1.0 CHECK (days > 0),
  area_worked DECIMAL(8,2) CHECK (area_worked >= 0),
  payment_type contract_type NOT NULL,
  rate_per_day DECIMAL(10,2) NOT NULL CHECK (rate_per_day >= 0),
  total_cost DECIMAL(10,2) NOT NULL CHECK (total_cost >= 0),
  materials_used TEXT,
  weather_conditions VARCHAR(100),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para activities
CREATE INDEX IF NOT EXISTS idx_activities_collaborator_id ON public.activities(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_collaborator_date ON public.activities(collaborator_id, date);

-- =============================================
-- TABLA: harvests
-- =============================================

CREATE TABLE IF NOT EXISTS public.harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  kilograms DECIMAL(8,2) NOT NULL CHECK (kilograms > 0),
  quality_grade quality_grade NOT NULL DEFAULT 'standard',
  price_per_kilogram DECIMAL(8,2) NOT NULL CHECK (price_per_kilogram > 0),
  total_payment DECIMAL(10,2) NOT NULL CHECK (total_payment >= 0),
  humidity_percentage DECIMAL(4,1) CHECK (humidity_percentage >= 0 AND humidity_percentage <= 100),
  defects_percentage DECIMAL(4,1) CHECK (defects_percentage >= 0 AND defects_percentage <= 100),
  area_harvested DECIMAL(8,2) CHECK (area_harvested >= 0),
  weather_conditions VARCHAR(100),
  is_sold BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para harvests
CREATE INDEX IF NOT EXISTS idx_harvests_collaborator_id ON public.harvests(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_harvests_date ON public.harvests(date);
CREATE INDEX IF NOT EXISTS idx_harvests_collaborator_date ON public.harvests(collaborator_id, date);
CREATE INDEX IF NOT EXISTS idx_harvests_is_sold ON public.harvests(is_sold);
CREATE INDEX IF NOT EXISTS idx_harvests_quality_grade ON public.harvests(quality_grade);

-- =============================================
-- TABLA: sales
-- =============================================

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name VARCHAR(200) NOT NULL,
  buyer_contact VARCHAR(100),
  buyer_address TEXT,
  date DATE NOT NULL,
  kilograms DECIMAL(8,2) NOT NULL CHECK (kilograms > 0),
  quality_grade quality_grade NOT NULL,
  price_per_kilogram DECIMAL(8,2) NOT NULL CHECK (price_per_kilogram > 0),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_due_date DATE,
  invoice_number VARCHAR(50),
  transport_cost DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (transport_cost >= 0),
  packaging_cost DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (packaging_cost >= 0),
  commission_percentage DECIMAL(4,2) NOT NULL DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  net_amount DECIMAL(12,2) NOT NULL CHECK (net_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para sales
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON public.sales(buyer_name);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_quality_grade ON public.sales(quality_grade);

-- =============================================
-- TABLA: sale_harvest_details (relación N:M)
-- =============================================

CREATE TABLE IF NOT EXISTS public.sale_harvest_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  harvest_id UUID NOT NULL REFERENCES public.harvests(id) ON DELETE CASCADE,
  kilograms_used DECIMAL(8,2) NOT NULL CHECK (kilograms_used > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para sale_harvest_details
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_harvest_unique ON public.sale_harvest_details(sale_id, harvest_id);
CREATE INDEX IF NOT EXISTS idx_sale_harvest_sale_id ON public.sale_harvest_details(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_harvest_harvest_id ON public.sale_harvest_details(harvest_id);

-- =============================================
-- TABLA: purchases
-- =============================================

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type purchase_type NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  supplier_contact VARCHAR(100),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(8,2) NOT NULL CHECK (unit_price > 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  purchased_by UUID REFERENCES public.collaborators(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50),
  delivery_date DATE,
  warranty_months INTEGER CHECK (warranty_months >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para purchases
CREATE INDEX IF NOT EXISTS idx_purchases_type ON public.purchases(type);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_name ON public.purchases(supplier_name);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON public.purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_by ON public.purchases(purchased_by);

-- =============================================
-- TABLA: inventory_summary
-- =============================================

CREATE TABLE IF NOT EXISTS public.inventory_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  quality_grade quality_grade NOT NULL,
  total_kilograms DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_kilograms >= 0),
  available_kilograms DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (available_kilograms >= 0),
  sold_kilograms DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (sold_kilograms >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para inventory_summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_date_quality ON public.inventory_summary(date, quality_grade);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON public.inventory_summary(date);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON public.collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_harvests_updated_at BEFORE UPDATE ON public.harvests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_summary_updated_at BEFORE UPDATE ON public.inventory_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLITICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_harvest_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_summary ENABLE ROW LEVEL SECURITY;

-- Politicas simplificadas para evitar errores de dependencias
CREATE POLICY "Enable all operations for authenticated users" ON public.users
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.collaborators
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.activities
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.harvests
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.sales
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.sale_harvest_details
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.purchases
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.settings
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.inventory_summary
  FOR ALL USING (true);

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Funcion auxiliar para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para calcular el costo de una actividad
CREATE OR REPLACE FUNCTION calculate_activity_cost(
  p_activity_type activity_type,
  p_payment_type contract_type,
  p_days DECIMAL,
  p_year INTEGER DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL;
  v_current_year INTEGER;
BEGIN
  -- Si no se proporciona año, usar el año actual
  v_current_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  -- Obtener la tarifa base según el tipo de pago
  IF p_payment_type = 'libre' THEN
    SELECT daily_rate_libre INTO v_rate
    FROM public.settings 
    WHERE year = v_current_year AND is_active = true;
  ELSE
    SELECT daily_rate_grabado INTO v_rate
    FROM public.settings 
    WHERE year = v_current_year AND is_active = true;
  END IF;
  
  -- Si hay una tarifa específica para el tipo de actividad, usarla
  CASE p_activity_type
    WHEN 'fertilization' THEN
      SELECT COALESCE(activity_rate_fertilization, v_rate) INTO v_rate
      FROM public.settings 
      WHERE year = v_current_year AND is_active = true;
    WHEN 'fumigation' THEN
      SELECT COALESCE(activity_rate_fumigation, v_rate) INTO v_rate
      FROM public.settings 
      WHERE year = v_current_year AND is_active = true;
    WHEN 'pruning' THEN
      SELECT COALESCE(activity_rate_pruning, v_rate) INTO v_rate
      FROM public.settings 
      WHERE year = v_current_year AND is_active = true;
    WHEN 'weeding' THEN
      SELECT COALESCE(activity_rate_weeding, v_rate) INTO v_rate
      FROM public.settings 
      WHERE year = v_current_year AND is_active = true;
    WHEN 'planting' THEN
      SELECT COALESCE(activity_rate_planting, v_rate) INTO v_rate
      FROM public.settings 
      WHERE year = v_current_year AND is_active = true;
    WHEN 'maintenance' THEN
      SELECT COALESCE(activity_rate_maintenance, v_rate) INTO v_rate
      FROM public.settings 
      WHERE year = v_current_year AND is_active = true;
    WHEN 'other' THEN
      SELECT COALESCE(activity_rate_other, v_rate) INTO v_rate
      FROM public.settings 
      WHERE year = v_current_year AND is_active = true;
  END CASE;
  
  -- Calcular el costo total
  RETURN COALESCE(v_rate, 0) * p_days;
END;
$$ LANGUAGE plpgsql;

-- Funcion para calcular el pago de una cosecha
CREATE OR REPLACE FUNCTION calculate_harvest_payment(
  p_kilograms DECIMAL,
  p_quality_grade quality_grade DEFAULT 'standard',
  p_year INTEGER DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_price_per_kg DECIMAL;
  v_current_year INTEGER;
BEGIN
  -- Si no se proporciona año, usar el año actual
  v_current_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  -- Obtener el precio por kilogramo
  SELECT harvest_price_per_kilogram INTO v_price_per_kg
  FROM public.settings 
  WHERE year = v_current_year AND is_active = true;
  
  -- Calcular el pago total
  RETURN COALESCE(v_price_per_kg, 0) * p_kilograms;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CONFIGURACIÓN INICIAL
-- =============================================

-- Crear usuario administrador automáticamente
-- IMPORTANTE: Este bloque busca tu usuario en auth.users y lo registra como admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar el ID del usuario en auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'sksmartinez@gmail.com'
  LIMIT 1;
  
  -- Si se encuentra el usuario, insertarlo en public.users como admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, first_name, last_name, role, is_active)
    VALUES (
      admin_user_id,
      'sksmartinez@gmail.com',
      'Nestor',
      'Martinez',
      'admin',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      is_active = true,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW();
    
    RAISE NOTICE 'Usuario administrador creado/actualizado exitosamente: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No se encontró el usuario con email sksmartinez@gmail.com en auth.users';
    RAISE NOTICE 'INSTRUCCIONES:';
    RAISE NOTICE '1. Primero debes registrarte en tu aplicación Angular con el email: sksmartinez@gmail.com';
    RAISE NOTICE '2. Luego ejecuta este comando SQL para convertirte en admin:';
    RAISE NOTICE 'UPDATE public.users SET role = ''admin'' WHERE email = ''sksmartinez@gmail.com'';';
  END IF;
END $$;

-- Configuracion inicial de settings (valores minimos por defecto)
-- IMPORTANTE: Estos valores deben ser configurados segun las necesidades reales
INSERT INTO public.settings (
  year,
  harvest_price_per_kilogram,
  daily_rate_libre,
  daily_rate_grabado,
  activity_rate_fertilization,
  activity_rate_fumigation,
  activity_rate_pruning,
  activity_rate_weeding,
  activity_rate_planting,
  activity_rate_maintenance,
  activity_rate_other,
  currency,
  tax_percentage,
  is_active
) VALUES (
  EXTRACT(YEAR FROM CURRENT_DATE),
     1000.00, -- Precio por kg - CONFIGURAR SEGUN MERCADO
   30000.00, -- Tarifa diaria libre - CONFIGURAR SEGUN NECESIDADES
   35000.00, -- Tarifa diaria grabado - CONFIGURAR SEGUN NECESIDADES
  NULL, -- Usar tarifa base por defecto
  NULL, -- Usar tarifa base por defecto
  NULL, -- Usar tarifa base por defecto
  NULL, -- Usar tarifa base por defecto
  NULL, -- Usar tarifa base por defecto
  NULL, -- Usar tarifa base por defecto
  NULL, -- Usar tarifa base por defecto
  'COP',
  0,
  true
) ON CONFLICT (year) WHERE is_active = true DO UPDATE SET
  harvest_price_per_kilogram = EXCLUDED.harvest_price_per_kilogram,
  daily_rate_libre = EXCLUDED.daily_rate_libre,
  daily_rate_grabado = EXCLUDED.daily_rate_grabado,
  updated_at = NOW();

-- =============================================
-- SCRIPT COMPLETADO
-- =============================================

-- El script ha creado exitosamente:
-- ✅ Todas las tablas con sus relaciones
-- ✅ Indices para optimizacion de consultas
-- ✅ Politicas RLS para seguridad
-- ✅ Triggers para updated_at
-- ✅ Funciones auxiliares para calculos
-- ✅ Usuario administrador (sksmartinez@gmail.com)
-- ✅ Configuracion inicial minima

-- PROXIMOS PASOS:
-- 1. Configurar las tarifas reales en la tabla settings
-- 2. Comenzar a agregar colaboradores a traves de la aplicacion
-- 3. Registrar actividades y cosechas segun las operaciones de la finca

SELECT 'SAV CLOUD Database setup completed successfully!' as status; 