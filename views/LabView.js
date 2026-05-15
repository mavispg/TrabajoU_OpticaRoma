/**
 * Vista para gestionar el modal de Laboratorios.
 */
export class LabView {
    constructor() {
        this.modal = document.getElementById('labMgmtModal');
        this.closeBtn = document.querySelector('.lab-mgmt-close');
        this.btnOpen = document.getElementById('btnOpenLabMgmt');
        
        this.inputName = document.getElementById('newLabName');
        this.btnAdd = document.getElementById('btnAddLab');
        this.tableBody = document.getElementById('labTableBody');
        
        // El select dentro del modal de ventas
        this.salesSelect = document.getElementById('sel_lab');
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.inputName.value = '';
    }

    /**
     * Llena el select de ventas con los laboratorios.
     */
    populateSelect(labs) {
        if (!this.salesSelect) return;
        this.salesSelect.innerHTML = '<option value="">Seleccione...</option>';
        labs.forEach(lab => {
            const opt = document.createElement('option');
            opt.value = lab.nombre;
            opt.text = lab.nombre;
            this.salesSelect.appendChild(opt);
        });
    }

    /**
     * Llena la tabla del modal de gestión.
     */
    renderTable(labs, deleteHandler) {
        this.tableBody.innerHTML = '';
        labs.forEach(lab => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${lab.nombre}</td>
                <td>
                    <button class="btn-delete-lab" data-id="${lab.id}" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:18px;">
                        <i class='bx bxs-trash'></i>
                    </button>
                </td>
            `;
            
            const delBtn = tr.querySelector('.btn-delete-lab');
            delBtn.addEventListener('click', () => deleteHandler(lab.id));
            
            this.tableBody.appendChild(tr);
        });
    }

    bindOpen(handler) {
        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', handler);
        }
    }

    bindClose() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        window.addEventListener('click', (e) => {
            if (e.target == this.modal) this.closeModal();
        });
    }

    bindAdd(handler) {
        if (this.btnAdd) {
            this.btnAdd.addEventListener('click', () => {
                const name = this.inputName.value.trim();
                if (name) handler(name);
            });
        }
    }
}
