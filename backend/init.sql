CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    victories INT DEFAULT 0,
    defeats INT DEFAULT 0,
    draws INT DEFAULT 0,
    matches INT DEFAULT 0,
    kills_count INT DEFAULT 0,
    deaths_count INT DEFAULT 0,
    time_played INTERVAL DEFAULT '00:00:00'
);
