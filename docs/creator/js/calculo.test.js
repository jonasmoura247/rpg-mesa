const assert = require('assert');
const Calculo = require('./calculo.js');

assert.strictEqual(Calculo.modificador(10), 0);
assert.strictEqual(Calculo.modificador(11), 0);
assert.strictEqual(Calculo.modificador(15), 2);
assert.strictEqual(Calculo.modificador(8), -1);
assert.strictEqual(Calculo.modificador(9), -1);
assert.strictEqual(Calculo.modificador(7), -2);
assert.strictEqual(Calculo.modificador(20), 5);

console.log('calculo.test.js: OK');
