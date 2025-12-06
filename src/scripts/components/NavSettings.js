document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.settings_tabs .tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove classe active de todas as tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Remove classe active de todos os tab-panes
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Adiciona classe active na tab clicada
            tab.classList.add('active');
            
            // Ativa o tab-pane correspondente
            const targetId = tab.getAttribute('data-tab');
            const targetPane = document.getElementById(`tab-${targetId}`);
            
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
});