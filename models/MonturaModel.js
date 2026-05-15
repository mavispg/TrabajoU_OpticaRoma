import { supabase } from './supabaseClient.js';

export class MonturaModel {
    /**
     * Obtiene todas las monturas ordenadas por código
     */
    static async getAll() {
        const { data, error } = await supabase
            .from('monturas')
            .select('*')
            .order('codigo', { ascending: true });
            
        if (error) throw error;
        return data || [];
    }

    /**
     * Genera automáticamente el próximo código de montura
     */
    static async getNextCode() {
        const data = await this.getAll();
        if (data.length === 0) return '001';
        
        let maxCode = 0;
        data.forEach(m => {
            const num = parseInt(m.codigo);
            if (!isNaN(num) && num > maxCode) {
                maxCode = num;
            }
        });
        
        return (maxCode + 1).toString().padStart(3, '0');
    }

    /**
     * Crea una nueva montura
     */
    static async create(montura) {
        const { error } = await supabase
            .from('monturas')
            .insert([{
                codigo: montura.codigo,
                nombre: montura.nombre,
                stock_total: montura.stock_total,
                stock_disponible: montura.stock_disponible,
                precio_venta: montura.precio_venta
            }]);
            
        if (error) throw error;
    }

    /**
     * Actualiza una montura existente
     */
    static async update(id, montura) {
        const { error } = await supabase
            .from('monturas')
            .update({
                codigo: montura.codigo,
                nombre: montura.nombre,
                stock_total: montura.stock_total,
                stock_disponible: montura.stock_disponible,
                precio_venta: montura.precio_venta
            })
            .eq('id', id);
            
        if (error) throw error;
    }

    /**
     * Actualiza el stock disponible sumando o restando una cantidad
     */
    static async updateStock(id, cantidad) {
        // 1. Obtener stock actual
        const { data, error: fetchError } = await supabase
            .from('monturas')
            .select('stock_disponible')
            .eq('id', id)
            .single();
            
        if (fetchError) throw fetchError;

        // 2. Calcular nuevo stock
        const nuevoStock = (data.stock_disponible || 0) + cantidad;

        // 3. Guardar
        const { error: updateError } = await supabase
            .from('monturas')
            .update({ stock_disponible: nuevoStock })
            .eq('id', id);
            
        if (updateError) throw updateError;
    }

    /**
     * Elimina una montura
     */
    static async delete(id) {
        const { error } = await supabase
            .from('monturas')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    }
}
