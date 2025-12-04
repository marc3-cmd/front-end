function requireAuth() {
    const token = localStorage.getItem("token");

    // 1. Define o caminho da página de login com base no contexto.
    const loginPageRelativePath = '../pages/login.html'; 
    const currentPath = window.location.pathname;

    // 2. Se o token não existir E NÃO estiver na página de login, redireciona.
    if (!token && !currentPath.includes('/login.html')) {
        console.warn("Token não encontrado. Redirecionando para login.");
        
        // Redireciona, passando a URL atual (com todos os parâmetros) como 'redirect'
        const fullUrl = window.location.href;

        window.location.href = `${loginPageRelativePath}?redirect=${encodeURIComponent(fullUrl)}`;
        
        // Impede que o restante do script da página atual seja carregado
        throw new Error("Usuário não autenticado. Redirecionando."); 
    }
}

// Garante que a verificação de autenticação ocorra antes de qualquer outra ação
document.addEventListener("DOMContentLoaded", requireAuth);