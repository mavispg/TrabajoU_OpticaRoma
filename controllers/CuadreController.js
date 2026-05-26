import { VentaModel } from '../models/VentaModel.js';
import { GastoModel } from '../models/GastoModel.js';
import { PagoVentaModel } from '../models/PagoVentaModel.js';
import { CuadreView } from '../views/CuadreView.js';

export class CuadreController {
    constructor() {
        this.view = new CuadreView();
        this.currentCuadre = null;
        this.view.setDefaultFecha();
        this.view.bindGenerar(
            this.handleGenerar.bind(this),
            this.handleGenerarPdf.bind(this)
        );

        // Generar cuadre automáticamente con la fecha actual
        this.handleGenerar();
    }

    async handleGenerar() {
        const fecha = this.view.getFecha();
        if (!fecha) return;

        try {
            this.view.renderFechaDisplay(fecha);

            // 1. Obtener ventas del día (las que tengan a_cuenta > 0 o que se crearon ese día)
            const todasVentas = await VentaModel.getAll();
            const ventasDelDia = todasVentas.filter(v => v.fecha === fecha);
            const pagosDelDia = this.enrichPagosWithVentas(
                await this.getPagosDelDia(fecha, ventasDelDia),
                todasVentas
            );
            const movimientosDelDia = [
                ...pagosDelDia,
                ...this.buildAnulacionesDelDia(todasVentas, fecha, pagosDelDia)
            ];

            // 2. Obtener gastos del día
            const gastosDelDia = await GastoModel.getByFecha(fecha);

            // 3. Calcular totales
            let totalIngresos = 0;
            let desglose = { efectivo: 0, yape: 0, visa: 0 };

            movimientosDelDia.forEach(p => {
                const tipo = (p.tipo || '').toUpperCase();

                const monto = parseFloat(p.monto) || 0;
                totalIngresos += monto;

                // Desglosar ingresos por método de pago (solo ingresos)
                const metodo = (p.modalidad_pago || 'EFECTIVO').toUpperCase();
                if (metodo.includes('YAPE')) desglose.yape += monto;
                else if (metodo.includes('VISA')) desglose.visa += monto;
                else desglose.efectivo += monto;
            });

            let totalGastos = 0;
            gastosDelDia.forEach(g => {
                // Los gastos solo se suman al total de egresos.
                // El desglose por modalidad muestra el EFECTIVO/YAPE/VISA COBRADO de las ventas.
                // No restamos del desglose para evitar valores negativos incoherentes.
                totalGastos += parseFloat(g.monto) || 0;
            });

            // 4. Renderizar
            this.view.renderVentas(movimientosDelDia);
            this.view.renderGastos(gastosDelDia);
            this.view.renderResumen(totalIngresos, totalGastos, desglose);
            this.currentCuadre = {
                fecha,
                pagos: movimientosDelDia,
                gastos: gastosDelDia,
                totalIngresos,
                totalGastos,
                desglose
            };

        } catch (e) {
            console.error('Error al generar cuadre de caja:', e);
        }
    }

    async handleGenerarPdf() {
        if (!this.currentCuadre || this.currentCuadre.fecha !== this.view.getFecha()) {
            await this.handleGenerar();
        }

        if (this.currentCuadre) {
            this.view.printReportePdf(this.currentCuadre);
        }
    }

    async getPagosDelDia(fecha, ventasDelDia) {
        try {
            const pagos = await PagoVentaModel.getByFecha(fecha);
            if (pagos.length > 0) return pagos;
        } catch (error) {
            console.warn('No se pudo leer pagos_venta, usando ingresos antiguos:', error);
        }

        return ventasDelDia
            .filter(v => (parseFloat(v.a_cuenta) || 0) > 0)
            .map(v => ({
                codigo_venta: v.codigo_venta,
                nombre_cliente: v.nombre_cliente,
                monto_total: v.monto_total,
                monto: v.a_cuenta,
                modalidad_pago: v.modalidad_pago,
                tipo: 'PAGO'
            }));
    }

    enrichPagosWithVentas(pagos, ventas) {
        return (pagos || []).map(pago => {
            const venta = (ventas || []).find(v =>
                String(v.id || '') === String(pago.venta_id || '') ||
                String(v.codigo_venta || '') === String(pago.codigo_venta || '')
            );

            if (!venta) return null;
            const monto = parseFloat(pago.monto) || 0;

            return {
                ...pago,
                nombre_cliente: pago.nombre_cliente || venta.nombre_cliente,
                monto_total: venta.monto_total,
                codigo_venta: pago.codigo_venta || venta.codigo_venta,
                monto,
                tipo: pago.tipo || 'PAGO'
            };
        }).filter(Boolean);
    }

    buildAnulacionesDelDia(ventas, fecha, pagosDelDia) {
        return (ventas || [])
            .filter(v => this.isVentaAnulada(v) && this.getFechaAnulacion(v) === fecha)
            .filter(v => !pagosDelDia.some(p =>
                String(p.codigo_venta || '') === String(v.codigo_venta || '') &&
                (parseFloat(p.monto) || 0) < 0
            ))
            .map(v => ({
                venta_id: v.id,
                codigo_venta: v.codigo_venta,
                nombre_cliente: v.nombre_cliente,
                monto_total: v.monto_total,
                monto: -Math.abs(parseFloat(v.a_cuenta) || 0),
                modalidad_pago: v.modalidad_pago || 'EFECTIVO',
                tipo: 'ANULACION'
            }))
            .filter(p => Math.abs(parseFloat(p.monto) || 0) > 0);
    }

    isVentaAnulada(venta) {
        return (venta?.estado || '').toUpperCase() === 'ANULADO' ||
            (venta?.estado_entrega || '').toUpperCase() === 'ANULADO';
    }

    getFechaAnulacion(venta) {
        const fecha = String(venta?.datos_compra || '')
            .split('|')
            .map(p => p.trim())
            .find(p => p.startsWith('Fecha Anulacion:'));

        return fecha ? fecha.replace('Fecha Anulacion:', '').trim() : venta?.fecha;
    }
}
