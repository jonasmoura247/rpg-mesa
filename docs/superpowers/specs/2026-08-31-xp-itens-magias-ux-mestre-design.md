# XP, Itens de Aventura, Uso de Magias e Redesign da Tela do Mestre

Data: 2026-08-31

## Contexto

Depois da feature de Equipamento (spec anterior), surgiram 4 pedidos relacionados, todos girando em torno
da tela **Jogadores** do painel do mestre (`src/PainelDed.Api/wwwroot`) e do Resumo do criador
(`docs/creator`):

1. **XP** — hoje não existe rastreamento de experiência na ficha. O mestre quer acompanhar o XP do
   personagem, subindo manualmente (recompensa livre) e automaticamente (vencer um combate, concluir uma
   side quest), com uma barra de progresso até o próximo nível.
2. **Itens de aventura** — corda, tocha etc. não aparecem em lugar nenhum, embora a tabela já exista em
   `content/regras.json`.
3. **Uso de magias** — não fica claro quantas vezes cada magia pode ser usada. Fiel ao 5e: cantrips são
   ilimitados, magias de 1º círculo são limitadas por espaços que recarregam no descanso longo. Isso
   também precisa ficar **mais destacado na tela de criação**, onde hoje cantrips e magias de 1º círculo
   se misturam visualmente.
4. **Redesign da tela do mestre** — a ficha do jogador (`Personagens.exibirDetalhe`) virou uma lista longa
   sem agrupamento visual claro. Reorganizar em seções com ícone, no mesmo estilo (cartão com borda) que a
   Side Quest já usa hoje.

## 1. XP — modelo de dados e regras

### Tabelas de referência (novo módulo `src/PainelDed.Api/wwwroot/js/experiencia.js`)

Dados oficiais do 5e, mesmo padrão dual-export de `dado.js`:

```js
const XP_POR_CD = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450,
  '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
};
const XP_PARA_NIVEL = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000]; // índice = nível - 1

function xpPorCd(cd) { return XP_POR_CD[cd] ?? 0; }
function xpNivelAtual(nivel) { return XP_PARA_NIVEL[nivel - 1] ?? 0; }
function xpProximoNivel(nivel) { return XP_PARA_NIVEL[nivel] ?? null; } // null = nível 10, sem próximo na tabela
```

Carregado antes de `combate.js` e `personagens.js` em `index.html` (mesmo padrão de `dado.js`).

### Backend

- `Personagem` ganha `int Xp = 0` (último parâmetro, mesmo padrão de `Armas`).
- **`Xp` não entra em `ImportarPersonagemRequisicao`** — reimportar uma ficha (mesmo nome) não pode
  zerar o XP já ganho. `ServicoPersonagens.Importar` preserva `Xp: existente?.Xp ?? 0` (igual já faz hoje
  com `SideQuestAtual`).
- Novo endpoint `POST /api/campanhas/{campanhaId}/personagens/{personagemId}/xp/adicionar`, body
  `AdicionarXpRequisicao(int Quantidade, string Motivo = "")`. Soma `Quantidade` ao `Xp` do personagem,
  salva, registra uma linha no histórico da campanha (reaproveitando `ServicoHistorico`, já injetado via
  DI) — ex: `"Kess Bramo ganhou 100 XP (venceu Rato)"` — e retorna o personagem atualizado.
- `AtualizarStatusSideQuest`: quando o novo status é `"concluida"`, além de atualizar o status, chama
  internamente a mesma lógica de somar XP com `motivo = "side quest: {titulo}"` usando o `XpSugerido` da
  side quest.

### Combate (gatilho automático #1)

Quando o jogador vence (`combatente === this.estado.monstro` chega a 0 PV em `aplicarDano`), o app calcula
`Experiencia.xpPorCd(this.estado.monstro.cd)` e chama `Api.adicionarXp(...)` sozinho, sem o mestre precisar
fazer nada. O banner de vitória passa a mostrar `+{xp} XP`. Precisa guardar `personagem.id` e `monstro.cd`
no `estado` do combate (hoje não são guardados) e um flag `xpConcedido` pra não conceder duas vezes se o
mestre clicar em algo depois do combate acabar.

### Tela do mestre (gatilho automático #2 já coberto acima + manual)

- Barra de progresso (mesmo componente visual da barra de PV, `.barra-vida`/`.preenchimento-vida`, só que
  com uma variante `.barra-xp`) logo abaixo dos destaques de PV/CA: `XP: 350/900 (nível 3)`.
- Quando `personagem.xp >= Experiencia.xpProximoNivel(personagem.nivel)`, mostra um aviso destacado
  "🎉 Pronto pra subir de nível!" (subir de nível continua manual — o app só avisa).
- Controle manual: campo numérico + botão "Adicionar XP" na própria ficha, chama o mesmo endpoint com
  `motivo = "manual (mestre)"`.
- O cartão de cada personagem na lista lateral (`criarCartaoLista`) ganha um selo pequeno
  `Nível {n} · {xp} XP`.

## 2. Itens de aventura

Kit fixo — sem escolha, informativo — igual pra todo personagem, tirado da tabela "Itens de Aventura" já
existente em `content/regras.json`:

```js
// docs/creator/js/dados.js
const KIT_AVENTUREIRO = [
  'Corda de Cânhamo (15m)',
  'Kit de Curandeiro',
  'Rações de Viagem (3 dias)',
  'Tocha (2)',
];
```

- `construirFichaFinal()` (criador) inclui `itens: DADOS.KIT_AVENTUREIRO.slice()` no retorno.
- Resumo do criador ganha uma seção "🎒 Itens" com a lista.
- Backend: `Personagem` e `ImportarPersonagemRequisicao` ganham `List<string>? Itens = null` (mesmo padrão
  de `Armas` — este SIM entra no import, porque vem da ficha, não é estado acumulado como XP).
- Tela do mestre ganha seção "🎒 Itens" mostrando `personagem.itens`.

## 3. Uso de magias — badges + destaque visual de cantrips

### Cálculo (criador)

`construirFichaFinal()` passa a calcular e exportar `espacosMagia1`:

```js
const espacosMagia1 = classe.magias ? Calculo.quantidadeMagiasNivel1(classe.magias, modConjuracao) : null;
```

(`modConjuracao` já é calculado nessa função quando a classe conjura — reaproveita, não recalcula do zero.)

- Backend: `Personagem` e `ImportarPersonagemRequisicao` ganham `int? EspacosMagia1 = null`.

### Exibição (criador — Resumo — e tela do mestre)

Cada magia ganha um selo (pill), reaproveitando as cores já usadas nos cartões de pacote selecionados
(`--cor-destaque` de fundo, `--cor-texto-sobre-destaque` de texto — sem inventar cor nova):

- Círculo 0 (cantrip): selo **"Uso ilimitado"**.
- Círculo 1: selo **"{espacosMagia1} usos — descanso longo"**.

No Resumo do criador, a lista de magias deixa de ser um bloco único (`blocoMagias` hoje mistura tudo com
sufixo de texto "(Cantrip)"/"(1º Círculo)") e passa a ter **dois subtítulos separados** — "Cantrips" e
"Magias de 1º Círculo" — igual ao padrão que a própria etapa Magias já usa (`renderizarLista` em
`renderEtapaMagias`). Isso resolve diretamente o problema relatado ("não dá pra ver direito as cantrips").

Na tela do mestre, a seção "✨ Magias" (já existe, já separa Cantrips/1º Círculo) ganha o mesmo selo por
magia.

## 4. Redesign da tela do mestre (`personagens.js` + `estilo.css`)

Sem inventar linguagem visual nova — generaliza o padrão que a Side Quest já usa (`.side-quest-ficha`:
cartão com borda) para as outras seções via uma classe `.secao-ficha`, e adiciona ícone no título de cada
uma:

| Seção | Ícone |
|---|---|
| Combate | 🛡️ |
| Testes de Resistência | 🎲 |
| Traços Raciais | 🧬 |
| Habilidades de Classe | ⚔️ |
| Magias | ✨ |
| Itens | 🎒 |
| Side Quest | 📜 (já existe, só ganha ícone no título) |
| História | 📖 |
| Características Físicas | 👤 |

A barra de XP fica no topo, logo abaixo do PV/CA (é a informação que o mestre mais quer acompanhar ao
vivo). O restante da ordem das seções não muda.

## Fora de escopo

- Auto-aplicar o level-up na ficha (recalcular PV, ataques, etc. quando o XP passa do limite) — fica só o
  aviso visual, a aplicação continua manual.
- Escolha de itens de aventura (kit é fixo, sem picker).
- XP por completar Quest do quadro principal (`Quadro de Quests`) — quest não é vinculada a um personagem
  específico no modelo atual, só side quests pessoais e combate concedem XP automaticamente.

## Testes

- `experiencia.test.js`: `xpPorCd` para cada CD da tabela + CD desconhecido (retorna 0); `xpNivelAtual` e
  `xpProximoNivel` para os níveis 1, 5, 10 (nível 10 retorna `null` no próximo).
- Backend (xUnit): serialização de `Xp`/`Itens`/`EspacosMagia1` (com/sem, igual ao padrão de
  `MagiasConhecidas`); `ImportarPersonagem` duas vezes seguidas com XP ganho no meio não zera o XP; XP
  automático ao marcar side quest como concluída; endpoint de adicionar XP soma corretamente e aparece no
  histórico.
- Manual (Playwright): combate até vencer um monstro CD 0 → XP sobe +10 automaticamente e aparece no
  banner; marcar side quest concluída → XP sobe pelo `XpSugerido`; botão manual de XP funciona; Resumo do
  criador mostra Cantrips e 1º Círculo em blocos separados com os selos corretos; tela do mestre mostra
  itens, XP e seções com ícone.
