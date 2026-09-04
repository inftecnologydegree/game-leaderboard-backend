//const API_URL = 'http://localhost:3000/api/leaderboard';
// Remova o localhost:3000 e coloque o seu link oficial do Render
const API_URL = 'https://game-leaderboard-backend.onrender.com';
const SECRET_KEY = 'MySuperSecretGameKey123'; // A mesma chave usada na Unity e Node


// Seletores do DOM
const leaderboardBody = document.getElementById('leaderboardBody');
const scoreForm = document.getElementById('scoreForm');
const messageElement = document.getElementById('message');
// Função auxiliar para gerar o Hash HMAC SHA-256 em JavaScript puro no navegador
async function generateHMAC(secret, jsonString) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(jsonString);

    const cryptoKey = await window.crypto.subtle.importKey(
        "raw", keyData,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false, ["sign"]
    );

    const signatureBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, messageData);
    return Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// Modifique a parte do preenchimento do formulário dentro do seu app.js original:
scoreForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('playerName').value;
    const score = document.getElementById('playerScore').value;

    // 1. Monta o objeto exatamente no formato que a Unity envia na rede
    const payloadObject = { id: 0, name: name, score: Number(score) };
    const jsonBody = JSON.stringify(payloadObject);

    try {
        // 2. Gera a assinatura de segurança direto no navegador do usuário
        const signature = await generateHMAC(SECRET_KEY, jsonBody);

        // 3. Dispara para o Render contendo o cabeçalho de autenticação!
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature // Passou pelo guarda da segurança!
            },
            body: jsonBody
        });

        const result = await response.json();

        if (response.ok) {
            showMessage("Enviado para a nuvem com sucesso! 🛡️", 'success');
            scoreForm.reset();
            fetchLeaderboard(); // Atualiza a tabela na tela
        } else {
            showMessage(result.error || 'Erro na nuvem.', 'error');
        }
    } catch (error) {
        showMessage('Erro crítico de rede.', 'error');
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
