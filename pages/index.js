import { useState, useEffect } from 'react';
import { Save, Play, RotateCcw, Clock, MapPin } from 'lucide-react';

export default function PalaisMental() {
  const [story, setStory] = useState('');
  const [choices, setChoices] = useState([]);
  const [memoryTip, setMemoryTip] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [palaceName, setPalaceName] = useState('Mon Palais Mental');
  const [error, setError] = useState('');

  // Chargement automatique de la sauvegarde
  useEffect(() => {
    const saved = localStorage.getItem('mental-palace');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStory(data.story || '');
        setChoices(data.choices || []);
        setHistory(data.history || []);
        setPalaceName(data.palaceName || 'Mon Palais Mental');
        setMemoryTip(data.memoryTip || '');
      } catch (e) {
        console.error('Erreur chargement sauvegarde:', e);
      }
    }
  }, []);

  // Sauvegarde automatique
  const saveState = () => {
    try {
      localStorage.setItem('mental-palace', JSON.stringify({
        story, 
        choices, 
        history, 
        palaceName, 
        memoryTip,
        lastSaved: new Date().toISOString()
      }));
      setError('');
    } catch (e) {
      setError('Erreur de sauvegarde');
    }
  };

  const startNewPalace = async () => {
    if (!palaceName.trim()) {
      setError('Veuillez entrer un nom pour votre palais');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Crée le début d'un palais mental sur le thème: "${palaceName}". 
          Décris l'entrée majestueuse de ce palais thématique. Le visiteur se trouve devant les grandes portes et s'apprête à pénétrer dans ce lieu magique dédié à la mémorisation. 
          Décris l'architecture, l'ambiance et les premiers éléments visuels marquants qui aideront à mémoriser.`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur serveur');
      }
      
      const data = await response.json();
      setStory(data.story);
      setChoices(data.choices || []);
      setMemoryTip(data.memoryTip || '');
      setHistory([{ story: data.story, choice: null, timestamp: Date.now() }]);
      
      // Sauvegarde automatique après création
      setTimeout(() => {
        saveState();
      }, 100);
      
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Erreur de génération. Vérifiez votre connexion.');
    }
    setLoading(false);
  };

  const makeChoice = async (choice) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${story}\n\nLe visiteur choisit: ${choice}`,
          choices: [...history.map(h => h.choice), choice].filter(Boolean)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur serveur');
      }
      
      const data = await response.json();
      setStory(data.story);
      setChoices(data.choices || []);
      setMemoryTip(data.memoryTip || '');
      
      const newHistoryItem = { 
        story: data.story, 
        choice, 
        timestamp: Date.now() 
      };
      setHistory(prev => [...prev, newHistoryItem]);
      
      // Sauvegarde automatique après choix
      setTimeout(() => {
        saveState();
      }, 100);
      
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Erreur de génération. Vérifiez votre connexion.');
    }
    setLoading(false);
  };

  const resetPalace = () => {
    if (confirm('Êtes-vous sûr de vouloir recommencer ce palais ? Toute progression sera perdue.')) {
      setStory('');
      setChoices([]);
      setHistory([]);
      setMemoryTip('');
      setError('');
      localStorage.removeItem('mental-palace');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            🏰 Palais Mental
          </h1>
          <div className="max-w-md mx-auto">
            <input
              value={palaceName}
              onChange={(e) => setPalaceName(e.target.value)}
              className="w-full text-xl bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-center focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all placeholder-white/60"
              placeholder="Nom de votre palais mental"
              disabled={loading}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg text-red-200">
            <p className="text-center">⚠️ {error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {!story && (
            <button
              onClick={startNewPalace}
              disabled={loading || !palaceName.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Play size={20} />
              {loading ? 'Création en cours...' : 'Créer le Palais'}
            </button>
          )}
          
          {story && (
            <>
              <button 
                onClick={saveState} 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save size={16} />
                Sauvegarder
              </button>
              <button 
                onClick={resetPalace} 
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RotateCcw size={16} />
                Recommencer
              </button>
            </>
          )}
        </div>

        {/* Histoire */}
        {story && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20 shadow-2xl">
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-lg leading-relaxed text-white/90 mb-4 whitespace-pre-line">
                {story}
              </p>
            </div>
            
            {memoryTip && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg border border-yellow-400/30 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">💡</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-200 mb-1">Astuce de mémorisation:</p>
                    <p className="text-sm text-yellow-100">{memoryTip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Choix */}
        {choices.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center text-purple-200">
              Que souhaitez-vous faire ?
            </h3>
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => makeChoice(choice)}
                disabled={loading}
                className="w-full text-left p-5 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 hover:border-purple-400/50 hover:shadow-lg group"
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-purple-300 text-lg mt-1 group-hover:text-purple-200 transition-colors">
                    {index + 1}.
                  </span>
                  <span className="text-white/90 group-hover:text-white transition-colors">
                    {choice}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
              <div className="animate-spin w-6 h-6 border-3 border-purple-400/30 border-t-purple-400 rounded-full"></div>
              <p className="text-purple-200">L'IA génère la suite de votre palais...</p>
            </div>
          </div>
        )}

        {/* Statistiques et Historique */}
        {history.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            
            {/* Statistiques */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-200">
                <MapPin size={18} />
                Progression
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Pièces visitées:</span>
                  <span className="text-purple-300 font-medium">{history.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Palais:</span>
                  <span className="text-purple-300 font-medium">{palaceName}</span>
                </div>
              </div>
            </div>

            {/* Historique récent */}
            {history.length > 1 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-200">
                  <Clock size={18} />
                  Chemin parcouru
                </h4>
                <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                  {history.slice(-4).map((item, index) => (
                    <div key={index} className="text-white/60">
                      {item.choice && (
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400">→</span>
                          <span className="truncate">{item.choice}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-white/40 text-sm">
          <p>Palais Mental • Technique de mémorisation par l'IA • Version Beta</p>
        </div>
      </div>
    </div>
  );
}