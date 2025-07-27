// Test script pour vérifier les fonctionnalités de base
const testStory = {
  story: "Vous vous trouvez devant un magnifique palais des sciences. Les colonnes sont ornées de formules mathématiques gravées dans le marbre blanc.",
  choices: [
    "Entrer par la grande porte principale",
    "Explorer les jardins de botanique sur le côté",
    "Examiner les inscriptions sur les colonnes"
  ],
  memoryTip: "Associez chaque colonne à une matière scientifique différente"
};

// Test localStorage
try {
  localStorage.setItem('test-palace', JSON.stringify(testStory));
  const retrieved = JSON.parse(localStorage.getItem('test-palace'));
  console.log('✅ localStorage fonctionne:', retrieved.story.length > 0);
  localStorage.removeItem('test-palace');
} catch (e) {
  console.log('❌ localStorage erreur:', e.message);
}

// Test validation JSON
try {
  const validFormat = JSON.parse(JSON.stringify(testStory));
  const hasRequiredFields = validFormat.story && Array.isArray(validFormat.choices) && validFormat.choices.length === 3;
  console.log('✅ Format JSON valide:', hasRequiredFields);
} catch (e) {
  console.log('❌ Format JSON invalide:', e.message);
}

console.log('🧪 Tests terminés');