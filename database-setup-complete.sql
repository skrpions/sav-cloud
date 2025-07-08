-- ============================================
-- SAV CLOUD - CONFIGURACIÓN COMPLETA DE BASE DE DATOS
-- Sistema de Gestión de Múltiples Fincas Cafeteras
-- ============================================

-- ============================================
-- HABILITAR EXTENSIONES NECESARIAS
-- ============================================

-- Habilitar la extensión UUID para generar IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Habilitar PostGIS para datos geoespaciales (opcional para coordenadas)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- CREAR TIPOS ENUM PERSONALIZADOS
-- ============================================

-- Limpiar tipos existentes si existen para evitar conflictos
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contract_type CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS plot_status CASCADE;
DROP TYPE IF EXISTS plant_status CASCADE;
DROP TYPE IF EXISTS quality_grade CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS purchase_type CASCADE;
DROP TYPE IF EXISTS bank_type CASCADE;
DROP TYPE IF EXISTS bancolombia_product_type CASCADE;
DROP TYPE IF EXISTS generic_product_type CASCADE;

-- Tipos de roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'farm_owner', 'farm_manager', 'collaborator');

-- Tipos de contrato para colaboradores
CREATE TYPE contract_type AS ENUM ('libre', 'grabado');

-- Tipos de actividades en la finca
CREATE TYPE activity_type AS ENUM (
    'fertilization',    -- Fertilización
    'fumigation',       -- Fumigación
    'pruning',          -- Poda
    'weeding',          -- Deshierbe
    'planting',         -- Siembra
    'maintenance',      -- Mantenimiento general
    'harvesting',       -- Cosecha
    'soil_preparation', -- Preparación de suelo
    'pest_control',     -- Control de plagas
    'irrigation',       -- Riego
    'other'             -- Otras actividades
);

-- Estados de parcelas/lotes
CREATE TYPE plot_status AS ENUM (
    'active',           -- Activa/Productiva
    'preparation',      -- En preparación
    'renovation',       -- En renovación
    'resting',          -- En descanso
    'abandoned'         -- Abandonada
);

-- Estados de plantas
CREATE TYPE plant_status AS ENUM (
    'seedling',         -- Plántula
    'growing',          -- Crecimiento
    'productive',       -- Productiva
    'declining',        -- En declive
    'dead'              -- Muerta
);

-- Grados de calidad de los cultivos
CREATE TYPE quality_grade AS ENUM ('premium', 'standard', 'low');

-- Métodos de pago
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'check', 'credit');

-- Estados de pago
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed');

-- Tipos de compras
CREATE TYPE purchase_type AS ENUM (
    'fertilizer',       -- Fertilizantes
    'pesticide',        -- Pesticidas
    'tools',            -- Herramientas
    'equipment',        -- Equipos
    'seeds',            -- Semillas
    'seedlings',        -- Plántulas
    'fuel',             -- Combustible
    'maintenance',      -- Mantenimiento
    'infrastructure',   -- Infraestructura
    'services',         -- Servicios
    'other'             -- Otros
);

-- Tipos de bancos
CREATE TYPE bank_type AS ENUM (
    'bancolombia',
    'nequi',
    'daviplata',
    'banco_bogota',
    'banco_popular',
    'bbva',
    'scotiabank',
    'otro'
);

-- Tipos de productos bancarios específicos para Bancolombia
CREATE TYPE bancolombia_product_type AS ENUM ('ahorros', 'corriente', 'bancolombia_a_la_mano');

-- Tipos de productos bancarios genéricos
CREATE TYPE generic_product_type AS ENUM ('ahorros', 'corriente');

-- ============================================
-- CREAR TABLAS PRINCIPALES
-- ============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'farm_owner',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Tabla de información bancaria
CREATE TABLE IF NOT EXISTS public.banking_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bank bank_type NOT NULL,
    product_type VARCHAR(50) NOT NULL, -- Puede ser bancolombia_product_type o generic_product_type
    account_number VARCHAR(50) NOT NULL,
    use_phone_number BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para información bancaria
CREATE INDEX IF NOT EXISTS idx_banking_info_bank ON public.banking_info(bank);
CREATE INDEX IF NOT EXISTS idx_banking_info_account_number ON public.banking_info(account_number);

-- Tabla de variedades de cultivos (café, cacao, aguacate, etc.)
CREATE TABLE IF NOT EXISTS public.crop_varieties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crop_type VARCHAR(50) NOT NULL, -- 'coffee', 'cacao', 'avocado', 'plantain', etc.
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(150),
    description TEXT,
    characteristics JSONB, -- {yield_per_plant, disease_resistance, altitude_range, etc.}
    maturation_months INTEGER, -- Meses hasta primera cosecha/producción
    productive_years INTEGER, -- Años productivos
    plants_per_hectare INTEGER,
    harvest_seasons JSONB, -- Épocas de cosecha ["january", "february", etc.]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para variedades de cultivos
CREATE INDEX IF NOT EXISTS idx_crop_varieties_crop_type ON public.crop_varieties(crop_type);
CREATE INDEX IF NOT EXISTS idx_crop_varieties_name ON public.crop_varieties(name);
CREATE INDEX IF NOT EXISTS idx_crop_varieties_is_active ON public.crop_varieties(is_active);

-- Restricción única para evitar duplicados de variedad por tipo de cultivo
CREATE UNIQUE INDEX IF NOT EXISTS idx_crop_varieties_crop_name_unique ON public.crop_varieties(crop_type, name);

-- Tabla de fincas
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT,
    municipality VARCHAR(100),
    department VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Colombia',
    total_area DECIMAL(10,2), -- Hectáreas totales
    altitude_min INTEGER, -- Metros sobre el nivel del mar mínimo
    altitude_max INTEGER, -- Metros sobre el nivel del mar máximo
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    phone VARCHAR(20),
    email VARCHAR(255),
    established_date DATE,
    certifications JSONB, -- {organic: true, fair_trade: false, etc.}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para fincas
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_name ON public.farms(name);
CREATE INDEX IF NOT EXISTS idx_farms_is_active ON public.farms(is_active);
CREATE INDEX IF NOT EXISTS idx_farms_municipality ON public.farms(municipality);

-- Tabla de lotes/parcelas
CREATE TABLE IF NOT EXISTS public.plots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50), -- Código identificador del lote
    crop_type VARCHAR(50) NOT NULL, -- Tipo de cultivo: 'coffee', 'cacao', 'avocado', etc.
    area DECIMAL(8,2) NOT NULL, -- Hectáreas
    altitude INTEGER, -- Metros sobre el nivel del mar
    slope_percentage DECIMAL(5,2), -- Porcentaje de pendiente
    soil_type VARCHAR(100),
    irrigation_system VARCHAR(100),
    status plot_status DEFAULT 'active',
    planting_date DATE,
    last_renovation_date DATE,
    notes TEXT,
    coordinates JSONB, -- Array de coordenadas para polígono del lote
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para lotes
CREATE INDEX IF NOT EXISTS idx_plots_farm_id ON public.plots(farm_id);
CREATE INDEX IF NOT EXISTS idx_plots_name ON public.plots(name);
CREATE INDEX IF NOT EXISTS idx_plots_crop_type ON public.plots(crop_type);
CREATE INDEX IF NOT EXISTS idx_plots_status ON public.plots(status);
CREATE INDEX IF NOT EXISTS idx_plots_is_active ON public.plots(is_active);
CREATE INDEX IF NOT EXISTS idx_plots_farm_crop ON public.plots(farm_id, crop_type);

-- Tabla de inventario de plantas por lote
CREATE TABLE IF NOT EXISTS public.plant_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    variety_id UUID NOT NULL REFERENCES public.crop_varieties(id) ON DELETE RESTRICT,
    plant_count INTEGER NOT NULL CHECK (plant_count >= 0),
    planted_date DATE,
    expected_first_harvest DATE,
    status plant_status DEFAULT 'growing',
    mortality_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para inventario de plantas
CREATE INDEX IF NOT EXISTS idx_plant_inventory_plot_id ON public.plant_inventory(plot_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_variety_id ON public.plant_inventory(variety_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_status ON public.plant_inventory(status);

-- Tabla de colaboradores
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
    identification VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
  birth_date DATE,
  hire_date DATE NOT NULL,
  contract_type contract_type NOT NULL,
    emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
    banking_info_id UUID REFERENCES public.banking_info(id) ON DELETE SET NULL,
    specializations JSONB, -- {fertilization: true, pruning: false, etc.}
  notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para colaboradores
CREATE INDEX IF NOT EXISTS idx_collaborators_farm_id ON public.collaborators(farm_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_identification ON public.collaborators(identification);
CREATE INDEX IF NOT EXISTS idx_collaborators_contract_type ON public.collaborators(contract_type);
CREATE INDEX IF NOT EXISTS idx_collaborators_is_active ON public.collaborators(is_active);
CREATE INDEX IF NOT EXISTS idx_collaborators_banking_info_id ON public.collaborators(banking_info_id);

-- Tabla de configuraciones por finca
CREATE TABLE IF NOT EXISTS public.farm_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'COP',
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    crop_prices JSONB NOT NULL, -- {coffee: {price_per_kg: 2800, unit: "kg"}, cacao: {price_per_kg: 8500, unit: "kg"}, avocado: {price_per_unit: 1200, unit: "units"}}
    daily_rate_libre DECIMAL(10,2) NOT NULL,
    daily_rate_grabado DECIMAL(10,2) NOT NULL,
    activity_rates JSONB, -- {fertilization: 40000, fumigation: 45000, etc.}
    quality_premiums JSONB, -- {premium: 500, standard: 0, low: -200}
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para configuraciones
CREATE UNIQUE INDEX IF NOT EXISTS idx_farm_settings_farm_year_active ON public.farm_settings(farm_id, year) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_farm_settings_farm_id ON public.farm_settings(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_settings_year ON public.farm_settings(year);

-- Tabla de actividades
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL, -- Opcional: actividad en lote específico
  type activity_type NOT NULL,
  date DATE NOT NULL,
    days DECIMAL(3,1) NOT NULL CHECK (days > 0),
  payment_type contract_type NOT NULL,
    rate_per_day DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    area_worked DECIMAL(8,2),
  materials_used TEXT,
  weather_conditions VARCHAR(100),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    supervisor_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL,
    equipment_used JSONB, -- Array de equipos utilizados
  notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para actividades
CREATE INDEX IF NOT EXISTS idx_activities_farm_id ON public.activities(farm_id);
CREATE INDEX IF NOT EXISTS idx_activities_collaborator_id ON public.activities(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_activities_plot_id ON public.activities(plot_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_farm_date ON public.activities(farm_id, date);

-- Tabla de cosechas
CREATE TABLE IF NOT EXISTS public.harvests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL, -- Opcional: cosecha de lote específico
    variety_id UUID REFERENCES public.crop_varieties(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0), -- Cantidad cosechada (kg, unidades, etc.)
    unit_measure VARCHAR(20) DEFAULT 'kg', -- kg, units, tons, etc.
    quality_grade quality_grade NOT NULL,
    humidity_percentage DECIMAL(5,2) CHECK (humidity_percentage >= 0 AND humidity_percentage <= 100),
    defects_percentage DECIMAL(5,2) CHECK (defects_percentage >= 0 AND defects_percentage <= 100),
    area_harvested DECIMAL(8,2),
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_payment DECIMAL(10,2) NOT NULL,
  weather_conditions VARCHAR(100),
    processing_method VARCHAR(100), -- Lavado, natural, honey, fermentado, etc.
    is_sold BOOLEAN DEFAULT false,
    batch_number VARCHAR(50),
  notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cosechas
CREATE INDEX IF NOT EXISTS idx_harvests_farm_id ON public.harvests(farm_id);
CREATE INDEX IF NOT EXISTS idx_harvests_collaborator_id ON public.harvests(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_harvests_plot_id ON public.harvests(plot_id);
CREATE INDEX IF NOT EXISTS idx_harvests_variety_id ON public.harvests(variety_id);
CREATE INDEX IF NOT EXISTS idx_harvests_date ON public.harvests(date);
CREATE INDEX IF NOT EXISTS idx_harvests_farm_date ON public.harvests(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_harvests_is_sold ON public.harvests(is_sold);
CREATE INDEX IF NOT EXISTS idx_harvests_quality_grade ON public.harvests(quality_grade);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
  buyer_name VARCHAR(200) NOT NULL,
    buyer_contact VARCHAR(200),
  buyer_address TEXT,
    total_quantity DECIMAL(10,2) NOT NULL CHECK (total_quantity > 0),
    unit_measure VARCHAR(20) DEFAULT 'kg', -- kg, units, tons, etc.
    price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit > 0),
    total_amount DECIMAL(12,2) NOT NULL,
  quality_grade quality_grade NOT NULL,
  payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_date DATE,
    transport_cost DECIMAL(10,2) DEFAULT 0,
    processing_cost DECIMAL(10,2) DEFAULT 0,
    packaging_cost DECIMAL(10,2) DEFAULT 0,
    other_costs DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(10,2),
    delivery_location VARCHAR(200),
    invoice_number VARCHAR(100),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(12,2),
    moisture_percentage DECIMAL(5,2),
    certifications JSONB, -- Certificaciones aplicables a esta venta
    contract_details JSONB, -- Detalles del contrato de venta
  notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para ventas
CREATE INDEX IF NOT EXISTS idx_sales_farm_id ON public.sales(farm_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON public.sales(buyer_name);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_quality_grade ON public.sales(quality_grade);

-- Tabla de relación entre ventas y cosechas
CREATE TABLE IF NOT EXISTS public.sale_harvest_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  harvest_id UUID NOT NULL REFERENCES public.harvests(id) ON DELETE CASCADE,
    kilograms_sold DECIMAL(8,2) NOT NULL CHECK (kilograms_sold > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para detalles de venta-cosecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_harvest_unique ON public.sale_harvest_details(sale_id, harvest_id);
CREATE INDEX IF NOT EXISTS idx_sale_harvest_sale_id ON public.sale_harvest_details(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_harvest_harvest_id ON public.sale_harvest_details(harvest_id);

-- Tabla de compras/gastos
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  type purchase_type NOT NULL,
    date DATE NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
    supplier_contact VARCHAR(200),
    supplier_address TEXT,
  description TEXT NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50), -- kg, litros, unidades, etc.
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_date DATE,
    invoice_number VARCHAR(100),
    tax_amount DECIMAL(10,2) DEFAULT 0,
  delivery_date DATE,
    delivery_location VARCHAR(200),
    warranty_months INTEGER,
    purchased_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    category_tags JSONB, -- Tags para categorización
  notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para compras
CREATE INDEX IF NOT EXISTS idx_purchases_farm_id ON public.purchases(farm_id);
CREATE INDEX IF NOT EXISTS idx_purchases_type ON public.purchases(type);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_name ON public.purchases(supplier_name);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON public.purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_by ON public.purchases(purchased_by);

-- Tabla de resumen de inventario por finca
CREATE TABLE IF NOT EXISTS public.inventory_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quality_grade quality_grade NOT NULL,
    total_harvested DECIMAL(10,2) DEFAULT 0,
    total_sold DECIMAL(10,2) DEFAULT 0,
    remaining_stock DECIMAL(10,2) DEFAULT 0,
    average_price DECIMAL(10,2),
    storage_location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para resumen de inventario
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_farm_date_quality ON public.inventory_summary(farm_id, date, quality_grade);
CREATE INDEX IF NOT EXISTS idx_inventory_farm_id ON public.inventory_summary(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON public.inventory_summary(date);

-- ============================================
-- CREAR FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banking_info_updated_at BEFORE UPDATE ON public.banking_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crop_varieties_updated_at BEFORE UPDATE ON public.crop_varieties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plant_inventory_updated_at BEFORE UPDATE ON public.plant_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON public.collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farm_settings_updated_at BEFORE UPDATE ON public.farm_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_harvests_updated_at BEFORE UPDATE ON public.harvests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_summary_updated_at BEFORE UPDATE ON public.inventory_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_harvest_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_summary ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas: permitir todas las operaciones para usuarios autenticados
-- En producción deberían ser más específicas según roles y ownership

-- Política para usuarios
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.users;
CREATE POLICY "Enable all operations for authenticated users" ON public.users
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para información bancaria
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.banking_info;
CREATE POLICY "Enable all operations for authenticated users" ON public.banking_info
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para variedades de cultivos (acceso global)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.crop_varieties;
CREATE POLICY "Enable all operations for authenticated users" ON public.crop_varieties
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para fincas
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.farms;
CREATE POLICY "Enable all operations for authenticated users" ON public.farms
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para lotes
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.plots;
CREATE POLICY "Enable all operations for authenticated users" ON public.plots
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para inventario de plantas
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.plant_inventory;
CREATE POLICY "Enable all operations for authenticated users" ON public.plant_inventory
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para colaboradores
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.collaborators;
CREATE POLICY "Enable all operations for authenticated users" ON public.collaborators
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para configuraciones de finca
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.farm_settings;
CREATE POLICY "Enable all operations for authenticated users" ON public.farm_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para actividades
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.activities;
CREATE POLICY "Enable all operations for authenticated users" ON public.activities
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para cosechas
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.harvests;
CREATE POLICY "Enable all operations for authenticated users" ON public.harvests
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para ventas
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sales;
CREATE POLICY "Enable all operations for authenticated users" ON public.sales
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para detalles de venta-cosecha
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sale_harvest_details;
CREATE POLICY "Enable all operations for authenticated users" ON public.sale_harvest_details
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para compras
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.purchases;
CREATE POLICY "Enable all operations for authenticated users" ON public.purchases
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para resumen de inventario
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.inventory_summary;
CREATE POLICY "Enable all operations for authenticated users" ON public.inventory_summary
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCIONES DE UTILIDAD
-- ============================================

-- Función para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es propietario de una finca
CREATE OR REPLACE FUNCTION public.is_farm_owner(farm_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = farm_uuid AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular el costo de una actividad
CREATE OR REPLACE FUNCTION calculate_activity_cost(
    p_days DECIMAL,
  p_payment_type contract_type,
    p_rate_per_day DECIMAL,
    p_farm_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
    v_base_cost DECIMAL;
BEGIN
    -- Calcular costo base
    v_base_cost := p_days * p_rate_per_day;
    
    -- Aquí se pueden agregar cálculos adicionales basados en configuraciones de la finca
    -- por ejemplo, bonificaciones, descuentos, etc.
    
    RETURN v_base_cost;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular estadísticas de producción por finca
CREATE OR REPLACE FUNCTION get_farm_production_stats(
    p_farm_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_crop_type VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Establecer fechas por defecto
    v_start_date := COALESCE(p_start_date, DATE_TRUNC('year', CURRENT_DATE));
    v_end_date := COALESCE(p_end_date, CURRENT_DATE);
    
    SELECT jsonb_build_object(
        'total_harvested', COALESCE(SUM(h.quantity), 0),
        'total_revenue', COALESCE(SUM(h.total_payment), 0),
        'average_price_per_unit', COALESCE(AVG(h.price_per_unit), 0),
        'harvest_count', COUNT(*),
        'plots_harvested', COUNT(DISTINCT h.plot_id),
        'collaborators_involved', COUNT(DISTINCT h.collaborator_id),
        'crop_breakdown', jsonb_object_agg(p.crop_type, COUNT(*))
    ) INTO v_stats
    FROM public.harvests h
    LEFT JOIN public.plots p ON h.plot_id = p.id
    WHERE h.farm_id = p_farm_id
        AND h.date BETWEEN v_start_date AND v_end_date
        AND (p_crop_type IS NULL OR p.crop_type = p_crop_type);
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener los tipos de cultivos de una finca
CREATE OR REPLACE FUNCTION get_farm_crop_types(p_farm_id UUID)
RETURNS TABLE(crop_type VARCHAR, plot_count BIGINT, total_area DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.crop_type,
        COUNT(*) as plot_count,
        SUM(p.area) as total_area
    FROM public.plots p
    WHERE p.farm_id = p_farm_id 
        AND p.is_active = true
    GROUP BY p.crop_type
    ORDER BY p.crop_type;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener variedades disponibles por tipo de cultivo
CREATE OR REPLACE FUNCTION get_crop_varieties_by_type(p_crop_type VARCHAR)
RETURNS TABLE(
    id UUID, 
    name VARCHAR, 
    scientific_name VARCHAR, 
    description TEXT,
    maturation_months INTEGER,
    productive_years INTEGER,
    plants_per_hectare INTEGER,
    harvest_seasons JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.id,
        cv.name,
        cv.scientific_name,
        cv.description,
        cv.maturation_months,
        cv.productive_years,
        cv.plants_per_hectare,
        cv.harvest_seasons
    FROM public.crop_varieties cv
    WHERE cv.crop_type = p_crop_type 
        AND cv.is_active = true
    ORDER BY cv.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar variedades de cultivos comunes
INSERT INTO public.crop_varieties (crop_type, name, scientific_name, description, characteristics, maturation_months, productive_years, plants_per_hectare, harvest_seasons) VALUES
-- Variedades de Café
('coffee', 'Caturra', 'Coffea arabica var. Caturra', 'Variedad de porte bajo, muy productiva y adaptable', '{"yield_per_plant": "1.5-2.5", "disease_resistance": "medium", "altitude_range": "1200-1800"}', 24, 15, 5000, '["october", "november", "december", "january", "february"]'),
('coffee', 'Colombia', 'Coffea arabica var. Colombia', 'Variedad resistente a la roya, desarrollada en Colombia', '{"yield_per_plant": "2.0-3.0", "disease_resistance": "high", "altitude_range": "1200-2000"}', 30, 20, 4500, '["october", "november", "december", "january", "february"]'),
('coffee', 'Castillo', 'Coffea arabica var. Castillo', 'Variedad moderna resistente a roya y CBD', '{"yield_per_plant": "2.5-3.5", "disease_resistance": "very_high", "altitude_range": "1000-2000"}', 24, 18, 4800, '["october", "november", "december", "january", "february"]'),
('coffee', 'Típica', 'Coffea arabica var. Typica', 'Variedad tradicional de excelente calidad de taza', '{"yield_per_plant": "1.0-1.5", "disease_resistance": "low", "altitude_range": "1400-2000"}', 36, 25, 4000, '["october", "november", "december", "january", "february"]'),
('coffee', 'Borbón', 'Coffea arabica var. Bourbon', 'Variedad tradicional de alta calidad', '{"yield_per_plant": "1.5-2.0", "disease_resistance": "medium", "altitude_range": "1200-2000"}', 30, 20, 4200, '["october", "november", "december", "january", "february"]'),
('coffee', 'Geisha', 'Coffea arabica var. Geisha', 'Variedad de especialidad con perfil de taza excepcional', '{"yield_per_plant": "0.8-1.2", "disease_resistance": "medium", "altitude_range": "1500-2000"}', 36, 20, 3500, '["october", "november", "december", "january", "february"]'),
-- Variedades de Cacao
('cacao', 'Trinitario', 'Theobroma cacao var. Trinitario', 'Variedad híbrida de alta calidad y buen rendimiento', '{"yield_per_plant": "1.0-2.0", "disease_resistance": "high", "altitude_range": "400-1000"}', 36, 30, 1000, '["april", "may", "june", "october", "november", "december"]'),
('cacao', 'Criollo', 'Theobroma cacao var. Criollo', 'Variedad nativa de excelente calidad pero baja producción', '{"yield_per_plant": "0.5-1.0", "disease_resistance": "low", "altitude_range": "200-800"}', 48, 25, 800, '["april", "may", "june", "october", "november", "december"]'),
('cacao', 'Forastero', 'Theobroma cacao var. Forastero', 'Variedad resistente y productiva', '{"yield_per_plant": "1.5-2.5", "disease_resistance": "very_high", "altitude_range": "200-600"}', 30, 35, 1200, '["april", "may", "june", "october", "november", "december"]'),
-- Variedades de Aguacate
('avocado', 'Hass', 'Persea americana var. Hass', 'Variedad comercial de piel rugosa y excelente sabor', '{"yield_per_plant": "50-200", "disease_resistance": "medium", "altitude_range": "1800-2600"}', 36, 50, 200, '["march", "april", "may", "june", "july", "august"]'),
('avocado', 'Fuerte', 'Persea americana var. Fuerte', 'Variedad de piel lisa, resistente al frío', '{"yield_per_plant": "80-250", "disease_resistance": "high", "altitude_range": "1500-2400"}', 30, 45, 180, '["november", "december", "january", "february", "march"]'),
('avocado', 'Quindia', 'Persea americana var. Quindia', 'Variedad colombiana adaptada al clima tropical', '{"yield_per_plant": "100-300", "disease_resistance": "high", "altitude_range": "1200-2200"}', 24, 40, 220, '["february", "march", "april", "may", "june"]'),
-- Variedades de Plátano
('plantain', 'Dominico Hartón', 'Musa acuminata x balbisiana', 'Variedad tradicional de cocción, muy popular', '{"yield_per_plant": "15-25", "disease_resistance": "medium", "altitude_range": "0-1500"}', 12, 8, 1600, '["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]'),
('plantain', 'FHIA-21', 'Musa FHIA-21', 'Variedad resistente a Sigatoka negra', '{"yield_per_plant": "20-30", "disease_resistance": "very_high", "altitude_range": "0-1200"}', 10, 6, 1800, '["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]')
ON CONFLICT (crop_type, name) DO NOTHING;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar resumen de tablas creadas
SELECT 
    'Tabla creada: ' || table_name as resultado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- Mensaje de finalización
SELECT 
    'SAV Cloud Database Setup Completed!' as status,
    'Total de tablas principales: ' || count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%';

-- Mostrar estructura de relaciones principales
SELECT 
    'SISTEMA AGRÍCOLA MULTI-CULTIVO COMPLETO:' as info
UNION ALL
SELECT '• Users (usuarios propietarios de fincas agrícolas)'
UNION ALL
SELECT '• Farms (fincas con datos geográficos y técnicos)'
UNION ALL
SELECT '• Plots (lotes/parcelas con diferentes tipos de cultivos)'
UNION ALL
SELECT '• Crop_varieties (variedades de café, cacao, aguacate, plátano, etc.)'
UNION ALL
SELECT '• Plant_inventory (inventario de plantas por lote y variedad)'
UNION ALL
SELECT '• Collaborators (trabajadores asignados a fincas específicas)'
UNION ALL
SELECT '• Activities (actividades realizadas en fincas/lotes específicos)'
UNION ALL
SELECT '• Harvests (cosechas de lotes específicos por variedad y cultivo)'
UNION ALL
SELECT '• Sales (ventas multi-cultivo de cada finca)'
UNION ALL
SELECT '• Purchases (compras/gastos por finca)'
UNION ALL
SELECT '• Farm_settings (configuraciones por finca con precios por cultivo)'
UNION ALL
SELECT '• Inventory_summary (resumen de inventario por finca y cultivo)'
UNION ALL
SELECT ''
UNION ALL
SELECT 'CULTIVOS SOPORTADOS:'
UNION ALL
SELECT '• Café (coffee) - 6 variedades incluidas'
UNION ALL
SELECT '• Cacao (cacao) - 3 variedades incluidas'
UNION ALL
SELECT '• Aguacate (avocado) - 3 variedades incluidas'
UNION ALL
SELECT '• Plátano (plantain) - 2 variedades incluidas'
UNION ALL
SELECT '• Fácilmente extensible para otros cultivos'; 