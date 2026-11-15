const CURATED = [
  ['kenney-medieval', 'Kenney — Medieval Kit', 'Kit medieval modular; confirme os assets e a licença no site.', 'https://kenney.nl/assets/medieval-kit', ['CC0', '300+', 'Modular', 'GLB'], ['castelo', 'vila-medieval', 'fantasia'], 'pack', 300, ['GLB', 'FBX', 'OBJ'], 'legendary'],
  ['kenney-castle', 'Kenney — Castle Kit', 'Peças modulares para castelos, muralhas e torres.', 'https://kenney.nl/assets/castle-kit', ['CC0', '150+', 'Modular', 'GLB'], ['castelo', 'fantasia'], 'pack', 150, ['GLB', 'FBX'], 'legendary'],
  ['kenney-tower-defense', 'Kenney — Tower Defense', 'Peças para cenários e protótipos de tower defense.', 'https://kenney.nl/assets/tower-defense-kit', ['CC0', '200+', 'Modular', 'GLB'], ['fantasia', 'castelo'], 'pack', 200, ['GLB', 'FBX'], 'legendary'],
  ['kenney-graveyard', 'Kenney — Graveyard Kit', 'Peças para um cenário de cemitério.', 'https://kenney.nl/assets/graveyard-kit', ['CC0', '90+', 'Modular', 'GLB'], ['cemiterio', 'horror'], 'pack', 90, ['GLB', 'FBX'], 'epic'],
  ['kenney-platformer', 'Kenney — Platformer Kit', 'Kit modular de plataformas, blocos e itens.', 'https://kenney.nl/assets/platformer-kit', ['CC0', '150+', 'Modular', 'GLB'], ['fantasia', 'interiores'], 'pack', 150, ['GLB', 'FBX'], 'epic'],
  ['kenney-fantasy-town', 'Kenney — Fantasy Town Kit', 'Peças para cidade medieval, casas e mercados.', 'https://kenney.nl/assets/fantasy-town-kit', ['CC0', '200+', 'Modular', 'GLB'], ['vila-medieval', 'fantasia'], 'pack', 200, ['GLB', 'FBX'], 'legendary'],
  ['kenney-nature', 'Kenney — Nature Kit', 'Natureza modular: árvores, rochas e plantas.', 'https://kenney.nl/assets/nature-kit', ['CC0', '300+', 'Modular', 'GLB'], ['floresta', 'montanha', 'ilha-tropical'], 'pack', 300, ['GLB', 'FBX'], 'legendary'],
  ['kenney-city-kit', 'Kenney — City Kit (Commercial)', 'Kit de cidade moderna e objetos urbanos.', 'https://kenney.nl/assets/city-kit-commercial', ['CC0', '200+', 'Modular', 'GLB'], ['cidade-moderna', 'industrial'], 'pack', 200, ['GLB', 'FBX'], 'legendary'],
  ['kenney-space', 'Kenney — Space Kit', 'Peças modulares de espaço, naves e satélites.', 'https://kenney.nl/assets/space-kit', ['CC0', '150+', 'Modular', 'GLB'], ['sci-fi', 'espaco'], 'pack', 150, ['GLB', 'FBX'], 'legendary'],
  ['kenney-sci-fi', 'Kenney — Sci-Fi Kit', 'Módulos sci-fi: salas, corredores e consoles.', 'https://kenney.nl/assets/sci-fi-kit', ['CC0', '150+', 'Modular', 'GLB'], ['sci-fi', 'industrial'], 'pack', 150, ['GLB', 'FBX'], 'legendary'],
  ['kenney-industrial', 'Kenney — Industrial Kit', 'Objetos industriais para fábricas e galpões.', 'https://kenney.nl/assets/industrial-kit', ['CC0', '180+', 'Modular', 'GLB'], ['industrial', 'pos-apocaliptico'], 'pack', 180, ['GLB', 'FBX'], 'epic'],
  ['kenney-furniture', 'Kenney — Furniture Kit', 'Móveis e decoração para cenários internos.', 'https://kenney.nl/assets/furniture-kit', ['CC0', '150+', 'Modular', 'GLB'], ['interiores', 'cidade-moderna'], 'pack', 150, ['GLB', 'FBX'], 'epic'],
  ['kenney-holiday', 'Kenney — Holiday Kit', 'Objetos e decoração para festas.', 'https://kenney.nl/assets/holiday-kit', ['CC0', '70+', 'Modular', 'GLB'], ['interiores', 'vila-medieval'], 'pack', 70, ['GLB', 'FBX'], 'common'],
  ['kenney-racing', 'Kenney — Racing Kit', 'Peças para pistas, barreiras e arquibancadas.', 'https://kenney.nl/assets/racing-kit', ['CC0', '100+', 'Modular', 'GLB'], ['cidade-moderna', 'industrial'], 'pack', 100, ['GLB', 'FBX'], 'epic'],
  ['kenney-survival', 'Kenney — Survival Kit', 'Objetos para acampamento e sobrevivência.', 'https://kenney.nl/assets/survival-kit', ['CC0', '100+', 'Modular', 'GLB'], ['floresta', 'pos-apocaliptico', 'ilha-tropical'], 'pack', 100, ['GLB', 'FBX'], 'epic'],
  ['kenney-minigolf', 'Kenney — Minigolf Kit', 'Obstáculos modulares para minigolfe e protótipos.', 'https://kenney.nl/assets/minigolf-kit', ['CC0', '120+', 'Modular', 'GLB'], ['cidade-moderna'], 'pack', 120, ['GLB', 'FBX'], 'common'],
  ['quaternius-nature', 'Quaternius — Nature Pack', 'Natureza estilizada: árvores, rochas e plantas.', 'https://quaternius.com/packs/nature.html', ['CC0', '100+', 'GLB', 'Estilizado'], ['floresta', 'floresta-magica', 'montanha'], 'pack', 100, ['GLB', 'FBX'], 'legendary'],
  ['quaternius-fantasy', 'Quaternius — Fantasy Props', 'Props de fantasia: baús, armas, poções e livros.', 'https://quaternius.com/packs/fantasyprops.html', ['CC0', '80+', 'GLB', 'Estilizado'], ['fantasia', 'castelo', 'masmorra'], 'pack', 80, ['GLB', 'FBX'], 'epic'],
  ['quaternius-scifi', 'Quaternius — Sci-Fi Modular', 'Módulos sci-fi para corredores, salas e portas.', 'https://quaternius.com/packs/ultimatescifimodular.html', ['CC0', '60+', 'GLB', 'Modular'], ['sci-fi', 'espaco', 'industrial'], 'pack', 60, ['GLB', 'FBX'], 'epic'],
  ['quaternius-medieval', 'Quaternius — Medieval Village', 'Vila medieval modular com casas, torres e cercas.', 'https://quaternius.com/packs/medievalvillage.html', ['CC0', '50+', 'GLB', 'Modular'], ['vila-medieval', 'castelo', 'fantasia'], 'pack', 50, ['GLB', 'FBX'], 'epic'],
  ['quaternius-dungeon', 'Quaternius — Dungeon Pack', 'Masmorra modular com paredes, chão, portas e tochas.', 'https://quaternius.com/packs/dungeon.html', ['CC0', '40+', 'GLB', 'Modular'], ['masmorra', 'castelo', 'fantasia'], 'pack', 40, ['GLB', 'FBX'], 'epic'],
  ['polyhaven-models', 'Poly Haven — Modelos', 'Catálogo de modelos 3D CC0 para cenários e arquitetura.', 'https://polyhaven.com/models', ['CC0', 'GLTF', 'Alta qualidade'], ['interiores', 'floresta', 'cidade-moderna', 'industrial'], 'library', 300, ['GLTF'], 'legendary'],
  ['polyhaven-textures', 'Poly Haven — Texturas PBR', 'Texturas CC0 para materiais de cenário.', 'https://polyhaven.com/textures', ['CC0', 'PBR', '4K'], ['interiores', 'cidade-moderna', 'industrial', 'castelo'], 'library', 500, ['JPG', 'EXR'], 'legendary'],
  ['polyhaven-hdri', 'Poly Haven — HDRIs', 'HDRIs CC0 para iluminação e ambientação.', 'https://polyhaven.com/hdris', ['CC0', 'HDR', 'Ambiente'], ['floresta', 'cidade-moderna', 'deserto', 'montanha'], 'library', 650, ['HDR', 'EXR'], 'legendary'],
  ['synty-fantasy', 'Synty — Fantasy Kingdom (Free)', 'Amostras e downloads gratuitos variam conforme o catálogo.', 'https://syntystore.com/pages/free-downloads', ['Grátis', 'FBX', 'AAA'], ['vila-medieval', 'castelo', 'fantasia'], 'pack', 50, ['FBX'], 'epic'],
  ['synty-city', 'Synty — Polygon City (Free)', 'Amostras de cenários urbanos; confira os termos atuais.', 'https://syntystore.com/pages/free-downloads', ['Grátis', 'FBX', 'AAA'], ['cidade-moderna', 'industrial'], 'pack', 40, ['FBX'], 'epic'],
  ['synty-scifi', 'Synty — Sci-Fi Pack (Free)', 'Amostras sci-fi; consulte disponibilidade e licença.', 'https://syntystore.com/pages/free-downloads', ['Grátis', 'FBX', 'AAA'], ['sci-fi', 'espaco', 'industrial'], 'pack', 30, ['FBX'], 'epic'],
  ['synty-western', 'Synty — Western (Free)', 'Amostras de cenário western; confira os termos atuais.', 'https://syntystore.com/pages/free-downloads', ['Grátis', 'FBX', 'AAA'], ['velho-oeste', 'deserto'], 'pack', 25, ['FBX'], 'common'],
  ['sketchfab-environments', 'Sketchfab — Cenários', 'Busca externa de cenários baixáveis; licenças e formatos variam.', 'https://sketchfab.com/search?type=models&q=environment+kit&features=downloadable&sort_by=-likeCount', ['Misto', 'GLB', 'Cenários'], ['fantasia', 'sci-fi', 'cidade-moderna', 'floresta'], 'library', 200000, ['GLB', 'GLTF', 'FBX', 'OBJ'], 'legendary'],
  ['sketchfab-modular', 'Sketchfab — Kits Modulares', 'Busca externa por kits modulares baixáveis.', 'https://sketchfab.com/search?type=models&q=modular+kit&features=downloadable&sort_by=-likeCount', ['Misto', 'GLB', 'Modular'], ['fantasia', 'sci-fi', 'cidade-moderna', 'castelo'], 'library', 80000, ['GLB', 'GLTF', 'FBX'], 'legendary'],
  ['opengameart-env', 'OpenGameArt — Cenários', 'Busca comunitária; confira licença e formato de cada item.', 'https://opengameart.org/art-search-advanced?keys=environment+kit&field_art_type_tid[]=10', ['Licenças variadas', 'Múltiplos'], ['fantasia', 'sci-fi', 'floresta'], 'library', 500, ['FBX', 'OBJ', 'BLEND', 'GLB'], 'epic'],
  ['polypizza-env', 'Poly Pizza — Cenários Low-Poly', 'Busca externa de modelos low-poly; licenças variam por item.', 'https://poly.pizza/search/environment', ['CC0/CC-BY', 'GLB', 'Low-poly'], ['fantasia', 'floresta', 'cidade-moderna'], 'library', 1000, ['GLB'], 'epic'],
  ['itch-env-kits', 'itch.io — Environment Kits', 'Busca comunitária por kits de cenário gratuitos.', 'https://itch.io/game-assets/free/tag-environment', ['Grátis', 'Múltiplos'], ['fantasia', 'sci-fi', 'floresta', 'cidade-moderna'], 'library', 500, ['PNG', 'GLB', 'FBX', 'OBJ'], 'epic'],
  ['ambientcg', 'ambientCG — Texturas PBR', 'Texturas CC0 para materiais de cenário; verifique os termos do site.', 'https://ambientcg.com', ['CC0', 'PBR', '4K'], ['interiores', 'castelo', 'industrial', 'cidade-moderna'], 'library', 900, ['JPG', 'PNG'], 'legendary'],
].map(([id, name, desc, url, tags, cat, type, count, formats, tier]) => ({
  id, name, desc, url, tags, cat, type, count, formats, tier,
}));

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    items: CURATED,
    sources: CURATED.length,
    legendary: CURATED.filter(item => item.tier === 'legendary').length,
    epic: CURATED.filter(item => item.tier === 'epic').length,
    common: CURATED.filter(item => item.tier === 'common').length,
    categories: [...new Set(CURATED.flatMap(item => item.cat))],
  });
}
