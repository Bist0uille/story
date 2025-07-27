# 🏰 Palais Mental - Générateur d'Histoires IA

Site web interactif pour créer des palais mentaux personnalisés avec génération d'histoires par IA.

## 🚀 Fonctionnalités

- ✨ Génération d'histoires par IA (Gemini)
- 🏛️ Création de palais mentaux thématiques
- 💾 Sauvegarde automatique (localStorage)
- 🎮 Système de choix interactifs
- 🛡️ Rate limiting (20 req/heure)
- 📱 Design responsive

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + React 19
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **IA**: Google Gemini API
- **Deploy**: Vercel

## 🏁 Démarrage rapide

```bash
npm install
npm run dev
```

Site accessible sur http://localhost:3000

## 🔐 Variables d'environnement

Créer `.env.local`:
```
GEMINI_API_KEY=votre_cle_api_gemini
```

## 📦 Déploiement Vercel

1. Fork ce repo
2. Connecter à Vercel
3. Ajouter `GEMINI_API_KEY` dans les variables d'environnement
4. Deploy automatique

## 🎯 Comment utiliser

1. Entrez le nom de votre palais mental
2. Cliquez "Créer le Palais"
3. Lisez l'histoire générée
4. Choisissez une des 3 options
5. Continuez l'aventure !

## 🔒 Sécurité

- Clé API jamais exposée côté client
- Rate limiting par IP
- Validation des entrées
- Gestion d'erreurs complète

## 📝 License

MIT License