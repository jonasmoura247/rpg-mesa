# Desafios da Guilda — Design

## Objetivo

Dar ao mestre um jeito rápido de sortear 3 desafios de guilda (bounties) por vez, prontos pra virar quests no Quadro de Quests já existente, com recompensa em PO e XP escalada pela dificuldade do desafio.

## Escopo

Essa é a primeira de três telas planejadas (Desafios da Guilda → Side Quests pessoais → Combate Jogador × Monstro). Este documento cobre só a primeira.

**Uma guilda por campanha.** A campanha inteira representa a cidade/guilda atual — não existe conceito de "cidade" ou "guilda" como entidade no sistema. Se os jogadores mudarem de cidade no futuro, isso é decisão narrativa do mestre, sem impacto no sistema.

**Sem campo novo em `Quest`.** Os desafios sorteados viram quests normais — mesmo modelo, mesma tela, mesmo fluxo de edição/status que já existe hoje.

## Arquitetura

Reaproveita a infraestrutura existente do "Gerar Ideia" (`ServicoGeradorIdeiaQuest`, `RascunhoQuest`, `IDado`, `RepositorioConteudo`) em vez de criar um sistema paralelo.

### `content/guilda/desafios-guilda.json` (novo arquivo, em subpasta)

**Importante:** `RepositorioConteudo.CarregarDePasta` varre `*.json` direto dentro de `content/` (não recursivo) esperando o formato `SecaoConteudo` (`mundo.json`, `glossario.json` etc). Colocar o arquivo direto em `content/` quebraria a inicialização do app. Por isso vai numa subpasta `content/guilda/`, fora do alcance desse scan.

Banco de ~100 desafios curados, autorados nesta fase (mistura de buscar/recuperar item, matar/capturar alvo, escoltar, investigar — no estilo dos exemplos do mestre: "Encontrar a Ruína das Bruxas", "Trazer a cabeça do Rei Goblin", "Roubar o machado do Orc X"):

```json
[
  { "titulo": "Encontrar a Ruína das Bruxas", "descricao": "A guilda quer um relatório sobre uma ruína que ninguém mapeou ainda, ao norte da estrada velha.", "dificuldade": "media" }
]
```

Três dificuldades: `facil`, `media`, `dificil`.

### `DesafioGuilda` (novo record, `Modelos.cs`)

```csharp
public record DesafioGuilda(string Titulo, string Descricao, string Dificuldade);
```

### `RepositorioDesafiosGuilda` (novo, `Campanhas/`)

Carrega `content/desafios-guilda.json` uma vez na inicialização (mesmo padrão de `RepositorioConteudo.CarregarDePasta`, mas mais simples — é uma lista plana, sem seções/notas/tabelas).

```csharp
public class RepositorioDesafiosGuilda
{
    private readonly List<DesafioGuilda> _desafios;
    public static RepositorioDesafiosGuilda CarregarDeArquivo(string caminhoArquivo) { ... }
    // caminhoArquivo = Path.Combine(LocalizadorConteudo.Localizar(contentRootPath), "guilda", "desafios-guilda.json")
    public IReadOnlyList<DesafioGuilda> Todos => _desafios;
}
```

### `ServicoGeradorDesafiosGuilda` (novo, `Campanhas/`)

```csharp
public class ServicoGeradorDesafiosGuilda
{
    public List<RascunhoQuest> SortearTres();
}
```

- Sorteia 3 índices distintos do banco (sem repetir), usando `IDado` (mesma abstração testável já usada por `ServicoGeradorIdeiaQuest` — permite mockar em teste pra sortear índices determinísticos).
- Para cada desafio sorteado, rola XP e PO dentro da faixa da dificuldade:

| Dificuldade | XP | Fórmula | PO | Fórmula |
|---|---|---|---|---|
| Fácil | 10–60 | `1d6 * 10` | 5–50 | `1d10 * 5` |
| Média | 20–200 | `1d10 * 20` | 15–150 | `1d10 * 15` |
| Difícil | 140–500 | `1d10 * 40 + 100` | 75–300 | `1d10 * 25 + 50` |

- Retorna `List<RascunhoQuest>` com 3 itens — reaproveita o record que já existe, sem precisar de um tipo novo pro frontend.

### Endpoint (`Program.cs`)

```
POST /api/campanhas/{campanhaId}/quests/sortear-desafios-guilda
→ 200 List<RascunhoQuest> (3 itens)
```

Mesmo formato de resposta do endpoint `gerar-ideia` existente, só que em lista.

### Frontend (`api.js`, `quests.js`)

- `Api.sortearDesafiosGuilda(campanhaId)` — mesmo padrão de `Api.gerarIdeiaDeQuest`.
- Botão **"🎲 Sortear Desafios da Guilda"** ao lado do botão "Gerar Ideia" existente no Quadro de Quests.
- Ao clicar, renderiza **3 cards de rascunho editáveis** (título, descrição, XP, recompensa pré-preenchidos), cada um com botões independentes:
  - **Salvar** → confirma aquele card como quest real (mesma chamada que já existe pra criar quest a partir de um rascunho editado).
  - **Descartar** → remove só aquele card, sem afetar os outros dois.
- Os 3 cards não têm nenhum estado compartilhado entre si — editar/salvar/descartar um não afeta os outros.

## Fluxo de dados ponta a ponta

`content/guilda/desafios-guilda.json` (banco fixo) → `RepositorioDesafiosGuilda` (carrega uma vez) → `ServicoGeradorDesafiosGuilda.SortearTres()` (sorteia 3 sem repetir + rola XP/PO por dificuldade) → endpoint retorna 3 `RascunhoQuest` → frontend renderiza 3 cards editáveis → mestre edita/salva/descarta cada um → quests salvas viram entradas normais no Quadro de Quests (via fluxo de criação de quest já existente).

## Testes

- `RepositorioDesafiosGuildaTestes.cs`: carrega o JSON de verdade e confirma que tem ~100 entradas, todas com dificuldade válida (`facil`/`media`/`dificil`).
- `ServicoGeradorDesafiosGuildaTestes.cs`: com `IDado` mockado — sorteia 3 índices distintos (nunca repete); XP/PO calculados batem com a fórmula da dificuldade sorteada; sortear mais vezes que o banco tem itens não trava nem repete além do necessário.
- Frontend: sem framework de teste automatizado nesse lado (mesmo padrão do `quests.js` atual) — verificação manual/Playwright do fluxo de 3 cards.

## Fora de escopo (explicitamente adiado)

- Conceito de cidade/guilda como entidade rastreável no sistema.
- Side Quests pessoais (próxima tela a ser desenhada).
- Tela de Combate Jogador × Monstro (terceira tela a ser desenhada).
- Edição do banco de 100 desafios pela UI (é um arquivo de conteúdo, editado manualmente como os outros arquivos de `content/`).
