import { supabase } from './supabaseClient.js';

/**
 * Modelo para gestionar la tabla de laboratorios en Supabase.
 */
export class LabModel {
    /**
     * Obtiene todos los laboratorios ordenados por nombre.
     */
    static async getAll() {
        const { data, error } = await supabase
            .from('laboratorios')
            .select('*')
            .order('nombre', { ascending: true });
            
        if (error) throw error;
        return data || [];
    }

    /**
     * Crea un nuevo laboratorio.
     */
    static async create(nombre) {
        const { data, error } = await supabase
            .from('laboratorios')
            .insert([{ nombre }])
            .select();
            
        if (error) throw error;
        return data[0];
    }

    /**
     * Elimina un laboratorio por ID.
     */
    static async delete(id) {
        const { error } = await supabase
            .from('laboratorios')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    }
}
