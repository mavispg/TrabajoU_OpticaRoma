export class UIHelper {
    static formatCurrency(value) {
        if (value === null || value === undefined || value === '') return '';
        let numberVal = parseFloat(value.toString().replace(/[^0-9.-]+/g,""));
        if (isNaN(numberVal)) return value;
        return "S/. " + numberVal.toFixed(2);
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

    static closeCustomDialog() {
        const customDialog = document.getElementById('customDialog');
        if(customDialog) customDialog.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}
