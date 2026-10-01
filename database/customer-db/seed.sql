-- Dummy seed data for customers table
INSERT INTO customers (customer_id, name, address, password, phone_no, created_at)
VALUES 
('cust_demo123', 'John Doe', '123 Farm Lane, Springfield', '$2a$10$dummyhashedpassword', '+919876543210', CURRENT_TIMESTAMP);
