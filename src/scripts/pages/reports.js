import { fetchData } from "../middlewares/api.js"; // Importa o middleware

const API_BASE_URL = 'http://localhost:3000/api';
let salesChart = null;
let contactsChart = null;

// ----------------------------------------------------------------------
// 1. Inicialização e Controle de Período
// ----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async function() {
    initTabs();
    initPeriodSelector();
    
    // Pega o período inicial (ex: 'Últimos 30 dias')
    const initialPeriod = document.getElementById('period')?.value || 'Últimos 30 dias';
    
    // Carrega dados iniciais
    await initializeDashboardData(initialPeriod); 
});

async function initializeDashboardData(period) {
    // Carrega Cards, Gráficos e Tarefas em paralelo
    console.log(`Carregando dashboard para o período: ${period}`);
    await Promise.all([
        updateDashboardCards(period),
        updateSalesChart(period),
        updateContactsChart(period),
        updateTasksDashboardFromAPI(period)
    ]);
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // ... (lógica de troca de abas, inalterada) ...
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                setTimeout(() => {
                    if (tabId === 'vendas' && salesChart) {
                        salesChart.resize();
                    }
                    if (tabId === 'contatos' && contactsChart) {
                        contactsChart.resize();
                    }
                }, 100);
            }
        });
    });
}

function initPeriodSelector() {
    const periodSelect = document.getElementById('period');
    if (!periodSelect) return;
    
    periodSelect.addEventListener('change', function() {
        const selectedPeriod = this.value;
        updateDashboard(selectedPeriod);
    });
}

async function updateDashboard(period) {
    await Promise.all([
        updateSalesChart(period),
        updateContactsChart(period),
        updateTasksDashboardFromAPI(period),
        updateDashboardCards(period)
    ]);
}


// ----------------------------------------------------------------------
// 2. Funções de Busca de Dados (APIs)
// ----------------------------------------------------------------------

// Função de dados mock para fallback
const getSalesDataMock = () => ({
    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    values: [45000, 52000, 48000, 61000, 67000, 72000]
});

async function fetchSalesData(period) {
    // 🚨 USANDO fetchData
    try {
        const data = await fetchData(`${API_BASE_URL}/vendas?period=${encodeURIComponent(period)}`, "GET");
        
        if (data && data.meses && data.vendas) {
             return {
                months: data.meses,
                values: data.vendas
            };
        } else {
            console.warn('API de vendas retornou dados inesperados, usando mock.');
            return getSalesDataMock();
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados de vendas:', error);
        return getSalesDataMock(); 
    }
}

// Função de dados mock para fallback
const getContactsDataMock = () => ({
    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    clients: [45, 52, 38, 61, 58, 72],
    targets: [50, 50, 50, 55, 55, 60]
});

async function fetchContactsData(period) {
    // 🚨 USANDO fetchData
    try {
        const data = await fetchData(`${API_BASE_URL}/contatos?period=${encodeURIComponent(period)}`, "GET");
        
        if (data && data.meses && data.clientes && data.metas) {
            const total = data.clientes.reduce((sum, current) => sum + current, 0);
            // Atualiza o total de clientes no sumário
            document.getElementById('totalClients').textContent = total;
            
            return {
                months: data.meses,
                clients: data.clientes,
                targets: data.metas
            };
        } else {
             console.warn('API de contatos retornou dados inesperados, usando mock.');
             return getContactsDataMock();
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados de contatos:', error);
        const data = getContactsDataMock();
        const total = data.clients.reduce((sum, current) => sum + current, 0);
        document.getElementById('totalClients').textContent = total;
        return data;
    }
}

// Função de dados mock para fallback
const getTasksDataMock = () => ({
    concluidas: 89,
    andamento: 23,
    atrasadas: 7
});

async function fetchTasksData(period) {
    // 🚨 USANDO fetchData
    try {
        const data = await fetchData(`${API_BASE_URL}/tarefas?period=${encodeURIComponent(period)}`, "GET");
        
        if (data && data.concluidas !== undefined && data.andamento !== undefined && data.atrasadas !== undefined) {
             return {
                concluidas: data.concluidas || 0,
                andamento: data.andamento || 0,
                atrasadas: data.atrasadas || 0
            };
        } else {
             console.warn('API de tarefas retornou dados inesperados, usando mock.');
             return getTasksDataMock();
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados de tarefas:', error);
        return getTasksDataMock();
    }
}


async function fetchDashboardCards(period) {
    // 🚨 USANDO fetchData
    try {
        const data = await fetchData(`${API_BASE_URL}/dashboard?period=${encodeURIComponent(period)}`, "GET");
        
        if (data) {
            return data;
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados de cards:', error);
    }
    return {}; 
}


// ----------------------------------------------------------------------
// 3. Funções de Atualização e Renderização
// ----------------------------------------------------------------------

function initSalesChart(salesData) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    if (salesChart) {
        salesChart.destroy();
    }
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesData.months,
            datasets: [{
                label: 'Vendas (R$)',
                data: salesData.values,
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 3,
                tension: 0.3,
                pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.parsed.y.toLocaleString('pt-BR')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: function(value) {
                            return `R$ ${(value / 1000).toFixed(0)}k`;
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

async function updateSalesChart(period) {
    const salesData = await fetchSalesData(period);
    
    if (salesChart) {
        salesChart.data.labels = salesData.months;
        salesChart.data.datasets[0].data = salesData.values;
        salesChart.update();
    } else {
        initSalesChart(salesData);
    }
}


function initContactsChart(contactsData) {
    const ctx = document.getElementById('contactsChart');
    if (!ctx) return;
    
    if (contactsChart) {
        contactsChart.destroy();
    }
    
    contactsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: contactsData.months,
            datasets: [
                {
                    label: 'Clientes Cadastrados',
                    data: contactsData.clients,
                    backgroundColor: contactsData.clients.map((value, index) => 
                        value >= contactsData.targets[index] ? '#4CAF50' : '#FF9800'
                    ),
                    borderColor: contactsData.clients.map((value, index) => 
                        value >= contactsData.targets[index] ? '#388E3C' : '#F57C00'
                    ),
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Meta',
                    data: contactsData.targets,
                    type: 'line',
                    borderColor: '#8B5CF6',
                    borderWidth: 3,
                    pointBackgroundColor: '#8B5CF6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            
                            if (datasetLabel === 'Clientes Cadastrados') {
                                const dataIndex = context.dataIndex;
                                const target = contactsData.targets[dataIndex]; 
                                const difference = value - target;
                                const status = difference >= 0 ? '▲' : '▼';
                                
                                return `${datasetLabel}: ${value} / ${target} ${status}`;
                            }
                            
                            return `${datasetLabel}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

async function updateContactsChart(period) {
    const contactsData = await fetchContactsData(period);
    
    if (contactsChart) {
        // Atualiza os dados (labels, datasets, cores)
        contactsChart.data.labels = contactsData.months;
        contactsChart.data.datasets[0].data = contactsData.clients;
        contactsChart.data.datasets[0].backgroundColor = contactsData.clients.map((value, index) => 
            value >= contactsData.targets[index] ? '#4CAF50' : '#FF9800'
        );
        contactsChart.data.datasets[0].borderColor = contactsData.clients.map((value, index) => 
            value >= contactsData.targets[index] ? '#388E3C' : '#F57C00'
        );
        contactsChart.data.datasets[1].data = contactsData.targets;
        contactsChart.update();
    } else {
        initContactsChart(contactsData);
    }
}


function updateTasksDashboard(data) {
    document.getElementById('concluidas-count').textContent = data.concluidas;
    document.getElementById('andamento-count').textContent = data.andamento;
    document.getElementById('atrasadas-count').textContent = data.atrasadas;
}

async function updateTasksDashboardFromAPI(period) {
    const data = await fetchTasksData(period);
    updateTasksDashboard(data);
}


async function updateDashboardCards(period) {
    const data = await fetchDashboardCards(period);
    
    // Assumindo a estrutura de retorno da API: 
    // { vendas_mes, novos_contatos, taxa_conversao, tarefas_concluidas }
    
    if (data.vendas_mes !== undefined) {
        document.querySelector('.cardSales .card_stats').textContent = 
            `R$ ${data.vendas_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    
    if (data.novos_contatos !== undefined) {
        document.querySelector('.cardContacts .card_stats').textContent = 
            data.novos_contatos;
    }
    
    if (data.taxa_conversao !== undefined) {
        document.querySelector('.cardConversion .card_stats').textContent = 
            `${data.taxa_conversao}%`;
    }
    
    if (data.tarefas_concluidas !== undefined) {
        document.querySelector('.cardCompleted .card_stats').textContent = 
            data.tarefas_concluidas;
    }
}


window.addEventListener('resize', function() {
    if (salesChart) {
        salesChart.resize();
    }
    if (contactsChart) {
        contactsChart.resize();
    }
});