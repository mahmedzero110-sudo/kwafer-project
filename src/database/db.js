const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
} : {
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: isProduction ? { rejectUnauthorized: false } : false
};

// Log a safe message for debugging without leaking credentials
if (isProduction) {
    if (process.env.DATABASE_URL) {
        console.log('Database connecting via DATABASE_URL');
    } else {
        console.log(`Database connecting via individual fields. Host: ${process.env.DB_HOST}`);
    }
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
