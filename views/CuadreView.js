import { UIHelper } from './UIHelper.js';

export class CuadreView {
    constructor() {
        this.fechaInput = document.getElementById('cuadre_fecha');
        this.btnGenerar = document.getElementById('btnGenerarCuadre');
        this.ventasTbody = document.querySelector('#cuadreVentasTable tbody');
        this.gastosTbody = document.querySelector('#cuadreGastosTable tbody');

        this.totalIngresosEl = document.getElementById('cuadre-total-ingresos');
        this.totalGastosEl = document.getElementById('cuadre-total-gastos');
        this.saldoNetoEl = document.getElementById('cuadre-saldo-neto');
        this.totalEfectivoEl = document.getElementById('cuadre-efectivo');
        this.totalYapeEl = document.getElementById('cuadre-yape');
        this.totalVisaEl = document.getElementById('cuadre-visa');
        this.cuadreFechaDisplay = document.getElementById('cuadre-fecha-display');
    }

    renderVentas(ventas) {
        if (!this.ventasTbody) return;
        this.ventasTbody.innerHTML = '';

        if (ventas.length === 0) {
            this.ventasTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:15px;">No hay ingresos este día</td></tr>';
            return;
        }

        ventas.forEach(v => {
            const aCuenta = parseFloat(v.a_cuenta) || 0;
            if (aCuenta <= 0) return; // Solo mostrar ventas que generaron ingreso

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.codigo_venta}</strong></td>
                <td>${v.nombre_cliente || 'N/A'}</td>
                <td>${UIHelper.formatCurrency(v.monto_total)}</td>
                <td style="color:#27ae60;font-weight:700;">+ ${UIHelper.formatCurrency(aCuenta)}</td>
                <td>${v.modalidad_pago}</td>
            `;
            this.ventasTbody.appendChild(tr);
        });

        // Si después de filtrar no queda nada
        if (this.ventasTbody.children.length === 0) {
            this.ventasTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:15px;">No hay ingresos este día</td></tr>';
        }
    }

    renderGastos(gastos) {
        if (!this.gastosTbody) return;
        this.gastosTbody.innerHTML = '';

        if (gastos.length === 0) {
            this.gastosTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:15px;">No hay gastos este día</td></tr>';
            return;
        }

        gastos.forEach(g => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${g.categoria}${g.descripcion ? ' — ' + g.descripcion : ''}</td>
                <td style="color:#e74c3c;font-weight:700;">- ${UIHelper.formatCurrency(g.monto)}</td>
                <td>${g.modalidad_pago}</td>
            `;
            this.gastosTbody.appendChild(tr);
        });
    }

    renderResumen(totalIngresos, totalGastos, desglose) {
        const saldoNeto = totalIngresos - totalGastos;

        if (this.totalIngresosEl) this.totalIngresosEl.innerText = UIHelper.formatCurrency(totalIngresos);
        if (this.totalGastosEl) this.totalGastosEl.innerText = UIHelper.formatCurrency(totalGastos);
        if (this.saldoNetoEl) {
            this.saldoNetoEl.innerText = UIHelper.formatCurrency(saldoNeto);
            this.saldoNetoEl.style.color = saldoNeto >= 0 ? '#27ae60' : '#e74c3c';
        }
        if (this.totalEfectivoEl) this.totalEfectivoEl.innerText = UIHelper.formatCurrency(desglose.efectivo);
        if (this.totalYapeEl) this.totalYapeEl.innerText = UIHelper.formatCurrency(desglose.yape);
        if (this.totalVisaEl) this.totalVisaEl.innerText = UIHelper.formatCurrency(desglose.visa);
    }

    renderFechaDisplay(fechaStr) {
        if (!this.cuadreFechaDisplay) return;
        const [y, m, d] = fechaStr.split('-');
        const dateObj = new Date(y, m - 1, d);
        const display = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        this.cuadreFechaDisplay.innerText = display.charAt(0).toUpperCase() + display.slice(1);
    }

    setDefaultFecha() {
        if (!this.fechaInput) return;
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        this.fechaInput.value = new Date(today - offset).toISOString().split('T')[0];
    }

    getFecha() {
        return this.fechaInput ? this.fechaInput.value : '';
    }

    bindGenerar(handler) {
        if (this.btnGenerar) {
            this.btnGenerar.addEventListener('click', () => handler());
        }
        // También generar automáticamente cuando cambie la fecha
        if (this.fechaInput) {
            this.fechaInput.addEventListener('change', () => handler());
        }
    }
}
