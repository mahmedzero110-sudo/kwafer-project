const db = require('./db');

async function migrate() {
    try {
        console.log('Starting Social Login Migration...');

        // Add google_id and facebook_id
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE,
            ALTER COLUMN password DROP NOT NULL
        `);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
