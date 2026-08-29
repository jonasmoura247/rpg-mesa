const assert = require('assert');
const { MAGIAS } = require('./magias.js');

const CLASSES_CONJURADORAS = ['Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Magista'];

assert.ok(Array.isArray(MAGIAS) && MAGIAS.length > 0, 'MAGIAS deve ser um array não vazio');

assert.ok(
  MAGIAS.every(m => m.circulo === 0 || m.circulo === 1),
  'toda magia deve ser círculo 0 (cantrip) ou 1'
);

assert.ok(
  MAGIAS.every(m => Array.isArray(m.classes) && m.classes.length > 0),
  'toda magia deve ter ao menos 1 classe'
);

assert.ok(
  MAGIAS.every(m => m.classes.every(c => CLASSES_CONJURADORAS.includes(c))),
  'toda classe listada numa magia deve ser uma das 6 classes conjuradoras de nível 1'
);

assert.ok(
  MAGIAS.every(m => typeof m.nome === 'string' && m.nome.length > 0),
  'toda magia deve ter nome'
);

CLASSES_CONJURADORAS.forEach(classe => {
  const cantrips = MAGIAS.filter(m => m.circulo === 0 && m.classes.includes(classe));
  const nivel1 = MAGIAS.filter(m => m.circulo === 1 && m.classes.includes(classe));
  assert.ok(cantrips.length >= 2, `${classe} deve ter ao menos 2 cantrips no catálogo`);
  assert.ok(nivel1.length >= 2, `${classe} deve ter ao menos 2 magias de 1º círculo no catálogo`);
});

const misseisMagicos = MAGIAS.find(m => m.nome === 'Mísseis Mágicos');
assert.ok(misseisMagicos && !misseisMagicos.classes.includes('Bruxo'), 'Mísseis Mágicos não deve estar disponível para Bruxo (não é da lista de magias do Bruxo)');

const repreensaoInfernal = MAGIAS.find(m => m.nome === 'Repreensão Infernal');
assert.ok(repreensaoInfernal && repreensaoInfernal.classes.length === 1 && repreensaoInfernal.classes[0] === 'Bruxo', 'Repreensão Infernal deve ser exclusiva do Bruxo no catálogo');

console.log('magias.test.js: OK');
