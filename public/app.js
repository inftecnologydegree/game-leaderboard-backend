//const API_URL = 'http://localhost:3000/api/leaderboard';
// Remova o localhost:3000 e coloque o seu link oficial do Render
const API_URL = 'https://game-leaderboard-backend.onrender.com';

// Seletores do DOM
const leaderboardBody = document.getElementById('leaderboardBody');
const scoreForm = document.getElementById('scoreForm');
const messageElement = document.getElementById('message');

// Função para buscar e renderizar o Placar (GET)
async function fetchLeaderboard() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Limpa a tabela antes de renderizar
        leaderboardBody.innerHTML = '';

        // Preenche a tabela com os dados da API
        data.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${index + 1}º</strong></td>
                <td>${player.name}</td>
                <td>${player.score} pts</td>
            `;
            leaderboardBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao buscar leaderboard:', error);
    }
}

// Função para enviar uma nova pontuação (POST)
scoreForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar

    const name = document.getElementById('playerName').value;
    const score = document.getElementById('playerScore').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, score }) // Transforma as variáveis em string JSON
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(result.message, 'success');
            scoreForm.reset(); // Limpa os campos do formulário
            fetchLeaderboard(); // Atualiza a tabela na tela imediatamente!
        } else {
            showMessage(result.error || 'Erro ao salvar.', 'error');
        }
    } catch (error) {
        showMessage('Não foi possível conectar ao servidor.', 'error');
    }
});

// Auxiliar para exibir mensagens na tela
function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    setTimeout(() => { messageElement.textContent = ''; }, 3000); // Some após 3 segundos
}

// Inicializa a página buscando o placar existente
fetchLeaderboard();
