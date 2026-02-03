const db = require('../database/db');

class Salon {
    static async getAllActive() {
        const query = 'SELECT * FROM salons WHERE is_active = TRUE ORDER BY is_featured DESC, rating DESC';
        const { rows } = await db.query(query);
        return rows;
    }

    static async getById(id) {
        const query = 'SELECT * FROM salons WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async getByOwnerId(ownerId) {
        const query = 'SELECT * FROM salons WHERE owner_id = $1';
        const { rows } = await db.query(query, [ownerId]);
        return rows[0];
    }

    static async updateRating(id) {
        const query = `
            UPDATE salons 
            SET rating = (SELECT AVG(rating) FROM reviews WHERE salon_id = $1)
            WHERE id = $1
        `;
        await db.query(query, [id]);
    }

    static async search(term) {
        const query = `
            SELECT * FROM salons 
            WHERE is_active = TRUE AND (name ILIKE $1 OR description ILIKE $1 OR location ILIKE $1)
            ORDER BY rating DESC
        `;
        const { rows } = await db.query(query, [`%${term}%`]);
        return rows;
    }

    static async getAllForAdmin() {
        const query = `
            SELECT s.*, u.name as owner_name 
            FROM salons s
            LEFT JOIN users u ON s.owner_id = u.id
            ORDER BY s.created_at DESC
        `;
        const { rows } = await db.query(query);
        return rows;
    }

    static async update(id, data) {
        const {
            name, description, location, phone, email, image_url,
            bridal_title, bridal_desc, bridal_discount, bridal_price,
            bridal_services, booking_policy, price_start_manual, google_maps_url,
            working_hours
        } = data;

        const query = `
            UPDATE salons 
            SET name = COALESCE($1, name), 
                description = COALESCE($2, description), 
                location = COALESCE($3, location), 
                phone = COALESCE($4, phone), 
                email = COALESCE($5, email), 
                image_url = COALESCE($6, image_url), 
                bridal_title = COALESCE($7, bridal_title),
                bridal_desc = COALESCE($8, bridal_desc),
                bridal_discount = COALESCE($9, bridal_discount),
                bridal_price = COALESCE($10, bridal_price),
                bridal_services = COALESCE($11, bridal_services),
                booking_policy = COALESCE($12, booking_policy),
                price_start_manual = COALESCE($13, price_start_manual),
                google_maps_url = COALESCE($14, google_maps_url),
                working_hours = COALESCE($15, working_hours),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $16
            RETURNING *
        `;
        const { rows } = await db.query(query, [
            name || null,
            description || null,
            location || null,
            phone || null,
            email || null,
            image_url || null,
            bridal_title || null,
            bridal_desc || null,
            bridal_discount !== undefined ? parseFloat(bridal_discount) : null,
            bridal_price !== undefined ? parseFloat(bridal_price) : null,
            bridal_services || null,
            booking_policy || null,
            price_start_manual !== undefined ? parseFloat(price_start_manual) : null,
            google_maps_url || null,
            working_hours || null,
            id
        ]);
        return rows[0];
    }

    static async toggleStatus(id) {
        const query = 'UPDATE salons SET is_active = NOT is_active WHERE id = $1 RETURNING *';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async toggleFeatured(id) {
        const query = 'UPDATE salons SET is_featured = NOT is_featured WHERE id = $1 RETURNING *';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async search({ query, category_id, sort, bridal }) {
        let sql = `
            SELECT s.*, c.name as category_name 
            FROM salons s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.is_active = true
        `;
        const params = [];

        if (query) {
            params.push(`%${query}%`);
            sql += ` AND (s.name ILIKE $${params.length} OR s.description ILIKE $${params.length} OR s.location ILIKE $${params.length})`;
        }

        if (category_id && category_id !== 'all') {
            params.push(category_id);
            sql += ` AND s.category_id = $${params.length}`;
        }

        if (bridal) {
            sql += ` AND s.bridal_title IS NOT NULL AND s.bridal_title != ''`;
        }

        // Sorting Logic
        switch (sort) {
            case 'rating':
                sql += ' ORDER BY s.rating DESC';
                break;
            case 'newest':
                sql += ' ORDER BY s.created_at DESC';
                break;
            case 'price_low':
                sql += ' ORDER BY s.price_start ASC';
                break;
            default:
                sql += ' ORDER BY s.is_featured DESC, s.rating DESC';
        }

        const { rows } = await db.query(sql, params);
        return rows;
    }

    static async delete(id) {
        const query = 'DELETE FROM salons WHERE id = $1 RETURNING *';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = Salon;
