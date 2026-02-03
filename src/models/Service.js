const db = require('../database/db');

class Service {
    // Get all services for a salon
    static async getBySalonId(salonId) {
        const query = 'SELECT * FROM services WHERE salon_id = $1 AND is_active = TRUE ORDER BY created_at DESC';
        const result = await db.query(query, [salonId]);
        return result.rows;
    }

    // Get service by ID
    static async getById(id) {
        const query = 'SELECT * FROM services WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    // Create new service
    static async create(serviceData) {
        const { salon_id, name, description, price, duration, icon, image_url } = serviceData;
        const query = `
            INSERT INTO services (salon_id, name, description, price, duration, icon, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await db.query(query, [salon_id, name, description, price, duration, icon, image_url]);
        return result.rows[0];
    }

    // Update service
    static async update(id, serviceData) {
        const { name, description, price, duration, icon, image_url } = serviceData;
        const query = `
            UPDATE services 
            SET name = COALESCE($1, name), 
                description = COALESCE($2, description), 
                price = COALESCE($3, price), 
                duration = COALESCE($4, duration), 
                icon = COALESCE($5, icon), 
                image_url = COALESCE($6, image_url), 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `;
        const result = await db.query(query, [name || null, description || null, price || null, duration || null, icon || null, image_url || null, id]);
        return result.rows[0];
    }

    // Delete service (soft delete)
    static async delete(id) {
        const query = 'UPDATE services SET is_active = FALSE WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = Service;
