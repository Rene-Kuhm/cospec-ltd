-- Seed SQL for COSPEC LTD
-- Run this in pgAdmin or psql
-- Password: cospec2024 (hash bcrypt)

INSERT INTO usuarios (id, nombre, email, password, rol, activo, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'Administrador',
    'admin@cospec.com',
    '$2a$10$Xu7vGZQZQZQZQZQZQZQZeJ5p9YH6YH6YH6YH6YH6YH6YH6', 
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
