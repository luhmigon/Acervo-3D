/**
 * Category tree for the catalog sidebar.
 * Paths contain four category levels below the root.
 */
export const CATEGORY_TREE = {
  id: 'root',
  name: 'Todos os assets',
  emoji: '🌐',
  children: [
    {
      id: 'modelos',
      name: 'Modelos 3D',
      emoji: '🧊',
      query: '',
      source: 'sketchfab',
      children: [
        {
          id: 'personagens',
          name: 'Personagens',
          emoji: '🧑',
          query: 'character',
          children: [
            {
              id: 'humanoides',
              name: 'Humanoides',
              emoji: '🧍',
              query: 'humanoid character',
              children: [
                { id: 'guerreiros', name: 'Guerreiros', emoji: '⚔️', query: 'warrior knight soldier' },
                { id: 'magos', name: 'Magos', emoji: '🧙', query: 'mage wizard sorcerer' },
                { id: 'arqueiros', name: 'Arqueiros', emoji: '🏹', query: 'archer ranger' },
                { id: 'ladinos', name: 'Ladinos', emoji: '🗡', query: 'rogue thief assassin' },
                { id: 'barbaros', name: 'Bárbaros', emoji: '🪓', query: 'barbarian viking' },
                { id: 'elfos', name: 'Elfos', emoji: '🧝', query: 'elf elven' },
                { id: 'anoes', name: 'Anões', emoji: '🧔', query: 'dwarf' },
                { id: 'orcs', name: 'Orcs', emoji: '👹', query: 'orc' },
                { id: 'sci-fi-soldiers', name: 'Soldados Sci-Fi', emoji: '🚀', query: 'sci-fi soldier marine' },
                { id: 'cyborgs', name: 'Cyborgs', emoji: '🤖', query: 'cyborg android robot' },
                { id: 'anime', name: 'Anime', emoji: '🎌', query: 'anime character' },
                { id: 'cartoon', name: 'Cartoon', emoji: '🎨', query: 'cartoon chibi' },
                { id: 'npc', name: 'NPCs', emoji: '👨‍🌾', query: 'npc civilian villager' },
                { id: 'samurais', name: 'Samurais', emoji: '🥷', query: 'samurai warrior' },
                { id: 'ninjas', name: 'Ninjas', emoji: '🥷', query: 'ninja assassin' },
                { id: 'piratas', name: 'Piratas', emoji: '🏴‍☠️', query: 'pirate character' },
                { id: 'pilotos', name: 'Pilotos', emoji: '🧑‍✈️', query: 'pilot character' },
                { id: 'cientistas', name: 'Cientistas', emoji: '🥼', query: 'scientist character' },
              ],
            },
            {
              id: 'criaturas',
              name: 'Criaturas',
              emoji: '🐉',
              query: 'creature',
              children: [
                { id: 'dragoes', name: 'Dragões', emoji: '🐉', query: 'dragon' },
                { id: 'lobos', name: 'Lobos', emoji: '🐺', query: 'wolf' },
                { id: 'felinos', name: 'Felinos', emoji: '🦁', query: 'cat lion tiger' },
                { id: 'ursos', name: 'Ursos', emoji: '🐻', query: 'bear' },
                { id: 'aves', name: 'Aves', emoji: '🦅', query: 'bird eagle' },
                { id: 'peixes', name: 'Peixes', emoji: '🐟', query: 'fish' },
                { id: 'insetos', name: 'Insetos', emoji: '🦂', query: 'insect bug' },
                { id: 'dinossauros', name: 'Dinossauros', emoji: '🦖', query: 'dinosaur trex' },
                { id: 'mortos-vivos', name: 'Mortos-vivos', emoji: '💀', query: 'zombie skeleton undead' },
                { id: 'fantasmas', name: 'Fantasmas', emoji: '👻', query: 'ghost spirit' },
                { id: 'robos', name: 'Robôs', emoji: '🤖', query: 'robot mech' },
                { id: 'aliens', name: 'Aliens', emoji: '👾', query: 'alien' },
                { id: 'cavalos', name: 'Cavalos', emoji: '🐎', query: 'horse unicorn pegasus' },
                { id: 'serpentes', name: 'Serpentes', emoji: '🐍', query: 'snake serpent' },
                { id: 'aranhas', name: 'Aranhas', emoji: '🕷', query: 'spider arachnid' },
                { id: 'polvos', name: 'Polvos e Krakens', emoji: '🐙', query: 'octopus kraken' },
                { id: 'fadas', name: 'Fadas', emoji: '🧚', query: 'fairy fae' },
              ],
            },
          ],
        },
        {
          id: 'objetos',
          name: 'Objetos',
          emoji: '📦',
          query: 'object',
          children: [
            { id: 'moveis', name: 'Móveis', emoji: '🪑', query: 'furniture chair table' },
            { id: 'armas', name: 'Armas', emoji: '⚔️', query: 'weapon sword gun' },
            { id: 'ferramentas-obj', name: 'Ferramentas', emoji: '🔧', query: 'tool' },
            { id: 'comida-obj', name: 'Comida', emoji: '🍎', query: 'food' },
            { id: 'eletronicos', name: 'Eletrônicos', emoji: '📱', query: 'electronics phone computer' },
            { id: 'vestuario', name: 'Vestuário', emoji: '👕', query: 'clothing' },
            { id: 'joias', name: 'Joias', emoji: '💎', query: 'jewelry gem' },
            { id: 'livros', name: 'Livros', emoji: '📚', query: 'book' },
            { id: 'pocoes', name: 'Poções', emoji: '🧪', query: 'potion flask' },
            { id: 'bau', name: 'Baús', emoji: '💰', query: 'treasure chest' },
            { id: 'instrumentos', name: 'Instrumentos', emoji: '🎸', query: 'musical instrument' },
            { id: 'mochilas', name: 'Mochilas', emoji: '🎒', query: 'backpack bag' },
            { id: 'decoracao', name: 'Decoração', emoji: '🪴', query: 'decoration ornament' },
            { id: 'utensilios', name: 'Utensílios', emoji: '🍽️', query: 'kitchen utensil' },
          ],
        },
        {
          id: 'veiculos',
          name: 'Veículos',
          emoji: '🚗',
          query: 'vehicle',
          children: [
            { id: 'carros', name: 'Carros', emoji: '🚗', query: 'car automobile' },
            { id: 'motos', name: 'Motos', emoji: '🏍', query: 'motorcycle' },
            { id: 'caminhoes', name: 'Caminhões', emoji: '🚚', query: 'truck' },
            { id: 'avioes', name: 'Aviões', emoji: '✈️', query: 'airplane aircraft' },
            { id: 'naves', name: 'Naves', emoji: '🚀', query: 'spaceship spacecraft' },
            { id: 'barcos', name: 'Barcos', emoji: '⛵', query: 'boat ship' },
            { id: 'tanques', name: 'Tanques', emoji: '🛡', query: 'tank military' },
            { id: 'bicicletas', name: 'Bicicletas', emoji: '🚲', query: 'bicycle' },
            { id: 'trens', name: 'Trens', emoji: '🚆', query: 'train locomotive' },
            { id: 'helicopteros', name: 'Helicópteros', emoji: '🚁', query: 'helicopter' },
          ],
        },
        {
          id: 'arquitetura',
          name: 'Arquitetura',
          emoji: '🏛',
          query: 'architecture building',
          children: [
            { id: 'casas', name: 'Casas', emoji: '🏠', query: 'house home' },
            { id: 'predios', name: 'Prédios', emoji: '🏢', query: 'building skyscraper' },
            { id: 'castelos', name: 'Castelos', emoji: '🏰', query: 'castle fortress' },
            { id: 'templos', name: 'Templos', emoji: '⛪', query: 'temple church' },
            { id: 'pontes', name: 'Pontes', emoji: '🌉', query: 'bridge' },
            { id: 'ruinas', name: 'Ruínas', emoji: '🏚', query: 'ruins abandoned' },
          ],
        },
        {
          id: 'natureza-modelos',
          name: 'Natureza',
          emoji: '🌲',
          query: 'nature',
          children: [
            { id: 'arvores', name: 'Árvores', emoji: '🌳', query: 'tree' },
            { id: 'plantas', name: 'Plantas', emoji: '🌿', query: 'plant flower' },
            { id: 'rochas', name: 'Rochas', emoji: '🪨', query: 'rock stone' },
            { id: 'montanhas', name: 'Montanhas', emoji: '🏔', query: 'mountain' },
            { id: 'agua', name: 'Água', emoji: '💧', query: 'water ocean river' },
            { id: 'cogumelos', name: 'Cogumelos', emoji: '🍄', query: 'mushroom fungus' },
            { id: 'corais', name: 'Corais', emoji: '🪸', query: 'coral reef' },
          ],
        },
        {
          id: 'props',
          name: 'Props',
          emoji: '📦',
          query: 'props',
          children: [
            { id: 'barris', name: 'Barris', emoji: '🛢', query: 'barrel' },
            { id: 'caixas', name: 'Caixas', emoji: '📦', query: 'crate box' },
            { id: 'lampadas', name: 'Lâmpadas', emoji: '💡', query: 'lamp light' },
            { id: 'tochas', name: 'Tochas', emoji: '🔥', query: 'torch fire' },
            { id: 'bancos', name: 'Bancos', emoji: '🪑', query: 'bench stool' },
            { id: 'placas', name: 'Placas e sinais', emoji: '🪧', query: 'sign road sign' },
          ],
        },
      ],
    },
    {
      id: 'texturas',
      name: 'Texturas',
      emoji: '🎨',
      query: '',
      children: [
        {
          id: 'pbr',
          name: 'Materiais PBR',
          emoji: '🧱',
          query: '',
          source: 'ambientcg',
          children: [
            { id: 'madeira', name: 'Madeira', emoji: '🪵', query: 'wood', cat: 'Wood' },
            { id: 'metal', name: 'Metal', emoji: '⚙️', query: 'metal', cat: 'Metal' },
            { id: 'pedra', name: 'Pedra', emoji: '🪨', query: 'rock stone', cat: 'Rock' },
            { id: 'tijolo', name: 'Tijolo', emoji: '🧱', query: 'brick', cat: 'Bricks' },
            { id: 'concreto', name: 'Concreto', emoji: '🏗', query: 'concrete', cat: 'Concrete' },
            { id: 'telha', name: 'Telha', emoji: '🏠', query: 'tile', cat: 'Tiles' },
            { id: 'tecido', name: 'Tecido', emoji: '🧵', query: 'fabric', cat: 'Fabric' },
            { id: 'couro', name: 'Couro', emoji: '🟫', query: 'leather', cat: 'Leather' },
            { id: 'plastico', name: 'Plástico', emoji: '🟦', query: 'plastic', cat: 'Plastic' },
            { id: 'comida-pbr', name: 'Comida', emoji: '🍎', query: 'food', cat: 'Food' },
          ],
        },
        {
          id: 'hdris',
          name: 'HDRIs',
          emoji: '🌅',
          query: '',
          source: 'polyhaven-hdri',
          children: [
            { id: 'estudio', name: 'Estúdio', emoji: '📸', query: 'studio' },
            { id: 'natureza-hdri', name: 'Natureza', emoji: '🌲', query: 'nature forest' },
            { id: 'urbano', name: 'Urbano', emoji: '🏙', query: 'urban city' },
            { id: 'interior', name: 'Interior', emoji: '🏠', query: 'interior' },
            { id: 'ceu', name: 'Céu', emoji: '☁️', query: 'sky' },
            { id: 'por-do-sol', name: 'Pôr do Sol', emoji: '🌇', query: 'sunset' },
            { id: 'noite', name: 'Noite', emoji: '🌃', query: 'night' },
          ],
        },
      ],
    },
    {
      id: 'audio',
      name: 'Áudio',
      emoji: '🔊',
      query: '',
      children: [
        {
          id: 'sfx',
          name: 'SFX',
          emoji: '🔊',
          query: '',
          source: 'audio-sfx',
          children: [
            { id: 'armas-sfx', name: 'Armas', emoji: '⚔️', query: 'weapon sword gun' },
            { id: 'magias-sfx', name: 'Magias', emoji: '✨', query: 'magic spell' },
            { id: 'ui', name: 'Interface', emoji: '🖱', query: 'ui click' },
            { id: 'impactos', name: 'Impactos', emoji: '💥', query: 'impact explosion' },
            { id: 'animais-sfx', name: 'Animais', emoji: '🐺', query: 'animal' },
            { id: 'passos', name: 'Passos', emoji: '👣', query: 'footsteps' },
            { id: 'ambiente-sfx', name: 'Ambiente', emoji: '🌿', query: 'ambient' },
          ],
        },
        {
          id: 'musica',
          name: 'Música',
          emoji: '🎵',
          query: '',
          source: 'audio-music',
          children: [
            { id: 'epica', name: 'Épica', emoji: '🔥', query: 'epic' },
            { id: 'batalha', name: 'Batalha', emoji: '⚔️', query: 'battle' },
            { id: 'ambiente-mus', name: 'Ambiente', emoji: '🌅', query: 'ambient' },
            { id: 'feliz', name: 'Feliz', emoji: '😊', query: 'happy' },
            { id: 'triste', name: 'Triste', emoji: '😢', query: 'sad' },
            { id: 'tensa', name: 'Tensa', emoji: '😰', query: 'tense' },
          ],
        },
        {
          id: 'ambientes',
          name: 'Ambientes',
          emoji: '🌿',
          query: '',
          source: 'audio-ambient',
          children: [
            { id: 'floresta-amb', name: 'Floresta', emoji: '🌲', query: 'forest' },
            { id: 'cidade-amb', name: 'Cidade', emoji: '🏙', query: 'city' },
            { id: 'chuva', name: 'Chuva', emoji: '🌧', query: 'rain' },
            { id: 'interior-amb', name: 'Interior', emoji: '🏠', query: 'interior' },
            { id: 'praia', name: 'Praia', emoji: '🌊', query: 'beach ocean' },
          ],
        },
      ],
    },
    {
      id: 'cenarios',
      name: 'Cenários',
      emoji: '🌍',
      query: '',
      children: [
        {
          id: 'fantasia-cen',
          name: 'Fantasia',
          emoji: '🧙',
          query: 'fantasy',
          source: 'scenekits',
          children: [
            { id: 'castelo-cen', name: 'Castelos', emoji: '🏰', query: 'castle' },
            { id: 'vila-medieval', name: 'Vila Medieval', emoji: '🏘', query: 'medieval village' },
            { id: 'masmorra', name: 'Masmorras', emoji: '💀', query: 'dungeon' },
            { id: 'floresta-magica', name: 'Floresta Mágica', emoji: '🍄', query: 'magic forest' },
            { id: 'templo', name: 'Templos', emoji: '⛪', query: 'temple' },
          ],
        },
        {
          id: 'sci-fi-cen',
          name: 'Sci-Fi',
          emoji: '🚀',
          query: 'sci-fi',
          source: 'scenekits',
          children: [
            { id: 'naves-cen', name: 'Naves', emoji: '🚀', query: 'spaceship' },
            { id: 'estacao', name: 'Estação Espacial', emoji: '🛰', query: 'space station' },
            { id: 'cyberpunk', name: 'Cyberpunk', emoji: '🌃', query: 'cyberpunk' },
            { id: 'industrial', name: 'Industrial', emoji: '🏭', query: 'industrial factory' },
          ],
        },
        {
          id: 'natureza-cen',
          name: 'Natureza',
          emoji: '🌲',
          query: 'nature',
          source: 'scenekits',
          children: [
            { id: 'floresta-cen', name: 'Floresta', emoji: '🌲', query: 'forest' },
            { id: 'montanha-cen', name: 'Montanha', emoji: '🏔', query: 'mountain' },
            { id: 'deserto', name: 'Deserto', emoji: '🏜', query: 'desert' },
            { id: 'praia-cen', name: 'Praia', emoji: '🌊', query: 'beach' },
            { id: 'neve', name: 'Neve', emoji: '❄️', query: 'snow' },
          ],
        },
        {
          id: 'moderno-cen',
          name: 'Moderno',
          emoji: '🏙',
          query: 'modern',
          source: 'scenekits',
          children: [
            { id: 'cidade-moderna', name: 'Cidade Moderna', emoji: '🏙', query: 'city' },
            { id: 'interiores-cen', name: 'Interiores', emoji: '🏠', query: 'interior' },
            { id: 'escritorio', name: 'Escritório', emoji: '💼', query: 'office' },
          ],
        },
      ],
    },
    {
      id: 'ferramentas',
      name: 'Ferramentas',
      emoji: '🛠',
      query: '',
      children: [
        { id: 'composer', name: 'Scene Composer', emoji: '🎬', url: '/scene-composer', description: 'Editor 3D no navegador' },
        { id: 'pbr-editor', name: 'PBR Editor', emoji: '🎨', url: '/pbr-editor', description: 'Editor de materiais' },
        { id: 'optimizer', name: 'Otimizador', emoji: '⚡', url: '/optimize', description: 'Reduzir polígonos' },
        { id: 'batch', name: 'Batch Optimizer', emoji: '📦', url: '/batch-optimize', description: 'Otimização em lote' },
        { id: 'blender', name: 'Plugin Blender', emoji: '🔷', url: '/blender-addon', description: 'Integração com Blender' },
      ],
    },
  ],
};

export function flattenCategories(node = CATEGORY_TREE, path = []) {
  const currentPath = [...path, node.id];
  return [
    { ...node, path: currentPath },
    ...(node.children || []).flatMap(child => flattenCategories(child, currentPath)),
  ];
}

export function findCategoryByPath(path) {
  let current = CATEGORY_TREE;
  for (const id of path) {
    current = current.children?.find(child => child.id === id);
    if (!current) return null;
  }
  return current;
}

export function getAncestors(path) {
  const ancestors = [CATEGORY_TREE];
  let current = CATEGORY_TREE;
  for (const id of path) {
    current = current.children?.find(child => child.id === id);
    if (!current) break;
    ancestors.push(current);
  }
  return ancestors;
}

export function getQueryChain(category) {
  const queries = [];
  const visit = node => {
    if (node.query) queries.push(node.query);
    (node.children || []).forEach(visit);
  };
  visit(category);
  return queries;
}
