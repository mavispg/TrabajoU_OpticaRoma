export class AuthView {
    constructor() {
        this.loginContainer = document.getElementById('loginContainer');
        this.mainApp = document.getElementById('mainApp');
        this.loginForm = document.getElementById('loginForm');
        this.loginError = document.getElementById('loginError');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.loginBox = document.querySelector('.login-box');
        
        // Elementos de navegación
        this.navItems = {
            home: document.getElementById('menu-home'),
            monturas: document.getElementById('menu-monturas'),
            ventas: document.getElementById('menu-ventas'),
            users: document.getElementById('menu-users')
        };
        this.userRoleDisplay = document.getElementById('userRoleDisplay');
    }

    showApp(session) {
        if(this.loginContainer) this.loginContainer.style.display = 'none';
        if(this.mainApp) {
            this.mainApp.style.display = 'block';
            
            const roleRaw = session.user.role.toLowerCase();
            const displayName = session.user.displayName;
            const roleLabel = session.user.role; // Usamos exactamente lo que escribieron

            // Determinar rol interno para la lógica de visibilidad
            const role = (roleRaw.includes('admin')) ? 'admin' : 'vendedora';

            // Actualizar nombre en la UI con rol en paréntesis
            if(this.userRoleDisplay) {
                this.userRoleDisplay.innerText = `${displayName} (${roleLabel})`;
            }

            // Lógica de roles
            if (role === 'admin') {
                // El administrador ve TODO
                if(this.navItems.home) this.navItems.home.style.display = 'block';
                if(this.navItems.monturas) this.navItems.monturas.style.display = 'block';
                if(this.navItems.ventas) this.navItems.ventas.style.display = 'block';
                if(this.navItems.users) this.navItems.users.style.display = 'block';
                
                // Por defecto ir a Inicio o lo que estaba
            } else if (role === 'vendedora') {
                // La vendedora ve todo menos Usuarios
                if(this.navItems.home) this.navItems.home.style.display = 'block';
                if(this.navItems.monturas) this.navItems.monturas.style.display = 'block';
                if(this.navItems.ventas) this.navItems.ventas.style.display = 'block';
                if(this.navItems.users) this.navItems.users.style.display = 'none';
                
                // Forzar ir a Inicio si estaba en usuarios
                const currentActive = document.querySelector('.nav-link.active');
                if (currentActive && currentActive.getAttribute('data-target') === 'users') {
                    const homeLink = this.navItems.home.querySelector('a');
                    if(homeLink) homeLink.click();
                }
            }
        }
    }

    showLogin() {
        if(this.mainApp) this.mainApp.style.display = 'none';
        if(this.loginContainer) this.loginContainer.style.display = 'flex';
    }

    showError(message) {
        if(this.loginError) {
            this.loginError.innerText = message;
        }
        if(this.loginBox) {
            this.loginBox.style.animation = 'shake 0.5s';
            setTimeout(() => this.loginBox.style.animation = 'none', 500);
        }
    }

    clearInputs() {
        if(this.usernameInput) this.usernameInput.value = '';
        if(this.passwordInput) this.passwordInput.value = '';
    }

    bindLogin(handler) {
        if(this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handler(this.usernameInput.value, this.passwordInput.value);
            });
        }
    }

    bindLogout(handler) {
        if(this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
            });
        }
    }
}
