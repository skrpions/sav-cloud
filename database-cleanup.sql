-- ============================================
-- SAV CLOUD - SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- Elimina todas las tablas, funciones, triggers y tipos
-- ============================================

-- Eliminar triggers primero
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;
DROP TRIGGER IF EXISTS update_banking_info_updated_at ON public.banking_info CASCADE;
DROP TRIGGER IF EXISTS update_coffee_varieties_updated_at ON public.coffee_varieties CASCADE;
DROP TRIGGER IF EXISTS update_farms_updated_at ON public.farms CASCADE;
DROP TRIGGER IF EXISTS update_plots_updated_at ON public.plots CASCADE;
DROP TRIGGER IF EXISTS update_plant_inventory_updated_at ON public.plant_inventory CASCADE;
DROP TRIGGER IF EXISTS update_collaborators_updated_at ON public.collaborators CASCADE;
DROP TRIGGER IF EXISTS update_farm_settings_updated_at ON public.farm_settings CASCADE;
DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities CASCADE;
DROP TRIGGER IF EXISTS update_harvests_updated_at ON public.harvests CASCADE;
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales CASCADE;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases CASCADE;
DROP TRIGGER IF EXISTS update_inventory_summary_updated_at ON public.inventory_summary CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_farm_owner(UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_activity_cost(
    p_days DECIMAL,
    p_payment_type contract_type,
    p_rate_per_day DECIMAL,
    p_farm_id UUID
) CASCADE;
DROP FUNCTION IF EXISTS get_farm_production_stats(
    p_farm_id UUID,
    p_start_date DATE,
    p_end_date DATE
) CASCADE;

-- Eliminar tablas en orden inverso de dependencias (desde las más dependientes hacia las principales)
DROP TABLE IF EXISTS public.sale_harvest_details CASCADE;
DROP TABLE IF EXISTS public.inventory_summary CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.harvests CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.farm_settings CASCADE;
DROP TABLE IF EXISTS public.collaborators CASCADE;
DROP TABLE IF EXISTS public.plant_inventory CASCADE;
DROP TABLE IF EXISTS public.plots CASCADE;
DROP TABLE IF EXISTS public.farms CASCADE;
DROP TABLE IF EXISTS public.coffee_varieties CASCADE;
DROP TABLE IF EXISTS public.banking_info CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Eliminar tablas legacy si existen (compatibilidad con estructura anterior)
DROP TABLE IF EXISTS public.settings CASCADE;

-- Eliminar tipos personalizados
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

-- Eliminar vistas si existen
DROP VIEW IF EXISTS public.farm_summary_view CASCADE;
DROP VIEW IF EXISTS public.production_stats_view CASCADE;
DROP VIEW IF EXISTS public.collaborator_performance_view CASCADE;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente.' as mensaje
UNION ALL
SELECT 'Todas las tablas, funciones, triggers, tipos y vistas han sido eliminados.' as info
UNION ALL
SELECT 'La base de datos está lista para una nueva instalación.' as status; 