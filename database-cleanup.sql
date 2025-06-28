-- =============================================
-- SAV CLOUD DATABASE CLEANUP SCRIPT
-- ELIMINA COMPLETAMENTE TODA LA BASE DE DATOS
-- =============================================

-- ADVERTENCIA: Este script eliminará TODOS los datos y estructuras
-- Úsalo solo si quieres empezar completamente desde cero
-- NO HAY FORMA DE RECUPERAR LOS DATOS DESPUÉS DE EJECUTAR ESTO

-- =============================================
-- ELIMINAR POLÍTICAS RLS
-- =============================================

-- Eliminar políticas simplificadas
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.collaborators;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.activities;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.harvests;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sale_harvest_details;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.purchases;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.settings;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.inventory_summary;

-- =============================================
-- ELIMINAR TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_collaborators_updated_at ON public.collaborators;
DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
DROP TRIGGER IF EXISTS update_harvests_updated_at ON public.harvests;
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
DROP TRIGGER IF EXISTS update_inventory_summary_updated_at ON public.inventory_summary;

-- =============================================
-- ELIMINAR FUNCIONES
-- =============================================

DROP FUNCTION IF EXISTS calculate_activity_cost(activity_type, contract_type, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS calculate_harvest_payment(DECIMAL, quality_grade, INTEGER);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.is_admin();

-- =============================================
-- ELIMINAR TABLAS (en orden correcto para evitar errores de FK)
-- =============================================

-- Eliminar tablas que dependen de otras primero
DROP TABLE IF EXISTS public.sale_harvest_details CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.harvests CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.inventory_summary CASCADE;

-- Eliminar tabla principal de colaboradores
DROP TABLE IF EXISTS public.collaborators CASCADE;

-- Eliminar tabla de configuración
DROP TABLE IF EXISTS public.settings CASCADE;

-- Eliminar tabla de usuarios (mantener auth.users intacta)
DROP TABLE IF EXISTS public.users CASCADE;

-- =============================================
-- ELIMINAR TIPOS ENUM
-- =============================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contract_type CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS quality_grade CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS purchase_type CASCADE;

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

-- Mostrar tablas restantes en el esquema public
SELECT 
  'Tablas restantes en public:' as info,
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Mostrar tipos enum restantes
SELECT 
  'Tipos enum restantes:' as info,
  typname as type_name
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND typtype = 'e'
ORDER BY typname;

-- =============================================
-- SCRIPT COMPLETADO
-- =============================================

SELECT 'SAV CLOUD Database cleanup completed!' as status,
       'Todas las tablas, tipos y políticas han sido eliminadas' as message,
       'Puedes ejecutar database-setup-complete.sql para recrear todo' as next_step; 