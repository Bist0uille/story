// Map globale pour tracking requests (rate limiting)
const requestCounts = new Map();
const RATE_LIMIT = 20; // requests per hour
const WINDOW_MS = 3600000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || { count: 0, resetTime: now + WINDOW_MS };
  
  if (now > userRequests.resetTime) {
    userRequests.count = 0;
    userRequests.resetTime = now + WINDOW_MS;
  }
  
  if (userRequests.count >= RATE_LIMIT) {
    return false;
  }
  
  userRequests.count++;
  requestCounts.set(ip, userRequests);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protection anti-spam basique
  const userIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown';
  
  if (!checkRateLimit(userIP)) {
    return res.status(429).json({ 
      error: 'Trop de requêtes. Limite: 20 par heure.',
      retryAfter: 3600
    });
  }

  try {
    const { prompt, choices = [] } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    // Construction du prompt structuré pour Gemini
    const systemPrompt = `Tu es un guide expérimenté de palais mental. Génère une suite d'histoire immersive avec exactement 3 choix.

Histoire actuelle: ${prompt}
Choix précédents: ${choices.join(', ')}

RÈGLES STRICTES:
- Thème cohérent avec le palais mental
- Descriptions riches et mémorisables (200-300 mots)
- Exactement 3 choix distincts et intéressants
- Intégrer des éléments mnémotechniques
- Réponse en français uniquement

Format JSON STRICT (pas de markdown, juste le JSON):
{
  "story": "Texte de l'histoire détaillée",
  "choices": ["Choix 1", "Choix 2", "Choix 3"],
  "memoryTip": "Conseil concret pour mémoriser cette scène"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('Pas de contenu retourné par Gemini');
    }
    
    // Parse du JSON retourné par l'IA
    try {
      // Nettoyer le contenu (enlever les markdown code blocks si présents)
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const storyData = JSON.parse(cleanContent);
      
      // Validation de la structure
      if (!storyData.story || !Array.isArray(storyData.choices) || storyData.choices.length !== 3) {
        throw new Error('Format JSON invalide');
      }
      
      res.json(storyData);
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      // Fallback si JSON mal formé
      res.json({
        story: content || "Vous vous trouvez dans un magnifique palais aux couloirs infinis. Chaque porte raconte une histoire différente, chaque couloir mène vers de nouveaux mystères à découvrir.",
        choices: [
          "Explorer le couloir de gauche aux tapisseries dorées",
          "Examiner la porte ornée de symboles mystérieux",
          "Monter l'escalier en colimaçon vers l'étage supérieur"
        ],
        memoryTip: "Associez chaque élément à un sens : visualisez les couleurs, imaginez les textures, entendez les sons de vos pas."
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Erreur de génération d\'histoire',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}