const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");
const cards = document.querySelectorAll(".profile-card");
tabs.forEach(tab => {
    tab.addEventListener("click", () => {

        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));

        
        tab.classList.add("active");
        const target = document.getElementById(tab.dataset.tab);
        target.classList.add("active");
         tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));
        cards.forEach(cd => cd.classList.remove("active"));

        // ativa aba
        tab.classList.add("active");

        const id = tab.dataset.tab;

        // ativa conteúdo principal
        document.getElementById(id).classList.add("active");

        // ativa card correspondente
        document.getElementById("card-" + id).classList.add("active");
    });
});
