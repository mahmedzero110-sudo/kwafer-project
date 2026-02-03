const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function resetDatabase() {
    try {
        console.log('Reading clean_schema.sql...');
        const schemaPath = path.join(__dirname, 'clean_schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing reset script...');
        await pool.query(sql);

        console.log('Database has been reset successfully!');
        console.log('Keep-alive: Admin User (master@kwafer.com) and Categories are preserved.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();
