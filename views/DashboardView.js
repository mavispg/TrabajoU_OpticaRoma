import { UIHelper } from './UIHelper.js';

/**
 * Vista para el Dashboard Principal.
 */
export class DashboardView {
    constructor() {
        this.totalSales = document.getElementById('stat-total-sales');
        this.totalClients = document.getElementById('stat-total-clients');
        this.lowStock = document.getElementById('stat-low-stock');
        this.todaySales = document.getElementById('stat-today-sales');
        this.recentSalesList = document.getElementById('recent-sales-list');
    }

    /**
     * Actualiza las tarjetas de estadísticas.
     */
    renderStats(stats) {
        if (this.totalSales) this.totalSales.innerText = UIHelper.formatCurrency(stats.totalSalesAmount);
        if (this.totalClients) this.totalClients.innerText = stats.totalClients;
        if (this.lowStock) this.lowStock.innerText = stats.lowStockCount;
        if (this.todaySales) this.todaySales.innerText = stats.todaySalesCount;
    }

    /**
     * Renderiza la lista de ventas recientes.
     */
    renderRecentSales(ventas) {
        if (!this.recentSalesList) return;
        this.recentSalesList.innerHTML = '';

        if (ventas.length === 0) {
            this.recentSalesList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">No hay ventas recientes</td></tr>';
            return;
        }

        ventas.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.codigo_venta}</strong></td>
                <td>${v.nombre_cliente}</td>
                <td>${UIHelper.formatCurrency(v.monto_total)}</td>
                <td><span class="status-badge status-paid" style="font-size:10px; padding:2px 8px;">PAGADO</span></td>
            `;
            this.recentSalesList.appendChild(tr);
        });
    }
}
