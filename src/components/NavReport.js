const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");
const cards = document.querySelectorAll(".profile-card"); // opcional

tabs.forEach(tab => {
    tab.addEventListener("click", () => {

        // remove active de tudo
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));
        cards.forEach(cd => cd.classList.remove("active"));

        // ativa aba
        tab.classList.add("active");

        const id = tab.dataset.tab;

        // ativa conteúdo
        document.getElementById(id).classList.add("active");

        // ativa card se existir
        const card = document.getElementById("card-" + id);
        if (card) card.classList.add("active");
    });
});
