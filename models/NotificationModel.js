import { supabase } from './supabaseClient.js';

export class NotificationModel {
    static async enviarPedidoListo({ telefono, cliente, codigoVenta }) {
        const { data, error } = await supabase.functions.invoke('enviar-mensaje-entrega', {
            body: {
                telefono,
                cliente,
                codigoVenta
            }
        });

        if (error) {
            const message = await this.getFunctionErrorMessage(error);
            throw new Error(message || error.message || 'No se pudo enviar el SMS');
        }

        if (data && data.ok === false) {
            throw new Error(data.error || 'No se pudo enviar el SMS');
        }

        return data;
    }

    static async getFunctionErrorMessage(error) {
        try {
            const context = error.context;
            if (context && typeof context.json === 'function') {
                const body = await context.json();
                return body?.error || body?.message;
            }
        } catch (parseError) {
            console.warn('No se pudo leer el detalle del error de SMS:', parseError);
        }

        return error.message;
    }
}
