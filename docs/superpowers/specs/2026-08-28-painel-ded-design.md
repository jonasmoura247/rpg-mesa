# Painel D&D — Costa da Travessia — Design

**Data:** 2026-08-28
**Status:** Aprovado para planejamento de implementação

## Contexto

O usuário vai mestrar sua primeira campanha de D&D 5e, ambientada em "Costa da Travessia" — um mundo próprio já documentado em um vault Obsidian com 63 notas Markdown organizadas (tabelas de hexcrawl, glossário, regras do jogo adaptadas do 5e, e fichas de monstros) mais 3 arquivos gigantes de livros convertidos de PDF (Jogador, Mestre, Monstros — fora do escopo desta v1).

A campanha será jogada via Roll20 (mestre e jogadores), com este painel rodando **local, só para o mestre**, em paralelo, como ferramenta de apoio para navegar o conteúdo do mundo, rolar tabelas rapidamente durante a sessão, gerenciar um quadro de quests da guilda, atribuir side quests pessoais de roleplay ligadas às perícias dos personagens, e acompanhar XP/nível de cada jogador.

## Objetivo

Construir uma aplicação web local (C# + JavaScript) que:
1. Disponibilize todo o conteúdo das 63 notas organizadas do vault, navegável e com tabelas roláveis com um clique.
2. Gerencie um quadro de quests da guilda (CRUD manual, com atalho de geração de ideia a partir das tabelas do mundo).
3. Ofereça 360 side quests pessoais pré-escritas (20 por perícia × 18 perícias do 5e), sorteáveis por personagem.
4. Rastreie personagens, XP e nível, com level-up automático.
5. Forneça um criador de ficha de personagem standalone (sem servidor), validando Point Buy (27 pontos) e regras de perícia por classe do 5e, exportando um arquivo `.json` importável no painel.

## Escopo desta v1

**Incluído:**
- Ingestão das 63 notas organizadas (excluindo os 3 livros brutos) em conteúdo estruturado.
- Navegação em árvore + roladores inline em todas as tabelas de dados (1d6/1d20/1d100).
- Resolução inline de wikilinks (`[[...]]`) ao rolar — expande a ficha referenciada sem trocar de página.
- Quadro de quests da guilda (CRUD simples + atalho "gerar ideia" a partir das tabelas existentes).
- 18 tabelas de 20 side quests cada (conteúdo a ser escrito como parte da implementação), sorteio 1d20 por perícia, atribuição a personagem, conclusão com XP bônus (faixa 10–25 XP).
- Cadastro/importação de personagens, com XP acumulado e level-up automático (tabela de XP de `10-Regras-do-Mestre.md`).
- Criador de ficha standalone (HTML/JS puro, sem backend) com Point Buy 27 pontos, raças do SRD 5e básico, classes de `07-Classes.md` com listas de perícias elegíveis por classe (conteúdo do SRD 5e a ser adicionado, pois não existe nas notas atuais), cálculo de HP/CA inicial, exportação em `.json`.
- Importação desse `.json` no painel principal.

**Fora do escopo (documentado para uma v2 futura):**
- Os 3 livros brutos convertidos de PDF (Jogador, Mestre, Monstros) como conteúdo navegável/rolável.
- Acesso de jogadores ao painel (é ferramenta exclusiva do mestre).
- Sincronização multiplayer/tempo real.
- Ficha de personagem completa (talentos, equipamento inicial detalhado, magias, multiclasse) — o criador cobre o essencial para nível 1 jogável.
- Geração automática de conteúdo de quests da guilda (fica manual + atalho de sorteio nas tabelas existentes, sem tabela dedicada de "quests da guilda").

## Convenção de Código

Nomes de classes, métodos, variáveis e endpoints (tanto no backend C# quanto no frontend JavaScript) devem ser em **português** (ex: `RolarTabela`, `CalcularNivel`, `ImportarPersonagem`, `/api/personagens`), mantendo consistência com o domínio (D&D, Costa da Travessia) e as notas do vault. Nomes de bibliotecas/frameworks e palavras-chave da linguagem permanecem no idioma original.

## Stack Técnica

- **Backend:** C# / ASP.NET Core (Minimal API). Serve a API REST local e os arquivos estáticos do frontend. Executado via `dotnet run`.
- **Frontend:** HTML + CSS + JavaScript puro (sem framework), para simplicidade de manutenção e zero build step.
- **Banco de dados:** SQLite (arquivo local `painel.db`), acessado via `Microsoft.Data.Sqlite` ou EF Core (decisão de implementação).
- **Conteúdo do mundo:** convertido **uma única vez** por um script de ingestão (C# console app ou script dedicado) das 63 notas Markdown para arquivos JSON estruturados versionados em `content/`. O script deve falhar de forma visível (erro explícito) se encontrar um arquivo do vault que não conseguir processar — garantindo que nada fique de fora silenciosamente. Reexecutável sempre que as notas originais mudarem.

## Arquitetura de Conteúdo

### Ingestão (uma vez, ou sob demanda)
Um conversor lê os 63 arquivos `.md` de `Costa da Travessia/`, `glossario/`, `regras-do-jogo/`, `monstros/` e produz:

- `content/mundo.json` — os 16 capítulos do universo, com suas tabelas estruturadas.
- `content/glossario.json` — verbetes de estruturas, raças, criaturas, paisagens.
- `content/regras.json` — os 10 arquivos de regras.
- `content/monstros.json` — as 8 categorias de monstros + índice por CR.

Cada tabela Markdown (`| Roll | Resultado |`) vira uma estrutura:
```json
{
  "dado": "1d20",
  "titulo": "Tipo de Assentamento",
  "entradas": [
    { "faixa": [1, 8], "texto": "Lugarejo", "links": [] },
    { "faixa": [9, 10], "texto": "Acampamento...", "links": [{"label": "restinga", "target": "glossario/paisagens/restinga"}] }
  ]
}
```

Wikilinks (`[[caminho|label]]`) viram entradas `links` resolvidas para IDs de conteúdo navegável internamente.

Conteúdo adicional a ser criado (não vem do vault, é SRD 5e / autoral):
- `content/sidequests.json` — 18 perícias × 20 side quests cada.
- `content/classes-5e.json` — as 12 classes com lista de perícias elegíveis e quantidade de escolhas.
- `content/racas-5e.json` — raças do SRD básico com bônus de atributo.
- `content/point-buy.json` — tabela de custo de Point Buy (8 a 15).

### Runtime
O backend carrega esses JSONs em memória na inicialização e os expõe via API. Não há parsing de Markdown em tempo de execução.

## Modelo de Dados (SQLite)

- `personagens` (id, nome, classe, raca, nivel, xp_atual)
- `personagem_pericias` (personagem_id, pericia)
- `sidequests_atribuidas` (id, personagem_id, pericia, roll, status [ativa/concluida], xp_concedido, data)
- `quests_guilda` (id, titulo, descricao, recompensa, xp_sugerido, status [disponivel/andamento/concluida/expirada], semana, responsavel)
- `historico_rolagens` (id, tipo, tabela_id, resultado, timestamp)

## API (ASP.NET Minimal API)

- `GET /api/conteudo/{secao}` — árvore/conteúdo de uma seção (mundo, glossario, regras, monstros)
- `POST /api/rolar/tabela/{id}` — rola uma tabela, resolve links, grava no histórico
- `GET /api/quests` / `POST /api/quests` / `PUT /api/quests/{id}` — quadro da guilda
- `POST /api/quests/gerar-ideia` — sorteia em tabelas existentes (Fortaleza/Ruínas/Assentamento/Encontros) e monta rascunho
- `GET/POST /api/personagens` — lista/cria personagens
- `POST /api/personagens/importar` — recebe `character.json` do criador standalone
- `GET /api/personagens/{id}/sidequest/{pericia}` — rola 1d20 na tabela da perícia
- `POST /api/personagens/{id}/sidequest/{sidequestId}/concluir` — marca concluída, credita XP, recalcula nível
- `POST /api/personagens/{id}/xp` — adiciona XP manual (ex: combate), recalcula nível

## UX — Princípios de Interface

- Barra lateral espelha exatamente a estrutura de pastas do vault (Mundo / Glossário / Regras / Monstros / Quests / Personagens) — sem reorganização.
- Toda tabela de rolagem tem um botão **🎲 Rolar** visível junto ao título.
- Resultado de rolagem: número em destaque, linha da tabela realçada, conteúdo linkado expandido inline (sem navegação/modal bloqueante).
- Histórico de últimas rolagens sempre visível na lateral.
- Tipografia grande, alto contraste, poucas cores — otimizado para leitura rápida durante a sessão, não estética de portfólio.
- Level-up dispara um destaque visual (ex: "🎉 Fulano subiu para o nível 3!").

## Criador de Ficha Standalone (`/creator`)

Página HTML/JS autocontida, sem dependência do backend, distribuível como arquivo único (ou pasta pequena) para os jogadores abrirem localmente.

Fluxo:
1. **Atributos:** Point Buy de 27 pontos, contador em tempo real, trava de mínimo/máximo (8–15 antes de bônus racial).
2. **Raça:** lista do SRD 5e básico, aplica bônus de atributo automaticamente.
3. **Classe:** lista de `07-Classes.md`, com perícias elegíveis e limite de escolhas por classe (dado novo, do SRD).
4. **Nível 1:** calcula HP inicial (dado de vida máximo + mod. CON) e CA base.
5. **Exportação:** botão "Baixar minha ficha" gera `character.json` com nome, raça, classe, atributos finais, perícias escolhidas, HP, CA.

O jogador envia esse arquivo de volta ao mestre (por qualquer canal), que importa via `POST /api/personagens/importar`.

## Testes / Verificação

Dado o porte solo/local do projeto, o nível de testes será pragmático:
- Testes unitários no backend para: parser de tabelas Markdown → JSON, cálculo de XP/nível, validação de Point Buy, cálculo de perícias por classe.
- Teste manual do fluxo completo: importar ficha → rolar side quest → concluir → conferir XP e nível.
- Verificação de completude: o script de ingestão deve reportar contagem de arquivos processados e falhar se algum dos 63 não for reconhecido.

## Riscos / Pontos em Aberto

- **Parsing de tabelas Markdown heterogêneas:** as notas têm variações de formatação (alguns arquivos usam espaçamento de tabela diferente — ver `05-Ruinas.md`). O parser precisa tolerar essas variações ou normalizá-las no pré-processamento.
- **Conteúdo SRD 5e a ser adicionado** (perícias por classe, raças, custo de Point Buy) não existe nas notas atuais — será conteúdo novo escrito durante a implementação, não extraído do vault.
- **360 side quests** são um volume de conteúdo autoral significativo — serão escritas como parte da implementação, não geradas automaticamente.
