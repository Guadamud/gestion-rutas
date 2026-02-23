-- Script de inicialización de rutas predefinidas
-- Ejecutar después de crear la base de datos

INSERT INTO "Ruta" (origen, destino, distancia, "tiempoViaje", descripcion, "createdAt", "updatedAt")
VALUES 
  ('Terminal', 'Guayaquil', 80.0, 120, 'Terminal de Guayaquil - $2.50', NOW(), NOW()),
  ('Terminal', 'Jipijapa', 45.0, 60, 'Terminal de Jipijapa - $1.25', NOW(), NOW()),
  ('24 de Mayo', 'Centro', 25.0, 40, '24 de Mayo - $0.75', NOW(), NOW()),
  ('Noboa', 'Centro', 15.0, 30, 'Noboa - $0.50', NOW(), NOW()),
  ('Paján', 'Noboa', 20.0, 35, 'Paján - Noboa - $0.75', NOW(), NOW()),
  ('Interprovincial', 'Varios', 100.0, 150, 'Interprovinciales - $3.00', NOW(), NOW()),
  ('Intracantonal', 'Varios', 30.0, 45, 'Intracantonales - $1.00', NOW(), NOW()),
  ('Otros', 'Lugares', 50.0, 70, 'Otros Lugares - $1.50', NOW(), NOW())
ON CONFLICT DO NOTHING;
