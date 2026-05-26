import { VentaModel } from '../models/VentaModel.js';
import { MonturaModel } from '../models/MonturaModel.js';
import { UsersModel } from '../models/UsersModel.js';
import { ClientModel } from '../models/ClientModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { ConsultaDocumentoModel } from '../models/ConsultaDocumentoModel.js';
import { NotificationModel } from '../models/NotificationModel.js';
import { PagoVentaModel } from '../models/PagoVentaModel.js';
import { VentaView } from '../views/VentaView.js';
import { UIHelper } from '../views/UIHelper.js';

export class VentaController {
    constructor() {
        this.view = new VentaView();
        this.isEditing = false;
        this.currentEditId = null;
        this.usersModel = new UsersModel();

        // Bind events
        this.view.bindAddVenta(this.handleAddVentaClick.bind(this));
        this.view.bindCloseModal();
        this.view.bindSubmitForm(this.handleFormSubmit.bind(this));
        this.view.bindTableActions(
            this.handleEditClick.bind(this),
            this.handleDeleteClick.bind(this),
            this.handleAbonoClick.bind(this),
            this.handlePrintClick.bind(this),
            this.handleListoEntregaClick.bind(this),
            this.handleEntregadoClick.bind(this),
            this.handleAnularClick.bind(this),
            this.handlePagosHistoryClick.bind(this)
        );
        this.view.bindSearch();
        this.view.bindMonturaSelect();
        this.view.bindDniSearch(this.handleDniSearch.bind(this));
        this.view.bindDateFilter(this.handleDateFilter.bind(this));
        this.view.bindPagoFormSubmit(this.handlePagoSubmit.bind(this));

        // Cargar datos iniciales
        this.init();
    }

    async init() {
        await VentaModel.compactCodes();
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

        // Cargar doctores (HU08)
        const doctores = await DoctorModel.getAll();
        this.view.populateDoctoresSelect(doctores);

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

            const doctores = await DoctorModel.getAll();
            this.view.populateDoctoresSelect(doctores);
            
            const clientes = await ClientModel.getAll();
            this.view.populateClientesSelect(clientes);

            this.view.openModal(true);
            this.view.populateForm(venta);
        }
    }

    async handleFormSubmit(formData) {
        try {
            formData.nombre_cliente = UIHelper.normalizeText(formData.nombre_cliente);
            await this.saveClientFromSale(formData);

            if (this.isEditing && this.currentEditId) {
                await VentaModel.update(this.currentEditId, formData);
            } else {
                const ventaCreada = await VentaModel.create(formData);
                await this.tryRegisterPagoVenta(ventaCreada, formData.a_cuenta, formData.modalidad_pago, 'PAGO INICIAL');
                // HU06: Descuento de stock al crear
                if (formData.montura_id) {
                    const monturas = await MonturaModel.getAll();
                    const montura = monturas.find(m => m.id === formData.montura_id);
                    if (montura && montura.stock_disponible > 0) {
                        montura.stock_disponible -= 1;
                        await MonturaModel.update(montura.id, montura);
                    }
                }
                // HU08: Incrementar consultas del doctor y sumar egreso
                if (formData.doctor_id) {
                    await DoctorModel.incrementarConsulta(formData.doctor_id);
                }
            }

            this.view.closeModal();
            if (window.app) {
                window.app.triggerGlobalRefresh();
            } else {
                await this.render();
            }
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

                // 3. Eliminar los ingresos del cuadre asociados a la venta
                await PagoVentaModel.deleteByVenta(venta.id, venta.codigo_venta);

                // 4. Eliminar la venta
                await VentaModel.delete(id);
                await VentaModel.compactCodes();
                
                // 5. Refrescar de forma global en tiempo real
                if (window.app) {
                    window.app.triggerGlobalRefresh();
                } else {
                    await this.render();
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
                this.view.nameInput.value = UIHelper.normalizeText(client.nombre);
                if (this.view.phoneInput) this.view.phoneInput.value = client.celular || "";
            } else {
                const persona = await ConsultaDocumentoModel.consultarDni(dni);
                this.view.nameInput.value = UIHelper.normalizeText(persona.nombreCompleto || "");
                if (this.view.phoneInput) this.view.phoneInput.value = "";
            }
        } catch (error) {
            console.error("Error buscando DNI:", error);
            this.view.nameInput.value = "";
            if (this.view.phoneInput) this.view.phoneInput.value = "";
            UIHelper.showCustomAlert('No se pudo consultar el DNI ingresado.', 'INFO');
        }
    }

    async saveClientFromSale(formData) {
        const dni = (formData.dni_cliente || '').trim();
        const nombre = UIHelper.normalizeText(formData.nombre_cliente || '').trim();
        const celular = (formData.celular_cliente || '').trim();
        const hasValidDni = /^\d{8}$/.test(dni);

        if (!nombre || !/^\d{9}$/.test(celular)) {
            return;
        }

        try {
            const existingClient = hasValidDni
                ? await ClientModel.getByDni(dni)
                : await ClientModel.getByCelular(celular);

            if (existingClient) {
                await ClientModel.update(existingClient.id, {
                    dni: hasValidDni ? dni : existingClient.dni,
                    nombre,
                    celular
                });
            } else {
                await ClientModel.create({
                    dni: hasValidDni ? dni : null,
                    nombre,
                    celular
                });
            }
        } catch (error) {
            console.warn('No se pudo guardar el cliente automaticamente:', error);
        }
    }

        // Obtenemos la instancia de ClientController a través de AppController si es necesario, 
        // o simplemente disparamos el evento del botón de nuevo cliente.

    /**
     * HU03: Abre el modal para registrar un abono/pago parcial a una venta pendiente
     */
    async handleAbonoClick(id) {
        try {
            const venta = await VentaModel.getById(id);
            if (!venta) return;
            this.view.openPagoModal(venta);
        } catch (error) {
            console.error('Error al abrir abono modal:', error);
            UIHelper.showCustomAlert('Error al cargar datos del abono.', 'ERROR');
        }
    }

    async handlePrintClick(id) {
        try {
            const venta = await VentaModel.getById(id);
            if (!venta) return;
            const anulado = venta.estado === 'ANULADO' || venta.estado_entrega === 'ANULADO';
            if (anulado) {
                UIHelper.showCustomAlert('No se puede imprimir el comprobante de una venta anulada.', 'VENTA ANULADA');
                return;
            }

            const saldo = parseFloat(venta.saldo) || 0;
            if (saldo > 0) {
                UIHelper.showCustomAlert('No se puede imprimir el comprobante mientras la venta tenga saldo pendiente.', 'VENTA PENDIENTE');
                return;
            }
            this.view.openPrintModal(venta, this.handleRucSearch.bind(this));
        } catch (error) {
            console.error('Error al abrir modal de impresión:', error);
            UIHelper.showCustomAlert('Error al cargar datos del comprobante.', 'ERROR');
        }
    }

    async handleRucSearch(ruc) {
        return await ConsultaDocumentoModel.consultarRuc(ruc);
    }

    async handleListoEntregaClick(id) {
        try {
            const venta = await VentaModel.getById(id);
            if (!venta) return;

            const saldo = parseFloat(venta.saldo) || 0;
            if (saldo > 0) {
                UIHelper.showCustomAlert('Primero debe cancelar la deuda antes de marcar el pedido como listo.', 'VENTA PENDIENTE');
                return;
            }

            let celular = venta.celular_cliente || '';
            if (!celular && venta.dni_cliente) {
                const cliente = await ClientModel.getByDni(venta.dni_cliente);
                celular = cliente?.celular || '';
            }

            celular = String(celular || '').replace(/\D/g, '');
            if (!celular) {
                UIHelper.showCustomAlert('Esta venta no tiene celular registrado para avisar al cliente.', 'FALTA CELULAR');
                return;
            }

            if (!/^\d{9}$/.test(celular)) {
                UIHelper.showCustomAlert('El celular debe tener 9 digitos para enviar el aviso.', 'CELULAR INVALIDO');
                return;
            }

            const confirm = await UIHelper.showCustomConfirm(
                `Se marcara el pedido ${venta.codigo_venta} como listo y se enviara un SMS al celular ${celular}.`,
                {
                    title: 'PEDIDO LISTO',
                    confirmText: 'Marcar y Enviar',
                    isDanger: false
                }
            );

            if (!confirm) return;

            await VentaModel.updateEstadoEntrega(id, 'LISTO PARA ENTREGA');

            try {
                await NotificationModel.enviarPedidoListo({
                    telefono: celular,
                    cliente: venta.nombre_cliente,
                    codigoVenta: venta.codigo_venta
                });
                UIHelper.showCustomAlert('Pedido marcado como listo y SMS enviado al cliente.', 'EXITO');
            } catch (notificationError) {
                console.error('Error al enviar notificacion:', notificationError);
                UIHelper.showCustomAlert('Pedido marcado como listo, pero no se pudo enviar el SMS: ' + notificationError.message, 'AVISO');
            }

            if (window.app) {
                window.app.triggerGlobalRefresh();
            } else {
                await this.render();
            }
        } catch (error) {
            console.error('Error al marcar pedido listo:', error);
            UIHelper.showCustomAlert('Error al marcar el pedido como listo: ' + error.message, 'ERROR');
        }
    }

    async handleEntregadoClick(id) {
        const confirm = await UIHelper.showCustomConfirm('Marcar este pedido como ENTREGADO al cliente.', {
            title: 'CONFIRMAR ENTREGA',
            confirmText: 'Marcar Entregado'
        });

        if (!confirm) return;

        try {
            await VentaModel.updateEstadoEntrega(id, 'ENTREGADO');
            if (window.app) window.app.triggerGlobalRefresh();
            else await this.render();
            UIHelper.showCustomAlert('Pedido marcado como entregado.', 'EXITO');
        } catch (error) {
            console.error('Error al marcar entregado:', error);
            UIHelper.showCustomAlert('Error al marcar entregado: ' + error.message, 'ERROR');
        }
    }

    async handleAnularClick(id) {
        const motivo = await UIHelper.showCustomPrompt('Indica el motivo de anulacion de esta venta.', {
            title: 'MOTIVO DE ANULACION',
            confirmText: 'Continuar',
            placeholder: 'Ej: Error en el registro, cliente cancelo la compra...',
            required: true
        });

        if (!motivo) return;

        const confirm = await UIHelper.showCustomConfirm(`Anular esta venta. Motivo: ${motivo}`, {
            title: 'ANULAR VENTA',
            confirmText: 'Anular',
            isDanger: true
        });

        if (!confirm) return;

        try {
            console.info('Motivo de anulacion:', { ventaId: id, motivo });
            const venta = await VentaModel.getById(id);
            await VentaModel.anular(id, motivo);

            if (venta && venta.montura_id) {
                await MonturaModel.updateStock(venta.montura_id, 1);
            }

            if (window.app) window.app.triggerGlobalRefresh();
            else await this.render();
            UIHelper.showCustomAlert('Venta anulada correctamente. El stock de la montura fue repuesto.', 'EXITO');
        } catch (error) {
            console.error('Error al anular venta:', error);
            UIHelper.showCustomAlert('Error al anular venta: ' + error.message, 'ERROR');
        }
    }

    async handlePagosHistoryClick(id) {
        try {
            const venta = await VentaModel.getById(id);
            const pagos = await PagoVentaModel.getByVentaId(id);
            this.view.openHistorialPagosModal(pagos, 'No hay pagos registrados para esta venta.', venta);
        } catch (error) {
            console.error('Error al cargar historial de pagos:', error);
            this.view.openHistorialPagosModal([], 'El historial se activara cuando se configure la tabla pagos_venta.');
        }
    }

    /**
     * HU03: Procesa el formulario de abono y actualiza saldo/estados/cuadres
     */
    async handlePagoSubmit(id, abono, metodoPago) {
        try {
            const venta = await VentaModel.getById(id);
            if (!venta) return;

            const saldo = parseFloat(venta.saldo) || 0;
            if (isNaN(abono) || abono <= 0) {
                UIHelper.showCustomAlert('El monto ingresado no es válido.', 'ERROR');
                return;
            }

            if (abono > saldo) {
                UIHelper.showCustomAlert('El abono no puede ser mayor que el saldo pendiente.', 'ERROR');
                return;
            }

            await VentaModel.registrarAbono(id, abono);
            await this.tryRegisterPagoVenta(venta, abono, metodoPago || 'EFECTIVO', 'ABONO');
            
            // Cerrar el modal
            this.view.closePagoModal();
            
            // Refrescar de forma global en tiempo real
            if (window.app) {
                window.app.triggerGlobalRefresh();
            } else {
                await this.render();
            }

            UIHelper.showCustomAlert('Abono registrado con éxito.', 'ÉXITO');
        } catch (error) {
            console.error('Error al registrar abono:', error);
            UIHelper.showCustomAlert('Error al registrar abono: ' + error.message, 'ERROR');
        }
    }

    /**
     * HU04: Filtra el listado de ventas por rango de fechas
     */
    async handleDateFilter(desde, hasta) {
        try {
            let ventas = await VentaModel.getAll();
            if (desde) {
                ventas = ventas.filter(v => v.fecha >= desde);
            }
            if (hasta) {
                ventas = ventas.filter(v => v.fecha <= hasta);
            }
            const rawRole = (window.app && window.app.getRole()) ? window.app.getRole() : 'vendedora';
            const role = rawRole.toLowerCase().includes('admin') ? 'admin' : 'vendedora';
            this.view.renderTable(ventas, role);
        } catch (error) {
            console.error('Error al filtrar ventas por fecha:', error);
        }
    }

    async tryRegisterPagoVenta(venta, monto, modalidadPago, tipo) {
        const montoPago = parseFloat(monto) || 0;
        if (!venta || montoPago <= 0) return;

        try {
            const today = new Date();
            const tzOffset = today.getTimezoneOffset() * 60000;
            const fechaPago = new Date(today - tzOffset).toISOString().split('T')[0];
            const usuario = window.app?.session?.user?.displayName || window.app?.session?.user?.username || '';

            await PagoVentaModel.create({
                venta_id: venta.id,
                codigo_venta: venta.codigo_venta,
                nombre_cliente: venta.nombre_cliente,
                fecha_pago: fechaPago,
                monto: montoPago,
                modalidad_pago: modalidadPago,
                usuario,
                tipo
            });
        } catch (error) {
            console.warn('No se pudo registrar historial de pago:', error);
        }
    }
}
