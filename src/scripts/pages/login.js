const API_URL = 'http://localhost:3000';

const form = document.getElementById("login-form");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("passwordEmail");

form.addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
    event.preventDefault();

    const email = emailInput.value; 
    const password = passwordInput.value;

    // Captura URL de destino
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect") || "../pages/home.html";

    try { 
        const response = await fetch(`${API_URL}/auth/login`, { 
            method: 'POST',
            headers: { 
                'Content-Type': "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            const { accessToken, refresh } = data;
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refresh', refresh);
            
            console.log("accessToken: " + localStorage.getItem('token'));
            console.log("refreshToken: " + localStorage.getItem("refresh"));

            // Redireciona para página original
            window.location.href = redirectTo;

        } else {
            console.error("Erro ao comunicação com a API: ", data.message || "unknown error");
            alert("Erro ao fazer login. Verifique suas credenciais.");
        }

    } catch(error) {
        console.error("Erro de comunicação com a API: ", error);
        alert("Erro de comunicação. Tente novamente mais tarde.");
    }
}
