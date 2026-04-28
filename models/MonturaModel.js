// export { supabase } from './supabaseClient.js'; // Comentado temporalmente

export class MonturaModel {
    /**
     * Helper temporal para manejar la base de datos en LocalStorage
     */
    static getLocalDB() {
        const db = localStorage.getItem('optica_monturas');
        return db ? JSON.parse(db) : [];
    }

    static saveLocalDB(data) {
        localStorage.setItem('optica_monturas', JSON.stringify(data));
    }

    /**
     * Obtiene todas las monturas ordenadas por código
     */
    static async getAll() {
        let data = this.getLocalDB();
        data.sort((a, b) => a.codigo.localeCompare(b.codigo));
        return data;
    }

    /**
     * Genera automáticamente el próximo código de montura
     */
    static async getNextCode() {
        let data = this.getLocalDB();
        if (data.length === 0) return '001';
        
        let maxCode = 0;
        data.forEach(m => {
            const num = parseInt(m.codigo);
            if (!isNaN(num) && num > maxCode) {
                maxCode = num;
            }
        });
        
        return (maxCode + 1).toString().padStart(3, '0');
    }

    /**
     * Crea una nueva montura
     */
    static async create(montura) {
        let data = this.getLocalDB();
        // Generar un ID temporal para local
        const newMontura = {
            id: Date.now().toString(),
            codigo: montura.codigo,
            nombre: montura.nombre,
            stock_total: montura.stock_total,
            stock_disponible: montura.stock_disponible,
            precio_venta: montura.precio_venta
        };
        data.push(newMontura);
        this.saveLocalDB(data);
    }

    /**
     * Actualiza una montura existente
     */
    static async update(id, montura) {
        let data = this.getLocalDB();
        const index = data.findIndex(m => m.id === id);
        if (index !== -1) {
            data[index] = {
                ...data[index],
                codigo: montura.codigo,
                nombre: montura.nombre,
                stock_total: montura.stock_total,
                stock_disponible: montura.stock_disponible,
                precio_venta: montura.precio_venta
            };
            this.saveLocalDB(data);
        }
    }

    /**
     * Elimina una montura
     */
    static async delete(id) {
        let data = this.getLocalDB();
        data = data.filter(m => m.id !== id);
        this.saveLocalDB(data);
    }
}
