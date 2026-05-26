import { supabase } from './supabaseClient.js';

export class VentaModel {
    /**
     * Obtiene todas las ventas
     */
    static async getAll() {
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .order('codigo_venta', { ascending: false });
            
        if (error) throw error;
        return this.sortByCodigoDesc(data || []);
    }

    static sortByCodigoDesc(ventas) {
        return [...ventas].sort((a, b) => {
            const numA = this.getCodigoNumber(a.codigo_venta);
            const numB = this.getCodigoNumber(b.codigo_venta);
            if (numA !== numB) return numB - numA;
            return String(b.codigo_venta || '').localeCompare(String(a.codigo_venta || ''));
        });
    }

    static getCodigoNumber(codigo) {
        const match = String(codigo || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    static sortForRenumber(ventas) {
        return [...ventas].sort((a, b) => {
            const fechaCompare = String(a.fecha || '').localeCompare(String(b.fecha || ''));
            if (fechaCompare !== 0) return fechaCompare;

            const codeCompare = this.getCodigoNumber(a.codigo_venta) - this.getCodigoNumber(b.codigo_venta);
            if (codeCompare !== 0) return codeCompare;

            return String(a.codigo_venta || '').localeCompare(String(b.codigo_venta || ''));
        });
    }

    static async compactCodes() {
        const { data, error } = await supabase
            .from('ventas')
            .select('*');

        if (error) throw error;

        const ventasOrdenadas = this.sortForRenumber(data || []);
        for (let i = 0; i < ventasOrdenadas.length; i++) {
            const venta = ventasOrdenadas[i];
            const codigoNuevo = 'V-' + (i + 1).toString().padStart(3, '0');
            if (venta.codigo_venta === codigoNuevo) continue;

            const { error: ventaError } = await supabase
                .from('ventas')
                .update({ codigo_venta: codigoNuevo })
                .eq('id', venta.id);

            if (ventaError) throw ventaError;

            await this.updateCodigoPagosVenta(venta, codigoNuevo);
        }
    }

    static async updateCodigoPagosVenta(venta, codigoNuevo) {
        const ventaId = String(venta.id || '');
        if (ventaId) {
            const { error } = await supabase
                .from('pagos_venta')
                .update({ codigo_venta: codigoNuevo })
                .eq('venta_id', ventaId);

            if (error) throw error;
        }

        if (venta.codigo_venta) {
            const { error } = await supabase
                .from('pagos_venta')
                .update({ codigo_venta: codigoNuevo })
                .eq('codigo_venta', venta.codigo_venta);

            if (error) throw error;
        }
    }

    /**
     * Obtiene una venta por ID
     */
    static async getById(id) {
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .eq('id', id)
            .maybeSingle();
            
        if (error) throw error;
        return data;
    }

    /**
     * Genera automáticamente el próximo código de venta
     */
    static async getNextCode() {
        const data = await this.getAll();
        if (data.length === 0) return 'V-001';
        
        let maxCode = 0;
        data.forEach(v => {
            const num = this.getCodigoNumber(v.codigo_venta);
            if (!isNaN(num) && num > maxCode) {
                maxCode = num;
            }
        });
        
        return 'V-' + (maxCode + 1).toString().padStart(3, '0');
    }

    /**
     * Registra una nueva venta (HU03: incluye a_cuenta, saldo y estado)
     */
    static async create(venta) {
        const aCuenta = parseFloat(venta.a_cuenta) || 0;
        const total = parseFloat(venta.monto_total) || 0;
        const saldo = Math.max(0, total - aCuenta);
        const estado = saldo === 0 ? 'CANCELADO' : 'PENDIENTE';

        const { data, error } = await supabase
            .from('ventas')
            .insert([{
                codigo_venta: venta.codigo_venta,
                dni_cliente: venta.dni_cliente,
                celular_cliente: venta.celular_cliente,
                nombre_cliente: venta.nombre_cliente,
                fecha: venta.fecha,
                datos_compra: venta.datos_compra,
                monto_total: total,
                a_cuenta: aCuenta,
                saldo: saldo,
                estado: estado,
                estado_entrega: venta.estado_entrega || 'EN PROCESO',
                modalidad_pago: venta.modalidad_pago,
                montura_id: venta.montura_id,
                doctor_id: venta.doctor_id || null
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }
    
    /**
     * Actualiza una venta existente (HU03: recalcula saldo y estado)
     */
    static async update(id, venta) {
        const aCuenta = parseFloat(venta.a_cuenta) || 0;
        const total = parseFloat(venta.monto_total) || 0;
        const saldo = Math.max(0, total - aCuenta);
        const estado = saldo === 0 ? 'CANCELADO' : 'PENDIENTE';

        const updateData = {
            codigo_venta: venta.codigo_venta,
            dni_cliente: venta.dni_cliente,
            celular_cliente: venta.celular_cliente,
            nombre_cliente: venta.nombre_cliente,
            fecha: venta.fecha,
            datos_compra: venta.datos_compra,
            monto_total: total,
            a_cuenta: aCuenta,
            saldo: saldo,
            estado: estado,
            modalidad_pago: venta.modalidad_pago,
            montura_id: venta.montura_id,
            doctor_id: venta.doctor_id || null
        };

        if (venta.estado_entrega) {
            updateData.estado_entrega = venta.estado_entrega;
        }

        const { error } = await supabase
            .from('ventas')
            .update(updateData)
            .eq('id', id);
            
        if (error) throw error;
    }

    /**
     * HU03: Registra un abono a una venta existente
     */
    static async registrarAbono(id, abono) {
        const venta = await this.getById(id);
        if (!venta) throw new Error('Venta no encontrada');

        const nuevoACuenta = (parseFloat(venta.a_cuenta) || 0) + parseFloat(abono);
        const total = parseFloat(venta.monto_total) || 0;
        const nuevoSaldo = Math.max(0, total - nuevoACuenta);
        const nuevoEstado = nuevoSaldo === 0 ? 'CANCELADO' : 'PENDIENTE';

        const { error } = await supabase
            .from('ventas')
            .update({
                a_cuenta: nuevoACuenta,
                saldo: nuevoSaldo,
                estado: nuevoEstado
            })
            .eq('id', id);

        if (error) throw error;
        return { saldo: nuevoSaldo, estado: nuevoEstado };
    }

    static async updateEstadoEntrega(id, estadoEntrega) {
        const { error } = await supabase
            .from('ventas')
            .update({ estado_entrega: estadoEntrega })
            .eq('id', id);

        if (error) throw error;
    }

    static async anular(id, motivo = '') {
        const venta = await this.getById(id);
        if (!venta) throw new Error('Venta no encontrada');

        const today = new Date();
        const tzOffset = today.getTimezoneOffset() * 60000;
        const fechaAnulacion = new Date(today - tzOffset).toISOString().split('T')[0];
        const datosCompra = this.setMotivoAnulacion(venta.datos_compra, motivo, fechaAnulacion);

        const { error } = await supabase
            .from('ventas')
            .update({
                estado_entrega: 'ANULADO',
                estado: 'ANULADO',
                datos_compra: datosCompra
            })
            .eq('id', id);

        if (error) throw error;
    }

    static setMotivoAnulacion(datosCompra, motivo, fechaAnulacion) {
        const base = String(datosCompra || '')
            .split('|')
            .map(p => p.trim())
            .filter(p => p && !p.startsWith('Motivo Anulacion:') && !p.startsWith('Fecha Anulacion:'))
            .join(' | ');

        const motivoLimpio = String(motivo || 'Sin motivo registrado').replace(/\s+/g, ' ').trim();
        const fechaLimpia = String(fechaAnulacion || '').trim();
        return `${base} | Motivo Anulacion: ${motivoLimpio} | Fecha Anulacion: ${fechaLimpia}`;
    }
    
    /**
     * Elimina una venta
     */
    static async delete(id) {
        const { error } = await supabase
            .from('ventas')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    }
}
