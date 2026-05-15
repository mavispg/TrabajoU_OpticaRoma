import { LabModel } from '../models/LabModel.js';
import { LabView } from '../views/LabView.js';
import { UIHelper } from '../views/UIHelper.js';

/**
 * Controlador para la gestión de laboratorios.
 */
export class LabController {
    constructor() {
        this.view = new LabView();
        
        this.view.bindOpen(this.handleOpen.bind(this));
        this.view.bindClose();
        this.view.bindAdd(this.handleAdd.bind(this));
        
        this.init();
    }

    async init() {
        await this.refreshData();
    }

    async refreshData() {
        try {
            const labs = await LabModel.getAll();
            this.view.populateSelect(labs);
            this.view.renderTable(labs, this.handleDelete.bind(this));
        } catch (error) {
            console.error("Error cargando laboratorios:", error);
        }
    }

    handleOpen() {
        this.view.openModal();
    }

    async handleAdd(name) {
        try {
            await LabModel.create(name);
            UIHelper.showCustomAlert('Laboratorio agregado con éxito', 'SUCCESS');
            await this.refreshData();
            this.view.inputName.value = '';
        } catch (error) {
            UIHelper.showCustomAlert('Error al agregar laboratorio', 'ERROR');
        }
    }

    async handleDelete(id) {
        UIHelper.showConfirmAlert('¿Estás seguro de eliminar este laboratorio?', async (confirmed) => {
            if (confirmed) {
                try {
                    await LabModel.delete(id);
                    UIHelper.showCustomAlert('Laboratorio eliminado', 'SUCCESS');
                    await this.refreshData();
                } catch (error) {
                    UIHelper.showCustomAlert('Error al eliminar: el laboratorio podría estar en uso.', 'ERROR');
                }
            }
        });
    }
}
