// 🚨 IMPORTANTE: Este módulo pressupõe a existência do fetchData para comunicação com a API
import { fetchData } from "../middlewares/api.js";

const BASE_URL = 'http://192.168.15.8:3000/api';
let leadsDoVendedor = []; // Estado global das Leads
let availableStages = []; // Estágios carregados (Prospecção, Proposta, etc.)

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
const clientSelect = document.getElementById('clientSelect');
const stageSelect = document.getElementById('stageSelect');
const followUpHistory = document.getElementById('followUpHistory');
const followUpForm = document.getElementById('followUpForm');
const tabs = document.querySelectorAll('.tab-link');

let currentLeadId = null; // ID da lead sendo editada

// ----------------------------------------------------------------------
// 2. Funções de Carregamento de Dados Iniciais (Clientes e Estágios)
// ----------------------------------------------------------------------

const fetchClientsForSelect = async () => {
    try {
        const clients = await fetchData(`${BASE_URL}/clientes`, "GET");
        clientSelect.innerHTML = '<option value="" disabled selected>Selecione um cliente</option>';
        if (clients) {
            clients.forEach(client => {
                const option = new Option(client.name, client.id);
                clientSelect.add(option);
            });
        }
    } catch (error) {
        console.error("Falha ao carregar Clientes:", error);
    }
};

const renderStageSelect = (stages) => {
    stageSelect.innerHTML = ''; // Limpa as opções
    stages.forEach(stage => {
        const option = new Option(stage.name, stage.id);
        stageSelect.add(option);
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
        const item = document.createElement('div');
        item.className = 'followup-item';
        item.innerHTML = `
            <strong>${new Date(fup.date).toLocaleString()}</strong>
            <p>Notas: ${fup.notes}</p>
            ${fup.nextActionNotes ? `<p>Próx. Ação: ${fup.nextActionNotes} em ${new Date(fup.nextActionDate).toLocaleDateString()}</p>` : ''}
        `;
        followUpHistory.appendChild(item);
    });
};

const switchTab = (tabName) => {
    tabs.forEach(tab => {
        tab.classList.remove('active');
        const content = document.getElementById(tab.dataset.tab);
        content.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
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
        if (e.target.tagName === 'BUTTON') return;
        openLeadModal(lead.id);
    });

    const nextActionDate = lead.nextActionDate ? new Date(lead.nextActionDate).toLocaleDateString() : 'N/A';
    const clientName = lead.clientName || '[Cliente Não Atribuído]';
    
    card.innerHTML = `
        <h4>${lead.title}</h4>
        <p>Cliente: ${clientName}</p>
        <p>Valor: <strong>R$ ${lead.value ? lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</strong></p>
        <p>Próximo Contato: ${nextActionDate}</p>
        <div class="card-actions">
            <button class="followup-btn" onclick="openLeadModal('${lead.id}'); switchTab('followups')">+</button>
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
        const followUps = await fetchData(`${BASE_URL}/leads/${leadId}/followups`, "GET");
        renderFollowUpHistory(followUps);
    } catch (error) {
        console.error("Erro ao carregar histórico de follow-ups:", error);
    }
};

// ----------------------------------------------------------------------
// 6. Funções Assíncronas Principais (Comunicação com API)
// ----------------------------------------------------------------------

const fetchLeads = async () => {
    try {
        const url = `${BASE_URL}/leads`;
        const data = await fetchData(url, "GET"); 
        leadsDoVendedor = data || []; 
        renderKanban(leadsDoVendedor); 
    } catch (error) {
        console.error("Erro ao carregar Leads:", error);
    }
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

const saveLead = async () => {
    const title = document.getElementById('leadTitle').value;
    const clientId = document.getElementById('clientSelect').value;
    const value = document.getElementById('leadValue').value;
    const stageId = document.getElementById('stageSelect').value;

    if (!title || !clientId || !stageId) {
        alert("Todos os campos obrigatórios devem ser preenchidos.");
        return;
    }

    const leadData = {
        title,
        clientId,
        value: value || 0,
        stageId,
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
// 7. Funções de Modal
// ----------------------------------------------------------------------

const openLeadModal = (leadId = null) => {
    currentLeadId = leadId; // Se for null, significa criar uma nova lead
    if (leadId) {
        loadLeadData(leadId);
        modalTitle.textContent = 'Editar Lead'; // Atualiza o título do modal
    } else {
        modalTitle.textContent = 'Cadastrar Nova Lead';
        deleteLeadBtn.hidden = true;
    }
    leadModal.hidden = false;
};

const loadLeadData = async (leadId) => {
    try {
        const lead = await fetchData(`${BASE_URL}/leads/${leadId}`, "GET");
        document.getElementById('leadTitle').value = lead.title;
        document.getElementById('clientSelect').value = lead.clientId;
        document.getElementById('leadValue').value = lead.value;
        document.getElementById('stageSelect').value = lead.stageId;
        modalTitle.textContent = `Editar Lead: ${lead.title}`;
        deleteLeadBtn.hidden = false;
        loadFollowUpHistory(leadId);
    } catch (error) {
        console.error("Erro ao carregar dados da lead:", error);
    }
};

const closeLeadModal = () => {
    leadModal.hidden = true;
    currentLeadId = null;
};

// ----------------------------------------------------------------------
// 8. Inicialização e Listeners
// ----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    await fetchLeads();  // Carregar todas as leads ao inicializar a página
    newLeadBtn.addEventListener('click', () => openLeadModal());
    closeLeadModalBtn.addEventListener('click', closeLeadModal);
    saveLeadBtn.addEventListener('click', saveLead);
    followUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const followUpData = {
            leadId: currentLeadId,
            notes: document.getElementById('interactionNotes').value,
            nextActionDate: document.getElementById('nextActionDate').value,
            nextActionNotes: document.getElementById('nextActionNotes').value
        };
        try {
            await fetchData(`${BASE_URL}/leads/${currentLeadId}/followups`, "POST", followUpData);
            loadFollowUpHistory(currentLeadId);
            alert("Follow-up registrado com sucesso!");
        } catch (error) {
            console.error("Erro ao registrar follow-up:", error);
        }
    });
});
