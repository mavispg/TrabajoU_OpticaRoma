import { GastoModel } from '../models/GastoModel.js';
import { GastoView } from '../views/GastoView.js';
import { VentaModel } from '../models/VentaModel.js';
import { UIHelper } from '../views/UIHelper.js';

export class GastoController {
    constructor() {
        this.view = new GastoView();
        this.isEditing = false;
        this.currentEditId = null;

        this.view.bindAddGasto(this.handleAdd.bind(this));
        this.view.bindCloseModal();
        this.view.bindSubmitForm(this.handleSubmit.bind(this));
        this.view.bindTableActions(this.handleEdit.bind(this), this.handleDelete.bind(this));
        this.view.bindSearch();

        this.init();
    }

    async init() {
        await this.render();
    }

    async render() {
        try {
            const gastos = await GastoModel.getAll();
            this.view.renderTable(gastos);
        } catch (e) {
            console.error('Error al renderizar gastos:', e);
        }
    }

    async handleAdd() {
        this.isEditing = false;
        this.currentEditId = null;
        const nextCode = await GastoModel.getNextCode();
        this.view.openModal(false, nextCode);
    }

    async handleEdit(id) {
        this.isEditing = true;
        this.currentEditId = id;
        const gastos = await GastoModel.getAll();
        const gasto = gastos.find(g => g.id === id);
        if (gasto) {
            this.view.openModal(true);
            this.view.populateForm(gasto);
        }
    }

    async handleSubmit(formData) {
        try {
            // Validar que si es gasto en EFECTIVO, no supere el efectivo disponible
            if (formData.modalidad_pago === 'EFECTIVO') {
                const ventas = await VentaModel.getAll();
                const gastos = await GastoModel.getAll();

                // Filtrar ventas del día cobradas en EFECTIVO
                const totalIngresosEfectivo = ventas
                    .filter(v => v.fecha === formData.fecha && (v.modalidad_pago || 'EFECTIVO').toUpperCase() === 'EFECTIVO')
                    .reduce((sum, v) => sum + (parseFloat(v.a_cuenta) || 0), 0);

                // Filtrar gastos del día pagados en EFECTIVO (excluyendo el que se edita)
                const totalGastosEfectivo = gastos
                    .filter(g => g.fecha === formData.fecha && (g.modalidad_pago || 'EFECTIVO').toUpperCase() === 'EFECTIVO' && g.id !== this.currentEditId)
                    .reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

                const disponible = totalIngresosEfectivo - totalGastosEfectivo;
                const montoGasto = parseFloat(formData.monto) || 0;

                if (montoGasto > disponible) {
                    UIHelper.showCustomAlert(
                        `<b>Operación Denegada:</b> No hay suficiente efectivo en caja para registrar este gasto.<br><br>` +
                        `💵 <b>Efectivo disponible:</b> S/. ${disponible.toFixed(2)}<br>` +
                        `🚫 <b>Monto del gasto:</b> S/. ${montoGasto.toFixed(2)}`,
                        'DENEGADO'
                    );
                    return;
                }
            }

            if (this.isEditing && this.currentEditId) {
                await GastoModel.update(this.currentEditId, formData);
            } else {
                await GastoModel.create(formData);
            }
            this.view.closeModal();
            await this.render();

            // Refrescar Cuadre de Caja y Dashboard si están abiertos
            if (window.app && window.app.cuadreController) {
                window.app.cuadreController.handleGenerar();
            }
            if (window.app && window.app.dashboardController) {
                window.app.dashboardController.render();
            }

            UIHelper.showCustomAlert(this.isEditing ? 'Gasto actualizado.' : 'Gasto registrado con éxito.', 'ÉXITO');
        } catch (e) {
            console.error('Error al guardar gasto:', e);
            UIHelper.showCustomAlert('Error al guardar gasto: ' + e.message, 'ERROR');
        }
    }

    async handleDelete(id) {
        const ok = await UIHelper.showCustomConfirm('¿Estás seguro de eliminar este gasto?', {
            title: 'ELIMINAR GASTO', confirmText: 'Eliminar', isDanger: true
        });
        if (ok) {
            try {
                await GastoModel.delete(id);
                await this.render();
                UIHelper.showCustomAlert('Gasto eliminado.', 'OK');
            } catch (e) {
                UIHelper.showCustomAlert('Error al eliminar gasto.', 'ERROR');
            }
        }
    }
}
