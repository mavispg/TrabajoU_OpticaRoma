export class UIHelper {
    static formatCurrency(value) {
        if (value === null || value === undefined || value === '') return '';
        let numberVal = parseFloat(value.toString().replace(/[^0-9.-]+/g,""));
        if (isNaN(numberVal)) return value;
        return "S/. " + numberVal.toFixed(2);
    }

    static normalizeText(value) {
        return String(value ?? '')
            .replace(/MU\uFFFDOZ/g, 'MU\u00D1OZ')
            .replace(/NU\uFFFDEZ/g, 'NU\u00D1EZ')
            .replace(/PE\uFFFDA/g, 'PE\u00D1A')
            .replace(/ORDO\uFFFDEZ/g, 'ORDO\u00D1EZ')
            .replace(/DUE\uFFFDAS/g, 'DUE\u00D1AS')
            .replace(/IBA\uFFFDEZ/g, 'IBA\u00D1EZ')
            .replace(/CASTA\uFFFDEDA/g, 'CASTA\u00D1EDA')
            .replace(/ACU\uFFFDA/g, 'ACU\u00D1A')
            .replace(/MA\uFFFDUCO/g, 'MA\u00D1UCO')
            .replace(/\s+/g, ' ')
            .trim();
    }

    static showCustomAlert(message, title = 'OPTICA ROMA') {
        return new Promise((resolve) => {
            const customDialog = document.getElementById('customDialog');
            const dialogMessage = document.getElementById('customDialogMessage');
            const titleEl = document.getElementById('customDialogTitle');
            const dialogConfirmBtn = document.getElementById('customDialogConfirm');
            const dialogCancelBtn = document.getElementById('customDialogCancel');

            if(titleEl) titleEl.innerText = title;
            if(dialogMessage) dialogMessage.innerText = message;
            
            if(dialogCancelBtn) dialogCancelBtn.style.display = 'none'; 
            if(dialogConfirmBtn) {
                dialogConfirmBtn.innerText = 'Entendido';
                dialogConfirmBtn.classList.remove('danger');
            }
            
            if(customDialog) customDialog.style.display = 'flex';
            document.body.classList.add('modal-open');

            const handleConfirm = () => {
                UIHelper.closeCustomDialog();
                dialogConfirmBtn.removeEventListener('click', handleConfirm);
                resolve(true);
            };

            if(dialogConfirmBtn) dialogConfirmBtn.addEventListener('click', handleConfirm);
        });
    }

    static showCustomConfirm(message, options = {}) {
        const { 
            title = 'AVISO DEL SISTEMA', 
            confirmText = 'Continuar', 
            cancelText = 'Cancelar', 
            isDanger = false 
        } = options;

        return new Promise((resolve) => {
            const customDialog = document.getElementById('customDialog');
            const dialogMessage = document.getElementById('customDialogMessage');
            const titleEl = document.getElementById('customDialogTitle');
            const dialogConfirmBtn = document.getElementById('customDialogConfirm');
            const dialogCancelBtn = document.getElementById('customDialogCancel');

            if(titleEl) titleEl.innerText = title;
            if(dialogMessage) dialogMessage.innerText = message;
            
            if(dialogCancelBtn) {
                dialogCancelBtn.style.display = 'block';
                dialogCancelBtn.innerText = cancelText;
            }
            
            if(dialogConfirmBtn) {
                dialogConfirmBtn.innerText = confirmText;
                if (isDanger) {
                    dialogConfirmBtn.classList.add('danger');
                } else {
                    dialogConfirmBtn.classList.remove('danger');
                }
            }
            
            if(customDialog) customDialog.style.display = 'flex';
            document.body.classList.add('modal-open');

            const onConfirm = () => {
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                UIHelper.closeCustomDialog();
                if(dialogConfirmBtn) dialogConfirmBtn.removeEventListener('click', onConfirm);
                if(dialogCancelBtn) dialogCancelBtn.removeEventListener('click', onCancel);
            };

            if(dialogConfirmBtn) dialogConfirmBtn.addEventListener('click', onConfirm);
            if(dialogCancelBtn) dialogCancelBtn.addEventListener('click', onCancel);
        });
    }

    static showCustomPrompt(message, options = {}) {
        const {
            title = 'AVISO DEL SISTEMA',
            confirmText = 'Continuar',
            cancelText = 'Cancelar',
            placeholder = '',
            required = false
        } = options;

        return new Promise((resolve) => {
            const customDialog = document.getElementById('customDialog');
            const dialogMessage = document.getElementById('customDialogMessage');
            const titleEl = document.getElementById('customDialogTitle');
            const dialogConfirmBtn = document.getElementById('customDialogConfirm');
            const dialogCancelBtn = document.getElementById('customDialogCancel');

            if (titleEl) titleEl.innerText = title;
            if (dialogMessage) {
                dialogMessage.innerHTML = `
                    <span style="display:block;margin-bottom:10px;">${UIHelper.escapeHtml(message)}</span>
                    <textarea id="customDialogInput" placeholder="${UIHelper.escapeHtml(placeholder)}" style="width:100%;min-height:80px;resize:vertical;padding:10px;border:1.5px solid #d1d8e0;border-radius:8px;font-family:inherit;font-size:14px;outline:none;"></textarea>
                `;
            }

            if (dialogCancelBtn) {
                dialogCancelBtn.style.display = 'block';
                dialogCancelBtn.innerText = cancelText;
            }

            if (dialogConfirmBtn) {
                dialogConfirmBtn.innerText = confirmText;
                dialogConfirmBtn.classList.remove('danger');
            }

            if (customDialog) customDialog.style.display = 'flex';
            document.body.classList.add('modal-open');

            setTimeout(() => document.getElementById('customDialogInput')?.focus(), 0);

            const onConfirm = () => {
                const input = document.getElementById('customDialogInput');
                const value = (input?.value || '').trim();
                if (required && !value) {
                    if (input) input.style.borderColor = '#e74c3c';
                    return;
                }
                cleanup();
                resolve(value);
            };

            const onCancel = () => {
                cleanup();
                resolve(null);
            };

            const cleanup = () => {
                UIHelper.closeCustomDialog();
                if (dialogConfirmBtn) dialogConfirmBtn.removeEventListener('click', onConfirm);
                if (dialogCancelBtn) dialogCancelBtn.removeEventListener('click', onCancel);
            };

            if (dialogConfirmBtn) dialogConfirmBtn.addEventListener('click', onConfirm);
            if (dialogCancelBtn) dialogCancelBtn.addEventListener('click', onCancel);
        });
    }

    static escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    static closeCustomDialog() {
        const customDialog = document.getElementById('customDialog');
        if(customDialog) customDialog.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}
