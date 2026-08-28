# Quadro de Quests + Campanhas + Histórico Persistido — Design

**Data:** 2026-08-28
**Status:** Aprovado para planejamento de implementação

## Contexto

O Plano 1 (fundação + navegador/rolador) está completo e em uso: o painel navega e rola o conteúdo do mundo "Costa da Travessia", mas não tem nenhum estado mutável persistido — o histórico de rolagens hoje vive só em memória no navegador (reseta a cada F5) e não existe quadro de quests.

Este é o Plano 2. Ele introduz o primeiro estado mutável do painel (quests da guilda) e, junto disso, resolve uma necessidade que surgiu durante o uso real: o usuário pode mestrar mais de um grupo/campanha, e cada um precisa ter seus próprios dados isolados (quests e histórico de rolagens; personagens e side quests entrarão nessa mesma partição em planos futuros).

## Objetivo

1. Introduzir o conceito de **Campanha** como partição de todos os dados mutáveis do painel.
2. Persistir o histórico de rolagens por campanha (hoje só em memória no frontend).
3. Implementar o Quadro de Quests da guilda: CRUD manual + atalho de geração de rascunho a partir das tabelas do mundo já existentes.
4. Adicionar um seletor de campanha na interface, com criação de novas campanhas.

## Escopo desta versão (Plano 2)

**Incluído:**
- Conceito de Campanha (criar, listar, selecionar) — sem edição/remoção de campanha nesta versão (não há necessidade real ainda; adiar até surgir).
- Persistência de quests da guilda e histórico de rolagens em arquivos JSON por campanha.
- CRUD de quests: criar, editar (incluindo mudar status), remover.
- Atalho "🎲 Gerar ideia de quest": sorteia aleatoriamente entre as tabelas **Fortaleza**, **Ruínas**, **Assentamento** e **Encontros Aleatórios** (usando a infraestrutura de rolagem já existente do Plano 1) e monta um rascunho de quest editável antes de salvar.
- Botão para limpar o histórico de rolagens da campanha ativa.
- Seletor de campanha na barra lateral, persistido em `localStorage` do navegador (lembra a última campanha usada).

**Fora do escopo (fica para depois):**
- Editar nome ou excluir uma campanha.
- Múltiplos usuários acessando a mesma campanha simultaneamente (o painel continua sendo uso exclusivo do mestre, local).
- Personagens e Side Quests (próximos planos — vão reutilizar a mesma partição por campanha introduzida aqui).
- Qualquer geração de conteúdo de quest além do sorteio nas 4 tabelas já existentes (não há uma "tabela de quests" dedicada).

## Convenção de Código

Mantém a convenção já estabelecida: nomes de classes, métodos, variáveis e endpoints em português.

## Arquitetura de Dados

Nenhum banco de dados — arquivos JSON simples, consistente com a escolha de manter o projeto sem dependências extras para um volume de dados pequeno (uso de um único mestre, poucas dezenas de quests, algumas centenas de rolagens por campanha).

```
data/
  campanhas/
    index.json              — lista leve de campanhas
    {id-da-campanha}.json   — estado completo daquela campanha
```

`index.json`:
```json
[
  { "id": "a1b2c3", "nome": "Grupo da Terça", "criadaEm": "2026-08-28T20:00:00Z" }
]
```

`{id}.json`:
```json
{
  "quests": [
    {
      "id": "q1",
      "titulo": "Matar o Rei Goblin",
      "descricao": "...",
      "recompensa": "50 PO",
      "xpSugerido": 450,
      "status": "disponivel",
      "semana": 1,
      "responsavel": null
    }
  ],
  "historicoRolagens": [
    { "descricao": "Condições: 4", "timestamp": "2026-08-28T20:05:00Z" }
  ]
}
```

`status` da quest: `disponivel` | `andamento` | `concluida` | `expirada`.

`historicoRolagens` é limitado a 200 entradas por campanha — ao ultrapassar, descarta as mais antigas. A barra lateral exibe só as ~15 mais recentes.

O `id` da campanha e das quests é gerado no backend (GUID curto ou similar) — não pelo cliente.

## API (ASP.NET Minimal API)

```
GET    /api/campanhas
POST   /api/campanhas                          { nome } → { id, nome, criadaEm }

GET    /api/campanhas/{id}/quests
POST   /api/campanhas/{id}/quests              { titulo, descricao, recompensa, xpSugerido, semana, responsavel }
PUT    /api/campanhas/{id}/quests/{questId}    corpo com os campos a atualizar (incluindo status)
DELETE /api/campanhas/{id}/quests/{questId}
POST   /api/campanhas/{id}/quests/gerar-ideia  → rascunho { tituloSugerido, descricaoSugerida } (não salva, só sugere)

GET    /api/campanhas/{id}/historico
POST   /api/campanhas/{id}/historico           { descricao } → registra com timestamp do servidor
DELETE /api/campanhas/{id}/historico
```

Todas as rotas de campanha inexistente retornam 404.

### Geração de rascunho de quest

`POST /api/campanhas/{id}/quests/gerar-ideia` sorteia aleatoriamente uma das 4 tabelas (Fortaleza, Ruínas, Assentamento, Encontros Aleatórios), rola nela usando o `ServicoRolagem` já existente, e monta um texto de rascunho simples combinando o nome da tabela e o texto da entrada rolada. Não salva nada — devolve o rascunho pro frontend preencher o formulário, que o usuário edita e confirma antes de criar a quest de fato (via `POST /api/campanhas/{id}/quests` normal).

## Interface

- **Seletor de campanha**: um `<select>` no topo da barra lateral, acima do campo de busca. Opção especial "+ Nova campanha…" abre um prompt simples pedindo o nome. Campanha ativa persiste em `localStorage` (`painel-ded-campanha-ativa`); se vazio ou inválido no carregamento, usa a primeira campanha da lista (ou força criação de uma se não houver nenhuma).
- **Item de navegação fixo** "📋 Quadro de Quests" na barra lateral (fora da árvore de conteúdo do mundo) — troca o conteúdo principal para a tela do mural.
- **Mural de quests**: colunas por status (Disponível / Em Andamento / Concluída / Expirada), cada quest como um cartão (título, descrição, recompensa, XP, semana, responsável, botões editar/mudar status/remover). Botão "+ Nova Quest" abre um formulário inline/modal. Botão "🎲 Gerar ideia" no mesmo formulário, preenchendo título/descrição sugeridos que o usuário pode ajustar antes de salvar.
- **Histórico de rolagens** (barra lateral): passa a carregar da API ao trocar de campanha ou ao carregar a página, e cada nova rolagem tanto atualiza a lista local quanto persiste via `POST /api/campanhas/{id}/historico`. Ganha um botão 🗑️ "Limpar histórico" com confirmação simples (`window.confirm`).

## Testes / Verificação

- Testes unitários para o repositório de campanhas/estado (criar, ler, listar, persistir quests e histórico, limite de 200 rolagens).
- Testes de integração para os endpoints (criar campanha, CRUD de quests, gerar-ideia, histórico).
- Teste manual do fluxo completo: criar campanha → criar quest manual → gerar ideia de quest → mudar status → rolar uma tabela e ver aparecer no histórico → limpar histórico → trocar de campanha e confirmar isolamento dos dados.

## Riscos / Pontos em Aberto

- **Concorrência de escrita em arquivo**: como é uso local de um único processo/usuário, não há necessidade de lock sofisticado — escritas são sequenciais (requisição HTTP por vez em uso normal). Se dois requests simultâneos ocorrerem (improvável nesse uso), a última escrita vence; aceitável para este contexto.
- **Migração implícita**: como não existia nenhuma campanha antes desta versão, o primeiro uso após esta atualização precisa criar a campanha inicial — a interface deve tratar bem o caso de `index.json` vazio/inexistente (força a criação da primeira campanha antes de liberar o resto do painel).
