import { supabase } from './supabaseClient.js';

export class UsersModel {
    /**
     * Obtiene todos los usuarios desde Supabase
     */
    async getAll() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('nombre', { ascending: true });
            
        if (error) throw error;
        return data || [];
    }

    /**
     * Agrega un nuevo usuario a Supabase
     */
    async add(user) {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                nombre: user.name,
                usuario: user.username,
                contraseña: user.password,
                rol: user.role
            }])
            .select();
            
        if (error) throw error;
        return data[0];
    }

    /**
     * Actualiza un usuario existente en Supabase
     */
    async update(id, updatedData) {
        const { error } = await supabase
            .from('usuarios')
            .update({
                nombre: updatedData.name,
                usuario: updatedData.username,
                contraseña: updatedData.password,
                rol: updatedData.role
            })
            .eq('id', id);
            
        if (error) throw error;
    }

    /**
     * Elimina un usuario de Supabase
     */
    async delete(id) {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    }
}
