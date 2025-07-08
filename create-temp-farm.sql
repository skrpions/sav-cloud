-- ============================================
-- SAV CLOUD - CREAR FINCA TEMPORAL
-- Script para crear la finca temporal necesaria para desarrollo
-- ============================================

-- Insertar finca temporal que coincida con DEFAULT_FARM_ID
INSERT INTO public.farms (
    id,
    owner_id,
    name,
    description,
    address,
    municipality,
    department,
    country,
    total_area,
    altitude_min,
    altitude_max,
    latitude,
    longitude,
    established_date,
    certifications,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- DEFAULT_FARM_ID
    (SELECT id FROM public.users WHERE email = 'sksmartinez@gmail.com' LIMIT 1), -- Usar el superadmin como propietario
    'Finca Temporal de Desarrollo',
    'Finca temporal creada para pruebas y desarrollo del sistema SAV Cloud',
    'Ubicación temporal para desarrollo',
    'Medellín',
    'Antioquia',
    'Colombia',
    10.00, -- 10 hectáreas
    1600, -- Altitud mínima
    1800, -- Altitud máxima
    6.2442, -- Latitud aproximada de Medellín
    -75.5812, -- Longitud aproximada de Medellín
    '2024-01-01', -- Fecha de establecimiento
    '{"organic": false, "fair_trade": false, "development_only": true}', -- Certificaciones
    true -- Activa
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Verificar que la finca se creó correctamente
SELECT 
    'Finca temporal creada exitosamente:' as status,
    id,
    name,
    owner_id,
    municipality,
    total_area,
    is_active
FROM public.farms 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar que hay un propietario válido
SELECT 
    CASE 
        WHEN owner_id IS NOT NULL THEN '✅ Finca tiene propietario válido'
        ELSE '❌ Error: Finca sin propietario válido'
    END as owner_check,
    (SELECT email FROM public.users WHERE id = owner_id) as owner_email
FROM public.farms 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

SELECT 
    'INSTRUCCIONES:' as info
UNION ALL
SELECT '1. Esta finca temporal permite el funcionamiento del sistema en desarrollo'
UNION ALL
SELECT '2. ID: 00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT '3. Solo para desarrollo - eliminar en producción'
UNION ALL
SELECT '4. Ahora puedes crear configuraciones, actividades y cosechas'
UNION ALL
SELECT ''
UNION ALL
SELECT 'SIGUIENTE PASO:'
UNION ALL
SELECT 'Intenta crear la configuración nuevamente en la aplicación'; 