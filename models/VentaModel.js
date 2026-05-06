import { supabase } from './supabaseClient.js';

export class VentaModel {
    /**
     * Obtiene todas las ventas
     */
    static async getAll() {
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .order('codigo_venta', { ascending: false });
            
        if (error) throw error;
        return data || [];
    }

    /**
     * Genera automáticamente el próximo código de venta
     */
    static async getNextCode() {
        const data = await this.getAll();
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
        const { error } = await supabase
            .from('ventas')
            .insert([{
                codigo_venta: venta.codigo_venta,
                nombre_cliente: venta.nombre_cliente,
                fecha: venta.fecha,
                datos_compra: venta.datos_compra,
                monto_total: venta.monto_total,
                estado: 'CANCELADO',
                modalidad_pago: venta.modalidad_pago,
                montura_id: venta.montura_id
            }]);
            
        if (error) throw error;
    }
    
    /**
     * Actualiza una venta existente
     */
    static async update(id, venta) {
        const { error } = await supabase
            .from('ventas')
            .update({
                codigo_venta: venta.codigo_venta,
                nombre_cliente: venta.nombre_cliente,
                fecha: venta.fecha,
                datos_compra: venta.datos_compra,
                monto_total: venta.monto_total,
                modalidad_pago: venta.modalidad_pago,
                montura_id: venta.montura_id
            })
            .eq('id', id);
            
        if (error) throw error;
    }
    
    /**
     * Elimina una venta
     */
    static async delete(id) {
        const { error } = await supabase
            .from('ventas')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    }
}
