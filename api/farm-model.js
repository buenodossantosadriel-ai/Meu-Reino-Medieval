const SOURCES = {
  cow: 'https://cdn.mint.gg/owned-artifacts/158d1a346a5b198c784514fe747f51f8ff7113e7789f402f532a9e32c138ea1c',
  chicken: 'https://cdn.mint.gg/owned-artifacts/4b70685d7395397a9a9a4c813f28b95c7a01769929e6bf21a43057bb02ed8004',
  pig: 'https://cdn.mint.gg/owned-artifacts/0151b3208e9413674e962a1360eca2446083e398bd8ceb4db22abc156a390d07',
  sheep: 'https://cdn.mint.gg/owned-artifacts/6e6b7ec3d01e80df27c21538f0cffaa754f6f608d9dfb44135b8b6c2f0812dc3',
  oak: 'https://files.innerscene.com/library/oak-street-tree-detailed-leaves-a273fef9/4a26d0fea7474835bf61/oak-detailed.glb',
  dragon: 'https://vinish-models.pages.dev/dragons/fire-dragon.glb',
  'horse-bay': 'https://vinish-models.pages.dev/horses/bay-horse.glb',
  'horse-arabian': 'https://vinish-models.pages.dev/horses/arabian-horse.glb',
  'horse-friesian': 'https://vinish-models.pages.dev/horses/friesian-horse.glb',
  'horse-western': 'https://vinish-models.pages.dev/horses/western-horse.glb',
  'horse-draft': 'https://vinish-models.pages.dev/horses/draft-horse.glb',
  knight: 'https://vinish-models.pages.dev/knights/plate-armour-knight.glb',
  princess: 'https://vinish-models.pages.dev/knights/lady-knight.glb',
  ogre: 'https://vinish-models.pages.dev/monsters/cyclops.glb',
  goblin: 'https://vinish-models.pages.dev/goblins-and-trolls/goblin-raider.glb',
  troll: 'https://vinish-models.pages.dev/goblins-and-trolls/forest-troll.glb'
};
module.exports = async function handler(req, res) {
  const type = String(req.query.type || '');
  const source = SOURCES[type];
  if (!source) return res.status(400).json({ error: 'Modelo não permitido.' });
  try {
    const upstream = await fetch(source, { headers: { Accept: 'model/gltf-binary, application/octet-stream, */*' } });
    if (!upstream.ok) return res.status(502).json({ error: 'Falha ao obter o modelo 3D.', status: upstream.status });
    const data = Buffer.from(await upstream.arrayBuffer());
    if (data.length < 12 || data.toString('ascii', 0, 4) !== 'glTF') return res.status(502).json({ error: 'O arquivo recebido não é um GLB válido.' });
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Length', String(data.length));
    res.setHeader('Cache-Control', 'public, s-maxage=31536000, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(data);
  } catch (error) {
    console.error('Erro no proxy de modelo 3D:', error);
    return res.status(502).json({ error: 'Não foi possível carregar o modelo 3D.' });
  }
};
