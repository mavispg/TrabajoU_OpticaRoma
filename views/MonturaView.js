import { UIHelper } from './UIHelper.js';

export class MonturaView {
    constructor() {
        this.tableBody = document.querySelector('#monturasTable tbody');
        this.modal = document.getElementById('addMonturaModal');
        this.form = document.getElementById('addMonturaForm');
        this.btnAdd = document.getElementById('btnAddMontura');
        this.closeBtn = document.querySelector('.montura-close');
        this.searchInput = document.getElementById('searchMonturasInput');
        
        // Inputs del formulario
        this.codeInput = document.getElementById('m_code');
        this.nameInput = document.getElementById('m_name');
        this.stockInput = document.getElementById('m_stock');
        this.sellPriceInput = document.getElementById('m_sell_price');
        this.modalTitle = document.querySelector('#addMonturaModal h2');
    }

    renderTable(monturas) {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';
        monturas.forEach(m => {
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', m.id);
            newRow.innerHTML = `
                <td>${m.codigo}</td>
                <td>${m.nombre}</td>
                <td>${m.stock_total}(${m.stock_disponible})</td>
                <td>${UIHelper.formatCurrency(m.precio_venta)}</td>
                <td class="actions-cell">
                    <div class="actions-wrapper">
                        <button class="icon-btn edit-btn"><i class='bx bxs-edit-alt'></i></button>
                        <button class="icon-btn delete-btn"><i class='bx bxs-trash'></i></button>
                    </div>
                </td>
            `;
            this.tableBody.appendChild(newRow);
        });
    }

    openModal(isEdit = false, nextCode = '') {
        this.form.reset();
        if (isEdit) {
            this.modalTitle.innerText = 'Editar Montura';
        } else {
            this.modalTitle.innerText = 'Agregar Nueva Montura';
            this.codeInput.value = nextCode;
        }
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
    }

    populateForm(cells) {
        this.codeInput.value = cells[0].innerText;
        this.nameInput.value = cells[1].innerText;
        const stockText = cells[2].innerText;
        const stockMatch = stockText.match(/(\d+)/);
        this.stockInput.value = stockMatch ? stockMatch[1] : stockText;
        const priceText = cells[3].innerText.replace('S/. ', '').replace(',', '');
        this.sellPriceInput.value = priceText;
    }

    getFormData() {
        return {
            codigo: this.codeInput.value,
            nombre: this.nameInput.value,
            stock_total: parseInt(this.stockInput.value) || 0,
            stock_disponible: parseInt(this.stockInput.value) || 0,
            precio_venta: parseFloat(this.sellPriceInput.value) || 0
        };
    }

    bindAddMontura(handler) {
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
                    const cells = row.getElementsByTagName('td');
                    editHandler(id, cells);
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
}
