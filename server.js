require('dotenv').config(); // Carrega as variáveis do arquivo .env local para a memória RAM

const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Módulo nativo do Node para manipular arquivos
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'leaderboard.json'); // Caminho do arquivo físico

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Função Auxiliar 1: Ler os dados do arquivo JSON de forma segura
function readDataFromFile() {
  try {
    // Se o arquivo não existir, cria um arquivo inicial com os 3 jogadores padrão
    if (!fs.existsSync(FILE_PATH)) {
      const defaultData = [
        { id: 1, name: "PlayerOne", score: 1500 },
        { id: 2, name: "CyberKnight", score: 1200 },
        { id: 3, name: "PixelArt", score: 950 }
      ];
      fs.writeFileSync(FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }

    // Se existir, lê o texto puro e converte de volta para Objeto/Array JavaScript
    const fileData = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error("Erro ao ler o arquivo, retornando array vazio:", error);
    return [];
  }
}

// Função Auxiliar 2: Salvar os dados atualizados no arquivo JSON
function writeDataToFile(data) {
  // Converte o objeto JavaScript em string JSON formatada (com 2 espaços de indentação)
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}
///////////////////////////HMAC///////////////////////////////
//const crypto = require('crypto'); // Built-in Node module for security
// Define your shared secret key (In production, load this from environment variables)
//const SECRET_KEY = 'MySuperSecretGameKey123';
// Busca a chave das Variáveis de Ambiente da nuvem, ou mantém a padrão local de teste
 const SECRET_KEY = process.env.SECRET_KEY || 'MySuperSecretGameKey123';
 //const SECRET_KEY = process.env.SECRET_KEY;

///////////////////////////HMAC//////////////////////
// --- ROTAS DA API ---
// 1. Rota para Buscar o Leaderboard (GET)
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = readDataFromFile(); // Busca os dados atualizados do disco
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
  res.json(sortedLeaderboard);
});

// 2. Rota para Salvar uma Nova Pontuação (POST)
app.post('/api/leaderboard', (req, res) => {
  try {
    const { id, name, score } = req.body; // Captura todas as propriedades enviadas pela Unity
    const clientSignature = req.headers['x-signature'];

    if (!name || score === undefined) {
      return res.status(400).json({ error: "Nome e pontuação são obrigatórios!" });
    }

    if (!clientSignature) {
      return res.status(401).json({ error: "Acesso negado: Assinatura ausente!" });
    }

    // 🔥 A SOLUÇÃO DEFINITIVA: Remonta o JSON usando os valores reais e os tipos exatos.
    // O ID enviado pelo JsonUtility da Unity chega como número, o score vira número e o name mantém aspas.
    // Isso reconstrói exatamente o formato alfanumérico gerado pela Unity na rede!
    const enviadoPelaUnity = {
        id: id !== undefined ? Number(id) : 0,
        name: name,
        score: Number(score)
    };
    const rawPayloadString = JSON.stringify(enviadoPelaUnity);

    // Calcula o Hash com base no objeto perfeitamente alinhado
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(rawPayloadString)
      .digest('hex');

    if (clientSignature !== expectedSignature) {
      console.log("-> Objeto que chegou no Node:", enviadoPelaUnity);
      console.log("-> String gerada para validação:", rawPayloadString);
      console.warn(`🚨 FRAUDE DETECTADA! Assinatura enviada: ${clientSignature} | Esperada: ${expectedSignature}`);
      return res.status(401).json({ 
        error: "Acesso negado: Integridade do pacote adulterada!" 
      });
    }

    // Se as assinaturas baterem, salva fisicamente no HD
    const leaderboard = readDataFromFile();
    const newEntry = { id: leaderboard.length + 1, name, score: Number(score) };
    leaderboard.push(newEntry);
    writeDataToFile(leaderboard);

    return res.status(201).json({ message: "Pontuação salva e criptografada com sucesso! 🛡️", data: newEntry });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno", details: error.message });
  }
});

/*
app.listen(PORT, () => {
  console.log(`Servidor persistente rodando em: http://localhost:${PORT}`);
});*/
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ativo e pronto para a nuvem na porta: ${PORT}`);
});

