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

console.log('dados.test.js (perícias/point buy): OK');
