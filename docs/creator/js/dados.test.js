const assert = require('assert');
const DADOS = require('./dados.js');

assert.strictEqual(DADOS.PERICIAS.length, 18, 'devem existir 18 perícias do 5e');
const furtividade = DADOS.PERICIAS.find(p => p.nome === 'Furtividade');
assert.strictEqual(furtividade.atributo, 'destreza');
assert.ok(furtividade.descricao, 'Furtividade deve ter descrição pro tooltip');

const atletismo = DADOS.PERICIAS.find(p => p.nome === 'Atletismo');
assert.strictEqual(atletismo.atributo, 'forca');
assert.ok(atletismo.descricao, 'Atletismo deve ter descrição pro tooltip');

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

assert.strictEqual(DADOS.CLASSES.length, 12, 'devem existir as 12 classes do 5e');
const guerreiro = DADOS.CLASSES.find(c => c.nome === 'Guerreiro');
assert.strictEqual(guerreiro.dadoDeVida, 10);
assert.strictEqual(guerreiro.escolhas, 2);
assert.ok(guerreiro.periciasElegiveis.includes('Atletismo'));

const ladino = DADOS.CLASSES.find(c => c.nome === 'Ladino');
assert.strictEqual(ladino.escolhas, 4);

const bardo = DADOS.CLASSES.find(c => c.nome === 'Bardo');
assert.strictEqual(bardo.todasPericias, true);
assert.strictEqual(bardo.escolhas, 3);

const barbaro = DADOS.CLASSES.find(c => c.nome === 'Bárbaro');
assert.strictEqual(barbaro.dadoDeVida, 12);

assert.ok(
  DADOS.RACAS.every(r => typeof r.descricao === 'string' && r.descricao.length > 0),
  'toda raça deve ter descricao não vazia'
);
assert.ok(
  DADOS.CLASSES.every(c => typeof c.descricao === 'string' && c.descricao.length > 0),
  'toda classe deve ter descricao não vazia'
);

const magista = DADOS.CLASSES.find(c => c.nome === 'Magista');
assert.strictEqual(magista.atributoConjuracao, 'inteligencia');
assert.deepStrictEqual(magista.resistencias, ['inteligencia', 'sabedoria']);

const guerreiroCombate = DADOS.CLASSES.find(c => c.nome === 'Guerreiro');
assert.strictEqual(guerreiroCombate.atributoConjuracao, null);
assert.deepStrictEqual(guerreiroCombate.resistencias, ['forca', 'constituicao']);

assert.ok(
  DADOS.CLASSES.every(c => Array.isArray(c.resistencias) && c.resistencias.length === 2),
  'toda classe deve ter exatamente 2 resistências'
);

assert.ok(
  DADOS.RACAS.every(r => Array.isArray(r.tracos) && r.tracos.length > 0),
  'toda raça deve ter pelo menos 1 traço racial'
);
const humanoTracos = DADOS.RACAS.find(r => r.nome === 'Humano');
assert.strictEqual(humanoTracos.tracos.length, 1);
const anaoColinaTracos = DADOS.RACAS.find(r => r.nome === 'Anão da Colina');
assert.strictEqual(anaoColinaTracos.tracos.length, 6);
assert.ok(anaoColinaTracos.tracos.every(t => typeof t.nome === 'string' && typeof t.descricao === 'string' && t.nome && t.descricao));

const tieflingTracos = DADOS.RACAS.find(r => r.nome === 'Tiefling');
assert.ok(tieflingTracos.tracos.some(t => t.descricao.includes('Repreensão Infernal')), 'Tiefling deve conhecer Repreensão Infernal, não um nome inventado');

const drowTracos = DADOS.RACAS.find(r => r.nome === 'Elfo Negro (Drow)');
assert.ok(drowTracos.tracos.some(t => t.descricao.includes('Fogo Feérico')), 'Drow deve conhecer Fogo Feérico, não um nome inventado');

assert.ok(
  DADOS.CLASSES.every(c => Array.isArray(c.habilidades) && c.habilidades.length > 0),
  'toda classe deve ter pelo menos 1 habilidade'
);
assert.ok(
  DADOS.CLASSES.every(c => c.habilidades.every(h => h.nivel >= 1 && h.nivel <= 5)),
  'toda habilidade deve ser de nível entre 1 e 5'
);
const guerreiroHabilidades = DADOS.CLASSES.find(c => c.nome === 'Guerreiro');
assert.ok(guerreiroHabilidades.habilidades.some(h => h.nome === 'Ataque Extra' && h.nivel === 5));
const barbaroHabilidades = DADOS.CLASSES.find(c => c.nome === 'Bárbaro');
assert.ok(barbaroHabilidades.habilidades.some(h => h.nome === 'Fúria' && h.nivel === 1));

const CLASSES_CONJURADORAS_NIVEL1 = ['Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Magista'];
DADOS.CLASSES.forEach(c => {
  if (CLASSES_CONJURADORAS_NIVEL1.includes(c.nome)) {
    assert.ok(c.magias, `${c.nome} deve ter o campo magias (é conjuradora de nível 1)`);
    assert.ok(c.magias.cantripsConhecidos >= 1, `${c.nome}.magias.cantripsConhecidos deve ser >= 1`);
    assert.ok(c.magias.tipo === 'fixo' || c.magias.tipo === 'preparado', `${c.nome}.magias.tipo deve ser 'fixo' ou 'preparado'`);
    if (c.magias.tipo === 'fixo') {
      assert.ok(c.magias.magiasConhecidasFixo >= 1, `${c.nome}.magias.magiasConhecidasFixo deve ser >= 1 quando tipo é fixo`);
    }
  } else {
    assert.ok(!c.magias, `${c.nome} não deve ter o campo magias (não conjura no nível 1)`);
  }
});
assert.strictEqual(bardo.magias.cantripsConhecidos, 2);
assert.strictEqual(bardo.magias.tipo, 'fixo');
assert.strictEqual(bardo.magias.magiasConhecidasFixo, 4);
const clerigo = DADOS.CLASSES.find(c => c.nome === 'Clérigo');
assert.strictEqual(clerigo.magias.tipo, 'preparado');
const paladino = DADOS.CLASSES.find(c => c.nome === 'Paladino');
assert.ok(!paladino.magias, 'Paladino não conjura no nível 1, não deve ter magias');

console.log('dados.test.js (perícias/point buy): OK');
