export const fetchStreamToken = async (userId: string): Promise<string> => {
    try {
      const response = await fetch('https://mke-1o61p0gcw-yanns-projects-d91848b9.vercel.app/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du token Stream');
      }
  
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token Stream :', error);
      throw error;
    }
  };
  