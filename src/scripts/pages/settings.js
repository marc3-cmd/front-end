import { fetchData } from "../middlewares/api.js";

const API_BASE_URL = "https://usetrack-backend-production.up.railway.app";

// =====================================================================
// 1. Seletores (versão com IDs — 100% confiável)
// =====================================================================
const formName       = document.getElementById("inputName");
const formEmail      = document.getElementById("inputEmail");
const formCargo      = document.getElementById("inputCargo");
const formTelefone   = document.getElementById("inputTelefone");
const formBiografia  = document.getElementById("inputBio");

const saveBtn        = document.getElementById("saveBtn");
const logoutBtn      = document.createElement("button");


// =====================================================================
// 2. Inicialização
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    setupEventListeners();
    loadProfileData();
});


// =====================================================================
// 3. Sistema de Tabs
// =====================================================================
function initTabs() {
    const tabs = document.querySelectorAll(".settings_tabs .tab");
    const panes = document.querySelectorAll(".settings_content .tab-pane");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelector(".tab.active")?.classList.remove("active");
            document.querySelector(".tab-pane.active")?.classList.remove("active");

            tab.classList.add("active");
            const targetPane = document.getElementById(`tab-${tab.dataset.tab}`);
            targetPane?.classList.add("active");
        });
    });
}


// =====================================================================
// 4. Eventos de Botões (Salvar, Excluir e Logout)
// =====================================================================
function setupEventListeners() {

    // Botão SALVAR
    saveBtn?.addEventListener("click", updateProfile);

    // Botão EXCLUIR CONTA
    const securityPane = document.getElementById("tab-seguranca");
    if (securityPane) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Excluir Conta Permanentemente";
        deleteBtn.classList.add("btn_primary");
        deleteBtn.style.marginTop = "20px";
        deleteBtn.style.backgroundColor = "#EF4444";
        deleteBtn.style.borderColor = "#EF4444";
        deleteBtn.addEventListener("click", deleteUserConfirmation);

        securityPane.querySelector(".settings_card")?.appendChild(deleteBtn);
    }

    // Botão LOGOUT (adicionado ao header)
    logoutBtn.textContent = "Logout";
    logoutBtn.classList.add("btn_primary");
    logoutBtn.style.marginLeft = "20px";
    logoutBtn.style.backgroundColor = "#6B7280";
    logoutBtn.style.borderColor = "#6B7280";
    logoutBtn.style.color = "white";
    logoutBtn.addEventListener("click", handleLogout);

    const settingsHeader = document.querySelector(".settings_header");
    const headerTitle = settingsHeader?.querySelector("h2");

    if (settingsHeader && headerTitle) {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "15px";

        headerTitle.parentElement.insertBefore(container, headerTitle);
        container.appendChild(headerTitle);
        container.appendChild(logoutBtn);
    }
}


// =====================================================================
// 5. GET — Carregar Perfil
// =====================================================================
async function loadProfileData() {
    try {
        const response = await fetchData(`${API_BASE_URL}/profile/me`, "GET");

        const data = response?.data ?? response;
        if (!data) {
            console.error("Resposta da API inválida.");
            return;
        }

        if (formName)      formName.value      = data.nome ?? "";
        if (formEmail)     formEmail.value     = data.email ?? "";
        if (formCargo)     formCargo.value     = data.role ?? "";
        if (formTelefone)  formTelefone.value  = data.telefone ?? ""; // campo manual
        if (formBiografia) formBiografia.value = data.biografia ?? ""; // campo manual

        console.log("Perfil carregado:", data);

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        alert("Erro ao carregar os dados do perfil. Tente novamente.");
    }
}


// =====================================================================
// 6. PUT — Atualizar Perfil
// =====================================================================
async function updateProfile() {
    const payload = {
        nome: formName?.value ?? "",
        email: formEmail?.value ?? "",
        telefone: formTelefone?.value ?? "",
        biografia: formBiografia?.value ?? ""
    };

    if (formPassword?.value) {
        payload.password = formPassword.value;
    }

    try {
        const response = await fetchData(`${API_BASE_URL}/profile/me`, "PUT", payload);
        alert(response?.message ?? "Perfil atualizado com sucesso!");

    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        alert("Falha ao salvar as alterações do perfil.");
    }
}


// =====================================================================
// 7. DELETE — Excluir Conta
// =====================================================================
function deleteUserConfirmation() {
    if (confirm("ATENÇÃO: Esta ação é irreversível. Deseja realmente excluir sua conta?")) {
        deleteUser();
    }
}

async function deleteUser() {
    try {
        await fetchData(`${API_BASE_URL}/profile/me`, "DELETE");
        alert("Conta excluída com sucesso!");
        handleLogout();

    } catch (error) {
        console.error("Erro ao excluir conta:", error);
        alert("Falha ao excluir sua conta.");
    }
}


// =====================================================================
// 8. Logout
// =====================================================================
function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login.html");
}
