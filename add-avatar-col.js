const db = require('./src/database/db');

async function addAvatarColumn() {
    try {
        console.log('Adding avatar column to users table...');
        await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT NULL');
        console.log('Column added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error);
        process.exit(1);
    }
}

addAvatarColumn();
