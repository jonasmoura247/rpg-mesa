# Magias (Fase 3) — Design

## Objetivo

Permitir que o jogador escolha, durante a criação de personagem no `/creator`, quais cantrips e magias de 1º círculo seu personagem conhece/prepara — respeitando os limites reais de cada classe conjuradora no nível 1 — e exibir essas magias (com efeito, dano, alcance etc.) tanto no resumo do creator quanto na ficha da aba Jogadores do painel.

## Escopo

**Magias:** só cantrips e magias de 1º círculo (o máximo que qualquer personagem de nível 1 pode conjurar).

**Classes cobertas:** das 12 classes, só 6 conjuram no nível 1 — **Bardo, Bruxo, Clérigo, Druida, Feiticeiro, Magista**. Paladino e Patrulheiro só começam a conjurar no nível 2 (regra oficial do PHB), então ficam fora por enquanto — nenhuma etapa nova aparece pra eles. As 6 classes não-conjuradoras (Bárbaro, Guerreiro, Ladino, Monge) continuam sem nenhuma alteração.

**Catálogo:** subconjunto curado, não a lista oficial completa. Por classe: todos os cantrips oficiais (são poucos — 3 a 8 por classe) + as ~8-10 magias de 1º círculo mais representativas/usadas. Suficiente pra montar qualquer personagem coerente, com risco de erro de conteúdo bem menor que catalogar cada magia oficial (60-100+ únicas). Pode ser expandido depois sob demanda, do mesmo jeito que a Fase 2b deixou níveis 6-20 pra depois.

**Mecânica de conjuração — simplificação deliberada:** o PHB distingue "conhecidas" (Bardo/Bruxo/Feiticeiro escolhem magias fixas ao subir de nível) de "preparadas" (Clérigo/Druida/Magista sabem toda a lista da classe e preparam um subconjunto por dia). Para uma ficha de personagem sempre-nível-1, essa distinção não muda a interação do jogador — em ambos os casos ele escolhe N magias de 1º círculo de uma lista, respeitando um limite. O creator trata as duas mecânicas de forma uniforme (escolher até o limite), e o limite em si já reflete a regra certa de cada classe:

- **Limite fixo** (Bardo, Bruxo, Feiticeiro): número exato de magias conhecidas no nível 1, direto da tabela de progressão da classe.
- **Limite calculado** (Clérigo, Druida, Magista): modificador do atributo de conjuração + 1 (nível do personagem), mínimo 1 — a fórmula real de "quantas magias preparadas" do PHB, aplicada a um personagem de nível 1.

Cantrips sempre têm limite fixo (não há "preparo" de cantrip).

## Arquitetura

Segue exatamente o padrão já usado nas Fases 1/2a/2b: o `/creator` calcula tudo uma vez no momento da exportação; o backend/painel só armazenam e exibem o que veio no JSON, sem recalcular (princípio "backend confia no JSON" já estabelecido no projeto).

### `docs/creator/js/magias.js` (novo arquivo)

Mesmo padrão dual `window.DADOS_MAGIAS`/`module.exports` dos outros arquivos de dados. Exporta `MAGIAS`, um array de:
```js
{
  nome: 'Mísseis Mágicos',
  circulo: 1,              // 0 = cantrip, 1 = primeiro círculo
  escola: 'Evocação',
  classes: ['Feiticeiro', 'Magista'],
  tempoConjuracao: '1 ação',
  alcance: '36 metros',
  duracao: 'Instantânea',
  componentes: 'V, S',
  descricao: 'Cria três dardos de energia mágica...',
  dano: '1d4+1 de dano de força por dardo',   // opcional, null quando não há dano
  testeResistencia: null                        // opcional, ex: 'Destreza' quando há; null quando não há
}
```

### `docs/creator/js/dados.js` (modificado)

Cada uma das 6 classes conjuradoras ganha um novo campo `magias`:
```js
magias: {
  cantripsConhecidos: 2,     // sempre fixo
  tipo: 'fixo',               // 'fixo' | 'preparado'
  magiasConhecidasFixo: 4     // só presente quando tipo === 'fixo'
}
```
Classes sem esse campo (`magias: undefined`) não passam pela nova etapa.

### `docs/creator/js/calculo.js` (modificado)

Nova função pura:
```js
function quantidadeMagiasNivel1(infoMagiasClasse, modAtributoConjuracao) {
  if (infoMagiasClasse.tipo === 'fixo') return infoMagiasClasse.magiasConhecidasFixo;
  return Math.max(1, modAtributoConjuracao + 1); // nivel do personagem = 1
}
```

### `docs/creator/js/app.js` (modificado)

- Nova etapa **Magias**, inserida entre Perícias e Resumo, só renderizada quando `classe.magias` existe (mesmo padrão de etapa condicional já usado — a estrutura de etapas do wizard vira dinâmica em função da classe escolhida, análogo a como o campo "+1 atributo" só aparece pra Meio-Elfo).
- Mostra dois grupos com contador de limite (mesmo padrão visual/comportamental do checkbox-com-limite já usado em Perícias): "Cantrips (X/Y escolhidos)" e "Magias de 1º Círculo (X/Y escolhidas)", listando só as magias de `MAGIAS` filtradas por `classes.includes(classeAtual)` e pelo `circulo` certo.
- `ficha` ganha `magiasEscolhidas: []` (array de nomes, como já é feito com `periciasEscolhidas`).
- `construirFichaFinal()` resolve os nomes escolhidos para os objetos completos de `MAGIAS` e exporta `magiasConhecidas: [...]` (array vazio `[]` — não `undefined` — para classes não-conjuradoras, mantendo o JSON sempre com a chave presente e consistente).

### Backend (`Modelos.cs`, `ServicoPersonagens.cs`)

Mesmo padrão das fases anteriores:
```csharp
public record MagiaPersonagem(
    string Nome, int Circulo, string Escola, string TempoConjuracao,
    string Alcance, string Duracao, string Componentes, string Descricao,
    string? Dano = null, string? TesteResistencia = null);
```
Declarado antes de `Personagem`. Campo `List<MagiaPersonagem>? MagiasConhecidas = null` adicionado como último parâmetro de `Personagem` e `ImportarPersonagemRequisicao`. `ServicoPersonagens.Importar` repassa `requisicao.MagiasConhecidas` como último argumento — com o mesmo cuidado de conferência posicional já documentado nas fases anteriores (esse método já esqueceu campos novos mais de uma vez).

### `src/PainelDed.Api/wwwroot/js/personagens.js` (modificado)

Novo bloco "Magias", guardado por `personagem.magiasConhecidas && personagem.magiasConhecidas.length > 0`, inserido depois de "Habilidades de Classe" e antes de "História". Separa visualmente Cantrips de Magias de 1º Círculo em duas listas (`<h4>Cantrips</h4><ul>` e `<h4>Magias de 1º Círculo</h4><ul>`, cada uma só renderizada se tiver pelo menos 1 item do respectivo círculo), mesmo padrão dos outros blocos. Cada item mostra nome em negrito, seguido de escola/alcance/duração e o efeito resumido (mais dano/teste de resistência quando existirem) em texto normal — mesma técnica createElement/textContent (nunca innerHTML) já usada pros outros blocos, já que magias importadas vêm de um JSON potencialmente editado pelo usuário.

## Fluxo de dados ponta a ponta

`magias.js` (catálogo fixo) + `dados.js` (limite por classe) → `app.js` etapa Magias (jogador escolhe, respeitando limite) → `construirFichaFinal()` exporta `magiasConhecidas: [...]` completo → `Modelos.cs`/`ServicoPersonagens` persistem → `personagens.js` exibe.

## Testes

- `docs/creator/js/calculo.test.js`: testes pra `quantidadeMagiasNivel1` (caso fixo, caso preparado com mod positivo/negativo, caso mínimo 1).
- `docs/creator/js/dados.test.js` (ou um novo `magias.test.js`): toda classe conjuradora tem `magias` válido; todo item de `MAGIAS` tem `classes.length > 0`; nenhuma magia de círculo fora de {0,1}.
- `ModelosTestes.cs`: round-trip de `MagiaPersonagem`/`MagiasConhecidas`, e regressão de JSON antigo sem o campo (lista nula).
- `ServicoPersonagensTestes.cs`: `Importar` repassa `MagiasConhecidas` corretamente.

## Fora de escopo (explicitamente adiado)

- Magias de 2º círculo em diante, e níveis de personagem acima de 1.
- Paladino e Patrulheiro (não conjuram no nível 1).
- Catálogo oficial completo de magias (só o subconjunto curado).
- Qualquer validação de "combo" entre magias (ex: pré-requisitos, magias rituais, concentração simultânea) — cada magia é tratada como uma entrada independente pro propósito desta ficha.
