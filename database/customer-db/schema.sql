CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  password TEXT NOT NULL,
  phone_no TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
