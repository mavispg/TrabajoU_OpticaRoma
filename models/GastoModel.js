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
            const num = this.getCodigoNumber(g.codigo);
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
        return this.sortForDisplay(data || []);
    }

    static async getByFecha(fecha) {
        const { data, error } = await supabase
            .from('gastos')
            .select('*')
            .eq('fecha', fecha);
        if (error) throw error;
        return this.sortForDisplay(data || []);
    }

    static sortForDisplay(gastos) {
        return [...gastos].sort((a, b) => {
            const fechaCompare = String(b.fecha || '').localeCompare(String(a.fecha || ''));
            if (fechaCompare !== 0) return fechaCompare;

            const codeCompare = this.getCodigoNumber(b.codigo) - this.getCodigoNumber(a.codigo);
            if (codeCompare !== 0) return codeCompare;

            return String(b.codigo || '').localeCompare(String(a.codigo || ''));
        });
    }

    static sortForRenumber(gastos) {
        return [...gastos].sort((a, b) => {
            const fechaCompare = String(a.fecha || '').localeCompare(String(b.fecha || ''));
            if (fechaCompare !== 0) return fechaCompare;

            const codeCompare = this.getCodigoNumber(a.codigo) - this.getCodigoNumber(b.codigo);
            if (codeCompare !== 0) return codeCompare;

            return String(a.codigo || '').localeCompare(String(b.codigo || ''));
        });
    }

    static getCodigoNumber(codigo) {
        const match = String(codigo || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    static async compactCodes() {
        const { data, error } = await supabase
            .from('gastos')
            .select('*');

        if (error) throw error;

        const gastosOrdenados = this.sortForRenumber(data || []);
        for (let i = 0; i < gastosOrdenados.length; i++) {
            const codigo = 'G-' + (i + 1).toString().padStart(3, '0');
            if (gastosOrdenados[i].codigo === codigo) continue;

            const { error: updateError } = await supabase
                .from('gastos')
                .update({ codigo })
                .eq('id', gastosOrdenados[i].id);

            if (updateError) throw updateError;
        }
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
