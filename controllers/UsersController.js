import { UsersModel } from '../models/UsersModel.js';
import { UIHelper } from '../views/UIHelper.js';

export class UsersController {
    constructor() {
        this.model = new UsersModel();
        this.tableBody = document.querySelector('#usersTable tbody');
        this.btnAddUser = document.getElementById('btnAddUser');
        
        // Modal Elements
        this.modal = document.getElementById('addUserModal');
        this.modalTitle = document.getElementById('userModalTitle');
        this.form = document.getElementById('addUserForm');
        this.closeBtn = document.querySelector('.user-close');
        
        // Inputs
        this.nameInput = document.getElementById('u_name');
        this.usernameInput = document.getElementById('u_username');
        this.passwordInput = document.getElementById('u_password');
        this.roleInput = document.getElementById('u_role');
        
        this.isEditing = false;
        this.currentEditId = null;

        this.init();
    }

    init() {
        this.render();

        if (this.btnAddUser) {
            this.btnAddUser.addEventListener('click', () => {
                this.isEditing = false;
                this.currentEditId = null;
                this.form.reset();
                this.modalTitle.innerText = 'Agregar Nuevo Vendedor';
                this.modal.style.display = 'block';
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target == this.modal) this.modal.style.display = 'none';
        });

        if (this.form) {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const data = {
                        name: this.nameInput.value,
                        username: this.usernameInput.value,
                        password: this.passwordInput.value,
                        role: this.roleInput.value
                    };

                    if (this.isEditing && this.currentEditId) {
                        await this.model.update(this.currentEditId, data);
                    } else {
                        await this.model.add(data);
                    }

                    this.modal.style.display = 'none';
                    await this.render();
                    UIHelper.showCustomAlert('Vendedor guardado con éxito.', 'ÉXITO');
                } catch (error) {
                    console.error('Error al guardar:', error);
                    UIHelper.showCustomAlert('Error al guardar: ' + error.message, 'ERROR');
                }
            });
        }
    }

    async render() {
        if (!this.tableBody) return;
        
        const users = await this.model.getAll();
        this.tableBody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.nombre}</td>
                <td><span class="badge-role">${(user.rol || '').toUpperCase()}</span></td>
                <td>${user.usuario}</td>
                <td>
                    <div class="pass-wrapper">
                        <span class="pass-text" data-pass="${user.contraseña}">******</span>
                        <button class="btn-toggle-pass"><i class='bx bx-show'></i></button>
                    </div>
                </td>
                <td style="text-align: right;">
                    <button class="btn-edit" data-id="${user.id}" style="margin-right: 5px; background: #2e61b3; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;"><i class='bx bx-edit-alt'></i></button>
                    <button class="btn-delete" data-id="${user.id}"><i class='bx bx-trash'></i></button>
                </td>
            `;
            this.tableBody.appendChild(tr);
        });

        // Bind toggle password
        this.tableBody.querySelectorAll('.btn-toggle-pass').forEach(btn => {
            btn.addEventListener('click', () => {
                const wrapper = btn.closest('.pass-wrapper');
                const span = wrapper.querySelector('.pass-text');
                const icon = btn.querySelector('i');
                const realPass = span.dataset.pass;

                if (span.innerText === '******') {
                    span.innerText = realPass;
                    icon.classList.replace('bx-show', 'bx-hide');
                } else {
                    span.innerText = '******';
                    icon.classList.replace('bx-hide', 'bx-show');
                }
            });
        });

        // Bind edit buttons
        this.tableBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                this.isEditing = true;
                this.currentEditId = btn.dataset.id;
                const users = await this.model.getAll();
                const user = users.find(u => u.id == this.currentEditId);
                
                this.modalTitle.innerText = 'Editar Vendedor';
                this.nameInput.value = user.nombre;
                this.usernameInput.value = user.usuario;
                this.passwordInput.value = user.contraseña;
                this.roleInput.value = user.rol;
                
                this.modal.style.display = 'block';
            });
        });

        // Bind delete buttons
        this.tableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirm = await UIHelper.showCustomConfirm('¿Estás seguro de eliminar este vendedor?', {
                    title: 'ELIMINAR VENDEDOR',
                    confirmText: 'Eliminar',
                    isDanger: true
                });

                if (confirm) {
                    this.model.delete(btn.dataset.id);
                    this.render();
                }
            });
        });
    }
}
