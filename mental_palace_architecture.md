# MVP Palais Mental - Développement 1 Jour ⚡

## 🎯 Objectif : Site fonctionnel en 8h

### Stack Ultra-Simple
- **Next.js** (frontend + API)
- **Local Storage** (pas de BDD)
- **Pas d'auth** pour commencer
- **Deploy sur Vercel** (gratuit)

## 📋 Plan de la Journée

### ⏰ 9h-10h : Setup de Base
```bash
npx create-next-app@latest palais-mental
cd palais-mental
npm install lucide-react
```

### ⏰ 10h-12h : API Sécurisée + Interface
- Route API protégée
- Interface de génération simple
- Stockage local des histoires

### ⏰ 14h-16h : Logique des Choix
- Système de choix basique
- Continuation d'histoire
- Sauvegarde état

### ⏰ 16h-17h : Design + Polish
- CSS basique
- UX fluide
- Tests

### ⏰ 17h-18h : Déploiement
- Deploy Vercel
- Variables d'environnement
- Tests production

## 💻 Code de Base

### 1. API Route (`/api/generate-story.js`)

```javascript
// Sécurité : clé API côté serveur uniquement
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protection basique anti-spam
  const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // TODO: ajouter rate limiting simple avec Map/cache

  try {
    const { prompt, choices = [] } = req.body;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Tu es un guide de palais mental. Génère une suite d'histoire avec 3 choix.
          
          Histoire actuelle: ${prompt}
          Choix précédents: ${choices.join(', ')}
          
          Format de réponse JSON strict:
          {
            "story": "texte de l'histoire",
            "choices": ["choix 1", "choix 2", "choix 3"],
            "memoryTip": "astuce mémorisation"
          }`
        }]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse du JSON retourné par l'IA
    try {
      const storyData = JSON.parse(content);
      res.json(storyData);
    } catch (e) {
      // Fallback si JSON mal formé
      res.json({
        story: content,
        choices: ["Continuer l'exploration", "Examiner les détails", "Chercher une sortie"],
        memoryTip: "Visualisez la scène avec tous vos sens"
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur génération' });
  }
}
```

### 2. Composant Principal (`/pages/index.js`)

```javascript
import { useState, useEffect } from 'react';
import { Save, Play, RotateCcw } from 'lucide-react';

export default function PalaisMental() {
  const [story, setStory] = useState('');
  const [choices, setChoices] = useState([]);
  const [memoryTip, setMemoryTip] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [palaceName, setPalaceName] = useState('Mon Palais');

  // Chargement automatique de la sauvegarde
  useEffect(() => {
    const saved = localStorage.getItem('mental-palace');
    if (saved) {
      const data = JSON.parse(saved);
      setStory(data.story || '');
      setChoices(data.choices || []);
      setHistory(data.history || []);
      setPalaceName(data.palaceName || 'Mon Palais');
    }
  }, []);

  // Sauvegarde automatique
  const saveState = () => {
    localStorage.setItem('mental-palace', JSON.stringify({
      story, choices, history, palaceName, memoryTip
    }));
  };

  const startNewPalace = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Crée le début d'un palais mental sur le thème: ${palaceName}. 
          Décris l'entrée majestueuse et les premières pièces visibles.`
        })
      });
      
      const data = await response.json();
      setStory(data.story);
      setChoices(data.choices);
      setMemoryTip(data.memoryTip);
      setHistory([{ story: data.story, choice: null }]);
    } catch (error) {
      alert('Erreur de génération');
    }
    setLoading(false);
  };

  const makeChoice = async (choice) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: story,
          choices: [...history.map(h => h.choice), choice].filter(Boolean)
        })
      });
      
      const data = await response.json();
      setStory(data.story);
      setChoices(data.choices);
      setMemoryTip(data.memoryTip);
      setHistory([...history, { story: data.story, choice }]);
      saveState();
    } catch (error) {
      alert('Erreur de génération');
    }
    setLoading(false);
  };

  const resetPalace = () => {
    if (confirm('Recommencer le palais ?')) {
      setStory('');
      setChoices([]);
      setHistory([]);
      setMemoryTip('');
      localStorage.removeItem('mental-palace');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🏰 Palais Mental</h1>
          <input
            value={palaceName}
            onChange={(e) => setPalaceName(e.target.value)}
            className="text-xl bg-transparent border-b-2 border-white/30 text-center focus:outline-none focus:border-white"
            placeholder="Nom de votre palais"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mb-8">
          {!story && (
            <button
              onClick={startNewPalace}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              <Play size={20} />
              {loading ? 'Création...' : 'Créer le Palais'}
            </button>
          )}
          
          {story && (
            <>
              <button onClick={saveState} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                <Save size={16} />
                Sauvegarder
              </button>
              <button onClick={resetPalace} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                <RotateCcw size={16} />
                Recommencer
              </button>
            </>
          )}
        </div>

        {/* Histoire */}
        {story && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed">{story}</p>
            </div>
            
            {memoryTip && (
              <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <p className="text-sm font-medium">💡 Astuce mémorisation: {memoryTip}</p>
              </div>
            )}
          </div>
        )}

        {/* Choix */}
        {choices.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl font-semibold mb-4">Que faites-vous ?</h3>
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => makeChoice(choice)}
                disabled={loading}
                className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 border border-white/20 hover:border-white/40"
              >
                <span className="font-medium">{index + 1}.</span> {choice}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p>L'IA génère la suite de votre palais...</p>
          </div>
        )}

        {/* Historique */}
        {history.length > 1 && (
          <div className="mt-8 p-4 bg-black/20 rounded-lg">
            <h4 className="font-semibold mb-2">Chemin parcouru:</h4>
            <div className="text-sm space-y-1">
              {history.slice(-3).map((item, index) => (
                <div key={index} className="opacity-60">
                  {item.choice && `→ ${item.choice}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. Variables d'Environnement (`.env.local`)

```bash
OPENAI_API_KEY=sk-votre-cle-ici
```

## 🚀 Déploiement Express

### 1. Vercel (gratuit)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ajouter la variable d'environnement dans le dashboard Vercel
```

### 2. Protection Basique

```javascript
// Rate limiting simple (à ajouter dans l'API)
const requestCounts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const count = requestCounts.get(ip) || { count: 0, resetTime: now + 3600000 };
  
  if (now > count.resetTime) {
    count.count = 0;
    count.resetTime = now + 3600000;
  }
  
  if (count.count >= 20) { // 20 requêtes/heure
    return false;
  }
  
  count.count++;
  requestCounts.set(ip, count);
  return true;
}
```

## ✅ Checklist 1 Jour

- [ ] **9h**: Créer projet Next.js
- [ ] **10h**: API route avec clé sécurisée
- [ ] **11h**: Interface de base fonctionnelle
- [ ] **14h**: Système de choix + sauvegarde
- [ ] **15h**: Polish UX + design
- [ ] **16h**: Tests locaux
- [ ] **17h**: Deploy Vercel + variables env
- [ ] **18h**: Tests production

## 🎯 Résultat Final

**Site fonctionnel avec :**
- Génération d'histoires IA sécurisée
- Système de choix interactifs
- Sauvegarde automatique locale
- Interface clean et responsive
- Déployé en production

**Coût estimé :** ~2-5€ pour les premiers tests avec l'API OpenAI

Cette version ultra-simplifiée vous donne une base fonctionnelle que vous pourrez étendre ensuite !