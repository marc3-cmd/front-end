class ContactsManager {
    constructor() {
        this.contacts = JSON.parse(localStorage.getItem('contacts')) || [
            {
                id: 1,
                name: 'João Silva',
                email: 'joao@techcorp.com',
                phone: '(11) 99999-9999',
                company: 'TechCorp',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Pedro Henrique',
                email: 'pedro@mail.com',
                phone: '(11) 99999-9999',
                company: 'Mail Solutions',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Fernanda Ribeiro',
                email: 'fernanda@fitness.com',
                phone: '(11) 99999-9999',
                company: 'Fitness Center',
                createdAt: new Date().toISOString()
            }
        ];
        
        this.initializeElements();
        this.attachEventListeners();
        this.renderContacts();
        this.updateContactsCount();
    }

    initializeElements() {
    this.modal = document.getElementById('contactModal');
    this.addContactBtn = document.getElementById('addContactBtn');
    this.closeBtn = this.modal?.querySelector('.close');
    this.cancelBtn = document.getElementById('cancelContactBtn');
    this.saveBtn = document.getElementById('saveContactBtn');
    this.contactForm = document.getElementById('contactForm');
    
    this.contactName = document.getElementById('contactName');
    this.contactEmail = document.getElementById('contactEmail');
    this.contactPhone = document.getElementById('contactPhone');
    this.contactCompany = document.getElementById('contactCompany');
    
    this.contactsContainer = document.querySelector('.contacts_container');
    this.contactsTitle = document.querySelector('.contacts_title span');
    
    this.searchInput = document.querySelector('.input_search');
}

    attachEventListeners() {
    this.addContactBtn.addEventListener('click', () => this.openModal());
    this.closeBtn?.addEventListener('click', () => this.closeModal());
    this.cancelBtn?.addEventListener('click', () => this.closeModal());
    this.saveBtn?.addEventListener('click', () => this.saveContact());
    
    this.contactName?.addEventListener('input', () => this.validateForm());
    
    // CORREÇÃO: Event listener melhorado para a pesquisa
    this.searchInput?.addEventListener('input', (e) => {
        this.searchContacts(e.target.value);
    });
    
    // CORREÇÃO: Adicionar evento de tecla Enter para limpar pesquisa
    this.searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.target.value = '';
            this.searchContacts('');
        }
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === this.modal) {
            this.closeModal();
        }
    });
}

    openModal() {
        if (!this.modal) return;
        
        this.modal.style.display = 'block';
        this.contactForm.reset();
        this.contactName.focus();
        this.validateForm();
    }

    closeModal() {
        if (!this.modal) return;
        
        this.modal.style.display = 'none';
        this.contactForm.reset();
    }

    validateForm() {
        const hasName = this.contactName?.value.trim().length > 0;
        if (this.saveBtn) {
            this.saveBtn.disabled = !hasName;
        }
    }

    saveContact() {
        const name = this.contactName?.value.trim();
        
        if (!name) {
            this.showNotification('Por favor, digite um nome para o contato!', 'error');
            return;
        }

        const newContact = {
            id: Date.now(),
            name: name,
            email: this.contactEmail?.value.trim() || '',
            phone: this.contactPhone?.value.trim() || '',
            company: this.contactCompany?.value.trim() || '',
            createdAt: new Date().toISOString()
        };

        this.contacts.unshift(newContact);
        this.saveToLocalStorage();
        this.renderContacts();
        this.updateContactsCount();
        this.closeModal();
        
        this.showNotification('Contato adicionado com sucesso!', 'success');
    }

    deleteContact(id) {
        if (confirm('Tem certeza que deseja excluir este contato?')) {
            this.contacts = this.contacts.filter(contact => contact.id !== id);
            this.saveToLocalStorage();
            this.renderContacts();
            this.updateContactsCount();
            this.showNotification('Contato excluído!', 'success');
        }
    }

    editContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (contact) {
            this.openModal();
            
            // Preencher formulário com dados do contato
            setTimeout(() => {
                this.contactName.value = contact.name;
                this.contactEmail.value = contact.email || '';
                this.contactPhone.value = contact.phone || '';
                this.contactCompany.value = contact.company || '';
                
                // Alterar comportamento do botão salvar para edição
                this.saveBtn.textContent = 'Atualizar Contato';
                this.saveBtn.onclick = () => this.updateContact(id);
                this.validateForm();
            }, 100);
        }
    }

    updateContact(id) {
        const name = this.contactName.value.trim();
        
        if (!name) {
            this.showNotification('Por favor, digite um nome para o contato!', 'error');
            return;
        }

        const contactIndex = this.contacts.findIndex(contact => contact.id === id);
        if (contactIndex !== -1) {
            this.contacts[contactIndex] = {
                ...this.contacts[contactIndex],
                name: name,
                email: this.contactEmail.value.trim(),
                phone: this.contactPhone.value.trim(),
                company: this.contactCompany.value.trim()
            };

            this.saveToLocalStorage();
            this.renderContacts();
            this.closeModal();
            
            // Restaurar comportamento padrão do botão
            this.saveBtn.textContent = 'Salvar Contato';
            this.saveBtn.onclick = () => this.saveContact();
            
            this.showNotification('Contato atualizado com sucesso!', 'success');
        }
    }

    renderContacts() {
        if (!this.contactsContainer) return;

        // Remove existing contacts (keeping the header)
        const existingContacts = this.contactsContainer.querySelectorAll('.contact_card');
        existingContacts.forEach(contact => contact.remove());

        // Render contacts
        this.contacts.forEach(contact => {
            const contactElement = this.createContactElement(contact);
            this.contactsContainer.appendChild(contactElement);
        });
    }

    createContactElement(contact) {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact_card';
        contactElement.setAttribute('data-id', contact.id);

        // Criar iniciais para o avatar
        const initials = this.getInitials(contact.name);
        
        contactElement.innerHTML = `
            <div class="avatar">
                ${initials}
            </div>
            <div class="info">
                <h3>${this.escapeHtml(contact.name)}</h3>
                <div class="details">
                    ${contact.email ? `<div><i class="fa fa-envelope"></i> ${this.escapeHtml(contact.email)}</div>` : ''}
                    ${contact.phone ? `<div><i class="fa fa-phone"></i> ${this.escapeHtml(contact.phone)}</div>` : ''}
                    ${contact.company ? `<div><i class="fa fa-building"></i> ${this.escapeHtml(contact.company)}</div>` : ''}
                </div>
            </div>
            <div class="contact_actions">
                <button class="contact_edit" title="Editar contato">
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button class="contact_delete" title="Excluir contato">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const editBtn = contactElement.querySelector('.contact_edit');
        const deleteBtn = contactElement.querySelector('.contact_delete');

        editBtn.addEventListener('click', () => this.editContact(contact.id));
        deleteBtn.addEventListener('click', () => this.deleteContact(contact.id));

        // Double click to edit
        contactElement.addEventListener('dblclick', () => this.editContact(contact.id));

        return contactElement;
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    searchContacts(searchTerm) {
    if (!searchTerm) {
        this.renderContacts();
        this.updateContactsCount();
        return;
    }

    const filteredContacts = this.contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm)
    );

    // Remove existing contacts
    const existingContacts = this.contactsContainer.querySelectorAll('.contact_card');
    existingContacts.forEach(contact => contact.remove());

    // Render filtered contacts
    filteredContacts.forEach(contact => {
        const contactElement = this.createContactElement(contact);
        this.contactsContainer.appendChild(contactElement);
    });

    // Update count for filtered results
    this.contactsTitle.textContent = `(${filteredContacts.length})`;
}

    updateContactsCount() {
        if (this.contactsTitle) {
            this.contactsTitle.textContent = `(${this.contacts.length})`;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToLocalStorage() {
        localStorage.setItem('contacts', JSON.stringify(this.contacts));
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

// Initialize the contacts manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactsManager();
});