# Architecture Site Web - Palais Mental avec IA

## 🏗️ Architecture Générale

### Stack Technique Recommandé

**Frontend:**
- React/Next.js avec TypeScript
- Tailwind CSS pour le design
- Zustand ou Redux pour la gestion d'état
- React Query pour la gestion des données

**Backend:**
- Node.js avec Express ou Next.js API Routes
- Base de données : PostgreSQL avec Prisma ORM
- Authentification : NextAuth.js ou Auth0
- Rate limiting : express-rate-limit

**Hébergement:**
- Frontend : Vercel/Netlify
- Backend : Railway/Render/DigitalOcean
- Base de données : Supabase/PlanetScale

## 🔐 Sécurisation de la Clé API

### 1. Architecture Backend Sécurisée

```
Client (Frontend) → Backend API → Service IA (OpenAI/Claude)
```

**Jamais de clé API côté client !**

### 2. Variables d'Environnement

```bash
# .env (côté serveur uniquement)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=...
JWT_SECRET=...
DATABASE_URL=...
```

### 3. Proxy API Sécurisé

```javascript
// /api/generate-story
export default async function handler(req, res) {
  // Vérification de l'authentification
  const token = req.headers.authorization;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // Rate limiting par utilisateur
  if (await isRateLimited(req.user.id)) {
    return res.status(429).json({ error: 'Trop de requêtes' });
  }

  // Appel sécurisé à l'API IA
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: req.body.messages,
    max_tokens: 500
  });

  res.json(response);
}
```

## 👥 Système d'Authentification

### 1. Méthodes d'Accès

**Option A : Authentification Simple**
- Inscription par email/mot de passe
- Vérification par email
- Tokens JWT

**Option B : OAuth Social**
- Google, Discord, GitHub
- Plus simple pour les utilisateurs
- Moins de gestion des mots de passe

### 2. Niveaux d'Accès

```javascript
const USER_TIERS = {
  FREE: {
    dailyGenerations: 5,
    maxPalaces: 3,
    features: ['basic_generation']
  },
  PREMIUM: {
    dailyGenerations: 100,
    maxPalaces: 20,
    features: ['advanced_generation', 'custom_themes', 'export']
  }
};
```

## 🏰 Structure des Palais Mentaux

### 1. Modèle de Données

```sql
-- Palais Mental
CREATE TABLE mental_palaces (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  theme VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Pièces du Palais
CREATE TABLE palace_rooms (
  id UUID PRIMARY KEY,
  palace_id UUID REFERENCES mental_palaces(id),
  name VARCHAR(255),
  description TEXT,
  position_x INTEGER,
  position_y INTEGER,
  connections JSONB, -- IDs des pièces connectées
  content JSONB -- Éléments mémorisables
);

-- Histoires Générées
CREATE TABLE story_sessions (
  id UUID PRIMARY KEY,
  palace_id UUID REFERENCES mental_palaces(id),
  user_id UUID REFERENCES users(id),
  current_room_id UUID,
  story_state JSONB, -- État complet de l'histoire
  choices_made JSONB[], -- Historique des choix
  created_at TIMESTAMP
);
```

### 2. Architecture des Choix

```javascript
const storyState = {
  currentScene: "entrance_hall",
  inventory: ["clé dorée", "carte ancienne"],
  characters: {
    "guide_mysterieux": {
      relationship: "neutre",
      knownInfo: ["nom", "mission"]
    }
  },
  visitedRooms: ["entrance", "library"],
  globalFlags: {
    "door_unlocked": true,
    "secret_discovered": false
  }
};
```

## 🤖 Intégration IA Intelligente

### 1. Système de Prompts Contextuels

```javascript
function buildStoryPrompt(palaceData, storyState, userChoice) {
  return `
CONTEXTE DU PALAIS MENTAL:
- Thème: ${palaceData.theme}
- Pièce actuelle: ${storyState.currentRoom.name}
- Description: ${storyState.currentRoom.description}

ÉTAT DE L'HISTOIRE:
- Objets en possession: ${storyState.inventory.join(', ')}
- Pièces visitées: ${storyState.visitedRooms.join(', ')}
- Flags actifs: ${Object.keys(storyState.globalFlags).filter(f => storyState.globalFlags[f])}

CHOIX DU JOUEUR: ${userChoice}

INSTRUCTIONS:
1. Continue l'histoire de manière cohérente
2. Propose 3-4 choix significatifs
3. Intègre des éléments mémorisables (objets, personnes, lieux)
4. Maintiens l'immersion dans le palais mental
5. Format JSON avec: {story, choices, memoryElements, newFlags}
`;
}
```

### 2. Cache et Optimisation

```javascript
// Cache des réponses IA pour réduire les coûts
const storyCache = new Map();

async function generateStorySegment(context) {
  const cacheKey = hashContext(context);
  
  if (storyCache.has(cacheKey)) {
    return storyCache.get(cacheKey);
  }

  const response = await callAI(context);
  storyCache.set(cacheKey, response);
  
  return response;
}
```

## 📊 Gestion des Coûts et Limites

### 1. Rate Limiting Intelligent

```javascript
const rateLimits = {
  FREE_USER: {
    requestsPerHour: 10,
    requestsPerDay: 50,
    maxTokensPerRequest: 500
  },
  PREMIUM_USER: {
    requestsPerHour: 100,
    requestsPerDay: 500,
    maxTokensPerRequest: 1500
  }
};
```

### 2. Optimisation des Tokens

- Summarization automatique des histoires longues
- Réutilisation de descriptions de base
- Compression du contexte pour les longues sessions

## 🎨 Interface Utilisateur

### 1. Composants Principaux

```javascript
// Composants React
- <PalaceBuilder /> // Création/édition de palais
- <StoryViewer /> // Affichage de l'histoire en cours
- <ChoiceSelector /> // Sélection des choix
- <MemoryMap /> // Visualisation du palais mental
- <InventoryPanel /> // Gestion des objets/connaissances
```

### 2. Expérience Utilisateur

- **Visualisation 3D** (Three.js) ou **2D stylisée** du palais
- **Système de sauvegarde** automatique
- **Export/Import** de palais mentaux
- **Partage** de créations avec la communauté

## 🚀 Déploiement et Monitoring

### 1. Pipeline de Déploiement

```yaml
# GitHub Actions
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### 2. Monitoring

- **Sentry** pour le tracking d'erreurs
- **Analytics** pour l'usage des fonctionnalités
- **Monitoring des coûts API** avec alertes
- **Logging** des requêtes IA pour optimisation

## 💰 Modèle Économique

### 1. Tiers d'Abonnement

- **Gratuit** : Palais limités, 5 générations/jour
- **Pro** (9€/mois) : Palais illimités, 100 générations/jour
- **Premium** (19€/mois) : Fonctionnalités avancées, API access

### 2. Optimisation des Coûts

- Cache intelligent des réponses
- Modèles IA adaptés (GPT-3.5 pour les tâches simples)
- Compression et résumé automatique

## 🔧 Étapes de Développement

### Phase 1 : MVP (4-6 semaines)
1. Authentification basique
2. Création de palais simples
3. Génération d'histoires basique
4. Interface minimale

### Phase 2 : Fonctionnalités Avancées (6-8 semaines)
1. Visualisation du palais
2. Système de choix complexes
3. Sauvegarde d'état
4. Optimisations performance

### Phase 3 : Scaling (4-6 semaines)
1. Monitoring avancé
2. Modèle d'abonnement
3. Fonctionnalités communautaires
4. Mobile-responsive

## 📋 Checklist de Sécurité

- [ ] Clés API jamais exposées côté client
- [ ] Rate limiting par utilisateur
- [ ] Validation d'input strict
- [ ] Authentification robuste
- [ ] HTTPS obligatoire
- [ ] Sanitization des données utilisateur
- [ ] Monitoring des abus
- [ ] Backup régulier de la base de données

Cette architecture vous permet de créer un site robuste et sécurisé tout en protégeant vos clés API et en contrôlant l'accès. L'approche modulaire facilite le développement progressif et la maintenance.