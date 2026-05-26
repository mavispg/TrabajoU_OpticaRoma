import { UIHelper } from './UIHelper.js';

export class DoctorView {
    constructor() {
        this.tableBody = document.querySelector('#doctoresTable tbody');
        this.modal = document.getElementById('addDoctorModal');
        this.form = document.getElementById('addDoctorForm');
        this.btnAdd = document.getElementById('btnAddDoctor');
        this.closeBtn = document.querySelector('.doctor-close');
        this.searchInput = document.getElementById('searchDoctoresInput');

        this.codeInput = document.getElementById('doc_id');
        this.nombreInput = document.getElementById('doc_nombre');
        this.especialidadInput = document.getElementById('doc_especialidad');

        // Modal de pago
        this.pagoModal = document.getElementById('pagoDocModal');
        this.pagoForm = document.getElementById('pagoDocForm');
        this.pagoCloseBtn = document.querySelector('.pago-doc-close');
        this.pagoMontoInput = document.getElementById('pago_doc_monto');
        this.pagoDocIdInput = document.getElementById('pago_doc_id');
        this.pagoModalidadInput = document.getElementById('pago_doc_modalidad');
    }

    renderTable(doctores, role = 'admin') {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';
        const isAdmin = role === 'admin';
        if (this.btnAdd) this.btnAdd.style.display = isAdmin ? 'flex' : 'none';

        if (doctores.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">No hay doctores registrados</td></tr>';
            return;
        }

        doctores.forEach(d => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', d.id);
            const pendiente = parseFloat(d.deuda_pendiente) || 0;
            const total = parseFloat(d.deuda_total) || 0;
            const consultas = parseInt(d.consultas_count) || 0;
            const estadoColor = pendiente === 0 ? '#27ae60' : '#e74c3c';
            const estadoText = pendiente === 0 ? 'AL DÍA' : 'DEBE';

            tr.innerHTML = `
                <td><strong>${d.codigo}</strong></td>
                <td>${d.nombre}</td>
                <td>${d.especialidad || 'General'}</td>
                <td style="text-align:center;">
                    <span style="background:#e8f4fd;color:#2e61b3;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700;">${consultas}</span>
                    <br><small style="color:#aaa;">consultas</small>
                </td>
                <td>
                    <strong style="color:${estadoColor}; font-size: 15px;">${UIHelper.formatCurrency(pendiente)}</strong>
                    <br><span style="background:${estadoColor}15;color:${estadoColor};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;display:inline-block;margin-top:4px;">${estadoText}</span>
                    <br><small style="color:#777;font-size:11px;">Acumulado: ${UIHelper.formatCurrency(total)}</small>
                </td>
                <td class="actions-cell">
                    ${isAdmin
                        ? `<div class="actions-wrapper">
                            ${pendiente > 0 ? `<button class="icon-btn pago-btn" title="Registrar Pago" style="color:#27ae60;"><i class='bx bx-dollar-circle'></i></button>` : ''}
                            <button class="icon-btn edit-btn" title="Editar"><i class='bx bxs-edit-alt'></i></button>
                            <button class="icon-btn delete-btn" title="Eliminar"><i class='bx bxs-trash'></i></button>
                        </div>`
                        : '<span style="color:#7f8c8d;font-size:12px;font-weight:600;">Solo lectura</span>'}
                </td>
            `;
            this.tableBody.appendChild(tr);
        });
    }

    openModal(isEdit = false, nextCode = '') {
        if (!this.form) return;
        this.form.reset();
        const title = document.querySelector('#addDoctorModal h2');
        if (title) title.innerText = isEdit ? 'Editar Doctor' : 'Registrar Nuevo Doctor';
        if (!isEdit && this.codeInput) this.codeInput.value = nextCode;
        if (this.modal) this.modal.style.display = 'block';
    }

    populateForm(doctor) {
        if (this.codeInput) this.codeInput.value = doctor.codigo;
        if (this.nombreInput) this.nombreInput.value = doctor.nombre;
        if (this.especialidadInput) this.especialidadInput.value = doctor.especialidad || '';
    }

    closeModal() {
        if (this.modal) this.modal.style.display = 'none';
        if (this.form) this.form.reset();
    }

    getFormData() {
        return {
            codigo: this.codeInput ? this.codeInput.value : '',
            nombre: this.nombreInput ? this.nombreInput.value : '',
            especialidad: this.especialidadInput ? this.especialidadInput.value : 'General'
        };
    }

    openPagoModal(doctorId) {
        if (this.pagoForm) this.pagoForm.reset();
        if (this.pagoDocIdInput) this.pagoDocIdInput.value = doctorId;
        if (this.pagoModal) this.pagoModal.style.display = 'block';
    }

    closePagoModal() {
        if (this.pagoModal) this.pagoModal.style.display = 'none';
        if (this.pagoForm) this.pagoForm.reset();
    }

    bindAddDoctor(handler) {
        if (this.btnAdd) this.btnAdd.addEventListener('click', () => handler());
    }

    bindCloseModal() {
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
        if (this.pagoCloseBtn) this.pagoCloseBtn.addEventListener('click', () => this.closePagoModal());
        window.addEventListener('click', e => { if (e.target === this.pagoModal) this.closePagoModal(); });
    }

    bindSubmitForm(handler) {
        if (this.form) {
            this.form.addEventListener('submit', e => {
                e.preventDefault();
                handler(this.getFormData());
            });
        }
    }

    bindPagoForm(handler) {
        if (this.pagoForm) {
            this.pagoForm.addEventListener('submit', e => {
                e.preventDefault();
                const id = this.pagoDocIdInput ? this.pagoDocIdInput.value : '';
                const monto = this.pagoMontoInput ? parseFloat(this.pagoMontoInput.value) || 0 : 0;
                const modalidad = this.pagoModalidadInput ? this.pagoModalidadInput.value : 'EFECTIVO';
                handler(id, monto, modalidad);
            });
        }
    }

    bindTableActions(editHandler, deleteHandler, pagoHandler) {
        if (this.tableBody) {
            this.tableBody.addEventListener('click', e => {
                const row = e.target.closest('tr');
                if (!row) return;
                const id = row.getAttribute('data-id');
                if (e.target.closest('.delete-btn')) deleteHandler(id);
                if (e.target.closest('.edit-btn')) editHandler(id);
                if (e.target.closest('.pago-btn')) pagoHandler(id);
            });
        }
    }

    bindSearch() {
        if (this.searchInput && this.tableBody) {
            this.searchInput.addEventListener('keyup', e => {
                const filter = e.target.value.toLowerCase();
                this.tableBody.querySelectorAll('tr').forEach(row => {
                    row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none';
                });
            });
        }
    }
}
