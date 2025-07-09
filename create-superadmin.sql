-- ============================================
-- SAV CLOUD - CREAR USUARIO SUPERADMIN
-- Script para promover un usuario existente a administrador
-- ============================================

-- IMPORTANTE: Este usuario debe registrarse PRIMERO en la aplicación
-- usando el proceso normal de registro, y DESPUÉS ejecutar este script

-- Verificar que las tablas existan antes de actualizar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe. Ejecuta primero el script database-setup-complete.sql';
    END IF;
END $$;

-- ============================================
-- VERIFICACIÓN INICIAL Y DEPURACIÓN
-- ============================================

-- Mostrar TODOS los usuarios antes de la actualización
SELECT 
    'TODOS LOS USUARIOS EN LA BASE DE DATOS:' as debug_info,
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- Buscar específicamente por email
SELECT 
    'BUSCANDO USUARIO POR EMAIL:' as debug_info,
    id,
    email,
    first_name,
    last_name,
    role,
    phone,
    is_active,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'sksmartinez@gmail.com';

-- ============================================
-- PROMOVER USUARIO A SUPERADMIN
-- ============================================

-- Verificar si el usuario existe (debe haberse registrado ya)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'sksmartinez@gmail.com') THEN
        RAISE EXCEPTION 'El usuario sksmartinez@gmail.com no existe. Debe registrarse primero en la aplicación usando el proceso normal de registro.';
    END IF;
    
    RAISE NOTICE 'Usuario encontrado, procediendo con la actualización...';
END $$;

-- Actualizar el usuario existente con privilegios de admin
UPDATE public.users 
SET 
    first_name = 'Nestor',
    last_name = 'Martínez C.',
    role = 'admin',
    phone = '+57 3105338818',
    is_active = true,
    updated_at = NOW()
WHERE email = 'sksmartinez@gmail.com';

-- Verificar cuántas filas se actualizaron
SELECT 
    'RESULTADO DE LA ACTUALIZACIÓN:' as debug_info,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.users WHERE email = 'sksmartinez@gmail.com' AND first_name = 'Nestor') > 0 
        THEN 'ACTUALIZACIÓN EXITOSA'
        ELSE 'ACTUALIZACIÓN FALLÓ'
    END as status;

-- Mostrar el usuario después de la actualización
SELECT 
    'DATOS DESPUÉS DE LA ACTUALIZACIÓN:' as debug_info,
    id,
    email,
    first_name,
    last_name,
    role,
    phone,
    is_active,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'sksmartinez@gmail.com';

-- ============================================
-- VERIFICACIONES FINALES
-- ============================================

-- Verificar que el usuario tiene permisos de admin
SELECT 
    CASE 
        WHEN role = 'admin' THEN '✅ Usuario tiene permisos de administrador'
        ELSE '❌ Error: Usuario no tiene permisos de administrador - Rol actual: ' || role
    END as admin_check,
    first_name || ' ' || last_name as nombre_completo,
    role as rol_actual,
    id as user_id
FROM public.users 
WHERE email = 'sksmartinez@gmail.com';

-- ============================================
-- FUNCIÓN DE UTILIDAD PARA VERIFICAR ADMIN
-- ============================================

-- Primero eliminar la función si existe para evitar conflictos de tipo
DROP FUNCTION IF EXISTS public.check_user_admin_status(VARCHAR);

-- Función para verificar si un email es admin
CREATE OR REPLACE FUNCTION public.check_user_admin_status(user_email VARCHAR)
RETURNS TABLE(
    email VARCHAR,
    full_name VARCHAR,
    role user_role,
    is_admin BOOLEAN,
    is_active BOOLEAN,
    auth_sync_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email,
        (u.first_name || ' ' || u.last_name)::VARCHAR as full_name,
        u.role,
        (u.role = 'admin')::BOOLEAN as is_admin,
        u.is_active,
        CASE 
            WHEN u.id IS NOT NULL THEN 'Sincronizado correctamente'
            ELSE 'Problema de sincronización'
        END::VARCHAR as auth_sync_status
    FROM public.users u
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Verificar el estado final del admin
SELECT * FROM public.check_user_admin_status('sksmartinez@gmail.com');

-- ============================================
-- INFORMACIÓN ADICIONAL
-- ============================================

SELECT 
    'INSTRUCCIONES IMPORTANTES:' as info
UNION ALL
SELECT '1. VERIFICA que el usuario aparezca como "Nestor Martínez C." y rol "admin"'
UNION ALL
SELECT '2. Si la actualización falló, puede ser por permisos de la base de datos'
UNION ALL
SELECT '3. Si los datos son correctos, REFRESCA LA APLICACIÓN (F5 o Ctrl+R)'
UNION ALL
SELECT '4. O usa el botón "Debug Force Reload" en el sidebar'
UNION ALL
SELECT '5. El cache del navegador puede estar mostrando datos antiguos'
UNION ALL
SELECT ''
UNION ALL
SELECT 'POSIBLES PROBLEMAS:'
UNION ALL
SELECT '• Permisos de escritura en la tabla users'
UNION ALL
SELECT '• Row Level Security (RLS) bloqueando la actualización'
UNION ALL
SELECT '• Usuario no existe con ese email exacto'
UNION ALL
SELECT '• Cache del navegador o sessionStorage'; 