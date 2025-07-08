-- ============================================
-- SAV CLOUD - CREAR USUARIO SUPERADMIN
-- Script para crear el usuario administrador principal
-- ============================================

-- Verificar que las tablas existan antes de insertar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe. Ejecuta primero el script database-setup-complete.sql';
    END IF;
END $$;

-- ============================================
-- INSERTAR USUARIO SUPERADMIN
-- ============================================

-- Insertar el usuario superadmin Nestor
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    phone,
    is_active,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'sksmartinez@gmail.com',
    'Nestor',
    'Martínez C.',
    'admin',
    '+57 3105338818',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar el usuario creado
SELECT 
    'Usuario Superadmin creado exitosamente:' as status,
    id,
    email,
    first_name || ' ' || last_name as full_name,
    role,
    phone,
    is_active,
    created_at
FROM public.users 
WHERE email = 'nestor.admin@savcloud.com';

-- Verificar que el usuario tiene permisos de admin
SELECT 
    CASE 
        WHEN role = 'admin' THEN '✅ Usuario tiene permisos de administrador'
        ELSE '❌ Error: Usuario no tiene permisos de administrador'
    END as admin_check
FROM public.users 
WHERE email = 'nestor.admin@savcloud.com';

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

SELECT 
    'INSTRUCCIONES IMPORTANTES:' as info
UNION ALL
SELECT '1. Este usuario puede acceder a todas las funciones del sistema'
UNION ALL
SELECT '2. Email: nestor.admin@savcloud.com'
UNION ALL
SELECT '3. Configurar la contraseña en Supabase Auth Dashboard'
UNION ALL
SELECT '4. El usuario se creará automáticamente en auth.users al hacer login'
UNION ALL
SELECT '5. Mantener este email seguro y privado'
UNION ALL
SELECT ''
UNION ALL
SELECT 'PASOS SIGUIENTES:'
UNION ALL
SELECT '1. Ir a Supabase Dashboard > Authentication > Users'
UNION ALL
SELECT '2. Hacer clic en "Invite user" o "Add user"'
UNION ALL
SELECT '3. Usar email: nestor.admin@savcloud.com'
UNION ALL
SELECT '4. Establecer contraseña segura'
UNION ALL
SELECT '5. El usuario podrá hacer login inmediatamente';

-- ============================================
-- FUNCIÓN DE UTILIDAD PARA VERIFICAR ADMIN
-- ============================================

-- Función para verificar si un email es admin
CREATE OR REPLACE FUNCTION public.check_user_admin_status(user_email VARCHAR)
RETURNS TABLE(
    email VARCHAR,
    full_name VARCHAR,
    role user_role,
    is_admin BOOLEAN,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email,
        (u.first_name || ' ' || u.last_name)::VARCHAR as full_name,
        u.role,
        (u.role = 'admin')::BOOLEAN as is_admin,
        u.is_active
    FROM public.users u
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Verificar el estado del admin recién creado
SELECT * FROM public.check_user_admin_status('sksmartinez@gmail.com'); 