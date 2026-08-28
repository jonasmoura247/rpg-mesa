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
    { nome: 'Humano', bonus: { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 } },
    { nome: 'Anão da Colina', bonus: { constituicao: 2, sabedoria: 1 } },
    { nome: 'Anão da Montanha', bonus: { constituicao: 2, forca: 2 } },
    { nome: 'Elfo Alto', bonus: { destreza: 2, inteligencia: 1 } },
    { nome: 'Elfo da Floresta', bonus: { destreza: 2, sabedoria: 1 } },
    { nome: 'Elfo Negro (Drow)', bonus: { destreza: 2, carisma: 1 } },
    { nome: 'Halfling Pés Leves', bonus: { destreza: 2, carisma: 1 } },
    { nome: 'Halfling Robusto', bonus: { destreza: 2, constituicao: 1 } },
    { nome: 'Draconato', bonus: { forca: 2, carisma: 1 } },
    { nome: 'Gnomo da Floresta', bonus: { inteligencia: 2, destreza: 1 } },
    { nome: 'Gnomo das Rochas', bonus: { inteligencia: 2, constituicao: 1 } },
    { nome: 'Meio-Elfo', bonus: { carisma: 2 }, escolhaLivre: 2 },
    { nome: 'Meio-Orc', bonus: { forca: 2, constituicao: 1 } },
    { nome: 'Tiefling', bonus: { carisma: 2, inteligencia: 1 } }
  ];

  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [] },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'] }
  ];

  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO, RACAS, CLASSES };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.DADOS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
