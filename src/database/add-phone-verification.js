const db = require('./db');

async function migrate() {
    try {
        console.log('Starting Phone Verification Migration...');

        // Add phone verification columns
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS phone_verification_code VARCHAR(10),
            ADD COLUMN IF NOT EXISTS phone_verification_expires TIMESTAMP
        `);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
