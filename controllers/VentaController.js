import { VentaModel } from '../models/VentaModel.js';
import { MonturaModel } from '../models/MonturaModel.js';
import { UsersModel } from '../models/UsersModel.js';
import { ClientModel } from '../models/ClientModel.js';
import { VentaView } from '../views/VentaView.js';
import { UIHelper } from '../views/UIHelper.js';

export class VentaController {
    constructor() {
        this.view = new VentaView();
        this.isEditing = false;
        this.isEditing = false;
        this.currentEditId = null;
        this.usersModel = new UsersModel();

        // Bind events
        this.view.bindAddVenta(this.handleAddVentaClick.bind(this));
        this.view.bindCloseModal();
        this.view.bindSubmitForm(this.handleFormSubmit.bind(this));
        this.view.bindTableActions(this.handleEditClick.bind(this), this.handleDeleteClick.bind(this));
        this.view.bindSearch();
        this.view.bindMonturaSelect();
        this.view.bindDniSearch(this.handleDniSearch.bind(this));
        this.view.bindQuickAddClient(this.handleQuickAddClient.bind(this));

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

        // Cargar vendedoras (usuarios)
        const vendedoras = await this.usersModel.getAll();
        this.view.populateVendedorasSelect(vendedoras);

        // Cargar clientes (HU01)
        const clientes = await ClientModel.getAll();
        this.view.populateClientesSelect(clientes);
    }

    async handleEditClick(id) {
        this.isEditing = true;
        this.currentEditId = id;
        
        const ventas = await VentaModel.getAll();
        const venta = ventas.find(v => v.id === id);
        
        if (venta) {
            const monturas = await MonturaModel.getAll();
            this.view.populateMonturasSelect(monturas);
            
            const vendedoras = await this.usersModel.getAll();
            this.view.populateVendedorasSelect(vendedoras);
            
            const clientes = await ClientModel.getAll();
            this.view.populateClientesSelect(clientes);

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
        const confirm = await UIHelper.showCustomConfirm('¿Estás seguro de eliminar este registro de venta? El stock de la montura será devuelto automáticamente.', { 
            title: 'ELIMINAR VENTA', 
            confirmText: 'Eliminar y Reponer Stock', 
            isDanger: true 
        });
        
        if (confirm) {
            try {
                // 1. Obtener datos de la venta antes de borrarla para saber qué montura reponer
                const venta = await VentaModel.getById(id);
                
                if (venta && venta.montura_id) {
                    // 2. Reponer el stock (+1)
                    await MonturaModel.updateStock(venta.montura_id, 1);
                    console.log(`Stock repuesto para montura: ${venta.montura_id}`);
                }

                // 3. Eliminar la venta
                await VentaModel.delete(id);
                
                // 4. Refrescar tablas
                await this.render();
                
                // Refrescar catálogo de monturas si el controlador existe
                if (window.app && window.app.monturaController) {
                    window.app.monturaController.render();
                }

                UIHelper.showCustomAlert('Venta eliminada y stock actualizado.', 'SUCCESS');
            } catch (error) {
                console.error('Error al eliminar venta:', error);
                UIHelper.showCustomAlert('Error al eliminar venta', 'ERROR');
            }
        }
    }

    /**
     * Busca cliente por DNI y autocompleta (HU01)
     */
    async handleDniSearch(dni) {
        try {
            const client = await ClientModel.getByDni(dni);
            if (client) {
                this.view.nameInput.value = client.nombre;
            } else {
                UIHelper.showCustomAlert('Cliente no encontrado. Haz clic en "+" para registrarlo.', 'INFO');
                this.view.nameInput.value = "";
            }
        } catch (error) {
            console.error("Error buscando DNI:", error);
        }
    }

    /**
     * Abre el modal de clientes desde ventas
     */
    handleQuickAddClient() {
        // Obtenemos la instancia de ClientController a través de AppController si es necesario, 
        // o simplemente disparamos el evento del botón de nuevo cliente.
        const btnOpenClient = document.getElementById('btnOpenClientModal');
        if (btnOpenClient) btnOpenClient.click();
    }
}
