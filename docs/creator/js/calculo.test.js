const assert = require('assert');
const Calculo = require('./calculo.js');

assert.strictEqual(Calculo.modificador(10), 0);
assert.strictEqual(Calculo.modificador(11), 0);
assert.strictEqual(Calculo.modificador(15), 2);
assert.strictEqual(Calculo.modificador(8), -1);
assert.strictEqual(Calculo.modificador(9), -1);
assert.strictEqual(Calculo.modificador(7), -2);
assert.strictEqual(Calculo.modificador(20), 5);

const tabelaCusto = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

assert.strictEqual(
  Calculo.custoTotalPointBuy({ forca: 15, destreza: 14, constituicao: 13, inteligencia: 12, sabedoria: 10, carisma: 8 }, tabelaCusto),
  27
);
assert.strictEqual(
  Calculo.custoTotalPointBuy({ forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 }, tabelaCusto),
  0
);

assert.strictEqual(
  Calculo.pontosRestantes({ forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 }, tabelaCusto, 27),
  27
);
assert.strictEqual(
  Calculo.pontosRestantes({ forca: 15, destreza: 14, constituicao: 13, inteligencia: 12, sabedoria: 10, carisma: 8 }, tabelaCusto, 27),
  0
);

assert.strictEqual(Calculo.pvInicial(10, 2), 12);
assert.strictEqual(Calculo.pvInicial(6, -1), 5);
assert.strictEqual(Calculo.caBase(3), 13);
assert.strictEqual(Calculo.caBase(-1), 9);

assert.strictEqual(Calculo.bonusPericia(3, true, 2), 5);
assert.strictEqual(Calculo.bonusPericia(3, false, 2), 3);
assert.strictEqual(Calculo.bonusPericia(-1, true, 2), 1);

console.log('calculo.test.js: OK');
