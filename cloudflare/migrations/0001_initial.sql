CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  species TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  inventory INTEGER NOT NULL DEFAULT 0,
  light TEXT NOT NULL DEFAULT '',
  watering TEXT NOT NULL DEFAULT '',
  soil TEXT NOT NULL DEFAULT '',
  growing_conditions TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT '',
  humidity TEXT NOT NULL DEFAULT '',
  mature_size TEXT NOT NULL DEFAULT '',
  pet_safety TEXT NOT NULL DEFAULT '',
  care_notes TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  art_variant INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0,1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  announcement TEXT NOT NULL DEFAULT 'online ordering is not open yet. Browse the launch collection and build a cart now.',
  standard_shipping REAL NOT NULL DEFAULT 10,
  free_shipping_threshold REAL NOT NULL DEFAULT 75,
  local_pickup_enabled INTEGER NOT NULL DEFAULT 1 CHECK (local_pickup_enabled IN (0,1)),
  coming_soon INTEGER NOT NULL DEFAULT 1 CHECK (coming_soon IN (0,1)),
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions(expires_at);
