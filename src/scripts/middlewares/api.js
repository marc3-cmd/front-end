const API_URL = 'https://usetrack-backend-production.up.railway.app';

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


// Exemplo de função de segurança centralizada
function handleTokenExpiration(errorMessage = "Sua sessão expirou.") {
    console.warn("Token expirado/inválido. Limpando localStorage e redirecionando.");
    
    // 1. Notifica o usuário
    alert(errorMessage); 

    // 2. Remove os tokens do localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    
    // 3. Redireciona para a tela de login
    window.location.replace("/login.html");
    
    // 4. Lança um erro para interromper a execução da promessa/código chamador
    throw new Error("Sessão expirada. Redirecionamento forçado.");
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
                    handleTokenExpiration("Sua sessão expirou. Por favor, faça login novamente.");  
                }
                
                // Renova o token e notifica todas as requisições em espera
                isRefreshing = false;
                onRefreshed(newToken); 

                // A requisição inicial continua abaixo com o token recém-obtido.
                accessToken = newToken;

            } catch (err) {
                isRefreshing = false;
                onRefreshed(null);
                handleTokenExpiration("Falha na rede durante a renovação da sessão.");
            }
        
        // 2. Se o refresh JÁ estiver em andamento, ADICIONA à fila
        } else {
            console.log("Renovação já em andamento, esperando novo token...");
            
            // Cria uma Promessa que será resolvida quando onRefreshed for chamada
            const newAccessTokenPromise = new Promise((resolve, reject) => {
                subscribeTokenRefresh(token => {
                    if(token) {
                        resolve(token);
                    }else {
                        reject(new Error("Renovação de token falhou."));
                    }
                });
            });

            try {
                const newToken = await newAccessTokenPromise;
                accessToken = newToken;
            } catch (error) {
                // Lança o erro para quem estava na fila (handleTokenExpiration já foi chamado pelo bloco inicial)
                throw error; 
            }
        }

        // Reenvia a requisição com o token ATUALIZADO (seja o recém-obtido ou o que estava em espera)
        response = await makeRequest(accessToken);
    }
    

    // Se a resposta não for OK, lança um erro
    if (!response.ok) {
        // Se 401/403 novamente, força o logout (caso o token recém-emitido seja inválido por algum motivo)
        if (response.status === 401 || response.status === 403) {
            handleTokenExpiration("Acesso não autorizado. Por favor, faça login.");
        }
        
        const errorText = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        const error = new Error(errorText.message || 'Erro desconhecido');
        (error).status = response.status;
        throw error;
    }

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
