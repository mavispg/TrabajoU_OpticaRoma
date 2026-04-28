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
    }

    showApp() {
        if(this.loginContainer) this.loginContainer.style.display = 'none';
        if(this.mainApp) {
            this.mainApp.style.display = 'block';
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
