import { fetchData } from "../middlewares/api.js";

const API_BASE = 'https://usetrack-backend-production.up.railway.app/api/clientes';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Contacts script carregado com sucesso")
    const addContactBtn = document.getElementById('addContactBtn');
    const contactModal = document.getElementById('contact-Modal');
    const closeModalBtn = document.querySelector('#contact-Modal .close');
    const cancelContactBtn = document.getElementById('cancelContactBtn');
    const contactForm = document.getElementById('contactForm');
    const contactsList = document.getElementById('contactsList');
    const contactsTitle = document.getElementById('contacts_title').querySelector('span');
    const searchInput = document.querySelector('.input_search');

    let editId = null;

    // Abrir modal
    const openModal = () => {
        contactModal.hidden = false;
        // Foco no primeiro campo
        document.getElementById('contactName').focus();
    };

    // Fechar modal
    const closeModal = () => {
        contactModal.hidden = true;
        contactForm.reset();
        editId = null;
    };

    // Montar iniciais d
    const getInitials = (name) => {
        if(!name) return "?";

        const parts = name.trim().split(" ");

        if(parts.length === 1) {
            return parts[0][0].toUpperCase();
        }

        return (
            parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
        );

    }

    // Montar lista de contatos no DOM
    const renderContacts = (contacts) => {
        contactsList.innerHTML = '';

        if (contacts.length === 0) {
            contactsList.innerHTML = '<li>Nenhum contato encontrado.</li>';
            contactsTitle.textContent = '0';
            return;
        }

        contacts.forEach((contact) => {
            const initials = getInitials(contact.name);

            const li = document.createElement('li');
            li.dataset.id = contact.id;
            li.tabIndex = 0;
            li.innerHTML = `
                <div class="contact-info">
                    <div class="contact-avatar">${initials}</div>
                    <div class="contact-text">
                        <strong>${contact.name}</strong> 
                        <span>${contact.email || '-'}</span>
                        <span>${contact.phone || '-'}</span>
                        <span>${contact.contactName || '-'}</span>
                    </div>
                 </div>

                <div class="contact-actions">
                    <button class="editBtn" aria-label="Editar contato ${contact.nome}">Editar</button>
                    <button class="deleteBtn" aria-label="Excluir contato ${contact.nome}">Excluir</button>
                </div>
            `;
            contactsList.appendChild(li);
        });
        contactsTitle.textContent = contacts.length;
    };

    // Buscar contatos
    const fetchContacts = async (searchTerm = '') => {
        try {

            let url = API_BASE;
            if(searchTerm) {
                url = `${API_BASE}?search=${encodeURIComponent(searchTerm)}`;
            }
            const data = await fetchData(url, "GET");
            renderContacts(data);
        } catch (error) {
            alert(error.message);
        }
    };

    // Criar contato
    const createContact = async (contact) => {
        try {
            return await fetchData(API_BASE, "POST", contact);
        } catch (error) {
            alert("Erro ao criar contato");
        }
    };

    // Atualizar contato
    const updateContact = async (id, contact) => {
        try {
            return await fetchData(`${API_BASE}/${id}`, "PUT", contact);
            
        } catch (error) {
            console.error("Erro ao atualizar contato:", error);
            alert(`Erro ao atualizar contato: ${error.message}`);
        }
    };

    // Excluir contato
    const deleteContactAPI = async (id) => {
        try {
            await fetchData(`${API_BASE}/${id}`, "DELETE");
            return true;
        } catch (error) {
            alert("Erro ao excluir contato");
            return false;
        }
    };

    // Salvar contato (novo ou edição)
    const saveContact = async (e) => {
        e.preventDefault();

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();
        const contactName = document.getElementById('contactCompany').value.trim();

        if (!name) {
            alert('Nome é obrigatório');
            return;
        }

        const contactData = {
            name,
            email,
            phone,
            contactName,
        };

        let success = false;
        if (editId) {
            success = !!(await updateContact(editId, contactData));
        } else {
            success = !!(await createContact(contactData));
        }

        await fetchContacts();
        closeModal();
    };

    // Editar contato - preenche modal com dados do cliente
    const editContact = async (id) => {
        try {

            const data = await fetchData(`${API_BASE}/${id}`, "GET");

            document.getElementById('contactName').value = data.name ?? '';
            document.getElementById('contactEmail').value = data.email ?? '';
            document.getElementById('contactPhone').value = data.phone ?? '';
            document.getElementById('contactCompany').value = data.contactName ?? '';

            editId = id;

            openModal();
        } catch (error) {
            console.error("Erro ao editar contato:", error);
            alert(`Erro ao carregar cliente para edição: ${error.message}`);
        }
    };

    // Excluir contato
    const deleteContact = async (id) => {
        if (confirm('Deseja realmente excluir este contato?')) {
            try {
                const success = await deleteContactAPI(id);
                if (success) {
                    alert("contato excluido com sucesso");
                    await fetchContacts();
                }
            }catch(error) {
                alert('Erro ao excluir contato');
            }
        }
    };

    let searchTimeout;
    const handleSearch = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = searchInput.value.trim();
            fetchContacts(searchTerm);
        }, 300)
    }

    // Eventos
    addContactBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });
    contactForm.addEventListener('submit', saveContact);

    searchInput.addEventListener('input', handleSearch);

    contactsList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const id = li.dataset.id;
        if (e.target.classList.contains('editBtn')) {
            editContact(id);
        }
        if (e.target.classList.contains('deleteBtn')) {
            deleteContact(id);
        }
    });

    // Inicializa listagem
    fetchContacts();
});
