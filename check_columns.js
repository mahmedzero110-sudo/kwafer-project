const db = require('./src/database/db');

async function checkColumns() {
    try {
        const query = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'salons';
        `;

        const { rows } = await db.query(query);
        console.log('Columns in salons table:', rows.map(r => r.column_name));
    } catch (error) {
        console.error('Error checking columns:', error);
    } finally {
        process.exit();
    }
}

checkColumns();
