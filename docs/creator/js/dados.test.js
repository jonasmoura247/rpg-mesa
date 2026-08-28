const assert = require('assert');
const DADOS = require('./dados.js');

assert.strictEqual(DADOS.PERICIAS.length, 18, 'devem existir 18 perícias do 5e');
assert.deepStrictEqual(
  DADOS.PERICIAS.find(p => p.nome === 'Furtividade'),
  { nome: 'Furtividade', atributo: 'destreza' }
);
assert.deepStrictEqual(
  DADOS.PERICIAS.find(p => p.nome === 'Atletismo'),
  { nome: 'Atletismo', atributo: 'forca' }
);

assert.strictEqual(DADOS.CUSTO_POINT_BUY[8], 0);
assert.strictEqual(DADOS.CUSTO_POINT_BUY[13], 5);
assert.strictEqual(DADOS.CUSTO_POINT_BUY[15], 9);
assert.strictEqual(DADOS.ORCAMENTO_PONTOS, 27);
assert.strictEqual(DADOS.ATRIBUTO_MINIMO, 8);
assert.strictEqual(DADOS.ATRIBUTO_MAXIMO, 15);

assert.strictEqual(DADOS.RACAS.length, 14, 'devem existir 14 opções de raça (9 raças + subraças)');
assert.deepStrictEqual(
  DADOS.RACAS.find(r => r.nome === 'Humano').bonus,
  { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 }
);
assert.deepStrictEqual(
  DADOS.RACAS.find(r => r.nome === 'Anão da Montanha').bonus,
  { constituicao: 2, forca: 2 }
);
const meioElfo = DADOS.RACAS.find(r => r.nome === 'Meio-Elfo');
assert.deepStrictEqual(meioElfo.bonus, { carisma: 2 });
assert.strictEqual(meioElfo.escolhaLivre, 2);

console.log('dados.test.js (perícias/point buy): OK');
