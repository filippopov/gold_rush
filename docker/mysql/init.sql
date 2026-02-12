-- Gold Rush - Initial Database Setup
-- This file runs automatically when the MySQL container is first created.

-- The database is already created via MYSQL_DATABASE env var,
-- so we just ensure proper charset and add any initial setup here.

ALTER DATABASE gold_rush CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
