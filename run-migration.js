require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/database/db'); // Adjust path as needed based on your project structure

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'add-subscription-fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await db.query(sql);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
