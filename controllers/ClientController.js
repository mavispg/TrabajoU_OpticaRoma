import { ClientModel } from '../models/ClientModel.js';
import { VentaModel } from '../models/VentaModel.js';
import { ClientView } from '../views/ClientView.js';
import { UIHelper } from '../views/UIHelper.js';

/**
 * Controlador para la gestión de Clientes (HU01)
 * Conecta el modelo de datos con la interfaz de usuario.
 */
export class ClientController {
    constructor() {
        this.view = new ClientView();
        this.isEditing = false;
        this.currentEditId = null;

        // Vincular eventos de la vista
        this.view.bindOpenModal(this.handleOpenModal.bind(this));
        this.view.bindCloseModal();
        this.view.bindCloseHistory();
        this.view.bindSubmit(this.handleSubmit.bind(this));
        this.view.bindTableActions(this.handleEdit.bind(this), this.handleDelete.bind(this), this.handleShowHistory.bind(this));

        this.init();
    }

    /**
     * Inicializa el módulo cargando los datos.
     */
    async init() {
        await this.render();
    }

    /**
     * Carga y muestra la tabla de clientes.
     */
    async render() {
        try {
            const clients = await ClientModel.getAll();
            this.view.renderTable(clients);
        } catch (error) {
            console.error("Error al cargar clientes:", error);
        }
    }

    handleOpenModal() {
        this.isEditing = false;
        this.currentEditId = null;
        this.view.openModal(false);
    }

    /**
     * Procesa el guardado de un cliente (Nuevo o Editado).
     * @param {Object} formData Datos validados desde la vista.
     */
    async handleSubmit(formData) {
        try {
            if (this.isEditing && this.currentEditId) {
                await ClientModel.update(this.currentEditId, formData);
                UIHelper.showCustomAlert('Cliente actualizado correctamente.', 'ÉXITO');
            } else {
                await ClientModel.create(formData);
                UIHelper.showCustomAlert('Cliente registrado correctamente.', 'ÉXITO');
            }
            this.view.closeModal();
            await this.render();
        } catch (error) {
            UIHelper.showCustomAlert('Error al guardar cliente: ' + error.message, 'ERROR');
        }
    }

    async handleEdit(id) {
        const clients = await ClientModel.getAll();
        const client = clients.find(c => c.id === id);
        if (client) {
            this.isEditing = true;
            this.currentEditId = id;
            this.view.openModal(true);
            // Llenar formulario (el View reseteará, así que lo llenamos manualmente)
            document.getElementById('cl_dni').value = client.dni || '';
            document.getElementById('cl_name').value = client.nombre;
            document.getElementById('cl_phone').value = client.celular;
        }
    }

    async handleDelete(id) {
        const confirm = await UIHelper.showCustomConfirm('¿Seguro que deseas eliminar este cliente?', {
            title: 'ELIMINAR CLIENTE',
            confirmText: 'Eliminar',
            isDanger: true
        });

        if (confirm) {
            try {
                await ClientModel.delete(id);
                await this.render();
            } catch (error) {
                UIHelper.showCustomAlert('Error al eliminar: ' + error.message, 'ERROR');
            }
        }
    }

    /**
     * Busca en las ventas todas las recetas de un cliente (HU01)
     * @param {string} id ID del cliente
     * @param {string} name Nombre del cliente
     */
    async handleShowHistory(id, name) {
        try {
            const allSales = await VentaModel.getAll();
            // Filtrar ventas por el nombre del cliente
            const clientSales = allSales.filter(v => v.nombre_cliente === name);
            
            // Extraer las medidas de 'datos_compra'
            const history = clientSales
                .filter(v => v.datos_compra && v.datos_compra.includes('Med:'))
                .map(v => {
                    const medPart = v.datos_compra.split('Med:')[1].split('|')[0].trim();
                    return {
                        fecha: v.fecha,
                        codigo_venta: v.codigo_venta,
                        medidas: medPart
                    };
                });
            
            this.view.showHistory(name, history);
        } catch (error) {
            UIHelper.showCustomAlert('Error al cargar el historial: ' + error.message, 'ERROR');
        }
    }
}
