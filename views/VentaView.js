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
        this.monturaSelect = document.getElementById('sel_montura_pivot');
        this.lunasInput = document.getElementById('c_lunas');
        this.labSelect = document.getElementById('sel_lab');
        this.othersInput = document.getElementById('c_others');
        this.vendedoraInput = document.getElementById('sel_vendedora');
        this.totalInput = document.getElementById('c_total');
        this.methodSelect = document.getElementById('split_method_1');

        // Nuevos campos de medida
        this.odEsf = document.getElementById('m_od_esf');
        this.odCil = document.getElementById('m_od_cil');
        this.odEje = document.getElementById('m_od_eje');
        this.oiEsf = document.getElementById('m_oi_esf');
        this.oiCil = document.getElementById('m_oi_cil');
        this.oiEje = document.getElementById('m_oi_eje');
        this.dipInput = document.getElementById('m_dip');
    }

    renderTable(ventas, role = 'admin') {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';
        ventas.forEach(v => {
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', v.id);
            
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

            const actionsHtml = (role === 'admin') 
                ? `<div class="actions-wrapper">
                        <button class="icon-btn edit-btn" title="Editar Venta"><i class='bx bxs-edit-alt'></i></button>
                        <button class="icon-btn delete-btn" title="Eliminar Venta"><i class='bx bxs-trash'></i></button>
                   </div>`
                : `<span class="badge-role">REGISTRADO</span>`;

            newRow.innerHTML = `
                <td><strong>${v.codigo_venta}</strong></td>
                <td>${v.nombre_cliente || 'N/A'}</td>
                <td style="padding: 12px 8px;">${formattedDatos || 'N/A'}</td>
                <td>${v.fecha}</td>
                <td><strong>${UIHelper.formatCurrency(v.monto_total)}</strong><br><small>${methodHtml}</small></td>
                <td><span class="status-badge status-paid">${v.estado}</span></td>
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
        this.dniInput.value = ""; 
        this.monturaSelect.value = venta.montura_id || '';
        
        // Limpiar inputs antes de llenar
        this.lunasInput.value = "";
        this.labSelect.value = "";
        this.othersInput.value = "";
        this.vendedoraInput.value = "";

        // Parsear datos_compra
        if (venta.datos_compra) {
            const partes = venta.datos_compra.split('|');
            partes.forEach(p => {
                const txt = p.trim();
                if (txt.startsWith("L:")) this.lunasInput.value = txt.replace("L:", "").trim();
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

        this.totalInput.value = venta.monto_total;
        this.methodSelect.value = venta.modalidad_pago;
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
    }

    getFormData() {
        let datosCompra = "";
        
        if (this.monturaSelect.selectedIndex > 0) {
            const monturaText = this.monturaSelect.options[this.monturaSelect.selectedIndex].text;
            datosCompra += "M: " + monturaText.split('(')[0].trim() + " ";
        }

        if (this.lunasInput.value.trim() !== '') {
            datosCompra += "| L: " + this.lunasInput.value.trim() + " ";
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
            nombre_cliente: this.nameInput.value,
            montura_id: this.monturaSelect.value || null,
            datos_compra: datosCompra,
            monto_total: parseFloat(this.totalInput.value) || 0,
            modalidad_pago: this.methodSelect.value
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
        window.addEventListener('click', (e) => {
            if (e.target == this.modal) this.closeModal();
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

    bindTableActions(editHandler, deleteHandler) {
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
            });
        }
    }

    bindSearch() {
        if (this.searchInput && this.tableBody) {
            this.searchInput.addEventListener('keyup', (e) => {
                const filter = e.target.value.toLowerCase();
                const rows = this.tableBody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
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
    
    // Autocompletar precio cuando seleccionan montura
    bindMonturaSelect() {
        if (this.monturaSelect) {
            this.monturaSelect.addEventListener('change', () => {
                const selected = this.monturaSelect.options[this.monturaSelect.selectedIndex];
                if (selected && selected.dataset.precio) {
                    this.totalInput.value = selected.dataset.precio;
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
                } else {
                    this.nameInput.value = "";
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
}
