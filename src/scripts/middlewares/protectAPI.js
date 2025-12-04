function requireAuth() {
    const token = localStorage.getItem("token");
    
    // Identifica a página atual
    const currentPage = window.location.pathname;
    
    // 2. Define o caminho da página de login
    const loginPagePath = '../pages/login.html'; 

    // Se o token não existir E NÃO ESTIVER na página de login, redireciona
    if (!token && !currentPage.includes(loginPagePath)) {
        console.warn("Token não encontrado. Redirecionando para login.");
        
        // Redireciona, passando a URL atual como parâmetro 'redirect'
        window.location.href = `${loginPagePath}?redirect=${encodeURIComponent(currentPage)}`;
        
        // Opcional: Impedir que o restante do script da página seja carregado
        throw new Error("Usuário não autenticado."); 
    }
}

document.addEventListener("DOMContentLoaded", requireAuth);