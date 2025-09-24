document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o envio do formulário

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Credenciais corretas
        const correctUser = 'jenifer';
        const correctPass = 'amandateamo';

        if (username === correctUser && password === correctPass) {
            // Sucesso!
            errorMessage.textContent = '';
            
            // Armazena um item na sessão do navegador para indicar que o login foi feito
            sessionStorage.setItem('isAuthenticated', 'true');
            
            // Redireciona para a página principal
            window.location.href = 'main.html';
        } else {
            // Falha!
            errorMessage.textContent = 'Usuário ou senha inválidos.';
        }
    });
});