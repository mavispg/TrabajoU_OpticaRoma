import { supabase } from './supabaseClient.js';

export class DoctorModel {
    static async getNextCode() {
        const data = await this.getAll();
        if (data.length === 0) return 'D-001';
        let max = 0;
        data.forEach(d => {
            const num = parseInt(d.codigo.replace('D-', ''));
            if (!isNaN(num) && num > max) max = num;
        });
        return 'D-' + (max + 1).toString().padStart(3, '0');
    }

    static async getAll() {
        const { data, error } = await supabase
            .from('doctores')
            .select('*')
            .order('codigo', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    static async getById(id) {
        const { data, error } = await supabase
            .from('doctores')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    static async create(doctor) {
        const { error } = await supabase
            .from('doctores')
            .insert([{
                codigo: doctor.codigo,
                nombre: doctor.nombre,
                especialidad: doctor.especialidad || 'General',
                deuda_total: 0,
                deuda_pendiente: 0,
                consultas_count: 0
            }]);
        if (error) throw error;
    }

    static async update(id, doctor) {
        const { error } = await supabase
            .from('doctores')
            .update({
                codigo: doctor.codigo,
                nombre: doctor.nombre,
                especialidad: doctor.especialidad,
                deuda_total: parseFloat(doctor.deuda_total) || 0,
                deuda_pendiente: parseFloat(doctor.deuda_pendiente) || 0
            })
            .eq('id', id);
        if (error) throw error;
    }

    /**
     * HU08: Registra un pago a un doctor (reduce deuda_pendiente)
     */
    static async registrarPago(id, monto) {
        const doctor = await this.getById(id);
        if (!doctor) throw new Error('Doctor no encontrado');
        const nuevaPendiente = Math.max(0, (parseFloat(doctor.deuda_pendiente) || 0) - parseFloat(monto));
        const { error } = await supabase
            .from('doctores')
            .update({ deuda_pendiente: nuevaPendiente })
            .eq('id', id);
        if (error) throw error;
        return nuevaPendiente;
    }

    /**
     * HU08: Registra una consulta del doctor al vincular una venta
     * Incrementa consultas_count y suma S/. 20 a deuda_total y deuda_pendiente
     */
    static async incrementarConsulta(id) {
        const doctor = await this.getById(id);
        if (!doctor) throw new Error('Doctor no encontrado');
        const TARIFA = 20;
        const nuevasConsultas = (parseInt(doctor.consultas_count) || 0) + 1;
        const nuevaTotal = (parseFloat(doctor.deuda_total) || 0) + TARIFA;
        const nuevaPendiente = (parseFloat(doctor.deuda_pendiente) || 0) + TARIFA;
        const { error } = await supabase
            .from('doctores')
            .update({
                consultas_count: nuevasConsultas,
                deuda_total: nuevaTotal,
                deuda_pendiente: nuevaPendiente
            })
            .eq('id', id);
        if (error) throw error;
        return { consultas_count: nuevasConsultas, deuda_total: nuevaTotal, deuda_pendiente: nuevaPendiente };
    }

    static async delete(id) {
        const { error } = await supabase
            .from('doctores')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}
