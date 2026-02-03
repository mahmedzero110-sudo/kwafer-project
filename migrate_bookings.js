const db = require('./src/database/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        await db.query(`
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visible_to_customer BOOLEAN DEFAULT TRUE;
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visible_to_salon BOOLEAN DEFAULT TRUE;
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visible_to_admin BOOLEAN DEFAULT TRUE;
        `);
        console.log('Migration successful: Columns added to bookings table.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
