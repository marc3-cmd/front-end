const API_URL = 'http://localhost:3000';

let isRefreshing = false;
let subscribers = []; // Fila de requisições que aguardam o novo token

// Função utilitária para adicionar funções de callback à fila
function subscribeTokenRefresh(callback) {
    subscribers.push(callback);
};

function onRefreshed(token) {
    subscribers.forEach(callback => {
        callback(token); // <--- A função callback PRECISA ser executada!
    });
    subscribers = []; 
}

// Função para obter o token de acesso (Access Token)
function getAccessToken() {
    return localStorage.getItem("token");
}

// Função para obter o refresh token
function getRefreshToken() {
    return localStorage.getItem("refresh");
}

// Função para armazenar o token de acesso
function setAccessToken(token) {
    localStorage.setItem("token", token);
}

// Função para renovar o token de acesso
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    console.log(refreshToken);
    if (!refreshToken) {
        console.warn("Refresh token não encontrado");
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        });

        const data = await response.json();

        if (response.ok) {
            setAccessToken(data.accessToken);
            return data.accessToken;
        }

        console.warn("Falha ao renovar o token de acesso");
        return null;

    } catch (err) {
        console.error("Erro ao renovar token:", err);
        return null;
    }
}

// Função para fazer requisição à API com tratamento de tokens e refresh
export async function fetchData(url, method = "GET", body = null) {
    let accessToken = getAccessToken();

    if (!accessToken) {
        console.warn("Token de acesso não encontrado. Redirecionando para login...");
        window.location.href = '../pages/login.html';
        return;
    }

    // Função interna para realizar a requisição (INALTERADA)
    async function makeRequest(token) {
        return await fetch(url, { 
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: body ? JSON.stringify(body) : null
        });
    }

    // TENTAATIVA INICIAL
    let response = await makeRequest(accessToken);

    // Se 401, checa o estado do refresh
    if (response.status === 401) {
        console.warn("Token expirado, gerenciando renovação...");

        // 1. Se NENHUM refresh estiver em andamento, INICIA a renovação
        if (!isRefreshing) {
            isRefreshing = true;
            
            try {
                const newToken = await refreshAccessToken();
                if (!newToken) {
                    
                    onRefreshed(null); // Notifica a fila com token nulo
                    console.warn("Falha ao renovar o token. Redirecionando para login...");

                    window.location.href = '../pages/login.html';
                    return;
                }
                
                // Renova o token e notifica todas as requisições em espera
                isRefreshing = false;
                onRefreshed(newToken); 

                // A requisição inicial continua abaixo com o token recém-obtido.
                accessToken = newToken;

            } catch (err) {
                isRefreshing = false;
                onRefreshed(null);
                throw err;
            }
        
        // 2. Se o refresh JÁ estiver em andamento, ADICIONA à fila
        } else {
            console.log("Renovação já em andamento, esperando novo token...");
            
            // Cria uma Promessa que será resolvida quando onRefreshed for chamada
            const newAccessTokenPromise = new Promise(resolve => {
                subscribeTokenRefresh(token => {
                    resolve(token);
                });
            });

            const newToken = await newAccessTokenPromise;

            if (!newToken) {
                // Se a renovação falhou, não tenta a requisição e retorna
                return; 
            }
            
            // Usa o novo token para esta requisição
            accessToken = newToken;
        }

        // Reenvia a requisição com o token ATUALIZADO (seja o recém-obtido ou o que estava em espera)
        response = await makeRequest(accessToken);
    }
    
    // --- LÓGICA DE TRATAMENTO DE RESPOSTA (INALTERADA) ---

    // Se a resposta não for OK, lança um erro
    if (!response.ok) {
        const errorText = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorText.message || 'Erro desconhecido');
    }

    // Se o status da resposta for 204, não há dados
    if (response.status === 204) {
        return null;
    }

    // Tenta retornar o JSON da resposta, se possível
    try {
        return await response.json();
    } catch (err) {
        // ...
        return null;
    }

}
