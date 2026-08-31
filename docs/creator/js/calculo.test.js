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

assert.strictEqual(Calculo.cdMagia(3, 2), 13);
assert.strictEqual(Calculo.cdMagia(-1, 2), 9);
assert.strictEqual(Calculo.cdMagia(0, 2), 10);

assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'fixo', magiasConhecidasFixo: 4 }, 3), 4);
assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'preparado' }, 3), 4);
assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'preparado' }, -1), 1);
assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'preparado' }, 0), 1);

assert.strictEqual(Calculo.caArmadura(null, false, 3), 13, 'sem armadura, sem escudo: 10 + DES');
assert.strictEqual(Calculo.caArmadura(null, true, 3), 15, 'sem armadura, com escudo: 10 + DES + 2');

const couro = { nome: 'Couro', categoria: 'leve', ca: 11, limiteDex: null };
assert.strictEqual(Calculo.caArmadura(couro, false, 3), 14, 'armadura leve soma DES inteiro');
assert.strictEqual(Calculo.caArmadura(couro, false, -2), 9, 'armadura leve com DES negativo');

const cotaDeMalha = { nome: 'Cota de Malha', categoria: 'media', ca: 13, limiteDex: 2 };
assert.strictEqual(Calculo.caArmadura(cotaDeMalha, false, 4), 15, 'armadura média limita DES em +2 mesmo com mod maior');
assert.strictEqual(Calculo.caArmadura(cotaDeMalha, false, 1), 14, 'armadura média usa DES cheio quando menor que o limite');
assert.strictEqual(Calculo.caArmadura(cotaDeMalha, true, 4), 17, 'armadura média com escudo soma +2 extra');

const placas = { nome: 'Armadura de Placas', categoria: 'pesada', ca: 18, limiteDex: 0, forMinima: 15 };
assert.strictEqual(Calculo.caArmadura(placas, false, 4), 18, 'armadura pesada ignora DES completamente');
assert.strictEqual(Calculo.caArmadura(placas, true, 4), 20, 'armadura pesada com escudo soma +2');

console.log('calculo.test.js: OK');
