// export { supabase } from './supabaseClient.js'; // Comentado temporalmente

export class AuthModel {
    /**
     * Inicia sesión con credenciales estáticas
     */
    static async login(email, password) {
        // Validación estática temporal
        if (email === 'admin' && password === 'admin') {
            const fakeSession = { user: { email: 'admin' } };
            localStorage.setItem('optica_session', JSON.stringify(fakeSession));
            // Disparar evento custom
            window.dispatchEvent(new CustomEvent('authStateChange', { detail: 'SIGNED_IN' }));
            return fakeSession;
        } else {
            throw new Error("Credenciales inválidas");
        }
    }

    /**
     * Cierra la sesión activa
     */
    static async logout() {
        localStorage.removeItem('optica_session');
        window.dispatchEvent(new CustomEvent('authStateChange', { detail: 'SIGNED_OUT' }));
    }

    /**
     * Obtiene la sesión actual
     */
    static async getSession() {
        const session = localStorage.getItem('optica_session');
        return session ? JSON.parse(session) : null;
    }

    /**
     * Escucha cambios en la sesión (Login/Logout)
     */
    static onAuthStateChange(callback) {
        window.addEventListener('authStateChange', (e) => {
            callback(e.detail, localStorage.getItem('optica_session'));
        });
    }
}
