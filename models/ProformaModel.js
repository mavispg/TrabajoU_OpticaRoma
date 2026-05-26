import { supabase } from './supabaseClient.js';

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 9) return `51${digits}`;
    if (digits.startsWith('51') && digits.length === 11) return digits;
    return String(phone || '').trim();
}

export class ProformaModel {
    static async enviarSms({ celular, mensaje }) {
        const { data, error } = await supabase.functions.invoke('enviar-mensaje-entrega', {
            body: {
                telefono: normalizePhone(celular),
                mensaje
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

    static buildWhatsappUrl({ celular, mensaje }) {
        const phone = normalizePhone(celular).replace(/\D/g, '');
        return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
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
