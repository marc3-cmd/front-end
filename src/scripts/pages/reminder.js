class RemindersManager {
    constructor() {
        this.reminders = JSON.parse(localStorage.getItem('reminders')) || [
            { id: 1, text: 'Preparar material de trabalho', completed: false },
            { id: 2, text: 'Fechar para inventário', completed: true },
            { id: 3, text: 'Fazer solicitação de materiais', completed: false }
        ];
        
        this.initializeElements();
        this.attachEventListeners(this.reminderText.addEventListener('input', () => this.updateSaveButton()));
        this.renderReminders();
    }

    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('reminderModal');
        this.addReminderBtn = document.getElementById('addReminderBtn');
        this.closeBtn = document.querySelector('.close');
        this.cancelBtn = document.getElementById('cancelReminderBtn');
        this.saveBtn = document.getElementById('saveReminderBtn');
        this.reminderText = document.getElementById('newReminderText');
        
        // Reminders container
        this.remindersContainer = document.querySelector('.reminders');
    }

     attachEventListeners() {
        // Modal controls
        this.addReminderBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.saveBtn.addEventListener('click', () => this.saveReminder());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        this.reminderText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveReminder();
            }
        });
    }

    openModal() {
        this.modal.style.display = 'block';
        this.reminderText.value = '';
        this.reminderText.focus();
        this.updateSaveButton();
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.reminderText.value = '';
    }

    updateSaveButton() {
        const hasText = this.reminderText.value.trim().length > 0;
        this.saveBtn.disabled = !hasText;
    }

    saveReminder() {
        const text = this.reminderText.value.trim();
        
        if (!text) {
            this.showNotification('Por favor, digite um lembrete!', 'error');
            return;
        }

        const newReminder = {
            id: Date.now(), // Usando timestamp como ID único
            text: text,
            completed: false
        };

        this.reminders.unshift(newReminder); // Adiciona no início
        this.saveToLocalStorage();
        this.renderReminders();
        this.closeModal();
        
        this.showNotification('Lembrete adicionado com sucesso!', 'success');
    }

    deleteReminder(id) {
        if (confirm('Tem certeza que deseja excluir este lembrete?')) {
            this.reminders = this.reminders.filter(reminder => reminder.id !== id);
            this.saveToLocalStorage();
            this.renderReminders();
            this.showNotification('Lembrete excluído!', 'success');
        }
    }

    toggleReminder(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.completed = !reminder.completed;
            this.saveToLocalStorage();
            this.renderReminders();
        }
    }

     renderReminders() {
        const reminderSections = this.remindersContainer.querySelectorAll('.reminder_section');
        reminderSections.forEach(section => section.remove());

        this.reminders.forEach(reminder => {
            const reminderSection = this.createReminderElement(reminder);
            this.remindersContainer.appendChild(reminderSection);
        });
    }

    createReminderElement(reminder) {
        const section = document.createElement('div');
        section.className = `reminder_section ${reminder.completed ? 'completed' : ''}`;
        section.setAttribute('data-id', reminder.id);

        section.innerHTML = `
            <input 
                type="checkbox" 
                class="reminder_checkbox" 
                ${reminder.completed ? 'checked' : ''}
            >
            <div class="reminder_content">
                <span class="reminder_text">${this.escapeHtml(reminder.text)}</span>

                </div>
            <button class="reminder_delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        const checkbox = section.querySelector('.reminder_checkbox');
        const deleteBtn = section.querySelector('.reminder_delete');

        checkbox.addEventListener('change', () => this.toggleReminder(reminder.id));
        deleteBtn.addEventListener('click', () => this.deleteReminder(reminder.id));

        return section;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToLocalStorage() {
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
    }

    showNotification(message, type = 'info') {
        // Remove notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Estilos da notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else {
            notification.style.backgroundColor = '#8B5CF6';
        }

        document.body.appendChild(notification);

        // Remove a notificação após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
}

// Adiciona os estilos de animação para as notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializa o gerenciador de lembretes quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new RemindersManager();
});