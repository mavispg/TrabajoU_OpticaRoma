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
        await this.loadMonturas();
    }

    async loadMonturas() {
        try {
            const monturas = await MonturaModel.getAll();
            this.view.renderTable(monturas);
        } catch (error) {
            console.error('Error al cargar monturas:', error);
        }
    }

    async handleAddMonturaClick() {
        this.isEditing = false;
        this.currentEditId = null;
        const nextCode = await MonturaModel.getNextCode();
        this.view.openModal(false, nextCode);
    }

    async handleFormSubmit(formData) {
        try {
            if (this.isEditing && this.currentEditId) {
                await MonturaModel.update(this.currentEditId, formData);
            } else {
                await MonturaModel.create(formData);
            }
            this.view.closeModal();
            await this.loadMonturas();
        } catch (error) {
            console.error('Error al guardar montura:', error);
            UIHelper.showCustomAlert('Error al guardar montura: ' + error.message, 'ERROR');
        }
    }

    handleEditClick(id, cells) {
        this.isEditing = true;
        this.currentEditId = id;
        this.view.openModal(true);
        this.view.populateForm(cells);
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
                await this.loadMonturas();
            } catch (error) {
                console.error('Error al eliminar montura:', error);
                UIHelper.showCustomAlert('Error al eliminar montura', 'ERROR');
            }
        }
    }
}
