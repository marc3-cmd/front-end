const API_URL = 'https://usetrack-backend-production.up.railway.app';

const form = document.getElementById("register-form");
const nomeInput = document.getElementById("nomeRegister");
const emailInput = document.getElementById("emailRegister");
const passwordInput = document.getElementById("passwordRegister");

form.addEventListener("submit", handleRegisterSubmit);

async function handleRegisterSubmit(event) {
    event.preventDefault();

    const nome = nomeInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    try { 
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, email, password })
        });

        if(response.ok) {
            alert("Registro feito com sucesso");
            window.location.href = '../pages/login.html';
        }else { 
            const errorData = await response.json();
            throw new Error(errorData.message || "Register Error");
        }

    }catch(error) {
        console.error("Erro de comunicação com API", error);
        alert(error.message);
    }
}