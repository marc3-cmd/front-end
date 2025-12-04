import { fetchData } from "../middlewares/api.js";

const API_BASE_URL = 'https://usetrack-backend-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
    // 🚨 Chamar a função de atualização de cards.
    // É uma boa prática inicializar os cards com um indicador de carregamento
    updateCardStats('Contatos Ativos', '...');
    updateCardStats('Novos Leads', '...');
    updateCardStats('Tarefas Pendentes', '...');
    
    // Atualiza os dados principais em paralelo
    await Promise.all([
        fetchActiveContacts(),
        fetchNewLeads(),
        // fetchPendingTasks() // Será implementado se a rota /api/tarefas existir
    ]);
}

/**
 * Encontra o elemento de estatísticas de um card pelo seu título 
 * e atualiza seu valor.
 * @param {string} title O texto do título do card.
 * @param {string|number} value O novo valor a ser exibido.
 */
function updateCardStats(title, value) {
    const cardTitleElement = Array.from(document.querySelectorAll('.card_title'))
        .find(el => el.textContent.trim() === title);

    if (cardTitleElement) {
        const cardStatsElement = cardTitleElement.nextElementSibling;
        if (cardStatsElement && cardStatsElement.classList.contains('card_stats')) {
            cardStatsElement.textContent = value;
        }
    }
}

// ----------------------------------------------------------------------
// 1. Contatos Ativos (Clientes)
// ----------------------------------------------------------------------

async function fetchActiveContacts() {
    const cardTitle = 'Contatos Ativos';
    
    try {
        // Rota: GET /api/clientes (para listar clientes/contatos)
        const data = await fetchData(`${API_BASE_URL}/clientes`, "GET");

        if (Array.isArray(data)) {
            // Conta o número total de clientes retornados
            const count = data.length;
            updateCardStats(cardTitle, count);
        } else {
            console.error('Dados de clientes não são um array:', data);
            updateCardStats(cardTitle, 'Erro');
        }
    } catch (error) {
        console.error('Erro ao buscar Contatos Ativos:', error);
        updateCardStats(cardTitle, 'Erro');
    }
}

// ----------------------------------------------------------------------
// 2. Novos Leads
// ----------------------------------------------------------------------

async function fetchNewLeads() {
    const cardTitle = 'Novos Leads';
    
    try {
        // Rota: GET /api/leads (para listar leads)
        const data = await fetchData(`${API_BASE_URL}/leads`, "GET");

        if (Array.isArray(data)) {
            // Conta o número total de leads retornados
            const count = data.length;
            updateCardStats(cardTitle, count);
        } else {
            console.error('Dados de leads não são um array:', data);
            updateCardStats(cardTitle, 'Erro');
        }
    } catch (error) {
        console.error('Erro ao buscar Novos Leads:', error);
        updateCardStats(cardTitle, 'Erro');
    }
}

// ----------------------------------------------------------------------
// 3. Tarefas Pendentes (Mock/Placeholder)
// ----------------------------------------------------------------------

/**
 * Esta é uma função placeholder, pois não temos o endpoint de tarefas,
 * mas a rota é essencial para manter o card funcional.
 */
async function fetchPendingTasks() {
    const cardTitle = 'Tarefas Pendentes';
    
    // Supondo que você tenha ou terá um endpoint: /api/tarefas/pendentes
    try {
        // Se a rota existir, utilize-a:
        // const data = await fetchData(`${API_BASE_URL}/tarefas/pendentes`, "GET");
        // if (Array.isArray(data)) {
        //     updateCardStats(cardTitle, data.length);
        // } else {
        //     updateCardStats(cardTitle, 0); 
        // }

        // Mock temporário para evitar Erro, ajuste quando o endpoint estiver pronto
        updateCardStats(cardTitle, 12); 

    } catch (error) {
        console.warn('Endpoint de Tarefas Pendentes não encontrado ou falhou. Usando valor fixo.');
        updateCardStats(cardTitle, 12); // Valor de fallback
    }
}