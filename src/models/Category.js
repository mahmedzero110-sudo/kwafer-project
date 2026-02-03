const db = require('../database/db');

class Category {
    static async getAll() {
        const query = 'SELECT * FROM categories ORDER BY name ASC';
        const { rows } = await db.query(query);
        return rows;
    }

    static async getById(id) {
        const query = 'SELECT * FROM categories WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = Category;
