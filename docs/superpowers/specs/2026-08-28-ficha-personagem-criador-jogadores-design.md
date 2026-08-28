# Ficha de Personagem: Criador, Importação e Aba Jogadores — Design

**Data:** 2026-08-28
**Status:** Aprovado para planejamento de implementação
**Relação com specs anteriores:** detalha e substitui a seção "Criador de Ficha Standalone (`/creator`)" do spec original (`2026-08-28-painel-ded-design.md`), que ficou apenas esboçada.

## Contexto

O spec original já previa um criador de ficha standalone e importação no painel, mas sem detalhar hospedagem, modelo de dados completo da ficha ou como o mestre consulta essas fichas durante a sessão. O usuário quer:

1. Uma página que os 3 jogadores preencham no próprio celular (iPhone/Android) ou PC, sem instalar nada.
2. Um botão que gera um `character.json` que o jogador manda de volta.
3. Importar esse JSON no painel principal.
4. Uma aba "Jogadores" no painel para consultar rapidamente, durante a sessão, o que cada personagem precisa rolar (perícias, PV, CA).

## Objetivo

1. Publicar o criador de ficha (`/creator`) como página estática hospedada via GitHub Pages a partir do próprio repositório `painel-ded`, com link único para compartilhar.
2. Restringir o criador ao conteúdo correto do SRD 5e básico e a nível 1: raças com bônus de atributo certos, classes com perícias elegíveis e quantidade de escolhas certas, Point Buy de 27 pontos com limites 8–15.
3. Calcular automaticamente PV, CA, modificadores e bônus final de cada perícia.
4. Expandir o modelo de personagem do painel para guardar a ficha completa (não só nome/classe/raça/nível/XP).
5. Adicionar aba "Jogadores" ao painel: lista de personagens da campanha ativa + ficha de consulta rápida.

## Escopo desta versão

**Incluído:**
- Página `/creator` (HTML/CSS/JS puro, sem backend), responsiva mobile-first.
- Fluxo completo: atributos (Point Buy) → raça → classe → perícias → cálculo automático → exportar `character.json`.
- Conteúdo SRD 5e básico apenas: raças (`content/racas-5e.json`) e classes (`content/classes-5e.json`), já previstos no spec original, escritos como parte desta implementação.
- Sempre nível 1 — sem seleção de nível.
- Publicação via GitHub Pages (pasta `docs/creator/`), gerando URL do tipo `https://<usuario>.github.io/painel-ded/creator/`.
- `POST /api/personagens/importar` recebendo o `character.json` e persistindo a ficha completa (atributos, PV, CA, perícias com bônus).
- Aba "Jogadores" na barra lateral do painel: lista de personagens da campanha ativa → ficha de consulta (atributos, modificadores, PV, CA, cada perícia com bônus final, ex: "Furtividade +5").
- Visual: tema escuro "grimório moderno" — elegante, tipografia serifada em títulos, detalhes dourados/âmbar, textura sutil de couro/pergaminho nos cantos, mas limpo e legível no celular. Mesma linguagem visual deve se estender à nova aba Jogadores no painel principal (que hoje já tem modo claro/escuro — a aba Jogadores segue o tema ativo do painel, não fixa em escuro).

**Fora do escopo (documentado para depois):**
- Multiclasse, talentos, magias, equipamento detalhado — o criador cobre só o essencial de nível 1, como já definido no spec original.
- Recálculo automático de PV/CA/perícias em level-up. PV/CA/perícias refletem o estado da importação (nível 1); se o personagem sobe de nível em jogo, o mestre ajusta manualmente ou reimporta uma ficha atualizada. Recálculo automático de progressão fica para uma versão futura.
- Autenticação/controle de acesso na página do criador — é um link compartilhado diretamente com os 3 jogadores, sem tela de login.
- Edição da ficha diretamente no painel — reimportar (mesmo nome) substitui os dados.

## Modelo de `character.json`

```json
{
  "nome": "Kess Bramo",
  "raca": "Humano",
  "classe": "Ladino",
  "nivel": 1,
  "atributos": {
    "forca": 10, "destreza": 15, "constituicao": 13,
    "inteligencia": 12, "sabedoria": 10, "carisma": 14
  },
  "pv": 10,
  "ca": 12,
  "pericias": [
    { "nome": "Furtividade", "atributo": "destreza", "proficiente": true, "bonus": 4 },
    { "nome": "Investigacao", "atributo": "inteligencia", "proficiente": true, "bonus": 3 }
  ]
}
```

`bonus` já vem calculado (modificador de atributo + bônus de proficiência de +2, se `proficiente`). O painel confia no JSON recebido (uso solo/local, sem preocupação de adversário) — não recalcula no backend.

## Modelo de Dados (SQLite — expande o spec original)

- `personagens`: adiciona colunas `forca, destreza, constituicao, inteligencia, sabedoria, carisma, pv, ca` aos campos já existentes (`id, nome, classe, raca, nivel, xp_atual`).
- `personagem_pericias`: expande de `(personagem_id, pericia)` para `(personagem_id, pericia, atributo, proficiente, bonus)`.

## Hospedagem do Criador

GitHub Pages servindo a pasta `docs/` do repositório `painel-ded` (já usada para specs/plans internos em Markdown — coexiste sem conflito, já que esses arquivos não são linkados publicamente). `docs/creator/index.html` fica acessível em `https://<usuario>.github.io/painel-ded/creator/`.

**Pré-requisito a verificar na implementação:** GitHub Pages gratuito exige repositório público (ou GitHub Pro para privado). Se `painel-ded` for privado e o usuário não quiser torná-lo público, alternativa é publicar só a pasta `docs/creator` num repo separado público, ou usar Netlify Drop (upload manual, sem repo).

## API (adiciona ao spec original)

```
GET  /api/personagens                     — lista (já previsto)
POST /api/personagens/importar            — recebe character.json completo, cria ou substitui por nome
GET  /api/personagens/{id}                — ficha completa para a aba Jogadores
```

## Interface — Aba Jogadores

- Item fixo "🧑‍🤝‍🧑 Jogadores" na barra lateral, junto ao "📋 Quadro de Quests".
- Lista de personagens da campanha ativa (nome, classe/raça, nível, XP).
- Ao selecionar um: cartão de ficha com atributos e modificadores em destaque, PV e CA grandes no topo, lista de perícias ordenada com bônus final visível de cada uma — pensado para consulta em ~2 segundos durante a sessão ("o que o Bran precisa rolar pra Atletismo?").

## Testes / Verificação

- Testes unitários: parsing/validação de `character.json` na importação (campos obrigatórios, ranges de atributo plausíveis), cálculo de PV/CA no criador (client-side, testável isoladamente em JS).
- Teste manual do fluxo completo: preencher ficha no `/creator` no celular → exportar → importar no painel → conferir na aba Jogadores.

## Riscos / Pontos em Aberto

- **Privacidade do repositório vs. GitHub Pages gratuito** — ver seção Hospedagem acima.
- **Ficha desatualizada após level-up** — aceito como limitação desta versão (ver Fora do escopo).
- **Perícias por classe (quantidade e lista elegível)** ainda não existem no vault — é conteúdo SRD novo, a ser escrito durante a implementação (mesmo ponto já levantado no spec original).
