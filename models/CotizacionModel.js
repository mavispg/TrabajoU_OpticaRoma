import { supabase } from './supabaseClient.js';

export class CotizacionModel {
    static async create(cotizacion) {
        const { error } = await supabase
            .from('cotizaciones')
            .insert([{
                cliente_id: cotizacion.cliente_id ? String(cotizacion.cliente_id) : null,
                nombre_cliente: cotizacion.nombre_cliente,
                celular: cotizacion.celular,
                detalle: cotizacion.detalle,
                extra: cotizacion.extra || '',
                monto: cotizacion.monto,
                canal: cotizacion.canal,
                mensaje: cotizacion.mensaje,
                estado: cotizacion.estado || 'ENVIADA',
                fecha: cotizacion.fecha
            }]);

        if (error) throw error;
    }
}
