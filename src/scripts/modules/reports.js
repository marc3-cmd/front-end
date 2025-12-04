document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initSalesChart();
    initContactsChart();
    initTasksDashboard();
    initPeriodSelector();
});

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                setTimeout(() => {
                    if (tabId === 'vendas' && window.salesChart) {
                        window.salesChart.resize();
                    }
                    if (tabId === 'contatos' && window.contactsChart) {
                        window.contactsChart.resize();
                    }
                }, 100);
            }
        });
    });
}

function initSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    const salesData = getSalesData();
    
    window.salesChart = new Chart(ctx, {
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
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Poppins', sans-serif"
                        },
                        color: '#333'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        family: "'Poppins', sans-serif"
                    },
                    bodyFont: {
                        family: "'Poppins', sans-serif"
                    },
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
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: "'Poppins', sans-serif"
                        },
                        callback: function(value) {
                            return `R$ ${(value/1000).toFixed(0)}k`;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 14
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function getSalesData() {
    return {
        months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        values: [45000, 52000, 48000, 61000, 67000, 72000]
    };
}

async function fetchSalesData(period = 'Últimos 30 dias') {
    try {
        const response = await fetch(`/api/vendas?period=${encodeURIComponent(period)}`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados');
        }
        
        const data = await response.json();
        
        if (data.success) {
            return {
                months: data.meses,
                values: data.vendas
            };
        } else {
            throw new Error(data.message || 'Erro nos dados da API');
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados de vendas:', error);
        return getSalesData();
    }
}

async function updateSalesChart(period) {
    if (!window.salesChart) return;
    
    const canvas = document.getElementById('salesChart');
    const container = canvas.parentElement;
    const originalHTML = container.innerHTML;
    container.innerHTML = '<div class="loading">Carregando dados...</div>';
    
    try {
        const salesData = await fetchSalesData(period);
        
        window.salesChart.data.labels = salesData.months;
        window.salesChart.data.datasets[0].data = salesData.values;
        window.salesChart.update();
        
        container.innerHTML = originalHTML;
        container.querySelector('canvas').id = 'salesChart';
        
        initSalesChart();
        
    } catch (error) {
        console.error('Erro ao atualizar gráfico:', error);
        container.innerHTML = originalHTML;
        container.querySelector('canvas').id = 'salesChart';
        initSalesChart();
    }
}

function initContactsChart() {
    const ctx = document.getElementById('contactsChart');
    if (!ctx) return;
    
    const contactsData = getContactsData();
    
    window.contactsChart = new Chart(ctx, {
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
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Poppins', sans-serif"
                        },
                        color: '#333'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        family: "'Poppins', sans-serif"
                    },
                    bodyFont: {
                        family: "'Poppins', sans-serif"
                    },
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
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: "'Poppins', sans-serif"
                        },
                        stepSize: 10
                    },
                    title: {
                        display: true,
                        text: 'Quantidade de Clientes',
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 14
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function getContactsData() {
    return {
        months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        clients: [45, 52, 38, 61, 58, 72],
        targets: [50, 50, 50, 55, 55, 60]
    };
}

async function fetchContactsData(period = 'Últimos 30 dias') {
    try {
        const response = await fetch(`/api/contatos?period=${encodeURIComponent(period)}`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados');
        }
        
        const data = await response.json();
        
        if (data.success) {
            const total = data.clientes.reduce((sum, current) => sum + current, 0);
            document.getElementById('totalClients').textContent = total;
            
            return {
                months: data.meses,
                clients: data.clientes,
                targets: data.metas
            };
        } else {
            throw new Error(data.message || 'Erro nos dados da API');
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados de contatos:', error);
        const data = getContactsData();
        const total = data.clients.reduce((sum, current) => sum + current, 0);
        document.getElementById('totalClients').textContent = total;
        return data;
    }
}

async function updateContactsChart(period) {
    if (!window.contactsChart) return;
    
    const canvas = document.getElementById('contactsChart');
    const container = canvas.parentElement;
    const originalHTML = container.innerHTML;
    container.innerHTML = '<div class="loading">Carregando dados...</div>';
    
    try {
        const contactsData = await fetchContactsData(period);
        
        window.contactsChart.data.labels = contactsData.months;
        window.contactsChart.data.datasets[0].data = contactsData.clients;
        window.contactsChart.data.datasets[0].backgroundColor = contactsData.clients.map((value, index) => 
            value >= contactsData.targets[index] ? '#4CAF50' : '#FF9800'
        );
        window.contactsChart.data.datasets[0].borderColor = contactsData.clients.map((value, index) => 
            value >= contactsData.targets[index] ? '#388E3C' : '#F57C00'
        );
        window.contactsChart.data.datasets[1].data = contactsData.targets;
        
        window.contactsChart.update();
        
        container.innerHTML = originalHTML;
        container.querySelector('canvas').id = 'contactsChart';
        
        initContactsChart();
        
    } catch (error) {
        console.error('Erro ao atualizar gráfico de contatos:', error);
        container.innerHTML = originalHTML;
        container.querySelector('canvas').id = 'contactsChart';
        initContactsChart();
    }
}

function initTasksDashboard() {
    const tasksData = getTasksData();
    updateTasksDashboard(tasksData);
}

function getTasksData() {
    return {
        concluidas: 89,
        andamento: 23,
        atrasadas: 7
    };
}

function updateTasksDashboard(data) {
    document.getElementById('concluidas-count').textContent = data.concluidas;
    document.getElementById('andamento-count').textContent = data.andamento;
    document.getElementById('atrasadas-count').textContent = data.atrasadas;
}

async function fetchTasksData(period = 'Últimos 30 dias') {
    try {
        const response = await fetch(`/api/tarefas?period=${encodeURIComponent(period)}`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados');
        }
        
        const data = await response.json();
        
        if (data.success) {
            return {
                concluidas: data.concluidas || 0,
                andamento: data.andamento || 0,
                atrasadas: data.atrasadas || 0
            };
        } else {
            throw new Error(data.message || 'Erro nos dados da API');
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados de tarefas:', error);
        return getTasksData();
    }
}

async function updateTasksDashboardFromAPI(period) {
    const data = await fetchTasksData(period);
    updateTasksDashboard(data);
}

function initPeriodSelector() {
    const periodSelect = document.getElementById('period');
    if (!periodSelect) return;
    
    periodSelect.addEventListener('change', function() {
        const selectedPeriod = this.value;
        updateSalesChart(selectedPeriod);
        updateContactsChart(selectedPeriod);
        updateTasksDashboardFromAPI(selectedPeriod);
        updateDashboardCards(selectedPeriod);
    });
}

async function updateDashboardCards(period) {
    try {
        const response = await fetch(`/api/dashboard?period=${encodeURIComponent(period)}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                if (data.vendas_mes !== undefined) {
                    document.querySelector('.cardSales .card_stats').textContent = 
                        `R$ ${data.vendas_mes.toLocaleString('pt-BR')}`;
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
        }
    } catch (error) {
        console.error('Erro ao atualizar cards:', error);
    }
}

window.addEventListener('resize', function() {
    if (window.salesChart) {
        window.salesChart.resize();
    }
    if (window.contactsChart) {
        window.contactsChart.resize();
    }
});