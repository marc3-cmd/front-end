document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initSalesChart();
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
                
                if (tabId === 'vendas' && window.salesChart) {
                    setTimeout(() => {
                        window.salesChart.resize();
                    }, 100);
                }
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

function initPeriodSelector() {
    const periodSelect = document.getElementById('period');
    if (!periodSelect) return;
    
    periodSelect.addEventListener('change', function() {
        const selectedPeriod = this.value;
        updateSalesChart(selectedPeriod);
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
});