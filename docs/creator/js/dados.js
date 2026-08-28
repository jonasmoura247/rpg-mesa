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

  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO, RACAS };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.DADOS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
