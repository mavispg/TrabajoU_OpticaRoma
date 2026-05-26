import { DoctorModel } from '../models/DoctorModel.js';
import { GastoModel } from '../models/GastoModel.js';
import { VentaModel } from '../models/VentaModel.js';
import { DoctorView } from '../views/DoctorView.js';
import { UIHelper } from '../views/UIHelper.js';

export class DoctorController {
    constructor() {
        this.view = new DoctorView();
        this.isEditing = false;
        this.currentEditId = null;

        this.view.bindAddDoctor(this.handleAdd.bind(this));
        this.view.bindCloseModal();
        this.view.bindSubmitForm(this.handleSubmit.bind(this));
        this.view.bindTableActions(
            this.handleEdit.bind(this),
            this.handleDelete.bind(this),
            this.handlePagoClick.bind(this)
        );
        this.view.bindPagoForm(this.handlePagoSubmit.bind(this));
        this.view.bindSearch();

        this.init();
    }

    async init() {
        await this.render();
    }

    async render() {
        try {
            const doctores = await DoctorModel.getAll();
            const rawRole = (window.app && window.app.getRole()) ? window.app.getRole() : 'vendedora';
            const role = rawRole.toLowerCase().includes('admin') ? 'admin' : 'vendedora';
            this.view.renderTable(doctores, role);
        } catch (e) {
            console.error('Error al renderizar doctores:', e);
        }
    }

    async handleAdd() {
        this.isEditing = false;
        this.currentEditId = null;
        const nextCode = await DoctorModel.getNextCode();
        this.view.openModal(false, nextCode);
    }

    async handleEdit(id) {
        this.isEditing = true;
        this.currentEditId = id;
        const doctor = await DoctorModel.getById(id);
        if (doctor) {
            this.view.openModal(true);
            this.view.populateForm(doctor);
        }
    }

    async handleSubmit(formData) {
        try {
            if (this.isEditing && this.currentEditId) {
                // Al editar, mantener intactos los saldos de deudas y contador de consultas
                const existing = await DoctorModel.getById(this.currentEditId);
                formData.deuda_total = existing.deuda_total || 0;
                formData.deuda_pendiente = existing.deuda_pendiente || 0;
                formData.consultas_count = existing.consultas_count || 0;
                await DoctorModel.update(this.currentEditId, formData);
            } else {
                await DoctorModel.create(formData);
            }
            this.view.closeModal();
            
            // Refrescar de forma global en tiempo real
            if (window.app) {
                window.app.triggerGlobalRefresh();
            } else {
                await this.render();
            }
            UIHelper.showCustomAlert(this.isEditing ? 'Doctor actualizado.' : 'Doctor registrado con éxito.', 'ÉXITO');
        } catch (e) {
            console.error('Error al guardar doctor:', e);
            UIHelper.showCustomAlert('Error al guardar doctor: ' + e.message, 'ERROR');
        }
    }

    handlePagoClick(id) {
        this.view.openPagoModal(id);
    }

    async handlePagoSubmit(id, monto, modalidad = 'EFECTIVO') {
        try {
            if (monto <= 0) {
                UIHelper.showCustomAlert('Ingrese un monto válido.', 'ERROR');
                return;
            }

            const doctor = await DoctorModel.getById(id);
            if (!doctor) throw new Error('Doctor no encontrado');

            const pendienteActual = parseFloat(doctor.deuda_pendiente) || 0;
            if (monto > pendienteActual) {
                UIHelper.showCustomAlert(`El monto a pagar (S/. ${monto.toFixed(2)}) no puede ser mayor que la deuda pendiente (S/. ${pendienteActual.toFixed(2)}).`, 'ERROR');
                return;
            }

            const today = new Date();
            const tzOffset = today.getTimezoneOffset() * 60000;
            const localDateStr = (new Date(today - tzOffset)).toISOString().split('T')[0];

            // Si el pago es en EFECTIVO, validar que haya dinero suficiente en la caja de hoy
            if (modalidad === 'EFECTIVO') {
                const ventas = await VentaModel.getAll();
                const gastos = await GastoModel.getAll();

                const totalIngresosEfectivo = ventas
                    .filter(v => v.fecha === localDateStr && (v.modalidad_pago || 'EFECTIVO').toUpperCase() === 'EFECTIVO')
                    .reduce((sum, v) => sum + (parseFloat(v.a_cuenta) || 0), 0);

                const totalGastosEfectivo = gastos
                    .filter(g => g.fecha === localDateStr && (g.modalidad_pago || 'EFECTIVO').toUpperCase() === 'EFECTIVO')
                    .reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

                const disponible = totalIngresosEfectivo - totalGastosEfectivo;

                if (monto > disponible) {
                    const mensaje = [
                        'No hay suficiente efectivo en caja para realizar este pago al doctor.',
                        '',
                        `Fecha de caja: ${localDateStr}`,
                        `Efectivo disponible: S/. ${disponible.toFixed(2)}`,
                        `Monto solicitado: S/. ${monto.toFixed(2)}`
                    ].join('\n');
                    UIHelper.showCustomAlert(mensaje, 'OPERACION DENEGADA');
                    return;
                }
            }

            // 1. Registrar pago en el modelo del Doctor
            const nuevaPendiente = await DoctorModel.registrarPago(id, monto);

            // 2. Crear de forma automática un Egreso (Gasto) con la modalidad elegida
            const nextCodeGasto = await GastoModel.getNextCode();
            await GastoModel.create({
                codigo: nextCodeGasto,
                fecha: localDateStr,
                categoria: 'HONORARIOS MÉDICOS',
                descripcion: `Pago de Liquidación a Doctor: ${doctor.nombre}`,
                monto: monto,
                modalidad_pago: modalidad
            });

            // 3. Cerrar el modal y refrescar la app globalmente
            this.view.closePagoModal();
            
            if (window.app) {
                window.app.triggerGlobalRefresh();
            } else {
                await this.render();
            }

            const mensajeExito = [
                'Pago registrado correctamente.',
                '',
                `Modalidad: ${modalidad}`,
                `Nueva deuda pendiente: S/. ${nuevaPendiente.toFixed(2)}`
            ].join('\n');
            UIHelper.showCustomAlert(mensajeExito, 'EXITO');
        } catch (e) {
            console.error('Error al registrar pago:', e);
            UIHelper.showCustomAlert('Error al registrar pago: ' + e.message, 'ERROR');
        }
    }

    async handleDelete(id) {
        const ok = await UIHelper.showCustomConfirm('¿Estás seguro de eliminar este doctor?', {
            title: 'ELIMINAR DOCTOR', confirmText: 'Eliminar', isDanger: true
        });
        if (ok) {
            try {
                await DoctorModel.delete(id);
                
                if (window.app) {
                    window.app.triggerGlobalRefresh();
                } else {
                    await this.render();
                }
                UIHelper.showCustomAlert('Doctor eliminado.', 'OK');
            } catch (e) {
                UIHelper.showCustomAlert('Error al eliminar doctor.', 'ERROR');
            }
        }
    }
}
