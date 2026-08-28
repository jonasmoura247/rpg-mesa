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

  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.DADOS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
