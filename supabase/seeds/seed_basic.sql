-- Basic seed data for local testing
INSERT INTO specialties (name) VALUES ('General Practice') ON CONFLICT DO NOTHING;
INSERT INTO specialties (name) VALUES ('Cardiology') ON CONFLICT DO NOTHING;

-- Insert an admin user (password should be a bcrypt hash in production; for demo we store plain text and functions should adapt)
INSERT INTO users (username, email, password, role) VALUES ('admin','admin@example.com','Password123!','admin') ON CONFLICT DO NOTHING;

-- Sample doctor and link to user
INSERT INTO users (id, username, email, password, role) VALUES (gen_random_uuid(), 'dr.alice','alice@example.com','Password123!','doctor') ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, name, specialty) SELECT id, 'Dr. Alice', 'General Practice' FROM users WHERE email='alice@example.com' ON CONFLICT DO NOTHING;
