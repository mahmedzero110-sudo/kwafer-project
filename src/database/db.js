const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

let poolConfig;

if (isProduction) {
    if (!process.env.DATABASE_URL) {
        console.error('CRITICAL: DATABASE_URL is missing!');
    } else {
        // Log a masked version of the URL to see what Vercel is actually receiving
        const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
        console.log('Database URL detected:', maskedUrl);
    }

    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    };
} else {
    poolConfig = {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'kwafer',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
        ssl: false
    };
}

const pool = new Pool(poolConfig);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
