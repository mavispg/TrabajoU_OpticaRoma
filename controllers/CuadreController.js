import { VentaModel } from '../models/VentaModel.js';
import { GastoModel } from '../models/GastoModel.js';
import { CuadreView } from '../views/CuadreView.js';

export class CuadreController {
    constructor() {
        this.view = new CuadreView();
        this.view.setDefaultFecha();
        this.view.bindGenerar(this.handleGenerar.bind(this));

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

            // 2. Obtener gastos del día
            const gastosDelDia = await GastoModel.getByFecha(fecha);

            // 3. Calcular totales
            let totalIngresos = 0;
            let desglose = { efectivo: 0, yape: 0, visa: 0 };

            ventasDelDia.forEach(v => {
                const aCuenta = parseFloat(v.a_cuenta) || 0;
                totalIngresos += aCuenta;

                // Desglosar ingresos por método de pago (solo ingresos)
                const metodo = (v.modalidad_pago || 'EFECTIVO').toUpperCase();
                if (metodo.includes('YAPE')) desglose.yape += aCuenta;
                else if (metodo.includes('VISA')) desglose.visa += aCuenta;
                else desglose.efectivo += aCuenta;
            });

            let totalGastos = 0;
            gastosDelDia.forEach(g => {
                // Los gastos solo se suman al total de egresos.
                // El desglose por modalidad muestra el EFECTIVO/YAPE/VISA COBRADO de las ventas.
                // No restamos del desglose para evitar valores negativos incoherentes.
                totalGastos += parseFloat(g.monto) || 0;
            });

            // 4. Renderizar
            this.view.renderVentas(ventasDelDia);
            this.view.renderGastos(gastosDelDia);
            this.view.renderResumen(totalIngresos, totalGastos, desglose);

        } catch (e) {
            console.error('Error al generar cuadre de caja:', e);
        }
    }
}
