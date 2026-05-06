import { AuthController } from './AuthController.js';
import { MonturaController } from './MonturaController.js';
import { VentaController } from './VentaController.js';
import { UsersController } from './UsersController.js';

export class AppController {
    constructor() {
        console.log("Iniciando Arquitectura MVC - Optica Roma");
        this.session = null;
        this.authController = new AuthController();
        this.monturaController = new MonturaController();
        this.ventaController = new VentaController();
        this.usersController = new UsersController();

        this.initNavigation();
        this.initSidebar();
    }

    setSession(session) {
        this.session = session;
        // Refrescar controladores cuando la sesión esté lista
        if (this.monturaController) this.monturaController.render();
        if (this.ventaController) this.ventaController.render();
    }

    getRole() {
        return this.session ? this.session.user.role : null;
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.content-section');

        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if(this.getAttribute('data-target')) {
                    e.preventDefault();
                    
                    navLinks.forEach(nav => nav.classList.remove('active'));
                    this.classList.add('active');
                    
                    const targetId = this.getAttribute('data-target');
                    sections.forEach(section => {
                        section.classList.remove('active');
                    });
                    
                    const targetSection = document.getElementById(targetId);
                    if(targetSection) {
                        targetSection.classList.add('active');
                    }
                }
            });
        });

        // Dropdown menu logic
        const iocnLinks = document.querySelectorAll(".iocn-link");
        iocnLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                let arrowParent = link.parentElement; 
                arrowParent.classList.toggle("showMenu");
            });
        });
    }

    initSidebar() {
        const sidebar = document.querySelector(".sidebar");
        const sidebarBtn = document.querySelector(".sidebarBtn");
        const menuOverlay = document.querySelector(".menu-overlay");
        const mobileCloseBtn = document.getElementById('mobileCloseBtn');

        if(sidebarBtn && sidebar) {
            sidebarBtn.addEventListener("click", () => {
                sidebar.classList.toggle("active");
                if(menuOverlay) menuOverlay.classList.toggle("active");
            });
        }

        if(mobileCloseBtn && sidebar) {
            mobileCloseBtn.addEventListener('click', () => {
                sidebar.classList.remove('active');
                if(menuOverlay) menuOverlay.classList.remove("active");
            });
        }

        if(menuOverlay && sidebar) {
            menuOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                menuOverlay.classList.remove("active");
            });
        }
    }
}

// Inicializar la aplicación cuando el DOM cargue
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});
