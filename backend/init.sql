CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    authProvider VARCHAR(50) DEFAULT 'local'
);

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    matches INT DEFAULT 0,
    kills_count INT DEFAULT 0,
    deaths_count INT DEFAULT 0,
    time_played INTERVAL DEFAULT '00:00:00'
);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID REFERENCES users(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES users(id) ON DELETE SET NULL,
    player3_id UUID REFERENCES users(id) ON DELETE SET NULL,
    player4_id UUID REFERENCES users(id) ON DELETE SET NULL,
    player1_kills INT DEFAULT 0,
    player2_kills INT DEFAULT 0,
    player3_kills INT DEFAULT 0,
    player4_kills INT DEFAULT 0,
    player1_deaths INT DEFAULT 0,
    player2_deaths INT DEFAULT 0,
    player3_deaths INT DEFAULT 0,
    player4_deaths INT DEFAULT 0,
    match_time INTERVAL DEFAULT '00:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);