import { UIHelper } from './UIHelper.js';

/**
 * Vista para el módulo de Clientes (HU01)
 * Gestiona el DOM y las validaciones de los campos.
 */
export class ClientView {
    constructor() {
        this.tableBody = document.querySelector('#clientsManagementTable tbody');
        this.modal = document.getElementById('addClientManagementModal');
        this.form = document.getElementById('addClientManagementForm');
        this.btnAdd = document.getElementById('btnOpenClientModal');
        this.closeBtn = document.querySelector('.client-mgmt-close');
        
        // Modal Historial
        this.historyModal = document.getElementById('historyModal');
        this.historyList = document.getElementById('historyList');
        this.historyClientName = document.getElementById('historyClientName');
        this.historyCloseBtn = document.querySelector('.history-close');

        // Modal Proforma
        this.proformaModal = document.getElementById('proformaModal');
        this.proformaForm = document.getElementById('proformaForm');
        this.proformaCloseBtn = document.querySelector('.proforma-close');
        this.proformaClientIdInput = document.getElementById('proforma_client_id');
        this.proformaClientNameInput = document.getElementById('proforma_client_name');
        this.proformaClientPhoneInput = document.getElementById('proforma_client_phone');
        this.proformaDetailInput = document.getElementById('proforma_detail');
        this.proformaExtraInput = document.getElementById('proforma_extra');
        this.proformaAmountInput = document.getElementById('proforma_amount');
        this.proformaChannelSelect = document.getElementById('proforma_channel');
        this.proformaMessageInput = document.getElementById('proforma_message');
        this.proformaPreview = document.getElementById('proforma_preview');
        this.proformaMessageTouched = false;
        
        // Inputs
        this.dniInput = document.getElementById('cl_dni');
        this.nameInput = document.getElementById('cl_name');
        this.phoneInput = document.getElementById('cl_phone');
    }

    /**
     * Renderiza la tabla de clientes.
     * @param {Array} clients Lista de clientes.
     */
    renderTable(clients) {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';
        
        clients.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.dni || 'N/A'}</strong></td>
                <td>${UIHelper.normalizeText(c.nombre)}</td>
                <td>${c.celular}</td>
                <td style="text-align: right;">
                    <button class="btn-proforma" data-id="${c.id}" data-name="${c.nombre}" data-phone="${c.celular}" title="Enviar Cotizacion" style="background: #27ae60; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        <i class='bx bx-message-rounded-detail'></i>
                    </button>
                    <button class="btn-history" data-id="${c.id}" data-name="${c.nombre}" title="Ver Historial Visual" style="background: #7f8c8d; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        <i class='bx bx-history'></i>
                    </button>
                    <button class="btn-edit" data-id="${c.id}" style="background: #2e61b3; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button class="btn-delete" data-id="${c.id}" style="background: #e74c3c; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            this.tableBody.appendChild(tr);
        });
    }

    /**
     * Abre el modal de registro/edición.
     * @param {boolean} isEdit Si es modo edición.
     */
    openModal(isEdit = false) {
        this.form.reset();
        const title = document.getElementById('clientMgmtModalTitle');
        if (title) title.innerText = isEdit ? 'Editar Cliente' : 'Nuevo Cliente';
        if (this.modal) this.modal.style.display = 'block';
    }

    /**
     * Cierra el modal.
     */
    closeModal() {
        if (this.modal) this.modal.style.display = 'none';
        this.form.reset();
    }

    /**
     * Obtiene los datos del formulario con validaciones básicas (HU01).
     * @returns {Object|null} Datos del cliente o null si falla la validación.
     */
    getFormData() {
        const dni = this.dniInput.value.trim();
        const nombre = this.nameInput.value.trim();
        const celular = this.phoneInput.value.trim();

        // Validación HU01: DNI de 8 dígitos
        const dniRegex = /^[0-9]{8}$/;
        if (!dniRegex.test(dni)) {
            UIHelper.showCustomAlert('El DNI debe tener exactamente 8 dígitos numéricos.', 'ERROR');
            return null;
        }

        // Validación HU01: Nombre no vacío
        if (nombre === '') {
            UIHelper.showCustomAlert('El nombre es obligatorio.', 'ERROR');
            return null;
        }

        // Validación HU01: Celular de 9 dígitos numéricos
        const phoneRegex = /^[0-9]{9}$/;
        if (!phoneRegex.test(celular)) {
            UIHelper.showCustomAlert('El celular debe tener exactamente 9 dígitos numéricos.', 'ERROR');
            return null;
        }

        return { dni, nombre, celular };
    }

    // --- BINDERS ---

    bindOpenModal(handler) {
        if (this.btnAdd) this.btnAdd.addEventListener('click', () => handler());
    }

    /**
     * Vincula la búsqueda automática por DNI en la gestión de clientes
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

    bindCloseModal() {
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target == this.modal) this.closeModal();
        });
    }

    bindSubmit(handler) {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = this.getFormData();
                if (data) handler(data);
            });
        }
    }

    bindTableActions(editHandler, deleteHandler, historyHandler, proformaHandler) {
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => {
                const btnEdit = e.target.closest('.btn-edit');
                const btnDelete = e.target.closest('.btn-delete');
                const btnHistory = e.target.closest('.btn-history');
                const btnProforma = e.target.closest('.btn-proforma');
                
                if (btnEdit) editHandler(btnEdit.dataset.id);
                if (btnDelete) deleteHandler(btnDelete.dataset.id);
                if (btnHistory) historyHandler(btnHistory.dataset.id, btnHistory.dataset.name);
                if (btnProforma) {
                    proformaHandler({
                        id: btnProforma.dataset.id,
                        nombre: btnProforma.dataset.name,
                        celular: btnProforma.dataset.phone
                    });
                }
            });
        }
    }

    openProformaModal(client, monturas = []) {
        if (!this.proformaModal || !this.proformaForm) return;
        this.proformaForm.reset();
        this.proformaClientIdInput.value = client.id;
        this.proformaClientNameInput.value = client.nombre;
        this.proformaClientPhoneInput.value = client.celular;
        this.populateProformaMonturas(monturas);
        this.proformaDetailInput.value = '';
        if (this.proformaExtraInput) this.proformaExtraInput.value = '';
        this.proformaAmountInput.value = '';
        this.proformaMessageTouched = false;
        if (this.proformaChannelSelect) this.proformaChannelSelect.value = 'SMS';
        this.updateProformaMessage(true);
        this.proformaModal.style.display = 'block';
    }

    populateProformaMonturas(monturas) {
        if (!this.proformaDetailInput) return;
        this.proformaDetailInput.innerHTML = '<option value="">Seleccione una montura...</option>';

        monturas
            .filter(m => (parseInt(m.stock_disponible) || 0) > 0)
            .forEach(m => {
                const opt = document.createElement('option');
                opt.value = `${m.codigo} - ${m.nombre}`;
                opt.text = `${m.codigo} - ${m.nombre} (S/. ${parseFloat(m.precio_venta || 0).toFixed(2)})`;
                opt.dataset.precio = m.precio_venta || 0;
                this.proformaDetailInput.appendChild(opt);
            });
    }

    closeProformaModal() {
        if (this.proformaModal) this.proformaModal.style.display = 'none';
        if (this.proformaForm) this.proformaForm.reset();
    }

    updateProformaMessage(force = false) {
        if (!this.proformaMessageInput) return;
        if (this.proformaMessageTouched && !force) return;
        const cliente = this.proformaClientNameInput?.value || 'cliente';
        const detalle = this.proformaDetailInput?.value || 'una montura disponible';
        const extra = this.proformaExtraInput?.value?.trim();
        const monto = parseFloat(this.proformaAmountInput?.value) || 0;
        const extraText = extra ? ` ${extra}.` : '';
        const message = `Hola ${cliente}, soy de Optica Roma. Te comparto una cotizacion referencial: ${detalle}${extraText} Total aprox. S/. ${monto.toFixed(2)}. Si deseas, puedes acercarte a tienda para separar tu pedido.`;
        this.proformaMessageInput.value = message;
        if (this.proformaPreview) this.proformaPreview.innerText = message;
    }

    bindProformaForm(handler) {
        if (this.proformaDetailInput) {
            this.proformaDetailInput.addEventListener('change', () => {
                const selected = this.proformaDetailInput.options[this.proformaDetailInput.selectedIndex];
                if (selected?.dataset?.precio) {
                    this.proformaAmountInput.value = parseFloat(selected.dataset.precio).toFixed(2);
                }
                this.updateProformaMessage();
            });
        }
        if (this.proformaExtraInput) this.proformaExtraInput.addEventListener('input', () => this.updateProformaMessage());
        if (this.proformaAmountInput) this.proformaAmountInput.addEventListener('input', () => this.updateProformaMessage());
        if (this.proformaMessageInput) {
            this.proformaMessageInput.addEventListener('input', () => {
                this.proformaMessageTouched = true;
                if (this.proformaPreview) this.proformaPreview.innerText = this.proformaMessageInput.value;
            });
        }

        if (this.proformaForm) {
            this.proformaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handler({
                    id: this.proformaClientIdInput.value,
                    nombre: this.proformaClientNameInput.value,
                    celular: this.proformaClientPhoneInput.value,
                    detalle: this.proformaDetailInput.value,
                    extra: this.proformaExtraInput ? this.proformaExtraInput.value : '',
                    monto: parseFloat(this.proformaAmountInput.value) || 0,
                    canal: 'SMS',
                    mensaje: this.proformaMessageInput.value
                });
            });
        }
    }

    /**
     * Muestra el historial en el modal con un diseño profesional y etiquetas claras.
     * @param {string} clientName 
     * @param {Array} history 
     */
    showHistory(clientName, history) {
        this.historyClientName.innerText = clientName;
        this.historyList.innerHTML = '';

        if (history.length === 0) {
            this.historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No se encontraron recetas previas para este cliente.</p>';
        } else {
            history.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.style.cssText = `
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    border-left: 5px solid #2e61b3;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                `;

                // Parsear medidas: OD(-1.25, -0.5, 90) OI(-1.00, -0.75, 85) DIP(62)
                const odMatch = item.medidas.match(/OD\((.*?),(.*?),(.*?)\)/);
                const oiMatch = item.medidas.match(/OI\((.*?),(.*?),(.*?)\)/);
                const dipMatch = item.medidas.match(/DIP\((.*?)\)/);

                const getEyeHtml = (title, match) => {
                    if(!match) return '';
                    return `
                        <div style="flex: 1; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e1e8ed;">
                            <div style="color: #2e61b3; font-weight: bold; font-size: 12px; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 4px; text-align: center;">${title}</div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; color: #666;">ESF:</span> <strong style="color: #2c3e50;">${match[1].trim()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; color: #666;">CIL:</span> <strong style="color: #2c3e50;">${match[2].trim()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-size: 11px; color: #666;">EJE:</span> <strong style="color: #2c3e50;">${match[3].trim()}°</strong>
                            </div>
                        </div>
                    `;
                };

                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 13px; font-weight: bold; color: #34495e;"><i class='bx bx-calendar'></i> ${item.fecha}</span>
                        <span style="font-size: 11px; color: #95a5a6; background: #eee; padding: 2px 8px; border-radius: 10px;">Ticket: ${item.codigo_venta}</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${getEyeHtml('OJO DERECHO (OD)', odMatch)}
                        ${getEyeHtml('OJO IZQUIERDO (OI)', oiMatch)}
                    </div>
                    ${dipMatch ? `
                        <div style="margin-top: 10px; text-align: center; font-size: 12px; color: #7f8c8d; background: #fff; padding: 5px; border-radius: 8px; border: 1px solid #e1e8ed;">
                            <strong>DIP:</strong> ${dipMatch[1]} mm
                        </div>
                    ` : ''}
                `;
                this.historyList.appendChild(div);
            });
        }

        this.historyModal.style.display = 'block';
    }

    bindCloseHistory() {
        if (this.historyCloseBtn) {
            this.historyCloseBtn.addEventListener('click', () => {
                this.historyModal.style.display = 'none';
            });
        }
        if (this.proformaCloseBtn) {
            this.proformaCloseBtn.addEventListener('click', () => this.closeProformaModal());
        }
        window.addEventListener('click', (e) => {
            if (e.target == this.historyModal) this.historyModal.style.display = 'none';
            if (e.target == this.proformaModal) this.closeProformaModal();
        });
    }
}
