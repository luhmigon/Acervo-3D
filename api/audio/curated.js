const CURATED = {
  sfx: [
    { id: 'kenney-rpg', name: 'Kenney RPG Audio', desc: 'Sons de RPG: ataques, magias, moedas e portas', url: 'https://kenney.nl/assets/rpg-audio', tags: ['CC0', 'OGG'], cat: ['weapons', 'magic', 'ui', 'pickup'] },
    { id: 'kenney-ui', name: 'Kenney UI Audio', desc: 'Sons de interface: cliques, hovers e notificações', url: 'https://kenney.nl/assets/ui-audio', tags: ['CC0', 'OGG'], cat: ['ui'] },
    { id: 'kenney-impact', name: 'Kenney Impact Sounds', desc: 'Impactos de metal, madeira, pedra e vidro', url: 'https://kenney.nl/assets/impact-sounds', tags: ['CC0', 'OGG'], cat: ['impacts', 'weapons'] },
    { id: 'kenney-sci-fi', name: 'Kenney Sci-Fi Sounds', desc: 'Sons sci-fi: lasers, naves e robôs', url: 'https://kenney.nl/assets/sci-fi-sounds', tags: ['CC0', 'OGG'], cat: ['sci-fi', 'weapons'] },
    { id: 'kenney-interface', name: 'Kenney Interface Sounds', desc: 'Sons de interface digital', url: 'https://kenney.nl/assets/interface-sounds', tags: ['CC0', 'OGG'], cat: ['ui'] },
    { id: 'kenney-digital', name: 'Kenney Digital Audio', desc: 'Beeps, glitches e sons de digitalização', url: 'https://kenney.nl/assets/digital-audio', tags: ['CC0', 'OGG'], cat: ['ui', 'sci-fi'] },
    { id: 'sonniss-gdc-1', name: 'Sonniss — GDC Bundle', desc: 'Coleção de efeitos sonoros para jogos e filmes', url: 'https://sonniss.com/gameaudiogdc', tags: ['Grátis; confira a licença', 'WAV'], cat: ['weapons', 'ambient', 'impacts'] },
    { id: 'sonniss-gdc-2', name: 'Sonniss — GDC Bundles', desc: 'Mais coleções de áudio profissional', url: 'https://sonniss.com/gameaudiogdc', tags: ['Grátis; confira a licença', 'WAV'], cat: ['weapons', 'ambient'] },
    { id: 'opengameart-sfx', name: 'OpenGameArt — SFX', desc: 'Efeitos sonoros comunitários para jogos', url: 'https://opengameart.org/art-search-advanced?field_art_type_tid[]=13', tags: ['Licenças variadas', 'OGG'], cat: ['weapons', 'magic', 'ui'] },
    { id: 'freesound-cc0', name: 'Freesound — CC0', desc: 'Busque sons publicados sob licença CC0', url: 'https://freesound.org/search/?f=license:%22Creative+Commons+0%22', tags: ['CC0', 'WAV'], cat: ['weapons', 'animals', 'ambient'] },
    { id: 'soundbible', name: 'SoundBible', desc: 'Efeitos sonoros por categoria', url: 'https://soundbible.com/', tags: ['Licenças variadas', 'WAV'], cat: ['weapons', 'animals', 'ambient'] },
    { id: 'zapsplat', name: 'ZapSplat', desc: 'Efeitos sonoros; consulte as condições do plano gratuito', url: 'https://www.zapsplat.com/', tags: ['Grátis com condições', 'MP3'], cat: ['weapons', 'ui', 'ambient'] },
    { id: 'mixkit-sfx', name: 'Mixkit Sound Effects', desc: 'Efeitos sonoros gratuitos', url: 'https://mixkit.co/free-sound-effects/', tags: ['Grátis; confira a licença', 'MP3'], cat: ['weapons', 'ui'] },
    { id: '99sounds', name: '99Sounds', desc: 'Pacotes gratuitos de áudio', url: 'https://99sounds.org/free-sound-effects/', tags: ['Grátis; confira a licença', 'WAV'], cat: ['ambient', 'sci-fi'] },
    { id: 'bbc-sfx', name: 'BBC Sound Effects', desc: 'Arquivo de sons da BBC; uso sujeito às condições do site', url: 'https://sound-effects.bbcrewind.co.uk/', tags: ['Uso sujeito a termos', 'MP3'], cat: ['ambient', 'animals'] },
    { id: 'videvo-sfx', name: 'Videvo Sound Effects', desc: 'Sons gratuitos com licenças que variam por recurso', url: 'https://www.videvo.net/sound-effect/', tags: ['Licenças variadas', 'WAV'], cat: ['ambient', 'impacts'] },
    { id: 'pixabay-sfx', name: 'Pixabay Sound Effects', desc: 'Efeitos sonoros gratuitos; confira os termos de uso', url: 'https://pixabay.com/sound-effects/', tags: ['Grátis; confira a licença', 'MP3'], cat: ['weapons', 'ui', 'ambient'] },
    { id: 'gameaudiopack', name: 'itch.io — Sound Effects', desc: 'Packs de áudio gratuitos para jogos', url: 'https://itch.io/game-assets/free/tag-sound-effects', tags: ['Licenças variadas', 'OGG'], cat: ['weapons', 'ui'] },
    { id: 'glitchsounds', name: 'Glitch Sounds — 99Sounds', desc: 'Pacote de sons digitais e glitches', url: 'https://99sounds.org/glitch/', tags: ['Confira a licença', 'WAV'], cat: ['sci-fi', 'ui'] },
    { id: 'weapon-sounds', name: 'OpenGameArt — RPG Sound Pack', desc: 'Sons de espadas, arcos e armas', url: 'https://opengameart.org/content/rpg-sound-pack', tags: ['Confira a licença', 'OGG'], cat: ['weapons'] },
  ],
  music: [
    { id: 'incompetech', name: 'Incompetech — Kevin MacLeod', desc: 'Músicas por categoria; atribuição pode ser necessária', url: 'https://incompetech.com/music/royalty-free/music.html', tags: ['CC-BY', 'MP3'], cat: ['epic', 'ambient', 'battle', 'sad', 'happy'] },
    { id: 'freepd', name: 'FreePD', desc: 'Música de domínio público, conforme os termos do site', url: 'https://freepd.com/', tags: ['Domínio público', 'MP3'], cat: ['ambient', 'epic', 'happy'] },
    { id: 'opengameart-music', name: 'OpenGameArt — Music', desc: 'Trilhas comunitárias para jogos', url: 'https://opengameart.org/art-search-advanced?field_art_type_tid[]=12', tags: ['Licenças variadas', 'OGG'], cat: ['epic', 'battle', 'ambient'] },
    { id: 'fma', name: 'Free Music Archive', desc: 'Catálogo e curadoria de música independente', url: 'https://freemusicarchive.org/', tags: ['Licenças variadas', 'MP3'], cat: ['ambient', 'epic', 'happy'] },
    { id: 'pixabay-music', name: 'Pixabay Music', desc: 'Música gratuita; confira as condições de uso', url: 'https://pixabay.com/music/', tags: ['Grátis; confira a licença', 'MP3'], cat: ['epic', 'battle', 'sad', 'happy'] },
    { id: 'filmmusic', name: 'FilmMusic.io', desc: 'Trilhas cinematográficas gratuitas', url: 'https://filmmusic.io/', tags: ['Grátis; confira a licença', 'MP3'], cat: ['epic', 'sad', 'tense'] },
    { id: 'mixkit-music', name: 'Mixkit Music', desc: 'Trilhas gratuitas para projetos', url: 'https://mixkit.co/free-stock-music/', tags: ['Grátis; confira a licença', 'MP3'], cat: ['epic', 'happy', 'ambient'] },
    { id: 'ben-sound', name: 'Bensound', desc: 'Trilhas gratuitas com condições de atribuição', url: 'https://www.bensound.com/', tags: ['Grátis com condições', 'MP3'], cat: ['happy', 'ambient', 'epic'] },
    { id: 'uppbeat', name: 'Uppbeat', desc: 'Músicas gratuitas com créditos conforme o plano', url: 'https://uppbeat.io/', tags: ['Grátis com condições', 'MP3'], cat: ['happy', 'epic', 'battle'] },
    { id: 'chosic', name: 'Chosic', desc: 'Música gratuita organizada por gênero', url: 'https://www.chosic.com/free-music/all/', tags: ['Licenças variadas', 'MP3'], cat: ['ambient', 'epic', 'sad'] },
    { id: 'purpleplanet', name: 'Purple Planet', desc: 'Trilhas gratuitas por categoria', url: 'https://www.purple-planet.com/', tags: ['Confira a licença', 'MP3'], cat: ['epic', 'ambient', 'happy'] },
    { id: 'soundimage', name: 'Soundimage', desc: 'Trilhas para projetos e jogos', url: 'https://soundimage.org/', tags: ['Confira a licença', 'MP3'], cat: ['epic', 'battle', 'ambient'] },
    { id: 'ocremix', name: 'OverClocked Remix', desc: 'Remixes de videogames; verifique os termos', url: 'https://ocremix.org/', tags: ['Confira a licença', 'MP3'], cat: ['epic', 'battle'] },
    { id: 'freemusicarchive-jazz', name: 'FMA — Jazz', desc: 'Seleção de jazz no Free Music Archive', url: 'https://freemusicarchive.org/genre/Jazz', tags: ['Licenças variadas', 'MP3'], cat: ['ambient'] },
    { id: 'tribeofnoise', name: 'Tribe of Noise', desc: 'Música independente e colaborativa', url: 'https://www.tribeofnoise.com/', tags: ['Licenças variadas', 'MP3'], cat: ['ambient', 'epic'] },
  ],
  ambient: [
    { id: 'polyhaven-hdri', name: 'Poly Haven — HDRIs', desc: 'HDRIs CC0 para iluminação e ambientes 3D', url: 'https://polyhaven.com/hdris', tags: ['CC0', 'HDR'], cat: ['forest', 'city', 'interior'] },
    { id: 'freesound-ambient', name: 'Freesound — Ambientes CC0', desc: 'Busque loops ambientes publicados em CC0', url: 'https://freesound.org/search/?q=ambient+loop&f=license:%22Creative+Commons+0%22', tags: ['CC0', 'WAV'], cat: ['forest', 'city', 'interior', 'weather'] },
    { id: 'sonniss-ambient', name: 'Sonniss — Ambientes', desc: 'Pacotes de ambientes; consulte os termos de cada coleção', url: 'https://sonniss.com/gameaudiogdc', tags: ['Grátis; confira a licença', 'WAV'], cat: ['forest', 'city', 'interior'] },
    { id: 'bbc-ambient', name: 'BBC Sound Effects — Ambientes', desc: 'Arquivo de sons; uso sujeito às condições do site', url: 'https://sound-effects.bbcrewind.co.uk/search?q=ambient', tags: ['Uso sujeito a termos', 'MP3'], cat: ['forest', 'city', 'weather'] },
    { id: 'zapsplat-ambient', name: 'ZapSplat — Ambientes', desc: 'Loops ambientes; confira as condições do plano', url: 'https://www.zapsplat.com/sound-effect-categories/', tags: ['Grátis com condições', 'MP3'], cat: ['forest', 'city', 'interior'] },
    { id: 'ambientsounds', name: 'Ambient Sounds — 99Sounds', desc: 'Coleção de sons ambientes', url: 'https://99sounds.org/ambient-sounds/', tags: ['Confira a licença', 'WAV'], cat: ['forest', 'interior', 'weather'] },
    { id: 'soundbible-ambient', name: 'SoundBible — Ambientes', desc: 'Sons ambientes organizados por busca', url: 'https://soundbible.com/search.php?q=ambient', tags: ['Licenças variadas', 'WAV'], cat: ['forest', 'city', 'weather'] },
    { id: 'mixkit-ambient', name: 'Mixkit — Ambientes', desc: 'Loops ambientes gratuitos', url: 'https://mixkit.co/free-sound-effects/ambient/', tags: ['Grátis; confira a licença', 'MP3'], cat: ['forest', 'city'] },
    { id: 'freetousesounds', name: 'Free To Use Sounds', desc: 'Gravações de ambientes de diferentes lugares', url: 'https://www.freetousesounds.com/', tags: ['Confira a licença', 'WAV'], cat: ['city', 'forest', 'weather'] },
    { id: 'gameaudiopack-ambient', name: 'itch.io — Ambient Packs', desc: 'Packs de ambiente para jogos', url: 'https://itch.io/game-assets/free/tag-ambient', tags: ['Licenças variadas', 'OGG'], cat: ['forest', 'interior'] },
  ],
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const requested = String(req.query.type || 'sfx');
  const type = ['sfx', 'music', 'ambient'].includes(requested) ? requested : 'sfx';
  return res.status(200).json({
    type,
    items: CURATED[type],
    total: CURATED[type].length,
    totals: Object.fromEntries(Object.entries(CURATED).map(([key, items]) => [key, items.length])),
  });
}
