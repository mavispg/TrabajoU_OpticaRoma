import { supabase } from './supabaseClient.js';

/**
 * Modelo para la gestión de Clientes (HU01)
 * Se encarga de la comunicación directa con la tabla 'clientes' en Supabase.
 */
export class ClientModel {
    /**
     * Obtiene la lista completa de clientes ordenados por nombre.
     * @returns {Promise<Array>} Lista de objetos de clientes.
     */
    static async getAll() {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre', { ascending: true });
            
        if (error) throw error;
        return data || [];
    }

    /**
     * Busca un cliente por su número de DNI.
     * @param {string} dni 
     * @returns {Promise<Object|null>}
     */
    static async getByDni(dni) {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('dni', dni)
            .maybeSingle();
            
        if (error) throw error;
        return data;
    }

    /**
     * Registra un nuevo cliente en la base de datos.
     * @param {Object} client Objeto con dni, nombre y celular.
     * @returns {Promise<Object>} El registro creado.
     */
    static async create(client) {
        const { data, error } = await supabase
            .from('clientes')
            .insert([{
                dni: client.dni,
                nombre: client.nombre,
                celular: client.celular
            }])
            .select();
            
        if (error) throw error;
        return data[0];
    }

    /**
     * Actualiza los datos de un cliente existente.
     * @param {string} id ID del cliente.
     * @param {Object} updatedData Nuevos datos (dni, nombre, celular).
     */
    static async update(id, updatedData) {
        const { error } = await supabase
            .from('clientes')
            .update({
                dni: updatedData.dni,
                nombre: updatedData.nombre,
                celular: updatedData.celular
            })
            .eq('id', id);
            
        if (error) throw error;
    }

    /**
     * Elimina un cliente por su ID.
     * @param {string} id ID del cliente.
     */
    static async delete(id) {
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    }
}
