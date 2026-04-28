export class VentaModel {
    /**
     * Helper temporal para manejar la base de datos de Ventas en LocalStorage
     */
    static getLocalDB() {
        const db = localStorage.getItem('optica_ventas');
        return db ? JSON.parse(db) : [];
    }

    static saveLocalDB(data) {
        localStorage.setItem('optica_ventas', JSON.stringify(data));
    }

    /**
     * Obtiene todas las ventas
     */
    static async getAll() {
        let data = this.getLocalDB();
        // Ordenar por fecha descendente o código
        data.sort((a, b) => b.codigo_venta.localeCompare(a.codigo_venta));
        return data;
    }

    /**
     * Genera automáticamente el próximo código de venta
     */
    static async getNextCode() {
        let data = this.getLocalDB();
        if (data.length === 0) return 'V-001';
        
        let maxCode = 0;
        data.forEach(v => {
            const numPart = v.codigo_venta.replace('V-', '');
            const num = parseInt(numPart);
            if (!isNaN(num) && num > maxCode) {
                maxCode = num;
            }
        });
        
        return 'V-' + (maxCode + 1).toString().padStart(3, '0');
    }

    /**
     * Registra una nueva venta
     */
    static async create(venta) {
        let data = this.getLocalDB();
        const newVenta = {
            id: Date.now().toString(),
            codigo_venta: venta.codigo_venta,
            nombre_cliente: venta.nombre_cliente,
            fecha: venta.fecha,
            datos_compra: venta.datos_compra, // string concatenado de montura + lunas
            monto_total: venta.monto_total,
            estado: 'CANCELADO', // Por defecto para esta iteración
            modalidad_pago: venta.modalidad_pago,
            montura_id: venta.montura_id
        };
        data.push(newVenta);
        this.saveLocalDB(data);
    }
    
    /**
     * Actualiza una venta existente
     */
    static async update(id, venta) {
        let data = this.getLocalDB();
        const index = data.findIndex(v => v.id === id);
        if (index !== -1) {
            data[index] = {
                ...data[index],
                codigo_venta: venta.codigo_venta,
                nombre_cliente: venta.nombre_cliente,
                fecha: venta.fecha,
                datos_compra: venta.datos_compra,
                monto_total: venta.monto_total,
                modalidad_pago: venta.modalidad_pago,
                montura_id: venta.montura_id
            };
            this.saveLocalDB(data);
        }
    }
    
    /**
     * Elimina una venta
     */
    static async delete(id) {
        let data = this.getLocalDB();
        data = data.filter(v => v.id !== id);
        this.saveLocalDB(data);
    }
}
