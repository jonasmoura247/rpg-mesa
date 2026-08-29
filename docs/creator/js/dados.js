(function (raiz) {
  const PERICIAS = [
    { nome: 'Atletismo', atributo: 'forca' },
    { nome: 'Acrobacia', atributo: 'destreza' },
    { nome: 'Furtividade', atributo: 'destreza' },
    { nome: 'Prestidigitacao', atributo: 'destreza' },
    { nome: 'Arcanismo', atributo: 'inteligencia' },
    { nome: 'Historia', atributo: 'inteligencia' },
    { nome: 'Investigacao', atributo: 'inteligencia' },
    { nome: 'Natureza', atributo: 'inteligencia' },
    { nome: 'Religiao', atributo: 'inteligencia' },
    { nome: 'Adestramento', atributo: 'sabedoria' },
    { nome: 'Intuicao', atributo: 'sabedoria' },
    { nome: 'Medicina', atributo: 'sabedoria' },
    { nome: 'Percepcao', atributo: 'sabedoria' },
    { nome: 'Sobrevivencia', atributo: 'sabedoria' },
    { nome: 'Atuacao', atributo: 'carisma' },
    { nome: 'Engano', atributo: 'carisma' },
    { nome: 'Intimidacao', atributo: 'carisma' },
    { nome: 'Persuasao', atributo: 'carisma' }
  ];

  const CUSTO_POINT_BUY = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const ORCAMENTO_PONTOS = 27;
  const ATRIBUTO_MINIMO = 8;
  const ATRIBUTO_MAXIMO = 15;

  const RACAS = [
    { nome: 'Humano', bonus: { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 },
      descricao: 'Adaptáveis e ambiciosos, os humanos são a raça mais numerosa e versátil, com um pouco de talento em tudo.' },
    { nome: 'Anão da Colina', bonus: { constituicao: 2, sabedoria: 1 },
      descricao: 'Anões resistentes e perceptivos, com instintos aguçados forjados em sociedades subterrâneas antigas.' },
    { nome: 'Anão da Montanha', bonus: { constituicao: 2, forca: 2 },
      descricao: 'Anões fortes e habituados à armadura pesada, vindos de fortalezas talhadas na rocha.' },
    { nome: 'Elfo Alto', bonus: { destreza: 2, inteligencia: 1 },
      descricao: 'Elfos graciosos com afinidade natural pela magia arcana e memória precisa.' },
    { nome: 'Elfo da Floresta', bonus: { destreza: 2, sabedoria: 1 },
      descricao: 'Elfos ágeis e furtivos, criados entre as árvores, com sentidos aguçados para a natureza.' },
    { nome: 'Elfo Negro (Drow)', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Elfos de vida subterrânea, ágeis e carismáticos, acostumados à escuridão e à intriga.' },
    { nome: 'Halfling Pés Leves', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Pequenos e discretos, hábeis em passar despercebidos e fazer amizade com estranhos.' },
    { nome: 'Halfling Robusto', bonus: { destreza: 2, constituicao: 1 },
      descricao: 'Halflings resistentes, com constituição mais forte que a média da sua raça.' },
    { nome: 'Draconato', bonus: { forca: 2, carisma: 1 },
      descricao: 'Descendentes de dragões, orgulhosos e imponentes, com um sopro elemental herdado da linhagem.' },
    { nome: 'Gnomo da Floresta', bonus: { inteligencia: 2, destreza: 1 },
      descricao: 'Gnomos curiosos e ágeis, com talento natural para ilusões e comunicação com pequenos animais.' },
    { nome: 'Gnomo das Rochas', bonus: { inteligencia: 2, constituicao: 1 },
      descricao: 'Gnomos inventivos e resistentes, hábeis com mecanismos e engenhocas.' },
    { nome: 'Meio-Elfo', bonus: { carisma: 2 }, escolhaLivre: 2,
      descricao: 'Nascidos entre dois mundos, carismáticos e versáteis, sem se encaixar totalmente em nenhum dos dois.' },
    { nome: 'Meio-Orc', bonus: { forca: 2, constituicao: 1 },
      descricao: 'Fortes e implacáveis em combate, com resistência notável e ímpeto selvagem.' },
    { nome: 'Tiefling', bonus: { carisma: 2, inteligencia: 1 },
      descricao: 'Marcados por uma herança infernal distante, carismáticos e frequentemente incompreendidos.' }
  ];

  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      descricao: 'Guerreiro que canaliza fúria primitiva em combate, resistente e devastador corpo a corpo.',
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [],
      descricao: 'Conjurador versátil que inspira aliados e desarma inimigos através de música, palavras e magia.' },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador que obtém poder através de um pacto com uma entidade sobrenatural.',
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador divino que cura, protege e combate em nome de uma divindade ou ideal.',
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador ligado à natureza, capaz de assumir formas animais e comandar os elementos.',
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador cujo poder mágico vem de uma origem inata, no sangue ou na alma.',
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      descricao: 'Combatente versátil e treinado, mestre em armas e táticas de batalha.',
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      descricao: 'Especialista em furtividade, precisão e golpes certeiros contra alvos desprevenidos.',
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador erudito que domina a magia arcana através de estudo e um grimório pessoal.',
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      descricao: 'Guerreiro disciplinado que canaliza energia interior em golpes rápidos e precisos.',
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      descricao: 'Guerreiro sagrado ligado por um juramento, combinando força marcial e magia divina.',
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      descricao: 'Caçador e explorador habilidoso, especialista em rastreamento, sobrevivência e combate à distância.',
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'] }
  ];

  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO, RACAS, CLASSES };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.DADOS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
