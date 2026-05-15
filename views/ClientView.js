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
                <td>${c.nombre}</td>
                <td>${c.celular}</td>
                <td style="text-align: right;">
                    <button class="btn-history" data-id="${c.id}" data-name="${c.nombre}" title="Ver Historial Visual" style="background: #27ae60; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
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

    bindTableActions(editHandler, deleteHandler, historyHandler) {
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => {
                const btnEdit = e.target.closest('.btn-edit');
                const btnDelete = e.target.closest('.btn-delete');
                const btnHistory = e.target.closest('.btn-history');
                
                if (btnEdit) editHandler(btnEdit.dataset.id);
                if (btnDelete) deleteHandler(btnDelete.dataset.id);
                if (btnHistory) historyHandler(btnHistory.dataset.id, btnHistory.dataset.name);
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
        window.addEventListener('click', (e) => {
            if (e.target == this.historyModal) this.historyModal.style.display = 'none';
        });
    }
}
