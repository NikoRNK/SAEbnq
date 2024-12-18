import { StreamChat } from 'stream-chat';

// Assurez-vous que la clé API est définie dans les variables d'environnement
const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY;

if (!STREAM_API_KEY) {
  throw new Error('STREAM_API_KEY n\'est pas défini dans les variables d\'environnement.');
}

// Initialisation du client Stream Chat
const client = StreamChat.getInstance(STREAM_API_KEY);

export default client;
