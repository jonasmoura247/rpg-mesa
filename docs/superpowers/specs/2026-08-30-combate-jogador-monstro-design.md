# Combate Jogador × Monstro — Design

## Objetivo

Uma tela onde o mestre escolhe um personagem já importado e um monstro de um banco curado, simula o combate 1×1 entre eles turno a turno — o mestre digita os resultados dos dados físicos rolados na mesa (ataque, resistência, dano), e o site calcula acertos, aplica dano e desce as barras de vida dos dois lados até um deles chegar a 0 PV.

## Escopo

**1 jogador × 1 monstro só.** Não gerencia grupos nem múltiplos combatentes de cada lado.

**Mestre continua rolando dado físico.** O site nunca sorteia resultado de ataque, resistência ou dano sozinho — só recebe os números que o mestre já rolou na mesa e faz a matemática (comparar com CA/CD, somar modificador, descontar de PV).

**Banco de monstros: CD 0 a CD 5, extraído do livro real do mestre** (`Costa da Travessia/Livros/guia-dos-monstros.md` — Manual dos Monstros convertido de PDF, ~308 ocorrências de "Nível de Desafio" nessa faixa, texto com colunas embaralhadas pela conversão, que preciso desembaralhar manualmente cruzando com conhecimento próprio de D&D). Escopo confirmado pelo usuário como "todos de CD 0 a 5", executado em lotes por CD na implementação para manter revisão de qualidade controlada.

**Ações de magia de criatura:** só **Conjuração Inata** (a maioria dos monstros dessa faixa) — cada magia inata vira mais um item na lista de ações da criatura, sem rastrear limite de usos por dia (o mestre controla isso de cabeça, como já faria numa mesa física). Criaturas com **Conjuração completa** (NPCs como Mago, Sacerdote, Druida — com espaços de magia por nível) ficam fora do banco nessa fase.

## Arquitetura

Segue o padrão já estabelecido: dados curados carregados de `content/` na inicialização (mesmo padrão de `RepositorioConteudo`/`RepositorioDesafiosGuilda`), backend expõe endpoints simples, frontend calcula/exibe sem lógica de regra escondida no servidor além da comparação básica (acerto/CD, dano, PV restante).

### `content/monstros-combate/monstros.json` (novo arquivo, subpasta pelo mesmo motivo de `content/guilda/`)

Array de objetos:
```json
{
  "nome": "Goblin",
  "cd": "1/4",
  "ca": 15,
  "pv": 7,
  "dadoDeVida": "2d6",
  "deslocamento": "9 m",
  "atributos": { "forca": -1, "destreza": 2, "constituicao": 0, "inteligencia": 0, "sabedoria": -1, "carisma": -1 },
  "acoes": [
    {
      "nome": "Cimitarra",
      "tipo": "ataque",
      "bonusAcerto": 4,
      "dano": "1d6+2 cortante"
    },
    {
      "nome": "Toque Amedrontador (exemplo de ação de resistência)",
      "tipo": "resistencia",
      "atributoResistencia": "sabedoria",
      "cdResistencia": 12,
      "dano": null
    }
  ]
}
```

Cada item de `acoes` é `tipo: "ataque"` (tem `bonusAcerto`, compara com a CA do alvo) ou `tipo: "resistencia"` (tem `atributoResistencia` — ex: `"sabedoria"` — e `cdResistencia`, o CD literal já informado no próprio texto do livro pra aquela ação — ex: "CD do teste de resistência de magia é 13" — em vez de recalculado a partir de um bônus, que seria menos confiável de extrair do texto embaralhado). Ambos os tipos têm `dano` opcional (algumas ações não causam dano, ex: efeitos de controle).

### `MonstroCombate` (novo record em `Modelos.cs`, backend)

```csharp
public record AcaoMonstro(string Nome, string Tipo, int? BonusAcerto, string? AtributoResistencia, int? CdResistencia, string? Dano);
public record AtributosMonstro(int Forca, int Destreza, int Constituicao, int Inteligencia, int Sabedoria, int Carisma);
public record MonstroCombate(string Nome, string Cd, int Ca, int Pv, string DadoDeVida, string Deslocamento, AtributosMonstro Atributos, List<AcaoMonstro> Acoes);
```

Carregado por um `RepositorioMonstrosCombate` (mesmo padrão de `RepositorioDesafiosGuilda`), exposto via endpoint `GET /api/monstros-combate` (lista completa — não precisa de campanha, é conteúdo global fixo, igual `RepositorioConteudo`).

### Frontend — nova aba/tela "⚔️ Combate"

**Setup:**
- Dois dropdowns: personagem (busca de `Api.listarPersonagens`, já existe) e monstro (busca do novo endpoint).
- Depois de escolher os dois, mostra PV inicial de cada um (editável — campo numérico pré-preenchido com o PV máximo, caso algum já esteja ferido de antes) e um botão "Iniciar combate".
- Checkbox "age 1º" ao lado de cada combatente (mutuamente exclusivo — marcar um desmarca o outro).

**Durante o combate** (layout "lado a lado", validado com mockup):
- Duas barras de vida sempre visíveis (jogador à esquerda, monstro à direita), com nome, CA e PV atual/máximo.
- Painel de ação, abaixo, pro lado que está no turno atual:
  - Dropdown de ação: pro jogador, arma(s) + magias conhecidas (filtra magias com `dano != null` — não lista magias puramente utilitárias); pro monstro, os itens de `acoes`.
  - Se a ação escolhida é do tipo **ataque** (arma, magia com `dano` e sem `testeResistencia`/`tipo: "resistencia"`): mostra "Ataque [+N] vs CA do alvo ([CA])", campo pro d20 de ataque rolado por quem ataca, indicador visual de acerto/erro assim que digitado, e (se acertou) campo pro dano rolado + botão "Aplicar".
  - Se a ação escolhida é do tipo **resistência** (magia com `testeResistencia`, ou ação de monstro com `tipo: "resistencia"`): mostra "[Alvo] resiste: 1d20 + [atributo] vs CD [do conjurador]", campo pro d20 de resistência do alvo (o site soma automaticamente o modificador do atributo certo — calculado da ficha se for o jogador, ou de `atributos` se for o monstro), resultado (passou/falhou), e se tiver dano associado e o alvo falhou, campo pro dano rolado + botão "Aplicar".
  - Aplicar dano desconta da barra de vida correspondente (sem passar de 0 nem de PV máximo).
- Botão **"Passar turno"**, sempre visível, alterna o lado ativo (permite registrar múltiplas ações do mesmo lado antes de passar — ex: monstro com Ataques Múltiplos).
- Log de combate simples abaixo (texto: "Vex acertou Goblin com Produzir Chama (6 dano)"), cronológico, sem interação.

**Fim de combate:** quando um PV chega a 0, o painel de ação trava (mostra só um banner "🏆 [Vencedor] venceu!") e aparece um botão "Novo combate" que volta pro setup.

## Fluxo de dados ponta a ponta

`content/monstros-combate/monstros.json` (banco fixo, extraído do livro) → `RepositorioMonstrosCombate` → endpoint `GET /api/monstros-combate` → frontend carrega junto com a lista de personagens da campanha → mestre monta o confronto → cada ação: mestre digita resultado do dado físico → frontend calcula acerto/resistência e desconto de PV, tudo client-side (sem persistir estado de combate no backend — se a página recarregar, o combate reseta, aceitável pra essa fase).

## Testes

- `RepositorioMonstrosCombateTestes.cs`: carrega o banco real, confirma que todo monstro tem CA/PV/pelo menos 1 ação válidos, todas as ações são `tipo: "ataque"` ou `"resistencia"` com os campos obrigatórios de cada tipo presentes.
- Frontend: sem framework de teste automatizado (mesmo padrão do resto do painel) — verificação manual/Playwright do fluxo completo: setup, ataque que acerta, ataque que erra, magia de resistência que falha, magia de resistência que passa, Ataques Múltiplos (2 ações do monstro antes de passar turno), fim de combate travando a tela.

## Fora de escopo (explicitamente adiado)

- Grupos/múltiplos combatentes de cada lado (só 1×1).
- Monstro conjurar contra o jogador magias que exigem que o JOGADOR resista, além das ações de "Conjuração Inata" já cobertas (essas já cobrem o caso mais comum: dano com resistência do alvo, que nesse fluxo é sempre o jogador quando o monstro ataca).
- NPCs com Conjuração completa (Mago, Sacerdote, Druida — espaços de magia por nível).
- Rastreio de "X vezes por dia" em ações de criatura.
- Persistência de estado de combate entre recarregamentos de página.
- Iniciativa real com múltiplas criaturas intercaladas — só alternância manual entre os dois lados via botão "Passar turno" e o checkbox de quem começa.
