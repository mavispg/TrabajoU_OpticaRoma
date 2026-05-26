import { UIHelper } from './UIHelper.js';

export class VentaView {
    constructor() {
        this.tableBody = document.querySelector('#clientsTable tbody');
        this.modal = document.getElementById('addClientModal');
        this.form = document.getElementById('addClientForm');
        this.btnAdd = document.getElementById('btnAddClient');
        this.closeBtn = document.querySelector('.client-close');
        this.searchInput = document.getElementById('searchClientsInput');
        
        // Inputs del formulario
        this.codeInput = document.getElementById('c_id');
        this.dateInput = document.getElementById('c_date');
        this.dniInput = document.getElementById('c_dni');
        this.nameInput = document.getElementById('c_name');
        this.phoneInput = document.getElementById('c_phone');
        this.monturaSelect = document.getElementById('sel_montura_pivot');
        this.lunasInput = document.getElementById('c_lunas');
        this.labSelect = document.getElementById('sel_lab');
        this.othersInput = document.getElementById('c_others');
        this.vendedoraInput = document.getElementById('sel_vendedora');
        this.doctorSelect = document.getElementById('sel_doctor');
        this.totalInput = document.getElementById('c_total');
        this.aCuentaInput = document.getElementById('c_a_cuenta');
        this.saldoInput = document.getElementById('c_saldo');
        this.methodSelect = document.getElementById('split_method_1');

        // Nuevos campos de medida
        this.odEsf = document.getElementById('m_od_esf');
        this.odCil = document.getElementById('m_od_cil');
        this.odEje = document.getElementById('m_od_eje');
        this.oiEsf = document.getElementById('m_oi_esf');
        this.oiCil = document.getElementById('m_oi_cil');
        this.oiEje = document.getElementById('m_oi_eje');
        this.dipInput = document.getElementById('m_dip');

        // Inputs de desglose de precios (HU09)
        this.precioMonturaInput = document.getElementById('c_precio_montura');
        this.precioLunaInput = document.getElementById('c_precio_luna');

        // Auto-calcular saldo en tiempo real
        const calcSaldo = () => {
            const tot = parseFloat(this.totalInput.value) || 0;
            const act = parseFloat(this.aCuentaInput.value) || 0;
            if (this.saldoInput) this.saldoInput.value = Math.max(0, tot - act).toFixed(2);
        };

        const calcTotal = () => {
            const pm = parseFloat(this.precioMonturaInput.value) || 0;
            const pl = parseFloat(this.precioLunaInput.value) || 0;
            this.totalInput.value = (pm + pl).toFixed(2);
            calcSaldo();
        };

        if (this.precioMonturaInput) this.precioMonturaInput.addEventListener('input', calcTotal);
        if (this.precioLunaInput) this.precioLunaInput.addEventListener('input', calcTotal);
        if (this.totalInput) this.totalInput.addEventListener('input', calcSaldo);
        if (this.aCuentaInput) this.aCuentaInput.addEventListener('input', calcSaldo);

        // Modal de pago personalizado para Ventas (HU03)
        this.pagoModal = document.getElementById('pagoVentaModal');
        this.pagoForm = document.getElementById('pagoVentaForm');
        this.pagoCloseBtn = document.querySelector('.pago-venta-close');
        this.pagoIdInput = document.getElementById('pago_venta_id');
        this.pagoCodigoEl = document.getElementById('pago_venta_codigo');
        this.pagoSaldoEl = document.getElementById('pago_venta_saldo');
        this.pagoMontoInput = document.getElementById('pago_venta_monto');
        this.pagoMetodoSelect = document.getElementById('pago_venta_metodo');
        this.historialPagosModal = document.getElementById('historialPagosModal');
        this.historialPagosList = document.getElementById('historialPagosList');
        this.historialPagosCloseBtn = document.querySelector('.historial-pagos-close');

        // Inputs para la factura y consulta RUC
        this.rucInput = document.getElementById('ticket_client_ruc');
        this.rsInput = document.getElementById('ticket_client_rs');
    }

    renderTable(ventas, role = 'admin') {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';
        ventas.forEach(v => {
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', v.id);
            newRow.dataset.search = [
                v.codigo_venta,
                v.nombre_cliente,
                v.dni_cliente,
                v.celular_cliente,
                v.fecha,
                v.datos_compra
            ].filter(Boolean).join(' ').toLowerCase();
            
            // Format icon based on payment method
            let methodHtml = v.modalidad_pago;
            if(v.modalidad_pago === 'VISA') methodHtml = `<i class='bx bxl-visa' style='color:#1a1f71; font-size:18px;'></i> ${methodHtml}`;
            else if(v.modalidad_pago === 'YAPE') methodHtml = `<i class='bx bx-mobile' style='color:#7b2cbf; font-size:18px;'></i> ${methodHtml}`;
            else if(v.modalidad_pago === 'EFECTIVO') methodHtml = `<i class='bx bx-money' style='color:#27ae60; font-size:18px;'></i> ${methodHtml}`;

            // Formatear datos_compra para que se vea ordenado (un dato debajo del otro)
            let formattedDatos = "";
            if (v.datos_compra) {
                const partes = v.datos_compra.split('|');
                formattedDatos = partes.map(p => {
                    const texto = p.trim();
                    if(!texto) return "";
                    if (texto.startsWith("Motivo Anulacion:") || texto.startsWith("Fecha Anulacion:")) return "";
                    
                    // Añadir iconos según el tipo de dato
                    let icon = "<i class='bx bx-chevron-right' style='color:#aaa;'></i>";
                    if(texto.startsWith("M:")) icon = "<i class='bx bx-glasses' style='color:#2e61b3;'></i>";
                    if(texto.includes("L:")) icon = "<i class='bx bxs-layer' style='color:#3498db;'></i>";
                    if(texto.includes("Lab:")) icon = "<i class='bx bxs-factory' style='color:#e67e22;'></i>";
                    if(texto.includes("Otros:")) icon = "<i class='bx bx-plus-circle' style='color:#27ae60;'></i>";
                    if(texto.includes("Med:")) icon = "<i class='bx bx-show-alt' style='color:#7b2cbf;'></i>";
                    if(texto.includes("Vend:")) icon = "<i class='bx bx-user' style='color:#666;'></i>";
                    
                    return `<div style="margin-bottom: 4px; display: flex; align-items: flex-start; gap: 5px;">
                                ${icon} <span>${texto}</span>
                            </div>`;
                }).join("");
            }

            const aCuenta = parseFloat(v.a_cuenta) || 0;
            const saldo = parseFloat(v.saldo) || 0;
            const total = parseFloat(v.monto_total) || 0;
            const nombreCliente = UIHelper.normalizeText(v.nombre_cliente || 'N/A');
            const estado = v.estado || (saldo === 0 ? 'CANCELADO' : 'PENDIENTE');
            const estadoColor = estado === 'CANCELADO' ? '#27ae60' : (estado === 'ANULADO' ? '#e74c3c' : '#e67e22');
            const estadoEntrega = v.estado_entrega || 'EN PROCESO';
            const entregaLista = estadoEntrega === 'LISTO PARA ENTREGA';
            const entregado = estadoEntrega === 'ENTREGADO';
            const anulado = estadoEntrega === 'ANULADO' || estado === 'ANULADO';
            const entregaColor = anulado ? '#e74c3c' : (entregado ? '#27ae60' : (entregaLista ? '#2e61b3' : '#7f8c8d'));
            const dniMasked = this.maskDocument(v.dni_cliente);
            const motivoAnulacion = this.getMotivoAnulacion(v.datos_compra);
            const motivoBtn = anulado
                ? `<button class="icon-btn motivo-anulacion-btn" title="Ver motivo de anulacion" data-motivo="${this.escapeHtml(motivoAnulacion)}" style="color:#e67e22;margin-left:4px;"><i class='bx bx-error-circle' style="font-size:18px;"></i></button>`
                : '';
            const canAdminEdit = role === 'admin' && !anulado && !entregado && !entregaLista;
            const canAnular = !anulado;

            const abonoBtn = (!anulado && !entregado && saldo > 0)
                ? `<button class="icon-btn abono-btn" title="Registrar Abono" style="color: #27ae60;"><i class='bx bx-dollar-circle' style="font-size: 18px;"></i></button>`
                : '';

            const printBtn = (!anulado && saldo === 0)
                ? `<button class="icon-btn print-btn" title="Imprimir Comprobante" style="color: #2e61b3;"><i class='bx bx-printer' style="font-size: 18px;"></i></button>`
                : '';

            const listoEntregaBtn = (!anulado && saldo === 0 && !entregaLista && !entregado)
                ? `<button class="icon-btn listo-entrega-btn" title="Marcar Pedido Listo" style="color: #8e44ad;"><i class='bx bx-check-circle' style="font-size: 18px;"></i></button>`
                : '';
            const entregadoBtn = (!anulado && entregaLista)
                ? `<button class="icon-btn entregado-btn" title="Marcar Entregado" style="color: #27ae60;"><i class='bx bx-package' style="font-size: 18px;"></i></button>`
                : '';
            const editBtn = canAdminEdit
                ? `<button class="icon-btn edit-btn" title="Editar Venta"><i class='bx bxs-edit-alt'></i></button>`
                : '';
            const deleteBtn = canAdminEdit && estado === 'PENDIENTE'
                ? `<button class="icon-btn delete-btn" title="Eliminar Venta"><i class='bx bxs-trash'></i></button>`
                : '';
            const anularBtn = canAnular
                ? `<button class="icon-btn anular-btn" title="Anular Venta" style="color: #e74c3c;"><i class='bx bx-block' style="font-size: 18px;"></i></button>`
                : '';
            const pagosBtn = `<button class="icon-btn pagos-history-btn" title="Historial de Pagos" style="color: #34495e;"><i class='bx bx-receipt' style="font-size: 18px;"></i></button>`;

            const actionsHtml = (role === 'admin') 
                ? `<div class="actions-wrapper">
                        ${abonoBtn}
                        ${listoEntregaBtn}
                        ${entregadoBtn}
                        ${pagosBtn}
                        ${printBtn}
                        ${editBtn}
                        ${deleteBtn}
                        ${anularBtn}
                   </div>`
                : `<div class="actions-wrapper">${abonoBtn}${listoEntregaBtn}${entregadoBtn}${pagosBtn}${printBtn}${anularBtn}</div>`;

            newRow.innerHTML = `
                <td><strong>${v.codigo_venta}</strong></td>
                <td>
                    ${nombreCliente}<br>
                    <small style="color:#777;">DNI: ${dniMasked}</small>
                </td>
                <td style="padding: 12px 8px;">${formattedDatos || 'N/A'}</td>
                <td>${v.fecha}</td>
                <td>
                    <strong>Tot: ${UIHelper.formatCurrency(total)}</strong><br>
                    <span style="color:#27ae60; font-size:11px;">Pagado: ${UIHelper.formatCurrency(aCuenta)}</span><br>
                    <span style="color:#e74c3c; font-size:11px; font-weight:600;">Sal: ${UIHelper.formatCurrency(saldo)}</span><br>
                    <small>${methodHtml}</small>
                </td>
                <td>
                    <span class="status-badge" style="background:${estadoColor}15; color:${estadoColor}; border:1px solid ${estadoColor}; padding:2px 8px; border-radius:10px; font-weight:600; font-size:11px;">${estado}</span>${motivoBtn}
                    <br>
                    <span class="status-badge" style="display:inline-block; margin-top:4px; background:${entregaColor}15; color:${entregaColor}; border:1px solid ${entregaColor}; padding:2px 8px; border-radius:10px; font-weight:600; font-size:10px;">${estadoEntrega}</span>
                </td>
                <td class="actions-cell">
                    ${actionsHtml}
                </td>
            `;
            this.tableBody.appendChild(newRow);
        });
    }

    populateMonturasSelect(monturas) {
        if (!this.monturaSelect) return;
        this.monturaSelect.innerHTML = '<option value="">Seleccione una Montura...</option>';
        monturas.forEach(m => {
            if (m.stock_disponible > 0) {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.text = `${m.codigo} - ${m.nombre} (S/. ${m.precio_venta})`;
                opt.dataset.precio = m.precio_venta;
                this.monturaSelect.appendChild(opt);
            }
        });
    }

    /**
     * Ya no se usa select de clientes, pero dejamos el método por si acaso
     * @param {Array} clientes 
     */
    populateClientesSelect(clientes) {
        // Obsoleto con búsqueda por DNI
    }

    populateVendedorasSelect(vendedores) {
        if (!this.vendedoraInput) return;
        this.vendedoraInput.innerHTML = '<option value="">Seleccione...</option>';
        vendedores.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.nombre;
            opt.text = v.nombre;
            this.vendedoraInput.appendChild(opt);
        });
    }

    /**
     * HU08: Carga la lista de doctores registrados en el selector del modal de Venta
     */
    populateDoctoresSelect(doctores) {
        if (!this.doctorSelect) return;
        this.doctorSelect.innerHTML = '<option value="">Ninguno (Venta Directa)</option>';
        doctores.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.text = `${d.nombre} — ${d.especialidad || 'General'}`;
            this.doctorSelect.appendChild(opt);
        });
    }

    openModal(isEdit = false, nextCode = '') {
        this.form.reset();
        
        if (isEdit) {
            document.querySelector('#addClientModal h2').innerText = 'Editar Venta';
        } else {
            document.querySelector('#addClientModal h2').innerText = 'Registrar Nueva Venta';
            this.codeInput.value = nextCode;
            
            // Fecha actual por defecto (ajustada a zona horaria local)
            const today = new Date();
            const tzOffset = today.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(today - tzOffset)).toISOString().slice(0, -1);
            this.dateInput.value = localISOTime.split('T')[0];
        }
        
        this.modal.style.display = 'block';
    }

    populateForm(venta) {
        this.codeInput.value = venta.codigo_venta;
        this.dateInput.value = venta.fecha;
        this.nameInput.value = venta.nombre_cliente;
        this.dniInput.value = venta.dni_cliente || ""; 
        if (this.phoneInput) this.phoneInput.value = venta.celular_cliente || "";
        this.monturaSelect.value = venta.montura_id || '';
        
        // Limpiar inputs antes de llenar
        this.lunasInput.value = "";
        this.labSelect.value = "";
        this.othersInput.value = "";
        this.vendedoraInput.value = "";

        // Parsear datos_compra
        let pmVal = 0;
        let plVal = 0;

        if (venta.datos_compra) {
            const partes = venta.datos_compra.split('|');
            partes.forEach(p => {
                const txt = p.trim();
                if (txt.startsWith("M:")) {
                    const cleanTxt = txt.replace("M:", "").trim();
                    const pmMatch = cleanTxt.match(/\((?:S\/\.\s*)?([0-9.]+)\)/);
                    if (pmMatch) pmVal = parseFloat(pmMatch[1]) || 0;
                }
                if (txt.startsWith("L:")) {
                    const cleanTxt = txt.replace("L:", "").trim();
                    const plMatch = cleanTxt.match(/\((?:S\/\.\s*)?([0-9.]+)\)/);
                    if (plMatch) plVal = parseFloat(plMatch[1]) || 0;
                    this.lunasInput.value = cleanTxt.split('(')[0].trim();
                }
                if (txt.startsWith("Lab:")) this.labSelect.value = txt.replace("Lab:", "").trim();
                if (txt.startsWith("Otros:")) this.othersInput.value = txt.replace("Otros:", "").trim();
                if (txt.startsWith("Vend:")) this.vendedoraInput.value = txt.replace("Vend:", "").trim();
                
                if (txt.startsWith("Med:")) {
                    const med = txt.replace("Med:", "").trim();
                    try {
                        const odMatch = med.match(/OD\((.*?),(.*?),(.*?)\)/);
                        if (odMatch) {
                            this.odEsf.value = odMatch[1].trim();
                            this.odCil.value = odMatch[2].trim();
                            this.odEje.value = odMatch[3].trim();
                        }
                        const oiMatch = med.match(/OI\((.*?),(.*?),(.*?)\)/);
                        if (oiMatch) {
                            this.oiEsf.value = oiMatch[1].trim();
                            this.oiCil.value = oiMatch[2].trim();
                            this.oiEje.value = oiMatch[3].trim();
                        }
                        const dipMatch = med.match(/DIP\((.*?)\)/);
                        if (dipMatch) {
                            this.dipInput.value = dipMatch[1].trim();
                        }
                    } catch (e) {
                        console.warn("Error parseando medidas:", e);
                    }
                }
            });
        }

        if (this.precioMonturaInput) this.precioMonturaInput.value = pmVal.toFixed(2);
        if (this.precioLunaInput) this.precioLunaInput.value = plVal.toFixed(2);

        this.totalInput.value = venta.monto_total;
        if (this.aCuentaInput) this.aCuentaInput.value = venta.a_cuenta || 0;
        if (this.saldoInput) this.saldoInput.value = (venta.saldo !== undefined) ? venta.saldo : (venta.monto_total - (venta.a_cuenta || 0));
        this.methodSelect.value = venta.modalidad_pago;
        if (this.doctorSelect) this.doctorSelect.value = venta.doctor_id || '';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
    }

    getFormData() {
        let datosCompra = "";
        
        if (this.monturaSelect.selectedIndex > 0) {
            const monturaText = this.monturaSelect.options[this.monturaSelect.selectedIndex].text;
            const pMontura = parseFloat(this.precioMonturaInput.value) || 0;
            datosCompra += "M: " + monturaText.split('(')[0].trim() + ` (S/. ${pMontura.toFixed(2)}) `;
        }

        if (this.lunasInput.value.trim() !== '' || (parseFloat(this.precioLunaInput.value) || 0) > 0) {
            const pLuna = parseFloat(this.precioLunaInput.value) || 0;
            const lunaDetalle = this.lunasInput.value.trim() || 'Lunas';
            datosCompra += "| L: " + lunaDetalle + ` (S/. ${pLuna.toFixed(2)}) `;
        }

        if (this.labSelect.value.trim() !== '') {
            datosCompra += "| Lab: " + this.labSelect.value.trim() + " ";
        }
        
        if (this.othersInput.value.trim() !== '') {
            datosCompra += "| Otros: " + this.othersInput.value.trim() + " ";
        }

        // Agregar Medidas
        const dip = this.dipInput ? this.dipInput.value : '0';
        const odEsf = this.odEsf ? this.odEsf.value : '0';
        const odCil = this.odCil ? this.odCil.value : '0';
        const odEje = this.odEje ? this.odEje.value : '0';
        const oiEsf = this.oiEsf ? this.oiEsf.value : '0';
        const oiCil = this.oiCil ? this.oiCil.value : '0';
        const oiEje = this.oiEje ? this.oiEje.value : '0';

        const medStr = `OD(${odEsf}, ${odCil}, ${odEje}) OI(${oiEsf}, ${oiCil}, ${oiEje}) DIP(${dip})`;
        datosCompra += "| Med: " + medStr + " ";
        
        if (this.vendedoraInput && this.vendedoraInput.value.trim() !== '') {
            datosCompra += "| Vend: " + this.vendedoraInput.value.trim();
        }

        return {
            codigo_venta: this.codeInput.value,
            fecha: this.dateInput.value,
            dni_cliente: this.dniInput.value,
            celular_cliente: this.phoneInput ? this.phoneInput.value : '',
            nombre_cliente: this.nameInput.value,
            montura_id: this.monturaSelect.value || null,
            datos_compra: datosCompra,
            monto_total: parseFloat(this.totalInput.value) || 0,
            a_cuenta: this.aCuentaInput ? parseFloat(this.aCuentaInput.value) || 0 : 0,
            modalidad_pago: this.methodSelect.value,
            doctor_id: this.doctorSelect ? this.doctorSelect.value || null : null
        };
    }

    bindAddVenta(handler) {
        if (this.btnAdd) {
            this.btnAdd.addEventListener('click', () => handler());
        }
    }

    bindCloseModal() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.pagoCloseBtn) {
            this.pagoCloseBtn.addEventListener('click', () => this.closePagoModal());
        }
        if (this.historialPagosCloseBtn) {
            this.historialPagosCloseBtn.addEventListener('click', () => this.closeHistorialPagosModal());
        }
        window.addEventListener('click', (e) => {
            if (e.target == this.modal) this.closeModal();
            if (e.target == this.pagoModal) this.closePagoModal();
            if (e.target == this.historialPagosModal) this.closeHistorialPagosModal();
        });
    }

    bindSubmitForm(handler) {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                handler(this.getFormData());
            });
        }
    }

    bindTableActions(editHandler, deleteHandler, abonoHandler, printHandler, listoEntregaHandler, entregadoHandler, anularHandler, pagosHistoryHandler) {
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (!row) return;
                const id = row.getAttribute('data-id');

                if (e.target.closest('.delete-btn')) {
                    deleteHandler(id, row);
                }
                
                if (e.target.closest('.edit-btn')) {
                    editHandler(id);
                }

                if (e.target.closest('.abono-btn') && abonoHandler) {
                    abonoHandler(id);
                }

                if (e.target.closest('.print-btn') && printHandler) {
                    printHandler(id);
                }

                if (e.target.closest('.listo-entrega-btn') && listoEntregaHandler) {
                    listoEntregaHandler(id);
                }

                if (e.target.closest('.entregado-btn') && entregadoHandler) {
                    entregadoHandler(id);
                }

                if (e.target.closest('.anular-btn') && anularHandler) {
                    anularHandler(id);
                }

                if (e.target.closest('.pagos-history-btn') && pagosHistoryHandler) {
                    pagosHistoryHandler(id);
                }

                const motivoBtn = e.target.closest('.motivo-anulacion-btn');
                if (motivoBtn) {
                    UIHelper.showCustomAlert(motivoBtn.dataset.motivo || 'Sin motivo registrado', 'MOTIVO DE ANULACION');
                }
            });
        }
    }

    openHistorialPagosModal(pagos, emptyMessage = 'No hay pagos registrados para esta venta.', venta = null) {
        if (!this.historialPagosModal || !this.historialPagosList) return;

        const pagosList = pagos || [];
        const resumenHtml = venta ? this.renderResumenPagos(venta, pagosList) : '';

        if (pagosList.length === 0) {
            this.historialPagosList.innerHTML = `
                ${resumenHtml}
                <p style="text-align:center;color:#777;padding:16px;">${this.escapeHtml(emptyMessage)}</p>
            `;
        } else {
            this.historialPagosList.innerHTML = resumenHtml + pagosList.map(p => {
                const tipo = (p.tipo || 'PAGO').toUpperCase();
                const monto = parseFloat(p.monto) || 0;
                const isNegative = tipo.includes('DESCUENTO') || tipo.includes('DEVOLUCION') || monto < 0;
                const amountColor = isNegative ? '#e74c3c' : '#27ae60';
                const amountPrefix = isNegative ? '- ' : '';

                return `
                <div style="display:flex;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid #eee;align-items:center;">
                    <div>
                        <strong>${this.escapeHtml(p.tipo || 'PAGO')}</strong><br>
                        <span style="font-size:12px;color:#666;">${this.escapeHtml(p.fecha_pago || '')} - ${this.escapeHtml(p.modalidad_pago || 'EFECTIVO')}</span>
                        ${p.usuario ? `<br><span style="font-size:12px;color:#888;">Cobrado por: ${this.escapeHtml(p.usuario)}</span>` : ''}
                    </div>
                    <strong style="color:${amountColor};">${amountPrefix}${UIHelper.formatCurrency(Math.abs(monto))}</strong>
                </div>
            `;
            }).join('');
        }

        this.historialPagosModal.style.display = 'block';
    }

    renderResumenPagos(venta, pagos) {
        const totalVenta = parseFloat(venta.monto_total) || parseFloat(venta.total_final) || 0;
        const totalPagado = pagos.reduce((sum, p) => {
            const tipo = (p.tipo || '').toUpperCase();
            if (tipo.includes('DESCUENTO')) return sum;
            return sum + (parseFloat(p.monto) || 0);
        }, 0);
        const diferencia = totalVenta - totalPagado;
        const saldoLabel = diferencia >= 0 ? 'Saldo pendiente' : 'Sobrante';
        const saldoColor = diferencia >= 0 ? '#e74c3c' : '#e67e22';

        return `
            <div style="background:#f8fafc;border:1px solid #e5e9f0;border-radius:8px;padding:12px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span>Total de venta</span>
                    <strong>${UIHelper.formatCurrency(totalVenta)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#27ae60;">
                    <span>Pagado por cliente</span>
                    <strong>${UIHelper.formatCurrency(totalPagado)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;color:${saldoColor};border-top:1px solid #dfe4ea;padding-top:6px;">
                    <span>${saldoLabel}</span>
                    <strong>${UIHelper.formatCurrency(Math.abs(diferencia))}</strong>
                </div>
            </div>
        `;
    }

    closeHistorialPagosModal() {
        if (this.historialPagosModal) this.historialPagosModal.style.display = 'none';
    }

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    maskDocument(value) {
        const digits = String(value || '').replace(/\D/g, '');
        if (!digits) return '-';
        return `${'*'.repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`;
    }

    getMotivoAnulacion(datosCompra) {
        const motivo = String(datosCompra || '')
            .split('|')
            .map(p => p.trim())
            .find(p => p.startsWith('Motivo Anulacion:'));

        return motivo ? motivo.replace('Motivo Anulacion:', '').trim() : 'Sin motivo registrado';
    }

    bindSearch() {
        if (this.searchInput && this.tableBody) {
            this.searchInput.addEventListener('keyup', (e) => {
                const filter = e.target.value.toLowerCase();
                const rows = this.tableBody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    const searchableText = rows[i].dataset.search || rows[i].innerText.toLowerCase();
                    if (searchableText.includes(filter)) {
                        rows[i].style.display = "";
                        continue;
                    }

                    const cells = rows[i].getElementsByTagName('td');
                    let match = false;
                    for (let j = 0; j < cells.length - 1; j++) {
                        if (cells[j] && cells[j].innerText.toLowerCase().indexOf(filter) > -1) {
                            match = true;
                            break;
                        }
                    }
                    rows[i].style.display = match ? "" : "none";
                }
            });
        }
    }
    
    // Autocompletar precio de la montura y recalcular total (HU09)
    bindMonturaSelect() {
        if (this.monturaSelect) {
            this.monturaSelect.addEventListener('change', () => {
                const selected = this.monturaSelect.options[this.monturaSelect.selectedIndex];
                if (selected && selected.dataset.precio) {
                    if (this.precioMonturaInput) {
                        this.precioMonturaInput.value = parseFloat(selected.dataset.precio).toFixed(2);
                        
                        // Recalcular total e inicializar a cuenta / saldo
                        const pm = parseFloat(this.precioMonturaInput.value) || 0;
                        const pl = parseFloat(this.precioLunaInput ? this.precioLunaInput.value : 0) || 0;
                        this.totalInput.value = (pm + pl).toFixed(2);
                        
                        if (this.aCuentaInput && (parseFloat(this.aCuentaInput.value) || 0) === 0) {
                            this.aCuentaInput.value = this.totalInput.value;
                        }
                        
                        const tot = parseFloat(this.totalInput.value) || 0;
                        const act = parseFloat(this.aCuentaInput ? this.aCuentaInput.value : 0) || 0;
                        if (this.saldoInput) this.saldoInput.value = Math.max(0, tot - act).toFixed(2);
                    } else {
                        this.totalInput.value = selected.dataset.precio;
                    }
                }
            });
        }
    }

    /**
     * Vincula la búsqueda automática por DNI
     * @param {Function} handler 
     */
    bindDniSearch(handler) {
        if (this.dniInput) {
            this.dniInput.addEventListener('keyup', (e) => {
                if (this.dniInput.value.length === 8) {
                    handler(this.dniInput.value);
                }
            });
        }
    }

    /**
     * Vincula la búsqueda automática por RUC en la Factura
     * @param {Function} handler 
     */
    bindRucSearch(handler) {
        if (this.rucInput) {
            this.rucInput.addEventListener('keyup', async (e) => {
                if (this.rucInput.value.length === 11) {
                    const ruc = this.rucInput.value;
                    if (this.rsInput) this.rsInput.placeholder = "Buscando en SUNAT...";
                    const data = await handler(ruc);
                    if (data && data.razonSocial) {
                        if (this.rsInput) {
                            this.rsInput.value = data.razonSocial;
                            // Disparar evento input para actualizar la vista previa de la factura
                            this.rucInput.dispatchEvent(new Event('input'));
                        }
                    } else {
                        if (this.rsInput) this.rsInput.placeholder = "No encontrado, ingrese manualmente";
                    }
                }
            });
        }
    }

    /**
     * Vincula el botón "+" para agregar cliente rápido
     * @param {Function} handler 
     */
    bindQuickAddClient(handler) {
        const btn = document.getElementById('btnQuickAddClient');
        if (btn) {
            btn.addEventListener('click', () => handler());
        }
    }

    /**
     * HU04: Vincula el filtro por rango de fechas
     * @param {Function} handler 
     */
    bindDateFilter(handler) {
        const btn = document.getElementById('btnFiltrarVentas');
        const desde = document.getElementById('c_filter_desde');
        const hasta = document.getElementById('c_filter_hasta');
        if (btn) {
            btn.addEventListener('click', () => {
                handler(desde.value, hasta.value);
            });
        }
    }

    /**
     * HU03: Métodos del modal de abonos personalizado
     */
    openPagoModal(venta) {
        if (this.pagoForm) this.pagoForm.reset();
        if (this.pagoIdInput) this.pagoIdInput.value = venta.id;
        if (this.pagoCodigoEl) this.pagoCodigoEl.innerText = venta.codigo_venta;
        if (this.pagoSaldoEl) this.pagoSaldoEl.innerText = UIHelper.formatCurrency(venta.saldo);
        if (this.pagoMontoInput) {
            this.pagoMontoInput.value = venta.saldo.toFixed(2);
            this.pagoMontoInput.max = venta.saldo.toFixed(2);
        }
        if (this.pagoMetodoSelect) {
            this.pagoMetodoSelect.value = venta.modalidad_pago || 'EFECTIVO';
        }
        if (this.pagoModal) this.pagoModal.style.display = 'block';
    }

    closePagoModal() {
        if (this.pagoModal) this.pagoModal.style.display = 'none';
        if (this.pagoForm) this.pagoForm.reset();
    }

    bindPagoFormSubmit(handler) {
        if (this.pagoForm) {
            this.pagoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = this.pagoIdInput.value;
                const monto = parseFloat(this.pagoMontoInput.value) || 0;
                const metodo = this.pagoMetodoSelect ? this.pagoMetodoSelect.value : 'EFECTIVO';
                handler(id, monto, metodo);
            });
        }
    }

    /**
     * HU09: Métodos de Gestión y Visualización de Boleta / Factura Electrónica
     */
    openPrintModal(venta, rucLookupHandler = null) {
        this.currentPrintVenta = venta;
        this.currentPrintType = 'BOLETA'; // Por defecto

        const modal = document.getElementById('ticketPrintModal');
        const closeBtn = document.querySelector('.ticket-print-close');
        const btnBoleta = document.getElementById('btnSelectBoleta');
        const btnFactura = document.getElementById('btnSelectFactura');
        const docInputs = document.getElementById('docInputs');
        const rucInput = document.getElementById('ticket_client_ruc');
        const rsInput = document.getElementById('ticket_client_rs');
        const btnImprimir = document.getElementById('btnImprimirTicket');

        if (!modal) return;

        // Limpiar campos e inputs
        if (rucInput) rucInput.value = '';
        if (rsInput) rsInput.value = '';
        if (docInputs) docInputs.style.display = 'none';

        // Estilos iniciales de los botones de selección
        if (btnBoleta) {
            btnBoleta.style.background = '#2e61b3';
            btnBoleta.style.color = '#fff';
        }
        if (btnFactura) {
            btnFactura.style.background = '#aaa';
            btnFactura.style.color = '#fff';
        }

        modal.style.display = 'block';

        const updateTicket = () => {
            this.renderPrintTicket(venta, this.currentPrintType, {
                ruc: rucInput ? rucInput.value : '',
                razonSocial: rsInput ? rsInput.value : ''
            });
        };

        // Enlazar eventos de botones de selección
        if (btnBoleta) {
            btnBoleta.onclick = () => {
                this.currentPrintType = 'BOLETA';
                btnBoleta.style.background = '#2e61b3';
                btnFactura.style.background = '#aaa';
                if (docInputs) docInputs.style.display = 'none';
                updateTicket();
            };
        }

        if (btnFactura) {
            btnFactura.onclick = () => {
                this.currentPrintType = 'FACTURA';
                btnFactura.style.background = '#2e61b3';
                btnBoleta.style.background = '#aaa';
                if (docInputs) docInputs.style.display = 'block';
                updateTicket();
            };
        }

        // Auto-actualizar preview mientras el usuario tipea
        if (rucInput) rucInput.oninput = async () => {
            const ruc = rucInput.value.replace(/\D/g, '');
            rucInput.value = ruc;

            if (ruc.length === 11 && rucLookupHandler) {
                try {
                    const empresa = await rucLookupHandler(ruc);
                    if (rsInput) rsInput.value = empresa.razonSocial || '';
                } catch (error) {
                    console.error('Error consultando RUC:', error);
                    if (rsInput) rsInput.value = '';
                }
            } else if (ruc.length < 11 && rsInput) {
                rsInput.value = '';
            }

            updateTicket();
        };
        if (rsInput) rsInput.oninput = updateTicket;

        // Cerrar modal
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = 'none'; };
        }
        
        // Imprimir
        if (btnImprimir) {
            btnImprimir.onclick = async () => {
                const ok = await UIHelper.showCustomConfirm('¿Deseas imprimir este comprobante?', {
                    title: 'IMPRIMIR COMPROBANTE',
                    confirmText: 'Imprimir'
                });
                if (!ok) return;
                window.print();
            };
        }

        // Renderizado inicial del ticket
        updateTicket();
    }

    parseDatosCompra(datos) {
        const items = [];
        if (!datos) return [{ cant: 1, desc: 'SERVICIO ÓPTICO GENERAL', precio: parseFloat(this.currentPrintVenta.monto_total) || 0 }];

        const partes = datos.split('|');
        let montura = "";
        let luna = "";
        let otros = "";
        let pm = 0;
        let pl = 0;

        partes.forEach(p => {
            const txt = p.trim();
            if (txt.startsWith("M:")) {
                const cleanTxt = txt.replace("M:", "").trim();
                const pmMatch = cleanTxt.match(/\((?:S\/\.\s*)?([0-9.]+)\)/);
                if (pmMatch) pm = parseFloat(pmMatch[1]) || 0;
                montura = cleanTxt.split('(')[0].trim();
            } else if (txt.includes("L:")) {
                const cleanTxt = txt.split('L:')[1].trim();
                const plMatch = cleanTxt.match(/\((?:S\/\.\s*)?([0-9.]+)\)/);
                if (plMatch) pl = parseFloat(plMatch[1]) || 0;
                luna = cleanTxt.split('(')[0].trim();
            } else if (txt.includes("Otros:")) {
                otros = txt.split('Otros:')[1].trim();
            }
        });

        if (montura) {
            items.push({ cant: 1, desc: `MONTURA: ${montura}`, precio: pm });
        }
        if (luna) {
            items.push({ cant: 1, desc: `LUNAS: ${luna}`, precio: pl });
        }
        if (otros) {
            items.push({ cant: 1, desc: otros, precio: 0 });
        }

        if (items.length === 0) {
            items.push({ cant: 1, desc: 'SERVICIO ÓPTICO INTEGRAL', precio: parseFloat(this.currentPrintVenta.monto_total) || 0 });
        }

        // Si la suma de montura + lunas no coincide con el total de venta (por descuentos o ajustes),
        // ajustamos la diferencia en el primer item para que la contabilidad del ticket cierre perfecto.
        const sumItems = items.reduce((sum, item) => sum + item.precio, 0);
        const totalVenta = parseFloat(this.currentPrintVenta.monto_total) || 0;
        if (sumItems !== totalVenta && items.length > 0) {
            if (sumItems === 0) {
                items[0].precio = totalVenta;
            } else {
                items[0].precio += (totalVenta - sumItems);
            }
        }
        return items;
    }

    numeroALetras(num) {
        const centavos = Math.round((num - Math.floor(num)) * 100);
        const entero = Math.floor(num);
        
        const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
        const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
        const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
        
        let texto = "";
        
        if (entero === 0) {
            texto = "CERO";
        } else if (entero === 100) {
            texto = "CIEN";
        } else {
            const c = Math.floor(entero / 100);
            const d = Math.floor((entero % 100) / 10);
            const u = entero % 10;
            
            if (c > 0) {
                if (c === 1) texto += "CIENTO ";
                else if (c === 5) texto += "QUINIENTOS ";
                else if (c === 7) texto += "SETECIENTOS ";
                else if (c === 9) texto += "NOVECIENTOS ";
                else texto += unidades[c] + "CIENTOS ";
            }
            
            if (d === 1) {
                texto += especiales[entero % 10] + " ";
            } else if (d > 1) {
                texto += decenas[d];
                if (u > 0) texto += " Y " + unidades[u];
                texto += " ";
            } else if (u > 0) {
                texto += unidades[u] + " ";
            }
        }
        
        const centavosStr = centavos.toString().padStart(2, '0');
        return `SON: ${texto.trim()} CON ${centavosStr}/100 SOLES`;
    }

    getComprobanteData(venta, isBoleta, extraData) {
        const serie = isBoleta ? 'B001' : 'F001';
        const tipoComprobante = isBoleta ? '03' : '01';
        const tipoDocCliente = isBoleta ? '1' : '6';
        const correlativo = this.getCorrelativoComprobante(venta.codigo_venta);
        const clientDocVal = isBoleta
            ? String(venta.dni_cliente || '-').replace(/\D/g, '')
            : String(extraData.ruc || '20100100100').replace(/\D/g, '');

        return {
            serie,
            correlativo,
            tipoComprobante,
            tipoDocCliente,
            clientDocVal,
            serialDoc: `${serie}-${correlativo}`
        };
    }

    getCorrelativoComprobante(codigoVenta) {
        const match = String(codigoVenta || '').match(/\d+/);
        const numero = match ? parseInt(match[0], 10) : 0;
        return numero.toString().padStart(8, '0');
    }

    renderPrintTicket(venta, type, extraData) {
        const ticketContainer = document.getElementById('ticketContainer');
        if (!ticketContainer) return;

        // =======================================================
        // 🏢 DATOS DE LA EMPRESA (Edítalos aquí cuando quieras cambiar los datos)
        // =======================================================
        const empresa_nombre = "OPTICA ROMA S.A.C.";
        const empresa_ruc = "10199234132";
        const empresa_direccion = "Ca. Real 686, Huancayo 12001";
        const empresa_telefono = "964 853 030";
        const empresa_email = "ventas@opticaroma.com";
      
        // =======================================================

        const isBoleta = type === 'BOLETA';
        const docName = isBoleta ? 'BOLETA DE VENTA ELECTRONICA' : 'FACTURA DE VENTA ELECTRONICA';
        const comprobante = this.getComprobanteData(venta, isBoleta, extraData);
        const serialDoc = comprobante.serialDoc;

        const clientDocLabel = isBoleta ? 'DNI' : 'RUC';
        const clientDocVal = comprobante.clientDocVal || '-';
            
        const clientNameLabel = isBoleta ? 'CLIENTE' : 'RAZON SOCIAL';
        const clientNameVal = isBoleta
            ? UIHelper.normalizeText(venta.nombre_cliente || 'CLIENTE GENERAL')
            : (extraData.razonSocial || 'EMPRESA DEMO S.A.C.');

        const totalVal = parseFloat(venta.monto_total) || 0;
        const gravadoVal = totalVal / 1.18;
        const igvVal = totalVal - gravadoVal;

        const items = this.parseDatosCompra(venta.datos_compra);
        const itemsHtml = items.map(item => `
            <div style="display: flex; margin-bottom: 5px;">
                <div style="width: 15%;">${item.cant} UND</div>
                <div style="width: 60%; text-transform: uppercase;">${item.desc}</div>
                <div style="width: 25%; text-align: right;">${item.precio.toFixed(2)}</div>
            </div>
        `).join('');

        const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

        // Construir trama real con formato SUNAT para el QR único
        const qrText = [
            empresa_ruc,
            comprobante.tipoComprobante,
            comprobante.serie,
            comprobante.correlativo,
            igvVal.toFixed(2),
            totalVal.toFixed(2),
            venta.fecha,
            comprobante.tipoDocCliente,
            clientDocVal
        ].join('|');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;

        ticketContainer.innerHTML = `
            <div style="text-align: center; margin-bottom: 12px;">
                <div style="font-size: 18px; font-weight: bold; background: #000; color: #fff; padding: 6px 12px; display: inline-block; margin-bottom: 5px; border-radius: 4px; letter-spacing: 2px;">
                    OPTICA ROMA
                </div>
                <div style="font-weight: bold; font-size: 13px; margin-top: 5px;">${empresa_nombre}</div>
                <div style="font-size: 11px;">RUC: ${empresa_ruc}</div>
                <div style="font-size: 11px;">${empresa_direccion}</div>
                <div style="font-size: 11px;">Telf: ${empresa_telefono}</div>
                <div style="font-size: 11px;">Email: ${empresa_email}</div>
                
            </div>

            <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin-bottom: 10px; text-align: center; font-weight: bold;">
                ${docName}<br>
                ${serialDoc}
            </div>

            <div style="margin-bottom: 10px; font-size: 11px;">
                <div style="display: flex;"><span style="width: 35%; font-weight: bold;">${clientNameLabel}:</span> <span style="width: 65%; text-transform: uppercase;">${clientNameVal}</span></div>
                <div style="display: flex;"><span style="width: 35%; font-weight: bold;">${clientDocLabel}:</span> <span style="width: 65%;">${clientDocVal}</span></div>
                <div style="display: flex;"><span style="width: 35%; font-weight: bold;">FECHA:</span> <span style="width: 65%;">${venta.fecha}</span></div>
                <div style="display: flex;"><span style="width: 35%; font-weight: bold;">HORA:</span> <span style="width: 65%;">${timeStr}</span></div>
            </div>

            <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px; font-weight: bold; display: flex; font-size: 11px;">
                <div style="width: 15%;">CANT</div>
                <div style="width: 60%;">DESCRIPCION</div>
                <div style="width: 25%; text-align: right;">TOTAL</div>
            </div>

            <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; font-size: 11px;">
                ${itemsHtml}
            </div>

            <div style="margin-bottom: 10px; font-size: 11px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>TOTAL GRAVADO (S/)</span>
                    <span style="font-weight: bold;">${gravadoVal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>I.G.V. (18%) (S/)</span>
                    <span style="font-weight: bold;">${igvVal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; border-top: 1px dashed #000; padding-top: 4px;">
                    <span>TOTAL (S/)</span>
                    <span>${totalVal.toFixed(2)}</span>
                </div>
            </div>

            <div style="font-size: 10px; margin-bottom: 12px; text-transform: uppercase;">
                ${this.numeroALetras(totalVal)}<br>
                <strong>FORMA DE PAGO:</strong> ${venta.modalidad_pago}<br>
                <strong>COND. VENTA:</strong> CONTADO
            </div>

            <!-- Codigo QR de Representacion de SUNAT -->
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="display: inline-block; padding: 4px; border: 1px solid #000; background: #fff;">
                    <img src="${qrUrl}" style="width: 90px; height: 90px; display: block;" alt="Codigo QR SUNAT">
                </div>
                <div style="font-size: 9px; color: #555; margin-top: 6px; line-height: 1.2;">
                    Representacion Impresa de la ${isBoleta ? 'BOLETA' : 'FACTURA'} DE VENTA ELECTRONICA<br>
                    Autorizado mediante Resolucion Nro. 034-005-0007241
                </div>
            </div>

            <div style="text-align: center; font-size: 10px; font-weight: bold; letter-spacing: 1px;">
                GRACIAS POR SU PREFERENCIA
            </div>
        `;
    }
}
