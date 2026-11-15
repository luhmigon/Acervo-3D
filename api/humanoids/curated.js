const sources = [
  ['quaternius-ultimate-characters', 'Quaternius — Ultimate Animated Characters', '50+ humanoides animados com rig completo (CC0).', 'https://quaternius.com/packs/ultimateanimatedcharacters.html', 50, ['GLB', 'FBX', 'OBJ'], true, true, 'legendary', ['CC0', '50+', 'Riggado', 'Animado']],
  ['quaternius-fantasy-characters', 'Quaternius — Ultimate Fantasy Characters', 'Guerreiros, magos, arqueiros, elfos e anões.', 'https://quaternius.com/packs/ultimatefantasycharacters.html', 30, ['GLB', 'FBX'], true, true, 'legendary', ['CC0', '30+', 'Fantasia']],
  ['quaternius-rpg-characters', 'Quaternius — Ultimate RPG Characters', 'Personagens de RPG para diferentes funções.', 'https://quaternius.com/packs/ultimaterpgcharacters.html', 40, ['GLB', 'FBX'], true, true, 'legendary', ['CC0', '40+', 'RPG']],
  ['quaternius-animated-humans', 'Quaternius — Animated Humans', 'Humanos animados para protótipos.', 'https://quaternius.com/packs/animatedhumans.html', 30, ['GLB', 'FBX'], true, true, 'legendary', ['CC0', '30+', 'Riggado']],
  ['quaternius-scifi-characters', 'Quaternius — Sci-Fi Characters', 'Soldados espaciais, androides e alienígenas humanoides.', 'https://quaternius.com/packs/ultimatescificharacters.html', 20, ['GLB', 'FBX'], true, true, 'legendary', ['CC0', 'Sci-Fi']],
  ['kenney-animated-characters', 'Kenney — Animated Characters', 'Personagens low-poly animados.', 'https://kenney.nl/assets/animated-characters', 30, ['GLB', 'FBX', 'OBJ'], true, true, 'legendary', ['CC0', 'Riggado']],
  ['kenney-animated-characters-2', 'Kenney — Animated Characters 2', 'Personagens adicionais com animações.', 'https://kenney.nl/assets/animated-characters-2', 50, ['GLB', 'FBX'], true, true, 'legendary', ['CC0', '50+']],
  ['kenney-mini-characters', 'Kenney — Mini Characters', 'Mini personagens em estilo cartoon.', 'https://kenney.nl/assets/mini-characters', 20, ['GLB', 'FBX'], true, true, 'legendary', ['CC0', 'Cartoon']],
  ['kenney-blocky-characters', 'Kenney — Blocky Characters', 'Personagens blocky para jogos e protótipos.', 'https://kenney.nl/assets/blocky-characters', 100, ['GLB', 'FBX'], true, true, 'legendary', ['CC0', '100+']],
  ['kenney-city-kit', 'Kenney — City Kit (People)', 'Pessoas civis para cenários urbanos.', 'https://kenney.nl/assets/city-kit-roads', 20, ['GLB'], true, false, 'epic', ['CC0', 'Civis']],
  ['mixamo-characters', 'Mixamo — Personagens Riggados', 'Biblioteca Adobe de personagens e rigs; requer login gratuito.', 'https://www.mixamo.com', 50, ['FBX'], true, true, 'legendary', ['Grátis', 'FBX', 'Riggado']],
  ['readyplayerme', 'Ready Player Me — Avatares', 'Serviço externo para criação de avatares; confira disponibilidade e termos.', 'https://readyplayer.me', 0, ['GLB'], true, false, 'epic', ['Avatares', 'GLB']],
  ['vroid-studio', 'VRoid Studio — Avatares Anime', 'Ferramenta para criar personagens anime; confira formatos e termos.', 'https://vroid.com/en/studio', 0, ['VRM'], true, false, 'epic', ['Anime', 'VRM']],
  ['makehuman', 'MakeHuman — Open Source', 'Ferramenta open-source para criação de humanoides.', 'http://www.makehumancommunity.org/', 0, ['OBJ', 'FBX', 'DAE'], true, false, 'epic', ['Open source', 'Humanoides']],
  ['synty-fantasy', 'Synty — Fantasy Kingdom (Free)', 'Amostras e downloads gratuitos variam conforme o catálogo.', 'https://syntystore.com/pages/free-downloads', 0, ['FBX'], true, true, 'epic', ['Grátis', 'Fantasia']],
  ['synty-knights', 'Synty — Polygon Knights (Free)', 'Consulte a página de downloads gratuitos e a licença de cada pacote.', 'https://syntystore.com/pages/free-downloads', 0, ['FBX'], true, true, 'epic', ['Grátis', 'Cavaleiros']],
  ['synty-city', 'Synty — Polygon City (Free)', 'Consulte a página de downloads gratuitos e a licença de cada pacote.', 'https://syntystore.com/pages/free-downloads', 0, ['FBX'], true, true, 'epic', ['Grátis', 'Urbano']],
  ['polypizza-humanoids', 'Poly Pizza — Humanoides', 'Busca comunitária de modelos; rig e licença variam por item.', 'https://poly.pizza/search/person', 0, ['GLB'], false, false, 'epic', ['GLB', 'Low-poly']],
  ['opengameart-humanoids', 'OpenGameArt — Personagens 3D', 'Busca comunitária; confira formato, rig e licença de cada item.', 'https://opengameart.org/art-search-advanced?keys=humanoid&field_art_type_tid[]=10', 0, ['FBX', 'OBJ', 'BLEND', 'GLB'], false, false, 'epic', ['Licenças variadas']],
  ['sketchfab-rigged-humanoids', 'Sketchfab — Humanoides Riggados', 'Busca por modelos humanoides animados e baixáveis; licenças variam.', 'https://sketchfab.com/search?type=models&q=humanoid&features=downloadable&animated=true&sort_by=-likeCount', 0, ['GLB', 'GLTF', 'FBX', 'OBJ'], true, true, 'legendary', ['Busca', 'GLB', 'Riggado']],
  ['cgtrader-free', 'CGTrader — Personagens gratuitos', 'Catálogo externo; preços, formatos e licenças variam.', 'https://www.cgtrader.com/free-3d-models/character', 0, ['FBX', 'OBJ', 'BLEND'], false, false, 'epic', ['Catálogo', 'Licenças variadas']],
  ['adobe-fuse', 'Adobe Fuse — Informações de encerramento', 'Fuse foi descontinuado; esta página explica o encerramento do produto.', 'https://helpx.adobe.com/fuse/kb/fuse-end-of-life.html', 0, ['OBJ', 'FBX'], false, false, 'common', ['Descontinuado']],
  ['blenderkit-humanoids', 'BlenderKit — Humanoides', 'Busca de personagens na biblioteca do BlenderKit; disponibilidade e licença variam.', 'https://www.blenderkit.com/asset-gallery?query=category_subtree:character+free', 0, ['BLEND'], false, false, 'epic', ['Blender', 'Catálogo']],
  ['turbosquid-free', 'TurboSquid — Modelos gratuitos', 'Catálogo externo de modelos; confira filtros e licenças.', 'https://www.turbosquid.com/Search/3D-Models/free/humanoid', 0, ['FBX', 'OBJ', 'MAX'], false, false, 'epic', ['Catálogo', 'Licenças variadas']],
  ['polyhaven-props', 'Poly Haven — Props', 'Modelos CC0 complementares, como objetos e acessórios.', 'https://polyhaven.com/models', 0, ['GLTF'], false, false, 'common', ['CC0', 'Props']],
  ['mixamo-animations-2500', 'Mixamo — Biblioteca de animações', 'Catálogo de animações humanoides da Adobe; requer login para baixar.', 'https://www.mixamo.com', 0, ['FBX'], false, true, 'legendary', ['Animações', 'FBX']],
  ['activetheory', 'Active Theory — Site oficial', 'Explore o trabalho e os recursos publicados pelo estúdio.', 'https://activetheory.net/', 0, [], false, false, 'common', ['Site oficial']],
  ['cascadeur-free', 'Cascadeur — Animação', 'Ferramenta de animação; confira os recursos e termos atuais.', 'https://cascadeur.com/', 0, ['FBX'], false, true, 'epic', ['Animação']],
  ['rokoko-free', 'Rokoko — Motion Capture', 'Recursos de mocap; catálogo e condições podem mudar.', 'https://www.rokoko.com/resources/free-motion-capture', 0, ['FBX'], false, true, 'epic', ['Mocap']],
  ['truebones', 'TrueBones — Animações', 'Amostras e licenças conforme os termos do fornecedor.', 'https://truebones.com/free/', 0, ['FBX'], false, true, 'common', ['Animação']],
].map(([id, name, desc, url, count, formats, rigged, animated, tier, tags]) => ({
  id, name, desc, url, tags, type: 'library', count, formats, rigged, animated, tier,
}));

const items = sources.map(source => ({
  ...source,
  type: source.count ? 'pack' : 'library',
}));

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    items,
    total: items.reduce((sum, item) => sum + item.count, 0),
    sources: items.length,
    legendary: items.filter(item => item.tier === 'legendary').length,
    epic: items.filter(item => item.tier === 'epic').length,
  });
}
