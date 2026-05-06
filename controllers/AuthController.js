import { AuthModel } from '../models/AuthModel.js';
import { AuthView } from '../views/AuthView.js';

export class AuthController {
    constructor() {
        this.view = new AuthView();

        // Vincular eventos de la vista con los métodos del controlador
        this.view.bindLogin(this.handleLogin.bind(this));
        this.view.bindLogout(this.handleLogout.bind(this));

        // Iniciar la validación de sesión
        this.init();
    }

    async init() {
        try {
            const session = await AuthModel.getSession();
            if (session) {
                console.log('Sesión activa encontrada');
                if(window.app) window.app.setSession(session);
                this.view.showApp(session);
            } else {
                console.log('No hay sesión activa');
                this.view.showLogin();
            }

            // Escuchar cambios (cuando la sesión expira o se cierra desde otro lado)
            AuthModel.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    if(window.app) window.app.setSession(session);
                    this.view.showApp(session);
                } else if (event === 'SIGNED_OUT') {
                    if(window.app) window.app.setSession(null);
                    this.view.showLogin();
                }
            });

        } catch (error) {
            console.warn('Error al verificar sesión:', error);
            this.view.showLogin();
        }
    }

    async handleLogin(username, password) {
        try {
            await AuthModel.login(username, password);
            this.view.clearInputs();
            // El onAuthStateChange detectará el SIGNED_IN y mostrará la app
        } catch (error) {
            console.error('Error en login:', error);
            this.view.showError('Correo o contraseña incorrectos');
        }
    }

    async handleLogout() {
        try {
            await AuthModel.logout();
            // El onAuthStateChange detectará el SIGNED_OUT y mostrará el login
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
}
