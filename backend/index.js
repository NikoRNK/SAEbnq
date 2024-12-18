const express = require('express');
const { StreamChat } = require('stream-chat');
const morgan = require('morgan');

const app = express();

// Middleware pour analyser les corps JSON
app.use(express.json());

// Middleware pour journaliser les requêtes HTTP
app.use(morgan('dev'));

// Clés API Stream Chat (récupérées des variables d'environnement)
const STREAM_API_KEY = process.env.STREAM_API_KEY || 'YOUR_STREAM_API_KEY';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || 'YOUR_STREAM_API_SECRET';

// Validation des variables d'environnement
if (!STREAM_API_KEY || !STREAM_API_SECRET) {
  throw new Error('STREAM_API_KEY et STREAM_API_SECRET doivent être définis dans les variables d\'environnement.');
}

const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

// Endpoint de santé
app.get('/', (req, res) => {
  res.status(200).send('Server is running');
});

// Endpoint pour générer un token
app.post('/generate-token', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId est requis' });
  }

  try {
    const token = serverClient.createToken(userId);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du token' });
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur inattendue:', err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Exporter l'application pour Vercel
module.exports = app;
