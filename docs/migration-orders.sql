-- orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'new',
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_telegram text,
  delivery_type text NOT NULL,
  delivery_address text,
  delivery_city text,
  comment text,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- order_items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  product_article text,
  product_photo text,
  qty int NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0
);

-- indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
