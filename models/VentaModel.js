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
     * Obtiene una venta por ID
     */
    static async getById(id) {
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .eq('id', id)
            .maybeSingle();
            
        if (error) throw error;
        return data;
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
     * Registra una nueva venta (HU03: incluye a_cuenta, saldo y estado)
     */
    static async create(venta) {
        const aCuenta = parseFloat(venta.a_cuenta) || 0;
        const total = parseFloat(venta.monto_total) || 0;
        const saldo = Math.max(0, total - aCuenta);
        const estado = saldo === 0 ? 'CANCELADO' : 'PENDIENTE';

        const { error } = await supabase
            .from('ventas')
            .insert([{
                codigo_venta: venta.codigo_venta,
                nombre_cliente: venta.nombre_cliente,
                fecha: venta.fecha,
                datos_compra: venta.datos_compra,
                monto_total: total,
                a_cuenta: aCuenta,
                saldo: saldo,
                estado: estado,
                modalidad_pago: venta.modalidad_pago,
                montura_id: venta.montura_id,
                doctor_id: venta.doctor_id || null
            }]);
            
        if (error) throw error;
    }
    
    /**
     * Actualiza una venta existente (HU03: recalcula saldo y estado)
     */
    static async update(id, venta) {
        const aCuenta = parseFloat(venta.a_cuenta) || 0;
        const total = parseFloat(venta.monto_total) || 0;
        const saldo = Math.max(0, total - aCuenta);
        const estado = saldo === 0 ? 'CANCELADO' : 'PENDIENTE';

        const { error } = await supabase
            .from('ventas')
            .update({
                codigo_venta: venta.codigo_venta,
                nombre_cliente: venta.nombre_cliente,
                fecha: venta.fecha,
                datos_compra: venta.datos_compra,
                monto_total: total,
                a_cuenta: aCuenta,
                saldo: saldo,
                estado: estado,
                modalidad_pago: venta.modalidad_pago,
                montura_id: venta.montura_id,
                doctor_id: venta.doctor_id || null
            })
            .eq('id', id);
            
        if (error) throw error;
    }

    /**
     * HU03: Registra un abono a una venta existente
     */
    static async registrarAbono(id, abono) {
        const venta = await this.getById(id);
        if (!venta) throw new Error('Venta no encontrada');

        const nuevoACuenta = (parseFloat(venta.a_cuenta) || 0) + parseFloat(abono);
        const total = parseFloat(venta.monto_total) || 0;
        const nuevoSaldo = Math.max(0, total - nuevoACuenta);
        const nuevoEstado = nuevoSaldo === 0 ? 'CANCELADO' : 'PENDIENTE';

        const { error } = await supabase
            .from('ventas')
            .update({
                a_cuenta: nuevoACuenta,
                saldo: nuevoSaldo,
                estado: nuevoEstado
            })
            .eq('id', id);

        if (error) throw error;
        return { saldo: nuevoSaldo, estado: nuevoEstado };
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
