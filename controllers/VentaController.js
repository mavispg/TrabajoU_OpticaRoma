import { VentaModel } from '../models/VentaModel.js';
import { MonturaModel } from '../models/MonturaModel.js';
import { VentaView } from '../views/VentaView.js';
import { UIHelper } from '../views/UIHelper.js';

export class VentaController {
    constructor() {
        this.view = new VentaView();
        this.isEditing = false;
        this.currentEditId = null;

        // Bind events
        this.view.bindAddVenta(this.handleAddVentaClick.bind(this));
        this.view.bindCloseModal();
        this.view.bindSubmitForm(this.handleFormSubmit.bind(this));
        this.view.bindTableActions(this.handleEditClick.bind(this), this.handleDeleteClick.bind(this));
        this.view.bindSearch();
        this.view.bindMonturaSelect();

        // Cargar datos iniciales
        this.init();
    }

    async init() {
        await this.render();
    }

    async render() {
        try {
            const ventas = await VentaModel.getAll();
            const rawRole = (window.app && window.app.getRole()) ? window.app.getRole() : 'vendedora';
            const role = rawRole.toLowerCase().includes('admin') ? 'admin' : 'vendedora';
            this.view.renderTable(ventas || [], role);
        } catch (error) {
            console.error('Error al renderizar ventas:', error);
        }
    }

    async handleAddVentaClick() {
        this.isEditing = false;
        this.currentEditId = null;
        const nextCode = await VentaModel.getNextCode();
        this.view.openModal(false, nextCode);
        
        // Cargar monturas disponibles para el select
        const monturas = await MonturaModel.getAll();
        this.view.populateMonturasSelect(monturas);
    }

    async handleEditClick(id) {
        this.isEditing = true;
        this.currentEditId = id;
        
        const ventas = await VentaModel.getAll();
        const venta = ventas.find(v => v.id === id);
        
        if (venta) {
            const monturas = await MonturaModel.getAll();
            this.view.populateMonturasSelect(monturas);
            this.view.openModal(true);
            this.view.populateForm(venta);
        }
    }

    async handleFormSubmit(formData) {
        try {
            if (this.isEditing && this.currentEditId) {
                await VentaModel.update(this.currentEditId, formData);
            } else {
                await VentaModel.create(formData);
                // HU06: Descuento de stock al crear
                if (formData.montura_id) {
                    const monturas = await MonturaModel.getAll();
                    const montura = monturas.find(m => m.id === formData.montura_id);
                    if (montura && montura.stock_disponible > 0) {
                        montura.stock_disponible -= 1;
                        await MonturaModel.update(montura.id, montura);
                    }
                }
            }

            this.view.closeModal();
            await this.render();
            UIHelper.showCustomAlert('Venta registrada con éxito.', 'ÉXITO');
        } catch (error) {
            console.error('Error al registrar venta:', error);
            UIHelper.showCustomAlert('Error al guardar venta: ' + error.message, 'ERROR');
        }
    }

    async handleDeleteClick(id) {
        const confirm = await UIHelper.showCustomConfirm('¿Estás seguro de eliminar este registro de venta?', { 
            title: 'ELIMINAR VENTA', 
            confirmText: 'Eliminar', 
            isDanger: true 
        });
        
        if (confirm) {
            try {
                await VentaModel.delete(id);
                await this.render();
            } catch (error) {
                console.error('Error al eliminar venta:', error);
                UIHelper.showCustomAlert('Error al eliminar venta', 'ERROR');
            }
        }
    }
}
