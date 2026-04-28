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
        this.nameInput = document.getElementById('c_name');
        this.monturaSelect = document.getElementById('sel_montura_pivot');
        this.othersInput = document.getElementById('c_others');
        this.vendedoraInput = document.getElementById('sel_vendedora');
        this.totalInput = document.getElementById('c_total');
        this.methodSelect = document.getElementById('split_method_1');
    }

    renderTable(ventas) {
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

            newRow.innerHTML = `
                <td><strong>${v.codigo_venta}</strong></td>
                <td>${v.nombre_cliente || 'N/A'}</td>
                <td><small>${v.datos_compra}</small></td>
                <td>${v.fecha}</td>
                <td><strong>${UIHelper.formatCurrency(v.monto_total)}</strong><br><small>${methodHtml}</small></td>
                <td><span class="status-badge status-paid">${v.estado}</span></td>
                <td class="actions-cell">
                    <div class="actions-wrapper">
                        <button class="icon-btn edit-btn" title="Editar Venta"><i class='bx bxs-edit-alt'></i></button>
                        <button class="icon-btn delete-btn" title="Eliminar Venta"><i class='bx bxs-trash'></i></button>
                    </div>
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
        this.monturaSelect.value = venta.montura_id || '';
        this.totalInput.value = venta.monto_total;
        this.methodSelect.value = venta.modalidad_pago;
        
        // Extraer 'Otros' y 'Vend' de los datos concatenados si existen
        let otros = "";
        let vend = "";
        if (venta.datos_compra) {
            if (venta.datos_compra.includes('Otros:')) {
                otros = venta.datos_compra.split('Otros:')[1].split('|')[0].trim();
            }
            if (venta.datos_compra.includes('Vend:')) {
                vend = venta.datos_compra.split('Vend:')[1].trim();
            }
        }
        this.othersInput.value = otros;
        this.vendedoraInput.value = vend;
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
        
        if (this.othersInput.value.trim() !== '') {
            datosCompra += "| Otros: " + this.othersInput.value.trim();
        }
        
        if (this.vendedoraInput.value.trim() !== '') {
            datosCompra += " | Vend: " + this.vendedoraInput.value.trim();
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
}
