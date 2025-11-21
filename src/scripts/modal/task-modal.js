class TasksManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [
            {
                id: 1,
                title: 'Ligar para o fornecedor',
                description: 'Fazer novo pedido',
                date: '2025-11-17',
                time: '15:00',
                priority: 'high',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Reunião com representante',
                description: 'Alinhar pendências',
                date: '2025-11-21',
                time: '13:30',
                priority: 'medium',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Programar entrega de pedidos',
                description: 'Pedido 43589, 784235',
                date: '2025-11-17',
                time: '15:00',
                priority: 'high',
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        
        this.initializeElements();
        this.attachEventListeners();
        this.renderTasks();
        this.updateDashboard();
    }

    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('taskModal');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.closeBtn = document.querySelector('.close');
        this.cancelBtn = document.getElementById('cancelTaskBtn');
        this.saveBtn = document.getElementById('saveTaskBtn');
        this.taskForm = document.getElementById('taskForm');
        
        // Form elements
        this.taskTitle = document.getElementById('taskTitle');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskDate = document.getElementById('taskDate');
        this.taskTime = document.getElementById('taskTime');
        this.taskPriority = document.getElementById('taskPriority');
        
        // Dashboard elements
        this.pendingCountElement = document.querySelector('.task_dashboard:nth-child(1) .dash_stats');
        this.completedCountElement = document.querySelector('.task_dashboard:nth-child(2) .dash_stats');
        this.todayCountElement = document.querySelector('.task_dashboard:nth-child(3) .dash_stats');
        
        // Tasks container
        this.tasksContainer = document.querySelector('.pending_section');
    }

    attachEventListeners() {
        // Modal controls
        this.addTaskBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.saveBtn.addEventListener('click', () => this.saveTask());
        
        // Form validation
        this.taskTitle.addEventListener('input', () => this.validateForm());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.style.display = 'block';
        this.taskForm.reset();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        this.taskDate.value = today;
        
        this.taskTitle.focus();
        this.validateForm();
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.taskForm.reset();
    }

    validateForm() {
        const hasTitle = this.taskTitle.value.trim().length > 0;
        this.saveBtn.disabled = !hasTitle;
    }

    saveTask() {
        const title = this.taskTitle.value.trim();
        
        if (!title) {
            this.showNotification('Por favor, digite um título para a tarefa!', 'error');
            return;
        }

        const newTask = {
            id: Date.now(),
            title: title,
            description: this.taskDescription.value.trim(),
            date: this.taskDate.value,
            time: this.taskTime.value,
            priority: this.taskPriority.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.saveToLocalStorage();
        this.renderTasks();
        this.updateDashboard();
        this.closeModal();
        
        this.showNotification('Tarefa adicionada com sucesso!', 'success');
    }

    deleteTask(id) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateDashboard();
            this.showNotification('Tarefa excluída!', 'success');
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateDashboard();
            
            const message = task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta!';
            this.showNotification(message, 'success');
        }
    }

    renderTasks() {
        // Remove existing tasks (keeping the header)
        const existingTasks = this.tasksContainer.querySelectorAll('.pending_task');
        existingTasks.forEach(task => task.remove());

        // Render tasks
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.tasksContainer.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `pending_task ${task.completed ? 'completed' : ''}`;
        taskElement.setAttribute('data-id', task.id);

        const priorityClass = `priority-${task.priority}`;
        const priorityText = this.getPriorityText(task.priority);
        
        const formattedDate = task.date ? this.formatDate(task.date) : '';
        
        taskElement.innerHTML = `
            <input type="checkbox" class="pending_checkbox" ${task.completed ? 'checked' : ''}>
            <div class="pending_content">
                <span>${this.escapeHtml(task.title)}</span>
                ${task.description ? `<span class="subtitle">${this.escapeHtml(task.description)}</span>` : ''}
                <div class="pending_stats">
                    ${formattedDate ? `
                    <div class="date_stats">
                        <i class="fa-solid fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    ` : ''}
                    
                    ${task.time ? `
                    <div class="hour_state">
                        <i class="fa-solid fa-clock"></i>
                        <span>${task.time}</span>
                    </div>
                    ` : ''}
                    
                    <div class="${priorityClass}">${priorityText}</div>
                </div>
            </div>
            <button class="pending_delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        // Add event listeners
        const checkbox = taskElement.querySelector('.pending_checkbox');
        const deleteBtn = taskElement.querySelector('.pending_delete');

        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        return taskElement;
    }

    updateDashboard() {
        const pendingTasks = this.tasks.filter(task => !task.completed).length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        
        // Count tasks for today
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(task => 
            task.date === today && !task.completed
        ).length;

        this.pendingCountElement.textContent = pendingTasks;
        this.completedCountElement.textContent = completedTasks;
        this.todayCountElement.textContent = todayTasks;
    }

    getPriorityText(priority) {
        const priorities = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        };
        return priorities[priority] || 'Média';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Apply styles
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

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
}

// Initialize the tasks manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TasksManager();
});