# Side Quests Pessoais — Design

## Objetivo

Dar ao mestre um jeito rápido de sortear uma missão pessoal simples e cotidiana pra um personagem específico antes da sessão, entregar em segredo (fora do sistema — o mestre só conta pro jogador certo), e marcar como concluída ou descartada depois da sessão, sem afetar a trama principal.

## Escopo

Essa é a segunda de três telas planejadas (guilda → side quests → combate, sendo guilda e combate já implementados). Este documento cobre a segunda.

**Uma side quest ativa por personagem.** Só dá pra sortear uma nova quando a atual estiver `concluida` ou `descartada`. Sem lista de histórico — o registro é só o estado atual.

**Sem rastreio de XP acumulado.** `xpSugerido` é só informativo — o mestre aplica a recompensa de cabeça, fora do sistema, do jeito que o resto do painel já funciona (nível sempre 1, sem XP persistido em nenhum lugar).

**Segredo é responsabilidade do mestre, não do sistema.** Não existe view separada pra jogador nem controle de acesso — o mestre é o único que abre o painel, então a "entrega em segredo" acontece naturalmente: ele lê o que saiu na tela e conta pro jogador por fora (voz, mensagem, etc), sem o sistema precisar esconder nada de ninguém.

## Arquitetura

Segue o padrão já estabelecido (guilda): banco de conteúdo fixo carregado na inicialização, sorteio via `IDado`, sem lógica de regra escondida.

### `content/side-quests/catalogo.json` (novo arquivo, subpasta)

Mesmo motivo de `content/guilda/`: `RepositorioConteudo.CarregarDePasta` varre `*.json` direto em `content/` esperando outro formato — subpasta evita colisão.

Array de ~100 itens simples:
```json
{ "titulo": "Pescar um peixe", "descricao": "Consiga pescar (ou comprar, ou roubar) um peixe fresco e entregue a alguém que pediu." }
```

Sem campo de dificuldade — todas as entradas são igualmente pequenas/cotidianas (diferente do banco de desafios da guilda).

### `SideQuestPersonagem` (novo record em `Modelos.cs`)

```csharp
public record SideQuestPersonagem(string Titulo, string Descricao, int XpSugerido, string Status);
```

`Status` é `"pendente"`, `"concluida"` ou `"descartada"` (string livre, mesmo padrão de `DesafioGuilda.Dificuldade`).

Campo novo, só em `Personagem` (não em `ImportarPersonagemRequisicao` — o creator/import nunca produz isso, é atribuído e gerenciado inteiramente pelo backend depois que o personagem já existe na campanha), como último parâmetro (trailing opcional, retrocompatível):
```csharp
SideQuestPersonagem? SideQuestAtual = null
```

### `RepositorioSideQuests` (novo, `Campanhas/`)

Mesmo padrão de `RepositorioDesafiosGuilda`: carrega `content/side-quests/catalogo.json` uma vez na inicialização, expõe `IReadOnlyList<SideQuestCatalogo> Todos` (um record simples só com `Titulo`/`Descricao`, sem XP nem status — esses são calculados/atribuídos só no momento do sorteio).

### `ServicoPersonagens` (modificado)

O construtor ganha duas dependências novas (`RepositorioSideQuests` e `IDado`, ambos já registrados no container de DI por outras features — `AddSingleton<ServicoPersonagens>()` no `Program.cs` resolve isso automaticamente, sem precisar editar a linha de registro).

Dois métodos novos:

```csharp
public Personagem? SortearSideQuest(string campanhaId, string personagemId)
```
Sorteia um item aleatório do catálogo (via `IDado`), calcula `xpSugerido` (faixa pequena fixa, ex: `1d6 * 5`, resultando 5-30), monta um `SideQuestPersonagem` com `Status = "pendente"`, salva no personagem, retorna a ficha atualizada. Retorna `null` se campanha ou personagem não existir.

```csharp
public Personagem? AtualizarStatusSideQuest(string campanhaId, string personagemId, string novoStatus)
```
Atualiza só o `Status` da `SideQuestAtual` existente (`"concluida"` ou `"descartada"`), sem mexer em título/descrição/XP. Retorna `null` se não existir campanha/personagem/side quest ativa.

### Endpoints (`Program.cs`)

```
POST /api/campanhas/{campanhaId}/personagens/{personagemId}/side-quest/sortear
→ 200 Personagem atualizado | 404

PUT /api/campanhas/{campanhaId}/personagens/{personagemId}/side-quest/status
Body: { "status": "concluida" | "descartada" }
→ 200 Personagem atualizado | 404
```

### Frontend (`personagens.js`)

Na ficha de cada personagem (`exibirDetalhe`), nova seção "Side Quest":
- Se `personagem.sideQuestAtual` é nulo ou `status !== "pendente"`: mostra botão "🎲 Sortear Side Quest" que chama o endpoint de sorteio e recarrega a ficha.
- Se `status === "pendente"`: mostra título (negrito) + descrição + XP sugerido, com dois botões — "✅ Concluída" e "❌ Descartar" — cada um chamando o endpoint de status com o valor certo e recarregando a ficha.

## Fluxo de dados ponta a ponta

`content/side-quests/catalogo.json` (banco fixo, ~100 itens) → `RepositorioSideQuests` → `ServicoPersonagens.SortearSideQuest` (sorteia + calcula XP + salva na ficha) → frontend exibe na seção "Side Quest" da ficha → mestre marca concluída/descartada → `ServicoPersonagens.AtualizarStatusSideQuest` → próxima vez que quiser, sorteia de novo (substitui a anterior).

## Testes

- `RepositorioSideQuestsTestes.cs`: carrega o banco real, confirma ~100 itens com título/descrição não-vazios.
- `ServicoPersonagensTestes.cs` (extensão): `SortearSideQuest` com `IDado` mockado atribui título/descrição corretos do catálogo e XP na fórmula certa, com `status: "pendente"`; `AtualizarStatusSideQuest` muda só o status, preservando título/descrição/XP; ambos retornam `null` pra campanha/personagem inexistente; `AtualizarStatusSideQuest` retorna `null` se não há side quest ativa.
- `ModelosTestes.cs` (extensão): round-trip de `SideQuestPersonagem`/`Personagem.SideQuestAtual`, e regressão de JSON antigo sem o campo (deserializa pra `null`).
- Frontend: sem framework de teste automatizado (mesmo padrão do resto do painel) — verificação manual/Playwright do fluxo sortear → concluir/descartar → sortear de novo.

## Fora de escopo (explicitamente adiado)

- Histórico de side quests já concluídas/descartadas (só o estado atual é guardado).
- Rastreio de XP acumulado ou sistema de nível.
- Qualquer view separada pra jogador (o sistema é 100% voltado pro mestre, como o resto do painel).
- Dificuldade/tiers no banco de side quests (todas são igualmente pequenas).
