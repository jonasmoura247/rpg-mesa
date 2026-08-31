# Equipamento inicial + dano automático no Combate

Data: 2026-08-30

## Contexto

O criador de ficha (`docs/creator`) hoje termina em CA fixa (`10 + mod. Destreza`, sem armadura) e não
captura qual arma o personagem usa. No painel do mestre (`src/PainelDed.Api/wwwroot/js/combate.js`), o
jogador só tem duas ações genéricas — "Ataque corpo a corpo (Força)" e "Ataque à distância (Destreza)" —
e o mestre precisa rolar o dado de dano fisicamente e digitar o resultado toda vez.

Esta spec resolve os dois problemas juntos: adiciona uma etapa de Equipamento (arma + armadura, fiel ao
padrão de pacotes "(a) ou (b)" do 5e oficial) e usa essa informação para o Combate rolar o dano
automaticamente — o mestre digita só o d20 de acerto.

**Fora de escopo:** Antecedente (Background), itens de aventura/dinheiro inicial, "Estilo de Combate" do
Guerreiro nível 1, "Defesa sem Armadura" de Bárbaro/Monge (CA especial sem armadura) — todas ficam para
specs futuras se fizerem falta.

## 1. Reordenação das etapas do criador

Ordem atual: Atributos → Raça → Classe → [Magias] → Resumo.

Nova ordem: **Raça → Classe → Atributos → Equipamento → [Magias] → Resumo.**

Motivo: o jogador só sabe onde vale a pena investir pontos de atributo depois de saber raça (bônus fixo)
e classe (atributo principal). O resultado final dos atributos não muda — só a ordem em que são
decididos. `etapas()` em `app.js` passa a retornar essa nova ordem; `NOMES_ETAPAS` ganha `equipamento:
'Equipamento'`.

## 2. Tabelas de armas e armaduras (`dados.js`)

Portadas de `content/regras.json` (seção "08-Equipamentos"), sem inventar valores novos:

```js
DADOS.ARMAS = [
  // Simples — corpo a corpo
  { nome: 'Clava', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d4', tipoDano: 'concussão', propriedades: ['leve'] },
  { nome: 'Adaga', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d4', tipoDano: 'perfuração', propriedades: ['fineza', 'leve', 'arremesso'] },
  { nome: 'Machadinha', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d6', tipoDano: 'corte', propriedades: ['leve', 'arremesso'] },
  { nome: 'Lança', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d6', tipoDano: 'perfuração', propriedades: ['arremesso', 'versatil'], danoVersatil: '1d8' },
  { nome: 'Cajado', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d6', tipoDano: 'concussão', propriedades: ['versatil'], danoVersatil: '1d8' },
  // Marciais — corpo a corpo
  { nome: 'Espada Longa', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'corte', propriedades: ['versatil'], danoVersatil: '1d10' },
  { nome: 'Machado de Guerra', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'corte', propriedades: ['versatil'], danoVersatil: '1d10' },
  { nome: 'Rapieira', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'perfuração', propriedades: ['fineza'] },
  { nome: 'Alabarda', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d10', tipoDano: 'corte', propriedades: ['alcance', 'pesada', 'duasMaos'] },
  { nome: 'Espada Grande', categoria: 'marcial', tipo: 'corpoACorpo', dano: '2d6', tipoDano: 'corte', propriedades: ['pesada', 'duasMaos'] },
  { nome: 'Maça Estrela', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'concussão', propriedades: [] },
  // À distância
  { nome: 'Arco Curto', categoria: 'simples', tipo: 'distancia', dano: '1d6', tipoDano: 'perfuração', propriedades: [], alcance: '24/96m' },
  { nome: 'Arco Longo', categoria: 'marcial', tipo: 'distancia', dano: '1d8', tipoDano: 'perfuração', propriedades: [], alcance: '45/180m' },
  { nome: 'Besta Leve', categoria: 'simples', tipo: 'distancia', dano: '1d8', tipoDano: 'perfuração', propriedades: ['carga'], alcance: '24/96m' },
  { nome: 'Besta Pesada', categoria: 'marcial', tipo: 'distancia', dano: '1d10', tipoDano: 'perfuração', propriedades: ['carga', 'pesada'], alcance: '30/120m' },
  { nome: 'Funda', categoria: 'simples', tipo: 'distancia', dano: '1d4', tipoDano: 'concussão', propriedades: [], alcance: '30/120m' },
];

DADOS.ARMADURAS = [
  { nome: 'Acolchoada', categoria: 'leve', ca: 11, limiteDex: null },
  { nome: 'Couro', categoria: 'leve', ca: 11, limiteDex: null },
  { nome: 'Couro Batido', categoria: 'leve', ca: 12, limiteDex: null },
  { nome: 'Cota de Malha', categoria: 'media', ca: 13, limiteDex: 2 },
  { nome: 'Escamas', categoria: 'media', ca: 14, limiteDex: 2 },
  { nome: 'Couraça', categoria: 'media', ca: 14, limiteDex: 2 },
  { nome: 'Meia-placa', categoria: 'media', ca: 15, limiteDex: 2 },
  { nome: 'Cota de Anéis', categoria: 'pesada', ca: 14, limiteDex: 0 },
  { nome: 'Camisão de Malha', categoria: 'pesada', ca: 16, limiteDex: 0, forMinima: 13 },
  { nome: 'Armadura de Placas', categoria: 'pesada', ca: 18, limiteDex: 0, forMinima: 15 },
];

DADOS.ESCUDO = { nome: 'Escudo', bonusCa: 2 };
```

`forMinima` é só informativo (mostrado como aviso no resumo se a Força do personagem for menor) — não
bloqueia a escolha nem aplica penalidade de deslocamento, isso fica fora de escopo.

## 3. Pacotes de equipamento por classe

Cada classe oferece **2 pacotes** ("(a)" e "(b)"), adaptados dos pacotes reais do 5e para o catálogo de
armas acima. Jogador clica em um cartão e segue.

| Classe | Pacote A | Pacote B |
|---|---|---|
| Bárbaro | Espada Grande (2 mãos), sem armadura | Machado de Guerra + Escudo, sem armadura |
| Bardo | Rapieira + Armadura de Couro | Espada Longa + Armadura de Couro |
| Bruxo | Besta Leve + Armadura de Couro | Adaga + Adaga + Armadura de Couro |
| Clérigo | Maça Estrela + Escudo + Escamas | Besta Leve + Armadura de Couro |
| Druida | Cajado + Escudo + Armadura de Couro | Machadinha + Armadura de Couro |
| Feiticeiro | Besta Leve, sem armadura | Adaga + Adaga, sem armadura |
| Guerreiro | Cota de Malha + Espada Longa + Escudo | Couro Batido + Arco Longo |
| Ladino | Rapieira + Armadura de Couro | Adaga + Adaga + Armadura de Couro |
| Magista | Cajado, sem armadura | Adaga, sem armadura |
| Monge | Adaga, sem armadura | Clava, sem armadura |
| Paladino | Espada Longa + Escudo + Cota de Malha | Alabarda (2 mãos) + Cota de Malha |
| Patrulheiro | Arco Longo + Couro Batido | Adaga + Adaga + Couro Batido |

Estrutura de dados (`DADOS.PACOTES_EQUIPAMENTO`, chave = nome da classe):

```js
DADOS.PACOTES_EQUIPAMENTO = {
  Guerreiro: [
    { rotulo: 'Guerreiro corpo a corpo', armas: ['Espada Longa'], escudo: true, armadura: 'Cota de Malha' },
    { rotulo: 'Guerreiro à distância', armas: ['Arco Longo'], escudo: false, armadura: 'Couro Batido' },
  ],
  // ...demais 11 classes
};
```

## 4. UI da etapa Equipamento

1. Mostra os 2 pacotes da classe escolhida como cartões clicáveis (nome do pacote, arma(s), armadura,
   CA resultante já calculada como prévia).
2. Ao selecionar um pacote:
   - Para cada arma com propriedade `fineza`: aparece um seletor "Usar Força ou Destreza no ataque e
     dano?" (padrão: nenhum pré-selecionado, precisa escolher pra avançar).
   - Para cada arma com propriedade `versatil` **e** pacote sem escudo: aparece um toggle "Empunhar com
     duas mãos?" (troca `dano` por `danoVersatil` quando ligado). Se o pacote tem escudo, a arma é sempre
     empunhada com uma mão só (sem toggle).
3. `podeAvancar()` da etapa `equipamento` exige: pacote selecionado + escolha de atributo pra toda arma
   com fineza no pacote.

## 5. Cálculo de CA (`calculo.js`)

Nova função:

```js
function caArmadura(armadura, temEscudo, modDestreza) {
  if (!armadura) return 10 + modDestreza + (temEscudo ? 2 : 0);
  const dexAplicavel = armadura.limiteDex === null ? modDestreza : Math.min(modDestreza, armadura.limiteDex);
  return armadura.ca + dexAplicavel + (temEscudo ? 2 : 0);
}
```

`construirFichaFinal()` passa a chamar essa função em vez do `Calculo.caBase` atual.

## 6. Ficha JSON — novo campo `armas`

```json
"armas": [
  {
    "nome": "Espada Longa",
    "dano": "1d8",
    "tipoDano": "corte",
    "atributo": "forca",
    "bonusAcerto": 5,
    "modDano": 3
  }
]
```

`bonusAcerto` e `modDano` já vêm calculados (mesmo padrão de `bonusAtaqueForca` hoje) — o app de combate
não precisa saber de proficiência nem recalcular nada, só usar os números prontos.

## 7. Backend (.NET) — `Modelos.cs` / `ServicoPersonagens.cs`

```csharp
public record ArmaPersonagem(string Nome, string Dano, string TipoDano, int BonusAcerto, int ModDano);
```

Adiciona `List<ArmaPersonagem>? Armas = null` em `Personagem` e `ImportarPersonagemRequisicao`
(mesmo padrão opcional de `MagiasConhecidas`), com passthrough em `ServicoPersonagens.Importar`.

## 8. Combate — dano automático (`combate.js`)

`acoesDoJogador(personagem)` passa a gerar uma ação de ataque **por arma equipada** (`personagem.armas`),
no lugar das duas ações genéricas de Força/Destreza. Cada ação guarda o dado da arma num campo novo
`danoDados` (ex: `'1d8'`, vindo de `arma.dano` na ficha importada) — nome diferente do `dano` que as
ações de magia/monstro já usam, porque aquele é uma string fixa tipo `'3d6 veneno'` (mestre digita o
resultado manualmente) enquanto `danoDados` é rolado pelo próprio app. Fichas antigas sem o campo `armas`
(importadas antes dessa mudança) continuam funcionando com as duas ações genéricas como fallback.

Fluxo de ataque (`criarFluxoAtaque`) para ações com `danoDados` (armas, diferente de magias/monstros que
já têm dano fixo em string):

1. Mestre digita só o **d20 rolado** (like hoje).
2. Se acertar (total ≥ CA do alvo): o app rola automaticamente os dados de dano da arma
   (`Math.random`-based, mesma lógica nova em `combate.js`) + `modDano`, e preenche o campo de dano com
   o resultado — mostrando o detalhamento (ex: "Rolou 6 no d8 + 3 = 9 cortante").
3. **Crítico (d20 = 20 natural):** dobra a quantidade de dados rolados (não o modificador) — regra já
   documentada em `regras.json`.
4. O campo de dano continua editável e há um botão "🎲 Rolar de novo", pro mestre poder ajustar ou
   re-rolar manualmente quando quiser (item mágico não modelado, house rule, etc.).

Ações de magia e de monstro continuam exatamente como hoje (dano em string, mestre digita manualmente).

## Testes

- `calculo.test.js`: casos de `caArmadura` (sem armadura, leve, média com limite de Destreza, pesada sem
  Destreza, com/sem escudo).
- `dados.test.js`: `DADOS.ARMAS.length`, `DADOS.ARMADURAS.length`, presença de cada pacote por classe.
- Testes manuais via Playwright (como nas mudanças anteriores) cobrindo: escolha de pacote com fineza,
  escolha de pacote com versátil, resumo mostrando CA e armas corretas.
- Combate: verificar que crítico dobra dados (não o modificador) e que fichas antigas sem `armas` ainda
  funcionam com o fallback genérico.
