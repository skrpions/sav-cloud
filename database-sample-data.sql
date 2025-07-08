-- ============================================
-- SAV CLOUD - DATOS DE EJEMPLO
-- Script para insertar datos de prueba del sistema multi-finca
-- ============================================

-- ============================================
-- USUARIOS DE EJEMPLO
-- ============================================

-- Insertar usuarios propietarios de fincas
INSERT INTO public.users (id, email, first_name, last_name, role, phone) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'carlos.martinez@email.com', 'Carlos', 'Martínez', 'farm_owner', '+57 311 123 4567'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'maria.rodriguez@email.com', 'María', 'Rodríguez', 'farm_owner', '+57 312 234 5678'),
('c3d4e5f6-g7h8-9012-cdef-345678901234', 'juan.perez@email.com', 'Juan', 'Pérez', 'farm_manager', '+57 313 345 6789'),
('d4e5f6g7-h8i9-0123-def0-456789012345', 'ana.lopez@email.com', 'Ana', 'López', 'admin', '+57 314 456 7890')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FINCAS DE EJEMPLO
-- ============================================

-- Finca 1: Finca El Paraíso (Carlos Martínez)
INSERT INTO public.farms (id, owner_id, name, description, address, municipality, department, total_area, altitude_min, altitude_max, latitude, longitude, established_date, certifications) VALUES
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Finca El Paraíso', 'Finca familiar dedicada al café de especialidad ubicada en las montañas de Antioquia', 'Vereda La Esperanza, Km 15 vía al Cerro', 'Jardín', 'Antioquia', 25.50, 1650, 1850, 5.5986111, -75.8230556, '1985-03-15', '{"organic": true, "fair_trade": true, "rainforest_alliance": false}'),

-- Finca 2: Finca Santa Ana (Carlos Martínez - segunda finca)
('f2b3c4d5-e6f7-8901-bcde-f23456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Finca Santa Ana', 'Finca experimental para variedades de alta calidad', 'Vereda El Silencio, Finca 23', 'Fredonia', 'Antioquia', 18.75, 1700, 1900, 5.9276667, -75.6693333, '2010-08-20', '{"organic": false, "fair_trade": false, "specialty_coffee": true}'),

-- Finca 3: Finca Los Cerezos (María Rodríguez)
('f3c4d5e6-f7g8-9012-cdef-345678901234', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Finca Los Cerezos', 'Finca tecnificada con variedades resistentes y procesos innovadores', 'Corregimiento El Tablazo, Sector 5', 'Andes', 'Antioquia', 32.00, 1550, 1750, 5.6566667, -75.8806667, '1992-11-30', '{"organic": true, "utz_certified": true, "c_cafe_practices": true}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LOTES/PARCELAS DE EJEMPLO
-- ============================================

-- Lotes de Finca El Paraíso
INSERT INTO public.plots (id, farm_id, name, code, area, altitude, slope_percentage, soil_type, irrigation_system, status, planting_date, notes) VALUES
('p1a2b3c4-d5e6-7890-abcd-ef1234567890', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'Lote Alto', 'EP-L01', 8.50, 1800, 25.5, 'Franco arcilloso', 'Goteo', 'active', '2005-04-10', 'Lote con mejor exposición solar'),
('p1b2c3d4-e5f6-7890-abcd-ef1234567891', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'Lote Medio', 'EP-L02', 12.00, 1750, 20.0, 'Franco', 'Aspersión', 'active', '2007-02-15', 'Lote principal de producción'),
('p1c2d3e4-f5g6-7890-abcd-ef1234567892', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'Lote Bajo', 'EP-L03', 5.00, 1650, 15.0, 'Franco arenoso', 'Manual', 'renovation', '2000-01-20', 'En proceso de renovación'),

-- Lotes de Finca Santa Ana
('p2a2b3c4-d5e6-7890-abcd-ef1234567890', 'f2b3c4d5-e6f7-8901-bcde-f23456789012', 'Lote Experimental A', 'SA-LA1', 4.25, 1850, 30.0, 'Franco arcilloso', 'Goteo', 'active', '2015-03-10', 'Variedades experimentales'),
('p2b2c3d4-e5f6-7890-abcd-ef1234567891', 'f2b3c4d5-e6f7-8901-bcde-f23456789012', 'Lote Experimental B', 'SA-LB1', 6.50, 1780, 22.0, 'Franco', 'Goteo', 'active', '2018-05-25', 'Pruebas de densidad de siembra'),
('p2c2d3e4-f5g6-7890-abcd-ef1234567892', 'f2b3c4d5-e6f7-8901-bcde-f23456789012', 'Lote Control', 'SA-LC1', 8.00, 1720, 18.0, 'Franco arenoso', 'Aspersión', 'preparation', '2023-09-01', 'Preparándose para nueva siembra'),

-- Lotes de Finca Los Cerezos
('p3a2b3c4-d5e6-7890-abcd-ef1234567890', 'f3c4d5e6-f7g8-9012-cdef-345678901234', 'Sector Norte', 'LC-N01', 10.00, 1650, 20.0, 'Franco arcilloso', 'Goteo tecnificado', 'active', '2010-06-15', 'Sector con variedades Castillo'),
('p3b2c3d4-e5f6-7890-abcd-ef1234567891', 'f3c4d5e6-f7g8-9012-cdef-345678901234', 'Sector Sur', 'LC-S01', 12.50, 1600, 25.0, 'Franco', 'Goteo tecnificado', 'active', '2012-08-20', 'Mayor producción de la finca'),
('p3c2d3e4-f5g6-7890-abcd-ef1234567892', 'f3c4d5e6-f7g8-9012-cdef-345678901234', 'Sector Oeste', 'LC-O01', 9.50, 1700, 30.0, 'Arcilloso', 'Goteo', 'active', '2008-04-12', 'Variedades tradicionales')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INVENTARIO DE PLANTAS
-- ============================================

-- Obtener IDs de variedades (asumiendo que ya están insertadas desde el script principal)
-- Plantas en Finca El Paraíso
INSERT INTO public.plant_inventory (plot_id, variety_id, plant_count, planted_date, status, notes) VALUES
-- Lote Alto - Caturra
('p1a2b3c4-d5e6-7890-abcd-ef1234567890', (SELECT id FROM coffee_varieties WHERE name = 'Caturra' LIMIT 1), 4250, '2005-04-10', 'productive', 'Plantas de 18 años, muy productivas'),
-- Lote Medio - Colombia
('p1b2c3d4-e5f6-7890-abcd-ef1234567891', (SELECT id FROM coffee_varieties WHERE name = 'Colombia' LIMIT 1), 5400, '2007-02-15', 'productive', 'Plantas en plena producción'),
-- Lote Bajo - en renovación
('p1c2d3e4-f5g6-7890-abcd-ef1234567892', (SELECT id FROM coffee_varieties WHERE name = 'Castillo' LIMIT 1), 800, '2023-11-01', 'seedling', 'Plantas nuevas en renovación'),

-- Plantas en Finca Santa Ana
-- Lote Experimental A - Geisha
('p2a2b3c4-d5e6-7890-abcd-ef1234567890', (SELECT id FROM coffee_varieties WHERE name = 'Geisha' LIMIT 1), 1487, '2015-03-10', 'productive', 'Variedad experimental de alta calidad'),
-- Lote Experimental B - Castillo
('p2b2c3d4-e5f6-7890-abcd-ef1234567891', (SELECT id FROM coffee_varieties WHERE name = 'Castillo' LIMIT 1), 3120, '2018-05-25', 'productive', 'Prueba de alta densidad'),

-- Plantas en Finca Los Cerezos
-- Sector Norte - Castillo
('p3a2b3c4-d5e6-7890-abcd-ef1234567890', (SELECT id FROM coffee_varieties WHERE name = 'Castillo' LIMIT 1), 4800, '2010-06-15', 'productive', 'Variedad resistente muy estable'),
-- Sector Sur - Colombia
('p3b2c3d4-e5f6-7890-abcd-ef1234567891', (SELECT id FROM coffee_varieties WHERE name = 'Colombia' LIMIT 1), 5625, '2012-08-20', 'productive', 'Mayor sector productivo'),
-- Sector Oeste - Típica
('p3c2d3e4-f5g6-7890-abcd-ef1234567892', (SELECT id FROM coffee_varieties WHERE name = 'Típica' LIMIT 1), 3800, '2008-04-12', 'declining', 'Plantas viejas, considerar renovación')
ON CONFLICT DO NOTHING;

-- ============================================
-- INFORMACIÓN BANCARIA DE EJEMPLO
-- ============================================

INSERT INTO public.banking_info (id, bank, product_type, account_number, use_phone_number) VALUES
('b1a2b3c4-d5e6-7890-abcd-ef1234567890', 'bancolombia', 'ahorros', '12345678901', false),
('b2b3c4d5-e6f7-8901-bcde-f23456789012', 'nequi', 'ahorros', '3112345678', true),
('b3c4d5e6-f7g8-9012-cdef-345678901234', 'banco_bogota', 'corriente', '98765432109', false),
('b4d5e6f7-g8h9-0123-def0-456789012345', 'daviplata', 'ahorros', '3134567890', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COLABORADORES DE EJEMPLO
-- ============================================

-- Colaboradores de Finca El Paraíso
INSERT INTO public.collaborators (id, farm_id, first_name, last_name, identification, email, phone, address, birth_date, hire_date, contract_type, emergency_contact_name, emergency_contact_phone, banking_info_id, specializations) VALUES
('c1a2b3c4-d5e6-7890-abcd-ef1234567890', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'Pedro', 'Gonzalez', '12345678', 'pedro.gonzalez@email.com', '+57 315 111 2222', 'Vereda La Esperanza, Casa 5', '1980-05-15', '2010-03-01', 'libre', 'Rosa González', '+57 315 111 2223', 'b1a2b3c4-d5e6-7890-abcd-ef1234567890', '{"fertilization": true, "pruning": true, "harvesting": true}'),
('c1b2c3d4-e5f6-7890-abcd-ef1234567891', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'Luis', 'Ramírez', '23456789', 'luis.ramirez@email.com', '+57 316 222 3333', 'Vereda La Esperanza, Casa 12', '1985-08-20', '2015-06-15', 'grabado', 'Carmen Ramírez', '+57 316 222 3334', 'b2b3c4d5-e6f7-8901-bcde-f23456789012', '{"fumigation": true, "pest_control": true, "maintenance": true}'),

-- Colaboradores de Finca Santa Ana
('c2a2b3c4-d5e6-7890-abcd-ef1234567890', 'f2b3c4d5-e6f7-8901-bcde-f23456789012', 'Roberto', 'Muñoz', '34567890', 'roberto.munoz@email.com', '+57 317 333 4444', 'Vereda El Silencio, Casa 3', '1975-12-10', '2012-01-20', 'libre', 'Elena Muñoz', '+57 317 333 4445', 'b3c4d5e6-f7g8-9012-cdef-345678901234', '{"planting": true, "soil_preparation": true, "irrigation": true}'),

-- Colaboradores de Finca Los Cerezos
('c3a2b3c4-d5e6-7890-abcd-ef1234567890', 'f3c4d5e6-f7g8-9012-cdef-345678901234', 'José', 'Vargas', '45678901', 'jose.vargas@email.com', '+57 318 444 5555', 'Corregimiento El Tablazo, Casa 8', '1978-03-25', '2008-09-10', 'libre', 'María Vargas', '+57 318 444 5556', 'b4d5e6f7-g8h9-0123-def0-456789012345', '{"harvesting": true, "quality_control": true, "post_harvest": true}'),
('c3b2c3d4-e5f6-7890-abcd-ef1234567891', 'f3c4d5e6-f7g8-9012-cdef-345678901234', 'Miguel', 'Torres', '56789012', 'miguel.torres@email.com', '+57 319 555 6666', 'Corregimiento El Tablazo, Casa 15', '1982-07-18', '2013-04-05', 'grabado', 'Laura Torres', '+57 319 555 6667', NULL, '{"fertilization": true, "weeding": true, "pruning": true}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CONFIGURACIONES POR FINCA
-- ============================================

-- Configuraciones para Finca El Paraíso (2024)
INSERT INTO public.farm_settings (farm_id, year, currency, harvest_price_per_kg, daily_rate_libre, daily_rate_grabado, activity_rates, quality_premiums, is_active) VALUES
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 2024, 'COP', 2800.00, 38000.00, 48000.00, 
 '{"fertilization": 42000, "fumigation": 45000, "pruning": 40000, "weeding": 35000, "planting": 50000, "maintenance": 38000}',
 '{"premium": 800, "standard": 0, "low": -300}', true),

-- Configuraciones para Finca Santa Ana (2024)
('f2b3c4d5-e6f7-8901-bcde-f23456789012', 2024, 'COP', 3200.00, 40000.00, 50000.00, 
 '{"fertilization": 45000, "fumigation": 48000, "pruning": 42000, "weeding": 38000, "planting": 55000, "maintenance": 40000}',
 '{"premium": 1200, "standard": 0, "low": -400}', true),

-- Configuraciones para Finca Los Cerezos (2024)
('f3c4d5e6-f7g8-9012-cdef-345678901234', 2024, 'COP', 2900.00, 39000.00, 49000.00, 
 '{"fertilization": 43000, "fumigation": 46000, "pruning": 41000, "weeding": 36000, "planting": 52000, "maintenance": 39000}',
 '{"premium": 900, "standard": 0, "low": -350}', true)
ON CONFLICT (farm_id, year) WHERE is_active = true DO NOTHING;

-- ============================================
-- ACTIVIDADES DE EJEMPLO (ÚLTIMOS 3 MESES)
-- ============================================

-- Actividades en Finca El Paraíso
INSERT INTO public.activities (farm_id, collaborator_id, plot_id, type, date, days, payment_type, rate_per_day, total_cost, area_worked, weather_conditions, quality_rating, notes) VALUES
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'c1a2b3c4-d5e6-7890-abcd-ef1234567890', 'p1a2b3c4-d5e6-7890-abcd-ef1234567890', 'fertilization', '2024-10-15', 2.0, 'libre', 42000, 84000, 8.5, 'Soleado', 4, 'Aplicación de fertilizante orgánico'),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'c1b2c3d4-e5f6-7890-abcd-ef1234567891', 'p1b2c3d4-e5f6-7890-abcd-ef1234567891', 'pruning', '2024-11-20', 3.0, 'grabado', 40000, 120000, 12.0, 'Nublado', 5, 'Poda sanitaria muy bien ejecutada'),

-- Actividades en Finca Santa Ana
('f2b3c4d5-e6f7-8901-bcde-f23456789012', 'c2a2b3c4-d5e6-7890-abcd-ef1234567890', 'p2a2b3c4-d5e6-7890-abcd-ef1234567890', 'weeding', '2024-11-05', 1.5, 'libre', 38000, 57000, 4.25, 'Parcialmente nublado', 4, 'Control de malezas en lote experimental'),

-- Actividades en Finca Los Cerezos
('f3c4d5e6-f7g8-9012-cdef-345678901234', 'c3a2b3c4-d5e6-7890-abcd-ef1234567890', 'p3b2c3d4-e5f6-7890-abcd-ef1234567891', 'harvesting', '2024-12-01', 1.0, 'libre', 39000, 39000, 5.0, 'Soleado', 5, 'Cosecha selectiva de café maduro'),
('f3c4d5e6-f7g8-9012-cdef-345678901234', 'c3b2c3d4-e5f6-7890-abcd-ef1234567891', 'p3a2b3c4-d5e6-7890-abcd-ef1234567890', 'fumigation', '2024-11-25', 0.5, 'grabado', 46000, 23000, 10.0, 'Seco', 4, 'Control preventivo de broca')
ON CONFLICT DO NOTHING;

-- ============================================
-- COSECHAS DE EJEMPLO
-- ============================================

-- Cosechas de Finca El Paraíso
INSERT INTO public.harvests (farm_id, collaborator_id, plot_id, variety_id, date, kilograms, quality_grade, humidity_percentage, price_per_kg, total_payment, weather_conditions, processing_method, notes) VALUES
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'c1a2b3c4-d5e6-7890-abcd-ef1234567890', 'p1a2b3c4-d5e6-7890-abcd-ef1234567890', (SELECT id FROM coffee_varieties WHERE name = 'Caturra' LIMIT 1), '2024-11-15', 125.5, 'premium', 12.5, 3600, 451800, 'Soleado', 'Lavado', 'Excelente calidad de cereza'),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'c1b2c3d4-e5f6-7890-abcd-ef1234567891', 'p1b2c3d4-e5f6-7890-abcd-ef1234567891', (SELECT id FROM coffee_varieties WHERE name = 'Colombia' LIMIT 1), '2024-12-02', 180.0, 'standard', 14.0, 2800, 504000, 'Parcialmente nublado', 'Lavado', 'Cosecha del lote principal'),

-- Cosechas de Finca Santa Ana (Geisha premium)
('f2b3c4d5-e6f7-8901-bcde-f23456789012', 'c2a2b3c4-d5e6-7890-abcd-ef1234567890', 'p2a2b3c4-d5e6-7890-abcd-ef1234567890', (SELECT id FROM coffee_varieties WHERE name = 'Geisha' LIMIT 1), '2024-11-28', 45.2, 'premium', 11.8, 4400, 198880, 'Soleado', 'Natural', 'Variedad experimental, perfil excepcional'),

-- Cosechas de Finca Los Cerezos
('f3c4d5e6-f7g8-9012-cdef-345678901234', 'c3a2b3c4-d5e6-7890-abcd-ef1234567890', 'p3b2c3d4-e5f6-7890-abcd-ef1234567891', (SELECT id FROM coffee_varieties WHERE name = 'Colombia' LIMIT 1), '2024-12-01', 220.8, 'standard', 13.2, 2900, 640320, 'Soleado', 'Lavado', 'Cosecha principal del sector sur'),
('f3c4d5e6-f7g8-9012-cdef-345678901234', 'c3b2c3d4-e5f6-7890-abcd-ef1234567891', 'p3a2b3c4-d5e6-7890-abcd-ef1234567890', (SELECT id FROM coffee_varieties WHERE name = 'Castillo' LIMIT 1), '2024-11-18', 165.3, 'premium', 12.0, 3800, 628140, 'Seco', 'Honey', 'Proceso especial para mercado de especialidad')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPRAS DE EJEMPLO
-- ============================================

-- Compras para Finca El Paraíso
INSERT INTO public.purchases (farm_id, type, date, supplier_name, description, quantity, unit, unit_price, total_amount, payment_method, invoice_number, notes) VALUES
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'fertilizer', '2024-10-01', 'Agroquímicos del Sur', 'Fertilizante orgánico 10-30-10', 20, 'bultos', 45000, 900000, 'transfer', 'INV-2024-001', 'Para aplicación en lotes alto y medio'),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', 'tools', '2024-11-15', 'Herramientas Cafeteras', 'Tijeras de poda profesionales', 5, 'unidades', 85000, 425000, 'cash', 'INV-2024-045', 'Reposición de herramientas'),

-- Compras para Finca Santa Ana
('f2b3c4d5-e6f7-8901-bcde-f23456789012', 'equipment', '2024-09-20', 'Tecnología Agrícola', 'Sistema de riego por goteo', 1, 'sistema', 2500000, 2500000, 'credit', 'INV-2024-078', 'Instalación en lote experimental B'),

-- Compras para Finca Los Cerezos
('f3c4d5e6-f7g8-9012-cdef-345678901234', 'pesticide', '2024-11-10', 'Control Fitosanitario', 'Fungicida preventivo para roya', 8, 'litros', 95000, 760000, 'transfer', 'INV-2024-123', 'Aplicación preventiva en todos los sectores'),
('f3c4d5e6-f7g8-9012-cdef-345678901234', 'seedlings', '2024-12-05', 'Vivero Montañas Verdes', 'Plántulas de Castillo (Renovación)', 1000, 'plantas', 1200, 1200000, 'cash', 'INV-2024-156', 'Para renovación del sector oeste')
ON CONFLICT DO NOTHING;

-- ============================================
-- VENTAS DE EJEMPLO
-- ============================================

-- Ventas de Finca El Paraíso
INSERT INTO public.sales (farm_id, date, buyer_name, buyer_contact, total_kilograms, price_per_kg, total_amount, quality_grade, payment_method, payment_status, delivery_location, notes) VALUES
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2024-11-20', 'Tostadores Premium Colombia', 'ventas@tostadorespremium.com', 125.5, 4200, 527100, 'premium', 'transfer', 'completed', 'Bodega Medellín', 'Venta de lote especial Caturra'),

-- Ventas de Finca Santa Ana (Geisha premium)
('f2b3c4d5-e6f7-8901-bcde-f23456789012', '2024-12-03', 'Café de Especialidad Internacional', 'compras@especialidad.com', 45.2, 8500, 384200, 'premium', 'transfer', 'pending', 'Puerto de Buenaventura', 'Geisha para exportación'),

-- Ventas de Finca Los Cerezos
('f3c4d5e6-f7g8-9012-cdef-345678901234', '2024-12-05', 'Cooperativa Cafetera Regional', 'comercial@cooperativa.com', 386.1, 3400, 1312740, 'standard', 'check', 'completed', 'Centro de Acopio Regional', 'Venta consolidada de noviembre-diciembre')
ON CONFLICT DO NOTHING;

-- ============================================
-- MENSAJE FINAL
-- ============================================

SELECT 'DATOS DE EJEMPLO INSERTADOS EXITOSAMENTE' as status
UNION ALL
SELECT '✓ 3 Fincas con diferentes características y ubicaciones' as info
UNION ALL
SELECT '✓ 9 Lotes/parcelas distribuidos entre las fincas' as info
UNION ALL  
SELECT '✓ Inventario de plantas con diferentes variedades' as info
UNION ALL
SELECT '✓ 5 Colaboradores con especialidades diferentes' as info
UNION ALL
SELECT '✓ Configuraciones específicas por finca' as info
UNION ALL
SELECT '✓ Actividades, cosechas, compras y ventas de ejemplo' as info
UNION ALL
SELECT '✓ Sistema multi-finca completamente funcional' as info; 