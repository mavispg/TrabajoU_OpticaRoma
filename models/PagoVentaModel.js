import { supabase } from './supabaseClient.js';

export class PagoVentaModel {
    static async getAll() {
        const { data, error } = await supabase
            .from('pagos_venta')
            .select('*')
            .order('fecha_pago', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getByVentaId(ventaId) {
        const { data, error } = await supabase
            .from('pagos_venta')
            .select('*')
            .eq('venta_id', String(ventaId || ''))
            .order('fecha_pago', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getByFecha(fecha) {
        const { data, error } = await supabase
            .from('pagos_venta')
            .select('*')
            .eq('fecha_pago', fecha)
            .order('codigo_venta', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async create(pago) {
        const { error } = await supabase
            .from('pagos_venta')
            .insert([{
                venta_id: String(pago.venta_id || ''),
                codigo_venta: pago.codigo_venta,
                nombre_cliente: pago.nombre_cliente,
                fecha_pago: pago.fecha_pago,
                monto: pago.monto,
                modalidad_pago: pago.modalidad_pago,
                usuario: pago.usuario || null,
                tipo: pago.tipo || 'ABONO'
            }]);

        if (error) throw error;
    }

    static async deleteByVenta(ventaId, codigoVenta) {
        const id = String(ventaId || '');
        if (id) {
            const { error } = await supabase
                .from('pagos_venta')
                .delete()
                .eq('venta_id', id);

            if (error) throw error;
        }

        if (codigoVenta) {
            const { error } = await supabase
                .from('pagos_venta')
                .delete()
                .eq('codigo_venta', codigoVenta);

            if (error) throw error;
        }
    }
}
