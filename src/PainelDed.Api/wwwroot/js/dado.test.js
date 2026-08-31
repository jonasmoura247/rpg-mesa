const assert = require('assert');
const Dado = require('./dado.js');

assert.deepStrictEqual(Dado.parseFormula('1d8'), { quantidade: 1, lados: 8 });
assert.deepStrictEqual(Dado.parseFormula('2d6'), { quantidade: 2, lados: 6 });
assert.throws(() => Dado.parseFormula('xyz'), /Fórmula de dano inválida/);

for (let i = 0; i < 200; i++) {
  const valor = Dado.rolar(1, 8);
  assert.ok(valor >= 1 && valor <= 8, `1d8 fora do intervalo: ${valor}`);
}
for (let i = 0; i < 200; i++) {
  const valor = Dado.rolar(2, 6);
  assert.ok(valor >= 2 && valor <= 12, `2d6 fora do intervalo: ${valor}`);
}

for (let i = 0; i < 200; i++) {
  const resultado = Dado.rolarDano('1d8', 3, false);
  assert.strictEqual(resultado.quantidadeDados, 1);
  assert.ok(resultado.dadosRolados >= 1 && resultado.dadosRolados <= 8);
  assert.strictEqual(resultado.total, resultado.dadosRolados + 3);
}

for (let i = 0; i < 200; i++) {
  const resultado = Dado.rolarDano('1d8', 3, true);
  assert.strictEqual(resultado.quantidadeDados, 2, 'crítico deve dobrar a quantidade de dados, não o modificador');
  assert.ok(resultado.dadosRolados >= 2 && resultado.dadosRolados <= 16);
  assert.strictEqual(resultado.total, resultado.dadosRolados + 3);
}

console.log('dado.test.js: OK');
