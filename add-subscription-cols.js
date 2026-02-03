const db = require('./src/database/db');

async function migrate() {
    try {
        console.log('Migrating database for subscription system...');

        // Add subscription columns to users table
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;
        `);

        // Set existing owners' expiry to 7 days from now if null
        await db.query(`
            UPDATE users 
            SET subscription_expires_at = NOW() + INTERVAL '7 days'
            WHERE role = 'owner' AND subscription_expires_at IS NULL;
        `);

        console.log('✅ Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
