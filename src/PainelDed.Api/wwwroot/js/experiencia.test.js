const assert = require('assert');
const Experiencia = require('./experiencia.js');

assert.strictEqual(Experiencia.xpPorCd('0'), 10);
assert.strictEqual(Experiencia.xpPorCd('1/8'), 25);
assert.strictEqual(Experiencia.xpPorCd('1/4'), 50);
assert.strictEqual(Experiencia.xpPorCd('1/2'), 100);
assert.strictEqual(Experiencia.xpPorCd('1'), 200);
assert.strictEqual(Experiencia.xpPorCd('2'), 450);
assert.strictEqual(Experiencia.xpPorCd('10'), 5900);
assert.strictEqual(Experiencia.xpPorCd('cd-desconhecido'), 0);

assert.strictEqual(Experiencia.xpNivelAtual(1), 0);
assert.strictEqual(Experiencia.xpNivelAtual(3), 900);
assert.strictEqual(Experiencia.xpNivelAtual(10), 64000);

assert.strictEqual(Experiencia.xpProximoNivel(1), 300);
assert.strictEqual(Experiencia.xpProximoNivel(9), 64000);
assert.strictEqual(Experiencia.xpProximoNivel(10), null);

console.log('experiencia.test.js: OK');
