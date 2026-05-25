import { UIHelper } from './UIHelper.js';

export class GastoView {
    constructor() {
        this.tableBody = document.querySelector('#gastosTable tbody');
        this.modal = document.getElementById('addGastoModal');
        this.form = document.getElementById('addGastoForm');
        this.btnAdd = document.getElementById('btnAddGasto');
        this.closeBtn = document.querySelector('.gasto-close');
        this.searchInput = document.getElementById('searchGastosInput');

        this.codeInput = document.getElementById('g_id');
        this.fechaInput = document.getElementById('g_fecha');
        this.categoriaInput = document.getElementById('g_categoria');
        this.descripcionInput = document.getElementById('g_descripcion');
        this.montoInput = document.getElementById('g_monto');
        this.metodoPagoInput = document.getElementById('g_metodo_pago');
    }

    renderTable(gastos) {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';

        if (gastos.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">No hay gastos registrados</td></tr>';
            return;
        }

        gastos.forEach(g => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', g.id);
            const [y, m, d] = g.fecha.split('-');
            const fechaDisplay = `${d}/${m}/${y}`;

            let metodoIcon = '';
            if (g.modalidad_pago === 'EFECTIVO') metodoIcon = `<i class='bx bx-money' style='color:#27ae60'></i>`;
            else if (g.modalidad_pago === 'YAPE') metodoIcon = `<i class='bx bx-mobile' style='color:#7b2cbf'></i>`;
            else if (g.modalidad_pago === 'VISA') metodoIcon = `<i class='bx bxl-visa' style='color:#1a1f71'></i>`;

            tr.innerHTML = `
                <td><strong>${g.codigo}</strong></td>
                <td>${fechaDisplay}</td>
                <td><span style="background:#fff3e0;color:#e67e22;padding:2px 8px;border-radius:10px;font-size:12px;">${g.categoria}</span></td>
                <td>${g.descripcion || '—'}</td>
                <td><strong style="color:#e74c3c;">${UIHelper.formatCurrency(g.monto)}</strong><br><small>${metodoIcon} ${g.modalidad_pago}</small></td>
                <td class="actions-cell">
                    <div class="actions-wrapper">
                        <button class="icon-btn edit-btn" title="Editar"><i class='bx bxs-edit-alt'></i></button>
                        <button class="icon-btn delete-btn" title="Eliminar"><i class='bx bxs-trash'></i></button>
                    </div>
                </td>
            `;
            this.tableBody.appendChild(tr);
        });
    }

    openModal(isEdit = false, nextCode = '') {
        if (!this.form) return;
        this.form.reset();
        const title = document.querySelector('#addGastoModal h2');
        if (title) title.innerText = isEdit ? 'Editar Gasto' : 'Registrar Nuevo Gasto';
        if (!isEdit) {
            if (this.codeInput) this.codeInput.value = nextCode;
            // Fecha actual en zona local
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const localDate = new Date(today - offset).toISOString().split('T')[0];
            if (this.fechaInput) this.fechaInput.value = localDate;
        }
        if (this.modal) this.modal.style.display = 'block';
    }

    populateForm(gasto) {
        if (this.codeInput) this.codeInput.value = gasto.codigo;
        if (this.fechaInput) this.fechaInput.value = gasto.fecha;
        if (this.categoriaInput) this.categoriaInput.value = gasto.categoria;
        if (this.descripcionInput) this.descripcionInput.value = gasto.descripcion || '';
        if (this.montoInput) this.montoInput.value = gasto.monto;
        if (this.metodoPagoInput) this.metodoPagoInput.value = gasto.modalidad_pago;
    }

    closeModal() {
        if (this.modal) this.modal.style.display = 'none';
        if (this.form) this.form.reset();
    }

    getFormData() {
        return {
            codigo: this.codeInput ? this.codeInput.value : '',
            fecha: this.fechaInput ? this.fechaInput.value : '',
            categoria: this.categoriaInput ? this.categoriaInput.value : '',
            descripcion: this.descripcionInput ? this.descripcionInput.value : '',
            monto: this.montoInput ? parseFloat(this.montoInput.value) || 0 : 0,
            modalidad_pago: this.metodoPagoInput ? this.metodoPagoInput.value : 'EFECTIVO'
        };
    }

    bindAddGasto(handler) {
        if (this.btnAdd) this.btnAdd.addEventListener('click', () => handler());
    }

    bindCloseModal() {
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
    }

    bindSubmitForm(handler) {
        if (this.form) {
            this.form.addEventListener('submit', e => {
                e.preventDefault();
                handler(this.getFormData());
            });
        }
    }

    bindTableActions(editHandler, deleteHandler) {
        if (this.tableBody) {
            this.tableBody.addEventListener('click', e => {
                const row = e.target.closest('tr');
                if (!row) return;
                const id = row.getAttribute('data-id');
                if (e.target.closest('.delete-btn')) deleteHandler(id);
                if (e.target.closest('.edit-btn')) editHandler(id);
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
