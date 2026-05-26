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
            this.ventasTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:15px;">No hay ingresos este dia</td></tr>';
            return;
        }

        ventas.forEach(v => {
            const monto = parseFloat(v.monto !== undefined ? v.monto : v.a_cuenta) || 0;
            if (monto === 0) return;
            const montoTotal = parseFloat(v.monto_total) || monto;
            const isNegative = monto < 0 || String(v.tipo || '').toUpperCase().includes('ANULACION');
            const amountColor = isNegative ? '#e74c3c' : '#27ae60';
            const amountPrefix = isNegative ? '- ' : '+ ';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.codigo_venta}</strong></td>
                <td>${v.nombre_cliente || 'N/A'}</td>
                <td>${UIHelper.formatCurrency(montoTotal)}<br><small style="color:#7f8c8d;">${v.tipo || 'PAGO'}</small></td>
                <td style="color:${amountColor};font-weight:700;">${amountPrefix}${UIHelper.formatCurrency(Math.abs(monto))}</td>
                <td>${v.modalidad_pago}</td>
            `;
            this.ventasTbody.appendChild(tr);
        });

        if (this.ventasTbody.children.length === 0) {
            this.ventasTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:15px;">No hay ingresos este dia</td></tr>';
        }
    }

    renderGastos(gastos) {
        if (!this.gastosTbody) return;
        this.gastosTbody.innerHTML = '';

        if (gastos.length === 0) {
            this.gastosTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:15px;">No hay gastos este dia</td></tr>';
            return;
        }

        gastos.forEach(g => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${g.categoria}${g.descripcion ? ' - ' + g.descripcion : ''}</td>
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
        this.cuadreFechaDisplay.innerText = this.getFechaDisplayText(fechaStr);
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

    bindGenerar(refreshHandler, reportHandler) {
        if (this.btnGenerar) {
            this.btnGenerar.addEventListener('click', () => reportHandler());
        }
        if (this.fechaInput) {
            this.fechaInput.addEventListener('change', () => refreshHandler());
            this.fechaInput.addEventListener('input', () => refreshHandler());
        }
    }

    printReportePdf(cuadre) {
        const fechaTexto = this.getFechaDisplayText(cuadre.fecha);
        const saldoNeto = cuadre.totalIngresos - cuadre.totalGastos;
        const ingresosRows = this.buildIngresosPdfRows(cuadre.pagos);
        const gastosRows = this.buildGastosPdfRows(cuadre.gastos);
        const generatedAt = new Date().toLocaleString('es-PE');
        const reportWindow = window.open('', '_blank');

        if (!reportWindow) {
            alert('El navegador bloqueo la ventana del reporte. Permite ventanas emergentes para generar el PDF.');
            return;
        }

        reportWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cuadre de Caja - ${this.escapeHtml(fechaTexto)}</title>
                <style>
                    @page { size: A4; margin: 16mm; }
                    body { font-family: Arial, sans-serif; color: #172b3a; margin: 0; }
                    h1 { margin: 0; font-size: 22px; letter-spacing: .4px; }
                    h2 { margin: 18px 0 8px; font-size: 15px; color: #2e61b3; }
                    .muted { color: #6b7280; font-size: 12px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2e61b3; padding-bottom: 12px; margin-bottom: 16px; }
                    .brand { font-weight: 800; color: #2e61b3; font-size: 16px; }
                    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
                    .box { border: 1px solid #d9e2ec; border-left: 4px solid #2e61b3; border-radius: 6px; padding: 10px; }
                    .box.in { border-left-color: #27ae60; }
                    .box.out { border-left-color: #e74c3c; }
                    .box strong { display: block; margin-top: 5px; font-size: 18px; }
                    .positive { color: #27ae60; }
                    .negative { color: #e74c3c; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
                    th { text-align: left; background: #f1f5f9; color: #172b3a; border-bottom: 1px solid #cbd5e1; padding: 7px; }
                    td { border-bottom: 1px solid #e5e7eb; padding: 7px; vertical-align: top; }
                    .right { text-align: right; }
                    .modalidades { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
                    .pill { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center; }
                    .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="brand">OPTICAS ROMA</div>
                        <h1>Reporte Detallado de Cuadre de Caja</h1>
                        <div class="muted">${this.escapeHtml(fechaTexto)}</div>
                    </div>
                    <div class="muted right">Generado: ${this.escapeHtml(generatedAt)}</div>
                </div>

                <div class="summary">
                    <div class="box in">Ingresos totales<strong class="positive">${UIHelper.formatCurrency(cuadre.totalIngresos)}</strong></div>
                    <div class="box out">Egresos totales<strong class="negative">${UIHelper.formatCurrency(cuadre.totalGastos)}</strong></div>
                    <div class="box">Flujo neto<strong class="${saldoNeto >= 0 ? 'positive' : 'negative'}">${UIHelper.formatCurrency(saldoNeto)}</strong></div>
                </div>

                <h2>Desglose por Modalidad de Pago</h2>
                <div class="modalidades">
                    <div class="pill">EFECTIVO<br><strong>${UIHelper.formatCurrency(cuadre.desglose.efectivo)}</strong></div>
                    <div class="pill">YAPE<br><strong>${UIHelper.formatCurrency(cuadre.desglose.yape)}</strong></div>
                    <div class="pill">VISA<br><strong>${UIHelper.formatCurrency(cuadre.desglose.visa)}</strong></div>
                </div>

                <h2>Detalle de Ingresos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Codigo</th>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th class="right">Monto total</th>
                            <th class="right">Ingreso</th>
                            <th>Modalidad</th>
                        </tr>
                    </thead>
                    <tbody>${ingresosRows}</tbody>
                </table>

                <h2>Detalle de Egresos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Categoria</th>
                            <th>Detalle</th>
                            <th class="right">Egreso</th>
                            <th>Modalidad</th>
                        </tr>
                    </thead>
                    <tbody>${gastosRows}</tbody>
                </table>

                <div class="footer">Reporte generado desde el sistema Opticas Roma.</div>
                <script>window.onload = () => window.print();</script>
            </body>
            </html>
        `);
        reportWindow.document.close();
    }

    buildIngresosPdfRows(pagos) {
        const rows = (pagos || [])
            .filter(p => (parseFloat(p.monto) || 0) !== 0)
            .map(p => {
                const monto = parseFloat(p.monto) || 0;
                const montoTotal = parseFloat(p.monto_total) || monto;
                const isNegative = monto < 0 || String(p.tipo || '').toUpperCase().includes('ANULACION');
                return `
                    <tr>
                        <td><strong>${this.escapeHtml(p.codigo_venta || '-')}</strong></td>
                        <td>${this.escapeHtml(p.nombre_cliente || 'N/A')}</td>
                        <td>${this.escapeHtml(p.tipo || 'PAGO')}</td>
                        <td class="right">${UIHelper.formatCurrency(montoTotal)}</td>
                        <td class="right ${isNegative ? 'negative' : 'positive'}">${isNegative ? '- ' : ''}${UIHelper.formatCurrency(Math.abs(monto))}</td>
                        <td>${this.escapeHtml(p.modalidad_pago || '-')}</td>
                    </tr>
                `;
            })
            .join('');

        return rows || '<tr><td colspan="6" class="right">No hay ingresos para esta fecha.</td></tr>';
    }

    buildGastosPdfRows(gastos) {
        const rows = (gastos || [])
            .map(g => `
                <tr>
                    <td>${this.escapeHtml(g.categoria || '-')}</td>
                    <td>${this.escapeHtml(g.descripcion || '-')}</td>
                    <td class="right negative">${UIHelper.formatCurrency(parseFloat(g.monto) || 0)}</td>
                    <td>${this.escapeHtml(g.modalidad_pago || '-')}</td>
                </tr>
            `)
            .join('');

        return rows || '<tr><td colspan="4" class="right">No hay egresos para esta fecha.</td></tr>';
    }

    getFechaDisplayText(fechaStr) {
        const [y, m, d] = fechaStr.split('-');
        const dateObj = new Date(y, m - 1, d);
        const display = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return display.charAt(0).toUpperCase() + display.slice(1);
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
