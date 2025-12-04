import { fetchData } from "../middlewares/api.js";

const BASE_URL = 'http://localhost:3000/api';
let leadsDoVendedor = []; // Estado global das Leads
let availableStages = []; // Estágios carregados (Prospecção, Proposta, etc.)
let availableClients = [];
let currentFollowUpId = null;

// ----------------------------------------------------------------------
// 1. Seletores
// ----------------------------------------------------------------------
const kanbanContainer = document.getElementById('kanbanContainer');
const newLeadBtn = document.getElementById('newLeadBtn');
const leadModal = document.getElementById('leadCrudModal');
const closeLeadModalBtn = document.getElementById('closeLeadModal');
const leadForm = document.getElementById('leadForm');
const modalTitle = document.getElementById('modalTitle');
const saveLeadBtn = document.getElementById('saveLeadBtn');
const deleteLeadBtn = document.getElementById('deleteLeadBtn');
const stageSelect = document.getElementById('stageSelect');
const followUpHistory = document.getElementById('followUpHistory');
const followUpForm = document.getElementById('followUpForm');
const followUpSubmitBtn = document.getElementById('followUpSubmitBtn');
const tabs = document.querySelectorAll('.tab-link');

let currentLeadId = null; // ID da lead sendo editada

// ----------------------------------------------------------------------
// 2. Funções de Carregamento de Dados Iniciais (Clientes e Estágios)
// ----------------------------------------------------------------------

// const fetchClientsData = async () => {
//     try {
//         const clients = await fetchData(`${BASE_URL}/clientes`, "GET");
        
//         if (clients) {
//             // Armazena todos os clientes, incluindo e-mail, para uso posterior
//             availableClients = clients.map(client => ({
//                 id: client.id,
//                 name: client.name,
//                 email: client.clientEmail // Assumindo que o backend retorna o email
//             }));
            
//         }
//     } catch (error) {
//         console.error("Falha ao carregar Clientes:", error);
//     }
//     return availableClients;
// };

const renderStageSelect = (stages) => {
    stageSelect.innerHTML = ''; // Limpa as opções

    const defaultOption = new Option("Selecione um Estágio", "", true, true);
    defaultOption.disabled = true;
    stageSelect.add(defaultOption);

    stages.forEach(stage => {
        const option = new Option(stage.name, stage.id);
        stageSelect.add(option);
    });
};

const renderStageColumns = (stages) => {
    kanbanContainer.innerHTML = '';
    stages.forEach(stage => {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.stageId = stage.id;

        // Adiciona classes para estilo de coluna final (ganho/perdido)
        const finalClass = stage.isFinal ? 'final-stage' : ''; 
        
        column.innerHTML = `
            <h3 class="column-title">${stage.name} <span>(0)</span></h3>
            <div class="column-header-progress"><div class="progress-bar ${finalClass}" style="width: 0%;"></div></div>
            <div class="lead-list" data-stage-id="${stage.id}" id="stage-${stage.id}"></div>
        `;

        // Adiciona listeners de Drag & Drop para a coluna
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        column.addEventListener('dragenter', (e) => e.target.closest('.kanban-column').classList.add('drag-over'));
        column.addEventListener('dragleave', (e) => e.target.closest('.kanban-column').classList.remove('drag-over'));
        
        kanbanContainer.appendChild(column);
    });
};

// ----------------------------------------------------------------------
// 3. Funções de CRUD e Interação
// ----------------------------------------------------------------------

const renderFollowUpHistory = (followUps) => {
    followUpHistory.innerHTML = '';
    if (!followUps || followUps.length === 0) {
        followUpHistory.innerHTML = '<p>Nenhuma interação registrada ainda.</p>';
        return;
    }

    followUps.sort((a, b) => new Date(b.date) - new Date(a.date));

    followUps.forEach(fup => {
        // Garante que a data é tratável ou usa um fallback
        const interactionDate = new Date(fup.date);

       const formattedDate = interactionDate instanceof Date && !isNaN(interactionDate) 
            ? interactionDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) 
            : 'Data Inválida';

        // Define o tipo e as cores baseadas no status
        const isLog = fup.isCompleted === true;
        const typeLabel = isLog ? 'Interação' : 'Próx. Ação';
        const itemClass = isLog ? 'followup-log' : 'followup-schedule';
        
        const item = document.createElement('div');
        item.className = `followup-item ${itemClass}`;
        item.dataset.followUpId = fup.id;

        // Ações de edição/exclusão apenas para agendamentos futuros (FUPs não completados)
        const showActions = !fup.isCompleted;

        item.innerHTML = `
            <div class="followup-header">
                <strong>${typeLabel}: ${formattedDate}</strong>
                <div class="followup-actions">
                    ${showActions ? `<button class="edit-fup-btn" data-id="${fup.id}">Editar</button>` : ''}
                    <button class="delete-fup-btn" data-id="${fup.id}">Excluir</button>
                </div>
            </div>
            <p><strong>Notas:</strong> ${fup.notes}</p>
        `;
        followUpHistory.appendChild(item);
    });
};

const switchTab = (tabName) => {
    tabs.forEach(tab => {
        tab.classList.remove('active');
        const content = document.getElementById(tab.dataset.tab);

        // Verifica se o elemento de conteúdo existe antes de manipular classes
        if (content) {
            content.classList.remove('active');
        }
    });
    
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const contentElement = document.getElementById(tabName);
    
    // Verifica se a aba selecionada existe
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Verifica se o conteúdo da aba existe
    if (contentElement) {
        contentElement.classList.add('active');
    }
};

// ----------------------------------------------------------------------
// 4. Funções de CRUD de Lead
// ----------------------------------------------------------------------

const renderLeadCard = (lead) => {
    const card = document.createElement('div');

    card.className = 'lead-card';
    card.draggable = true;
    card.dataset.id = lead.id;
    card.dataset.stageId = lead.stageId;

    card.addEventListener('dragstart', handleDragStart);

    card.addEventListener('click', (e) => {
        // Se o clique for no botão de follow-up, abrimos o modal e mudamos a aba
        if (e.target.classList.contains('followup-btn')) {
            openLeadModal(lead.id); 
            switchTab('followups');
        } else {
            // Se o clique for em qualquer outra parte do card, apenas abre para edição
            openLeadModal(lead.id);
        }
    });

    const nextActionDate = lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString('pt-BR') : 'N/A';
    const clientName = lead.client?.name || '[Cliente Não Atribuído]';

    card.innerHTML = `
        <h4>${lead.title}</h4>
        <p>Cliente: ${clientName}</p>
        <p>Valor: <strong>R$ ${lead.value ? lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</strong></p>
        <p>Próximo Contato: ${nextActionDate}</p>
        <div class="card-actions">
            <button class="followup-btn">+</button>
        </div>
    `;
    return card;
};

const renderKanban = (leads) => {
    const columns = document.querySelectorAll('.lead-list');
    const leadCountByStage = {};

    columns.forEach(list => {
        list.innerHTML = '';
        leadCountByStage[list.dataset.stageId] = 0;
    });

    leads.forEach(lead => {
        const column = document.getElementById(`stage-${lead.stageId}`);
        if (column) {
            column.appendChild(renderLeadCard(lead));
            leadCountByStage[lead.stageId]++;
        }
    });

    document.querySelectorAll('.kanban-column').forEach(column => {
        const stageId = column.dataset.stageId;
        const count = leadCountByStage[stageId] || 0;
        column.querySelector('.column-title span').textContent = `(${count})`;
        const totalLeads = leads.length || 1;
        const progress = Math.min(100, Math.round((count / totalLeads) * 100));
        column.querySelector('.progress-bar').style.width = `${progress}%`;
    });
};

// ----------------------------------------------------------------------
// 5. Funções de Follow-up
// ----------------------------------------------------------------------

const loadFollowUpHistory = async (leadId) => {
    try {
        const followUps = await fetchData(`${BASE_URL}/leads/${leadId}/followups/history`, "GET");
        renderFollowUpHistory(followUps);
    } catch (error) {
        console.error("Erro ao carregar histórico de follow-ups:", error);
    }
};

// ----------------------------------------------------------------------
// 6. Lógica de Drag and Drop
// ----------------------------------------------------------------------

let draggedLead = null;

const handleDragStart = (e) => {
    draggedLead = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
};

const handleDragOver = (e) => {
    e.preventDefault();
};

const handleDrop = async (e) => {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    const leadId = e.dataTransfer.getData('text/plain');
    const targetColumn = e.target.closest('.kanban-column');

    if (targetColumn) {
        const newStageId = targetColumn.dataset.stageId;

        if (newStageId === draggedLead.dataset.stageId) {
            draggedLead.classList.remove('dragging');
            return;
        }

        const success = await updateLeadStage(leadId, newStageId);
        if (success) {
            draggedLead.dataset.stageId = newStageId; // Atualiza o dataset para o card
        }
    }
    draggedLead.classList.remove('dragging');
};

// ----------------------------------------------------------------------
// 7. Funções Assíncronas Principais (Comunicação com API)
// ----------------------------------------------------------------------

const fetchStage = async () => {
    try {
        const stages = await fetchData(`${BASE_URL}/stages`, "GET");
        availableStages = stages || [];
        return stages;
    }catch(error) {
        console.error("Falha ao carregar Estágios", error);
        return [];
    }
}

const fetchLeads = async () => {
    try {
        const url = `${BASE_URL}/leads`;
        const data = await fetchData(url, "GET");
        leadsDoVendedor = data || [];
        renderKanban(leadsDoVendedor);
        console.log(leadsDoVendedor);
    } catch (error) {
        console.error("Erro ao carregar Leads:", error);
    }
};

const fetchFollowUpData = async ( followUpId ) => {
    try {
        const response = await fetchData(`${BASE_URL}/followups/${followUpId}`, "GET"); 
        return response.data;
    }catch(error) {
        alert(`Falha ao carregar dados do Follow-up: ${error.message}`);
        console.error("Erro ao carregar Follow-up:", error);
        return null;
    }
}

const deleteFollowUp = async (folloUpId) => {
    if(!confirm('Tem certeza que deseja EXCUIR permanentemente esse follow-up?')) {
        return;
    }

    try { 
        await fetchData(`${BASE_URL}/followups/${folloUpId}`, "DELETE");
        alert("Follow-Up excluido com sucesso!");

        loadFollowUpHistory(currentLeadId);
        await fetchLeads();
    }catch(error) {
        alert(`Falha ao excluir Follow-up: ${error.message}`);
        console.error("Erro ao excluir Follow-up: ", error);
    }
}

const resetFolloUpForm = () => {
    followUpForm.reset();
    currentFollowUpId = null;

    if(followUpSubmitBtn) {
        followUpSubmitBtn.textContent = 'Registrar Interação';
    }
    document.getElementById('followUpSubmitBtn').textContent = 'Registrar Interação';
}

// Função para preencher o formulário no modo de edição
const editFollowUp = async (followUpId) => {
    const fup = await fetchFollowUpData(followUpId);
    if (!fup) return;
    
    // 1. Armazena o ID e preenche o formulário
    currentFollowUpId = followUpId;

    const cleanedNotes = fup.notes.replace('[PRÓXIMA AÇÃO] ', '').trim();
    
    // Notas da Interação
    document.getElementById('interactionNotes').value = cleanedNotes;
    
    document.getElementById('nextActionNotes').value = cleanedNotes;
    
    // Próxima Ação (Formata para YYYY-MM-DDTHH:MM, necessário para input type="datetime-local")
    if (fup.data) {
        // Cria um objeto Date e formata para o formato local sem segundos
        const dateObj = new Date(fup.data);
        const formattedDate = dateObj.toISOString().slice(0, 16);
        document.getElementById('nextActionDate').value = formattedDate;
    } else {
        document.getElementById('nextActionDate').value = '';
    }
    
    // 2. Ajusta a UI
    document.getElementById('followUpSubmitBtn').textContent = 'Salvar Edição'; 
    switchTab('followups'); // Garante que a aba esteja aberta
};

const updateLeadStage = async (leadId, newStageId) => {
    const url = `${BASE_URL}/leads/${leadId}/stage`;
    try {
        await fetchData(url, "PUT", { newStageId: parseInt(newStageId) });
        await fetchLeads();
        return true;
    } catch (error) {
        alert(`Falha ao mover a Lead. ${error.message}`);
        return false;
    }
};

const deleteLead = async () => {
    if(!currentLeadId || !confirm('Tem certeza que deseja EXCLUIR permanentemente esta Lead?')) {
        return;
    }

    try {
        await fetchData(`${BASE_URL}/leads/${currentLeadId}`, "DELETE");
        alert("Lead excluida com sucesso!");
        closeLeadModal();
        await fetchLeads();
    }catch(error) {
        alert(`Falha ao excluir lead: ${error.message}`);
        console.error("Error ao excluir Lead: ", error);
    }
}

const saveLead = async () => {
    const title = document.getElementById('leadTitle').value;
    const clientEmail = document.getElementById('clientEmailInput').value;
    const value = document.getElementById('leadValue').value;
    const initialStageId = document.getElementById('stageSelect').value;

    if (!title || !clientEmail || !initialStageId) {
        alert("Todos os campos obrigatórios devem ser preenchidos.");
        return;
    }

    const leadData = {
        title,
        clientEmail: clientEmail,
        value: parseFloat(value) || 0,
        initialStageId: parseInt(initialStageId),
    };

    try {
        if (currentLeadId) {
            await fetchData(`${BASE_URL}/leads/${currentLeadId}`, "PUT", leadData); // Atualizar lead existente
        } else {
            await fetchData(`${BASE_URL}/leads`, "POST", leadData); // Criar nova lead
        }
        await fetchLeads(); // Recarregar as leads
        closeLeadModal(); // Fechar o modal
    } catch (error) {
        console.error("Erro ao salvar a lead:", error);
    }
};

// ----------------------------------------------------------------------
// 8. Funções de Modal
// ----------------------------------------------------------------------

const openLeadModal = (leadId = null) => {
    currentLeadId = leadId; // Se for null, significa criar uma nova lead
    if (leadId) {
        loadLeadData(leadId);
        modalTitle.textContent = 'Editar Lead'; // Atualiza o título do modal
    } else {
        modalTitle.textContent = 'Cadastrar Nova Lead';
        deleteLeadBtn.hidden = true;
        leadForm.reset();
    }
    leadModal.hidden = false;
    switchTab('leadDetails');
};

const loadLeadData = async (leadId) => {
    try {
        const lead = await fetchData(`${BASE_URL}/leads/${leadId}`, "GET");

        const clientEmail = lead.client?.email || '';

        document.getElementById('leadTitle').value = lead.title;
        document.getElementById('clientEmailInput').value =     clientEmail;
        document.getElementById('leadValue').value = lead.value;
        document.getElementById('stageSelect').value = lead.stageId;
        modalTitle.textContent = `Editar Lead: ${lead.title}`;

        deleteLeadBtn.hidden = false;

        resetFolloUpForm();

        loadFollowUpHistory(leadId);
    } catch (error) {
        console.error("Erro ao carregar dados da lead:", error);
        alert(`Falha ao carregar dados da Lead: ${error.message}`);
    }
};

const closeLeadModal = () => {
    leadModal.hidden = true;
    currentLeadId = null;

    leadForm.reset();
    followUpHistory.innerHTML = '<p>Nenhuma interação registrada ainda.</p>';
    followUpForm.reset();

    switchTab('leadDetails');
};

// ----------------------------------------------------------------------
// 9. Inicialização e Listeners
// ----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    const stages = await fetchStage();
    renderStageSelect(stages);
    renderStageColumns(stages);

    await fetchLeads();  // Carregar todas as leads ao inicializar a página
    // await fetchClientsData();


    newLeadBtn.addEventListener('click', () => openLeadModal());
    closeLeadModalBtn.addEventListener('click', closeLeadModal);

    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        saveLead();
    });

    tabs.forEach(tab => { 
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    deleteLeadBtn.addEventListener('click', deleteLead);

    followUpHistory.addEventListener("click", (e) => {
        const id = e.target.dataset.id;

        if(!id) return;

        if(e.target.classList.contains('delete-fup-btn')) {
            deleteFollowUp(id);
        }

        if(e.target.classList.contains('edit-fup-btn')) {
            editFollowUp(id);
        }
    })

    followUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nextActionDateValue = document.getElementById('nextActionDate').value;
        
        const isEditing = currentFollowUpId !== null;
        const method = isEditing ? "PUT" : "POST";

        const url = isEditing 
        ? `${BASE_URL}/followups/${currentFollowUpId}` 
        : `${BASE_URL}/leads/${currentLeadId}/followups`;

        let payload;

        // Validação básica para o POST
        if (!isEditing && (!document.getElementById('interactionNotes').value || !nextActionDateValue)) {
            alert("Preencha as notas de interação e a data para agendamento.");
            return;
        }

        if(isEditing) {
            payload = { 
                notes: `[PRÓXIMA AÇÃO] ${document.getElementById('nextActionNotes').value || document.getElementById('interactionNotes').value}`,

                data: nextActionDateValue,
            }
        }else {
            payload = {
                interactionNotes: document.getElementById('interactionNotes').value, 
                nextActionDate: nextActionDateValue,
                nextActionNotes: document.getElementById('nextActionNotes').value,
            }
        }

        try {
            await fetchData(url, method, payload);
            
            loadFollowUpHistory(currentLeadId);
            await fetchLeads();
            alert(`Follow-up ${isEditing ? 'atualizado' : 'registrado'} com sucesso!`);

            resetFolloUpForm()

            closeLeadModal();
        } catch (error) {
            console.error("Erro ao registrar follow-up:", error);
            alert(`Falha ao registrar Follow-up: ${error.message}`);
        }
    });

    
});
