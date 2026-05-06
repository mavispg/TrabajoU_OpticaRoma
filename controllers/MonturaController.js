import { MonturaModel } from '../models/MonturaModel.js';
import { MonturaView } from '../views/MonturaView.js';
import { UIHelper } from '../views/UIHelper.js';

export class MonturaController {
    constructor() {
        this.view = new MonturaView();
        this.isEditing = false;
        this.currentEditId = null;

        // Bind events
        this.view.bindAddMontura(this.handleAddMonturaClick.bind(this));
        this.view.bindCloseModal();
        this.view.bindSubmitForm(this.handleFormSubmit.bind(this));
        this.view.bindTableActions(this.handleEditClick.bind(this), this.handleDeleteClick.bind(this));
        this.view.bindSearch();

        // Cargar datos iniciales
        this.init();
    }

    async init() {
        await this.render();
    }

    async render() {
        try {
            const monturas = await MonturaModel.getAll();
            const rawRole = (window.app && window.app.getRole()) ? window.app.getRole() : 'vendedora';
            const role = rawRole.toLowerCase().includes('admin') ? 'admin' : 'vendedora';
            this.view.renderTable(monturas || [], role);
        } catch (error) {
            console.error('Error al renderizar monturas:', error);
        }
    }

    async handleAddMonturaClick() {
        this.isEditing = false;
        this.currentEditId = null;
        const nextCode = await MonturaModel.getNextCode();
        this.view.openModal(false, nextCode);
    }

    async handleEditClick(id) {
        this.isEditing = true;
        this.currentEditId = id;
        const monturas = await MonturaModel.getAll();
        const montura = monturas.find(m => m.id === id);
        if (montura) {
            this.view.openModal(true);
            this.view.populateForm(montura);
        }
    }

    async handleFormSubmit(formData) {
        try {
            if (this.isEditing && this.currentEditId) {
                await MonturaModel.update(this.currentEditId, formData);
                UIHelper.showCustomAlert('Montura actualizada con éxito.', 'ÉXITO');
            } else {
                await MonturaModel.create(formData);
                UIHelper.showCustomAlert('Montura registrada con éxito.', 'ÉXITO');
            }

            this.view.closeModal();
            await this.render();
        } catch (error) {
            console.error('Error al guardar montura:', error);
            UIHelper.showCustomAlert('Error al guardar: ' + error.message, 'ERROR');
        }
    }


    async handleDeleteClick(id) {
        const confirm = await UIHelper.showCustomConfirm('¿Estás seguro de eliminar esta montura?', { 
            title: 'ELIMINAR MONTURA', 
            confirmText: 'Eliminar', 
            isDanger: true 
        });
        
        if (confirm) {
            try {
                await MonturaModel.delete(id);
                await this.render();
            } catch (error) {
                console.error('Error al eliminar montura:', error);
                UIHelper.showCustomAlert('Error al eliminar montura', 'ERROR');
            }
        }
    }
}
