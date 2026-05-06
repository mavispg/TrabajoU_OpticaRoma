import { supabase } from './supabaseClient.js';

export class AuthModel {
    /**
     * Inicia sesión con Supabase
     */
    static async login(username, password) {
        // 1. Verificar credenciales estáticas de administrador (Opcional, mejor si está en DB)
        if (username === 'admin' && password === 'admin') {
            const adminSession = { 
                user: { username: 'admin', role: 'admin', displayName: 'Administradora' } 
            };
            localStorage.setItem('optica_session', JSON.stringify(adminSession));
            window.dispatchEvent(new CustomEvent('authStateChange', { 
                detail: { event: 'SIGNED_IN', session: adminSession } 
            }));
            return adminSession;
        }

        // 2. Verificar en tabla 'usuarios' de Supabase
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', username)
            .eq('contraseña', password)
            .single();

        if (error || !user) {
            throw new Error("Credenciales inválidas o usuario no encontrado");
        }

        const session = { 
            user: { 
                username: user.usuario, 
                role: user.rol,
                displayName: user.nombre
            } 
        };
        
        localStorage.setItem('optica_session', JSON.stringify(session));
        
        window.dispatchEvent(new CustomEvent('authStateChange', { 
            detail: { event: 'SIGNED_IN', session: session } 
        }));
        
        return session;
    }

    /**
     * Cierra la sesión activa
     */
    static async logout() {
        localStorage.removeItem('optica_session');
        window.dispatchEvent(new CustomEvent('authStateChange', { 
            detail: { event: 'SIGNED_OUT', session: null } 
        }));
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
            callback(e.detail.event, e.detail.session);
        });
    }
}
