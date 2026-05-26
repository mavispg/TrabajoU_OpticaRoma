import { DashboardView } from '../views/DashboardView.js';
import { VentaModel } from '../models/VentaModel.js';
import { ClientModel } from '../models/ClientModel.js';
import { MonturaModel } from '../models/MonturaModel.js';

/**
 * Controlador para el Dashboard Principal.
 */
export class DashboardController {
    constructor() {
        this.view = new DashboardView();
        this.init();
    }

    async init() {
        await this.render();
        
        // Escuchar cambios de pestaña para refrescar el dashboard si vuelven al inicio
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('data-target') === 'home') {
                    this.render();
                }
            });
        });
    }

    /**
     * Calcula estadísticas y renderiza el dashboard.
     */
    async render() {
        try {
            // 1. Obtener datos de todos los modelos necesarios
            const ventas = await VentaModel.getAll();
            const clientes = await ClientModel.getAll();
            const monturas = await MonturaModel.getAll();
            const ventasValidas = ventas.filter(v => !this.isVentaAnulada(v));

            // 2. Calcular Estadísticas
            const stats = {
                totalSalesAmount: ventasValidas.reduce((acc, v) => acc + (v.monto_total || 0), 0),
                totalClients: clientes.length,
                lowStockCount: monturas.filter(m => m.stock_disponible <= 5).length,
                todaySalesCount: this.getTodaySalesCount(ventasValidas)
            };

            // 3. Obtener Ventas Recientes (últimas 5)
            const recentSales = ventas.slice(0, 5);

            // 4. Renderizar en la vista
            this.view.renderStats(stats);
            this.view.renderRecentSales(recentSales);

        } catch (error) {
            console.error("Error al cargar el Dashboard:", error);
        }
    }

    /**
     * Filtra cuántas ventas se hicieron hoy (ajustado a zona horaria local).
     */
    getTodaySalesCount(ventas) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Buscamos ventas cuya fecha coincida con hoy
        return ventas.filter(v => v.fecha === todayStr).length;
    }

    isVentaAnulada(venta) {
        return (venta?.estado || '').toUpperCase() === 'ANULADO' ||
            (venta?.estado_entrega || '').toUpperCase() === 'ANULADO';
    }
}
