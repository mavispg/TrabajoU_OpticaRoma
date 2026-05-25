import { supabase } from './supabaseClient.js';

export class GastoModel {
    /**
     * Genera el próximo código de gasto (G-001, G-002...)
     */
    static async getNextCode() {
        const data = await this.getAll();
        if (data.length === 0) return 'G-001';
        let max = 0;
        data.forEach(g => {
            const num = parseInt(g.codigo.replace('G-', ''));
            if (!isNaN(num) && num > max) max = num;
        });
        return 'G-' + (max + 1).toString().padStart(3, '0');
    }

    static async getAll() {
        const { data, error } = await supabase
            .from('gastos')
            .select('*')
            .order('fecha', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    static async getByFecha(fecha) {
        const { data, error } = await supabase
            .from('gastos')
            .select('*')
            .eq('fecha', fecha);
        if (error) throw error;
        return data || [];
    }

    static async create(gasto) {
        const { error } = await supabase
            .from('gastos')
            .insert([{
                codigo: gasto.codigo,
                fecha: gasto.fecha,
                categoria: gasto.categoria,
                descripcion: gasto.descripcion,
                monto: parseFloat(gasto.monto) || 0,
                modalidad_pago: gasto.modalidad_pago
            }]);
        if (error) throw error;
    }

    static async update(id, gasto) {
        const { error } = await supabase
            .from('gastos')
            .update({
                codigo: gasto.codigo,
                fecha: gasto.fecha,
                categoria: gasto.categoria,
                descripcion: gasto.descripcion,
                monto: parseFloat(gasto.monto) || 0,
                modalidad_pago: gasto.modalidad_pago
            })
            .eq('id', id);
        if (error) throw error;
    }

    static async delete(id) {
        const { error } = await supabase
            .from('gastos')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}
