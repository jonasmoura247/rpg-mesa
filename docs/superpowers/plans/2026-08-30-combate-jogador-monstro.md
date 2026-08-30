# Combate Jogador x Monstro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tela de combate 1x1 Jogador x Monstro no painel, onde o mestre digita resultados de dados físicos e o site calcula acerto/resistência/dano e desce as barras de vida, com um banco de monstros extraído do livro real do usuário (CD 0-2 nesta fase; CD 3-5 fica pra sessões seguintes, mesma arquitetura).

**Architecture:** Banco de monstros em `content/monstros-combate/*.json` (um arquivo por CD, carregados e concatenados na inicialização — permite adicionar CDs novos depois sem tocar nos arquivos existentes). Backend expõe só leitura (`GET /api/monstros-combate`), sem lógica de regra escondida — toda comparação acerto/CD/dano acontece no frontend, que já recebe CA/PV/atributos/ações prontos. Nova aba "⚔️ Combate" no frontend, sem persistir estado de combate no servidor (reseta se a página recarregar — aceitável nesta fase).

**Tech Stack:** ASP.NET Core minimal API (C#), xUnit, vanilla JS (sem framework), mesmo padrão do resto do painel.

---

### Task 1: Modelos + `RepositorioMonstrosCombate`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Create: `src/PainelDed.Api/Campanhas/LocalizadorConteudoMonstrosCombate.cs`
- Create: `src/PainelDed.Api/Campanhas/RepositorioMonstrosCombate.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/RepositorioMonstrosCombateTestes.cs`

- [ ] **Step 1: Adicionar os records em `Modelos.cs`** (no final do arquivo)

```csharp
public record AtributosMonstro(int Forca, int Destreza, int Constituicao, int Inteligencia, int Sabedoria, int Carisma);

public record AcaoMonstro(
    string Nome,
    string Tipo,
    int? BonusAcerto,
    string? AtributoResistencia,
    int? CdResistencia,
    string? Dano);

public record MonstroCombate(
    string Nome,
    string Cd,
    int Ca,
    int Pv,
    string DadoDeVida,
    string Deslocamento,
    AtributosMonstro Atributos,
    List<AcaoMonstro> Acoes);
```

`Tipo` em `AcaoMonstro` é sempre `"ataque"` (usa `BonusAcerto`, `AtributoResistencia`/`CdResistencia` nulos) ou `"resistencia"` (usa `AtributoResistencia`+`CdResistencia`, `BonusAcerto` nulo). `Dano` é opcional em ambos os tipos.

- [ ] **Step 2: Escrever os testes (falhando)**

Crie `tests/PainelDed.Api.Testes/Campanhas/RepositorioMonstrosCombateTestes.cs`:

```csharp
using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioMonstrosCombateTestes
{
    [Fact]
    public void CarregarDePasta_ComDoisArquivos_ConcatenaOsMonstrosDosDois()
    {
        var pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-monstros-" + Guid.NewGuid());
        Directory.CreateDirectory(pastaTemporaria);
        try
        {
            File.WriteAllText(Path.Combine(pastaTemporaria, "cd-0.json"), """
            [
              {
                "nome": "Rato Gigante",
                "cd": "0",
                "ca": 10,
                "pv": 1,
                "dadoDeVida": "1d4-1",
                "deslocamento": "6 m",
                "atributos": { "forca": -2, "destreza": 1, "constituicao": -1, "inteligencia": -4, "sabedoria": -1, "carisma": -3 },
                "acoes": [
                  { "nome": "Mordida", "tipo": "ataque", "bonusAcerto": 2, "atributoResistencia": null, "cdResistencia": null, "dano": "1 perfurante" }
                ]
              }
            ]
            """);
            File.WriteAllText(Path.Combine(pastaTemporaria, "cd-1-4.json"), """
            [
              {
                "nome": "Goblin",
                "cd": "1/4",
                "ca": 15,
                "pv": 7,
                "dadoDeVida": "2d6",
                "deslocamento": "9 m",
                "atributos": { "forca": -1, "destreza": 2, "constituicao": 0, "inteligencia": 0, "sabedoria": -1, "carisma": -1 },
                "acoes": [
                  { "nome": "Cimitarra", "tipo": "ataque", "bonusAcerto": 4, "atributoResistencia": null, "cdResistencia": null, "dano": "1d6+2 cortante" }
                ]
              }
            ]
            """);

            var repositorio = RepositorioMonstrosCombate.CarregarDePasta(pastaTemporaria);

            Assert.Equal(2, repositorio.Todos.Count);
            Assert.Contains(repositorio.Todos, m => m.Nome == "Rato Gigante");
            Assert.Contains(repositorio.Todos, m => m.Nome == "Goblin");
        }
        finally
        {
            Directory.Delete(pastaTemporaria, recursive: true);
        }
    }

    [Fact]
    public void CarregarDePasta_ComAcaoDeResistencia_CarregaCdECdResistenciaCorretamente()
    {
        var pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-monstros-" + Guid.NewGuid());
        Directory.CreateDirectory(pastaTemporaria);
        try
        {
            File.WriteAllText(Path.Combine(pastaTemporaria, "cd-2.json"), """
            [
              {
                "nome": "Exemplo Conjurador",
                "cd": "2",
                "ca": 12,
                "pv": 20,
                "dadoDeVida": "3d8+6",
                "deslocamento": "9 m",
                "atributos": { "forca": 0, "destreza": 0, "constituicao": 1, "inteligencia": 0, "sabedoria": 2, "carisma": 3 },
                "acoes": [
                  { "nome": "Toque Amedrontador", "tipo": "resistencia", "bonusAcerto": null, "atributoResistencia": "sabedoria", "cdResistencia": 12, "dano": null }
                ]
              }
            ]
            """);

            var repositorio = RepositorioMonstrosCombate.CarregarDePasta(pastaTemporaria);

            var monstro = repositorio.Todos.Single();
            var acao = monstro.Acoes.Single();
            Assert.Equal("resistencia", acao.Tipo);
            Assert.Equal("sabedoria", acao.AtributoResistencia);
            Assert.Equal(12, acao.CdResistencia);
            Assert.Null(acao.BonusAcerto);
        }
        finally
        {
            Directory.Delete(pastaTemporaria, recursive: true);
        }
    }
}
```

- [ ] **Step 3: Rodar os testes e confirmar que falham (classe não existe)**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter RepositorioMonstrosCombateTestes`
Expected: erro de compilação.

- [ ] **Step 4: Criar `LocalizadorConteudoMonstrosCombate.cs`**

```csharp
namespace PainelDed.Api.Campanhas;

// Mesma estratégia de LocalizadorConteudo/LocalizadorConteudoGuilda: sobe a árvore
// de diretórios a partir do ponto de partida até achar a pasta, robusto tanto
// rodando via `dotnet run` quanto nos testes de integração.
public static class LocalizadorConteudoMonstrosCombate
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            var candidato = Path.Combine(diretorio.FullName, "content", "monstros-combate");
            if (Directory.Exists(candidato))
            {
                return candidato;
            }

            diretorio = diretorio.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Não foi possível localizar a pasta 'content/monstros-combate/' subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
```

- [ ] **Step 5: Criar `RepositorioMonstrosCombate.cs`**

```csharp
using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioMonstrosCombate
{
    private readonly List<MonstroCombate> _monstros;

    private RepositorioMonstrosCombate(List<MonstroCombate> monstros)
    {
        _monstros = monstros;
    }

    public IReadOnlyList<MonstroCombate> Todos => _monstros;

    public static RepositorioMonstrosCombate CarregarDePasta(string pasta)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var monstros = new List<MonstroCombate>();

        foreach (var arquivo in Directory.GetFiles(pasta, "*.json"))
        {
            var json = File.ReadAllText(arquivo);
            var doArquivo = JsonSerializer.Deserialize<List<MonstroCombate>>(json, opcoes)
                ?? throw new InvalidOperationException($"Falha ao carregar monstros de {arquivo}");
            monstros.AddRange(doArquivo);
        }

        return new RepositorioMonstrosCombate(monstros);
    }
}
```

Essa pasta ainda não existe no repositório de verdade — as próximas tasks (2-7) vão criar os arquivos `content/monstros-combate/cd-*.json` reais. O teste desta task usa uma pasta temporária isolada, então não depende dos arquivos reais existirem ainda.

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter RepositorioMonstrosCombateTestes`
Expected: PASS (2/2)

- [ ] **Step 7: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs src/PainelDed.Api/Campanhas/LocalizadorConteudoMonstrosCombate.cs src/PainelDed.Api/Campanhas/RepositorioMonstrosCombate.cs tests/PainelDed.Api.Testes/Campanhas/RepositorioMonstrosCombateTestes.cs
git commit -m "feat(combate): adiciona modelos e RepositorioMonstrosCombate"
```

---

### Task 2: Extração de monstros CD 0

**Files:**
- Create: `content/monstros-combate/cd-0.json`

- [ ] **Step 1: Extrair todos os monstros de CD 0 do livro real**

Fonte: `C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md` (Manual dos Monstros convertido de PDF — ~25000 linhas).

**Como encontrar:** rode `grep -n "Nível de Desafio 0 " "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md"` — isso retorna ~30 ocorrências (algumas são o mesmo monstro duplicado pelo artefato de colunas embaralhadas da conversão do PDF, então o número final de monstros únicos deve ser um pouco menor que 30). CD 0 no livro real é majoritariamente a seção de "Bestas" (animais comuns: rato, corvo, gato, aranha comum, cobra venenosa pequena, etc) e alguns humanoides/objetos animados triviais — concentrados principalmente entre as linhas ~22000-24500, com uma ou outra ocorrência isolada antes disso.

**Como ler um stat block nesse arquivo (o texto vem com colunas de PDF embaralhadas — duas colunas de conteúdo diferentes ficam intercaladas linha a linha):** o nome do monstro aparece em CAIXA ALTA perto do bloco; os campos `Classe de Armadura`, `Pontos de Vida`, `Deslocamento`, a tabela de atributos (FOR/DES/CON/INT/SAB/CAR com modificador entre parênteses), `Nível de Desafio` e as ações em `AÇÕES` pertencem ao MESMO stat block mesmo que apareçam intercalados com frases de outro monstro vizinho — leia com atenção, usando os valores numéricos como âncora (ex: "Pontos de Vida 7 (2d6)" só faz sentido junto com o resto do bloco daquele mesmo monstro). Exemplo real já decifrado, pra calibrar (linha ~12429-12459 do arquivo, é CD 1/4 então não entra nesta task, mas serve de referência do formato):

```
CHEFE GOBLIN [nome de outro monstro, ignorar - está intercalado]
GOBLIN
Humanoide Pequeno (goblinoide), neutro e mau
Classe de Armadura 15 (armadura de couro, escudo)
Pontos de Vida 7 (2d6)
Deslocamento 9 m
FOR 8 (–1)  DES 14 (+2)  CON 10 (+0)  INT 10 (+0)  SAB 8 (–1)  CAR 8 (–1)
Perícias Furtividade +6
Sentidos visão no escuro 18 m, Percepção passiva 9
Idiomas Comum, Goblin
Nível de Desafio 1/4 (50 XP)
AÇÕES
Cimitarra. Ataque Corpo-a-Corpo com Arma: +4 para atingir, alcance 1,5 m, um alvo.
Acerto: 5 (1d6 + 2) de dano cortante.
```

Isso vira, no schema deste projeto:
```json
{
  "nome": "Goblin", "cd": "1/4", "ca": 15, "pv": 7, "dadoDeVida": "2d6", "deslocamento": "9 m",
  "atributos": { "forca": -1, "destreza": 2, "constituicao": 0, "inteligencia": 0, "sabedoria": -1, "carisma": -1 },
  "acoes": [ { "nome": "Cimitarra", "tipo": "ataque", "bonusAcerto": 4, "atributoResistencia": null, "cdResistencia": null, "dano": "1d6+2 cortante" } ]
}
```

Regras de conversão pro schema:
- `atributos.*` = só o MODIFICADOR (o número entre parênteses), não o valor bruto do atributo.
- `dano` = string livre no formato "XdY[+Z] tipo" (ex: "1d6+2 cortante"), extraindo do texto "Acerto: N (XdY + Z) de dano TIPO".
- Ações do tipo "Ataque Corpo-a-Corpo com Arma"/"Ataque à Distância com Arma" → `tipo: "ataque"`, `bonusAcerto` = número depois de "+" antes de "para atingir".
- Ações que pedem "teste de resistência de [Atributo]" com um "CD X" explícito no texto → `tipo: "resistencia"`, `atributoResistencia` = o atributo em minúsculo sem acento (ex: "sabedoria"), `cdResistencia` = o CD literal do texto.
- Se um monstro CD 0 não tiver nenhuma ação de ataque nem resistência claramente identificável no texto (alguns animais realmente inofensivos, tipo um besouro comum), pode incluir com `acoes: []` — não invente uma ação que não está no livro.
- **Nunca invente ou "complete de memória" um valor que não conseguir ler claramente no texto por causa da bagunça de colunas** — se um campo estiver ambíguo/ilegível pra um monstro específico, pule esse monstro inteiro e liste ele como pulado no seu relatório final, em vez de arriscar um valor errado.

Salve o resultado (array JSON de todos os monstros CD 0 encontrados) em `content/monstros-combate/cd-0.json`.

- [ ] **Step 2: Validar o JSON**

Run: `python -c "import json; d=json.load(open('content/monstros-combate/cd-0.json',encoding='utf-8')); print(len(d)); [print(m['nome'], m['cd']) for m in d]"`
Expected: imprime a lista de monstros carregada sem erro, todos com `cd: "0"`.

- [ ] **Step 3: Commit**

```bash
git add content/monstros-combate/cd-0.json
git commit -m "feat(combate): adiciona monstros de CD 0 extraidos do livro"
```

---

### Task 3: Extração de monstros CD 1/8

**Files:**
- Create: `content/monstros-combate/cd-1-8.json`

- [ ] **Step 1: Extrair todos os monstros de CD 1/8**

Mesmo processo da Task 2, mas buscando `grep -n "Nível de Desafio 1/8" "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md"` (~24 ocorrências). Mesmas regras de conversão, mesmo cuidado com colunas embaralhadas, mesma regra de nunca inventar valor ilegível.

Salve em `content/monstros-combate/cd-1-8.json`, com `cd: "1/8"` em cada item.

- [ ] **Step 2: Validar o JSON**

Run: `python -c "import json; d=json.load(open('content/monstros-combate/cd-1-8.json',encoding='utf-8')); print(len(d)); [print(m['nome'], m['cd']) for m in d]"`
Expected: imprime a lista sem erro, todos com `cd: "1/8"`.

- [ ] **Step 3: Commit**

```bash
git add content/monstros-combate/cd-1-8.json
git commit -m "feat(combate): adiciona monstros de CD 1/8 extraidos do livro"
```

---

### Task 4: Extração de monstros CD 1/4

**Files:**
- Create: `content/monstros-combate/cd-1-4.json`

- [ ] **Step 1: Extrair todos os monstros de CD 1/4**

Mesmo processo, `grep -n "Nível de Desafio 1/4" "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md"` (~44 ocorrências — inclui o Goblin já decifrado como exemplo na Task 2, pode usar aquele bloco direto). `cd: "1/4"`.

Salve em `content/monstros-combate/cd-1-4.json`.

- [ ] **Step 2: Validar o JSON**

Run: `python -c "import json; d=json.load(open('content/monstros-combate/cd-1-4.json',encoding='utf-8')); print(len(d)); [print(m['nome'], m['cd']) for m in d]"`
Expected: imprime a lista sem erro, todos com `cd: "1/4"`, incluindo "Goblin".

- [ ] **Step 3: Commit**

```bash
git add content/monstros-combate/cd-1-4.json
git commit -m "feat(combate): adiciona monstros de CD 1/4 extraidos do livro"
```

---

### Task 5: Extração de monstros CD 1/2

**Files:**
- Create: `content/monstros-combate/cd-1-2.json`

- [ ] **Step 1: Extrair todos os monstros de CD 1/2**

Mesmo processo, `grep -n "Nível de Desafio 1/2" "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md"` (~36 ocorrências). `cd: "1/2"`.

Salve em `content/monstros-combate/cd-1-2.json`.

- [ ] **Step 2: Validar o JSON**

Run: `python -c "import json; d=json.load(open('content/monstros-combate/cd-1-2.json',encoding='utf-8')); print(len(d)); [print(m['nome'], m['cd']) for m in d]"`
Expected: imprime a lista sem erro, todos com `cd: "1/2"`.

- [ ] **Step 3: Commit**

```bash
git add content/monstros-combate/cd-1-2.json
git commit -m "feat(combate): adiciona monstros de CD 1/2 extraidos do livro"
```

---

### Task 6: Extração de monstros CD 1

**Files:**
- Create: `content/monstros-combate/cd-1.json`

- [ ] **Step 1: Extrair todos os monstros de CD 1**

Mesmo processo, `grep -n "Nível de Desafio 1 " "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md"` (~35 ocorrências — inclui o "Chefe Goblin" já visto de relance na Task 2, que é CD 1, não CD 1/4 — releia o bloco dele com atenção nessa task). `cd: "1"`.

Salve em `content/monstros-combate/cd-1.json`.

- [ ] **Step 2: Validar o JSON**

Run: `python -c "import json; d=json.load(open('content/monstros-combate/cd-1.json',encoding='utf-8')); print(len(d)); [print(m['nome'], m['cd']) for m in d]"`
Expected: imprime a lista sem erro, todos com `cd: "1"`.

- [ ] **Step 3: Commit**

```bash
git add content/monstros-combate/cd-1.json
git commit -m "feat(combate): adiciona monstros de CD 1 extraidos do livro"
```

---

### Task 7: Extração de monstros CD 2

**Files:**
- Create: `content/monstros-combate/cd-2.json`

- [ ] **Step 1: Extrair todos os monstros de CD 2**

Mesmo processo, `grep -n "Nível de Desafio 2 " "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md"` (~55 ocorrências — a maior leva desta fase). `cd: "2"`.

Preste atenção especial aqui a monstros com **Conjuração Inata** (traço listado antes de "AÇÕES", com uma lista de magias "à vontade" ou "X/dia cada"). Pra esses, adicione UMA ação por magia relevante de dano/controle da lista (ignore magias puramente utilitárias tipo luz ou detectar magia), classificando como `tipo: "ataque"` (se a magia usa "ataque de magia", com o bônus de acerto que o traço de conjuração informa) ou `tipo: "resistencia"` (se a magia força teste de resistência, com o CD que o traço de conjuração informa). Não modele controle de "quantas vezes por dia" — a ação fica sempre disponível.

Salve em `content/monstros-combate/cd-2.json`.

- [ ] **Step 2: Validar o JSON**

Run: `python -c "import json; d=json.load(open('content/monstros-combate/cd-2.json',encoding='utf-8')); print(len(d)); [print(m['nome'], m['cd'], len(m['acoes'])) for m in d]"`
Expected: imprime a lista sem erro, todos com `cd: "2"`.

- [ ] **Step 3: Commit**

```bash
git add content/monstros-combate/cd-2.json
git commit -m "feat(combate): adiciona monstros de CD 2 extraidos do livro"
```

---

### Task 8: Wiring no `Program.cs`

**Files:**
- Modify: `src/PainelDed.Api/Program.cs`

- [ ] **Step 1: Registrar o repositório**

Logo abaixo do registro de `ServicoGeradorDesafiosGuilda` (da feature anterior):

```csharp
builder.Services.AddSingleton(RepositorioMonstrosCombate.CarregarDePasta(
    LocalizadorConteudoMonstrosCombate.Localizar(builder.Environment.ContentRootPath)));
```

- [ ] **Step 2: Adicionar o endpoint**

Em qualquer lugar depois dos endpoints de conteúdo existentes:

```csharp
app.MapGet("/api/monstros-combate", (RepositorioMonstrosCombate repositorio) =>
    Results.Ok(repositorio.Todos));
```

Sem checagem de campanha — é conteúdo global fixo, igual `/api/conteudo/{secao}`.

- [ ] **Step 3: Rodar toda a suíte de testes**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
Expected: todos os testes passam.

- [ ] **Step 4: Rodar a API localmente e verificar o endpoint manualmente**

`dotnet run --project src/PainelDed.Api`, depois `curl -k https://localhost:7004/api/monstros-combate` (ou porta HTTP equivalente) — confirme 200 com um array de todos os monstros das Tasks 2-7 (CD 0 a CD 2), cada um com `nome`, `ca`, `pv`, `atributos`, `acoes` preenchidos.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Program.cs
git commit -m "feat(combate): registra repositorio e adiciona endpoint /api/monstros-combate"
```

---

### Task 9: Frontend — aba Combate, setup do confronto

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/index.html`
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`
- Create: `src/PainelDed.Api/wwwroot/js/combate.js`
- Modify: `src/PainelDed.Api/wwwroot/js/app.js`
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

Antes de implementar, leia `src/PainelDed.Api/wwwroot/js/personagens.js` e `src/PainelDed.Api/wwwroot/js/quests.js` inteiros — esta task segue o mesmo padrão de módulo (objeto com `exibir()`, chamado por um botão de navegação em `app.js`).

- [ ] **Step 1: Adicionar `Api.listarMonstrosCombate` em `api.js`**

```javascript
  async listarMonstrosCombate() {
    const resposta = await fetch('/api/monstros-combate');
    if (!resposta.ok) throw new Error('Falha ao listar monstros');
    return resposta.json();
  },
```

- [ ] **Step 2: Adicionar botão de navegação "⚔️ Combate" em `index.html`**, logo depois do botão existente `botao-quadro-quests` (mesmo padrão: `<button id="botao-combate" class="botao-navegacao-fixo" type="button">⚔️ Combate</button>`).

- [ ] **Step 3: Registrar o listener em `app.js`**, junto dos outros listeners de navegação (`document.getElementById('botao-combate').addEventListener('click', () => Combate.exibir());`).

- [ ] **Step 4: Criar `combate.js` com a tela de setup**

```javascript
// magias.js guarda testeResistencia com o nome do atributo acentuado (ex: "Constituição",
// "Força"), mas as chaves de atributos.* no resto do sistema são ASCII sem acento (ex:
// "constituicao", "forca", vindas dos nomes de propriedade em C#) — esse mapa converte.
const NOME_ATRIBUTO_PARA_CHAVE = {
  'força': 'forca',
  'destreza': 'destreza',
  'constituição': 'constituicao',
  'inteligência': 'inteligencia',
  'sabedoria': 'sabedoria',
  'carisma': 'carisma',
};

const Combate = {
  estado: null,

  async exibir() {
    const principal = document.getElementById('conteudo-principal');
    principal.innerHTML = '';
    this.estado = null;

    const cabecalho = document.createElement('div');
    cabecalho.className = 'cabecalho-nota';
    const titulo = document.createElement('h2');
    titulo.textContent = '⚔️ Combate';
    cabecalho.appendChild(titulo);
    principal.appendChild(cabecalho);

    const area = document.createElement('div');
    area.id = 'area-combate';
    principal.appendChild(area);

    await this.renderizarSetup();
  },

  async renderizarSetup() {
    const area = document.getElementById('area-combate');
    area.innerHTML = '<p class="carregando">Carregando…</p>';

    let personagens;
    let monstros;
    try {
      [personagens, monstros] = await Promise.all([
        Api.listarPersonagens(Campanha.ativa.id),
        Api.listarMonstrosCombate(),
      ]);
    } catch (erro) {
      area.innerHTML = '<p class="mensagem-erro">Falha ao carregar personagens ou monstros.</p>';
      console.error(erro);
      return;
    }

    if (personagens.length === 0) {
      area.innerHTML = '<p class="lista-personagens-vazia">Importe um personagem na aba Jogadores antes de montar um combate.</p>';
      return;
    }

    area.innerHTML = '';

    const formulario = document.createElement('div');
    formulario.className = 'setup-combate';

    const seletorPersonagem = document.createElement('select');
    personagens.forEach((p) => {
      const opcao = document.createElement('option');
      opcao.value = p.id;
      opcao.textContent = `${p.nome} (${p.classe})`;
      seletorPersonagem.appendChild(opcao);
    });

    const seletorMonstro = document.createElement('select');
    monstros.forEach((m, indice) => {
      const opcao = document.createElement('option');
      opcao.value = indice;
      opcao.textContent = `${m.nome} (CD ${m.cd})`;
      seletorMonstro.appendChild(opcao);
    });

    const botaoIniciar = document.createElement('button');
    botaoIniciar.className = 'botao-rolar';
    botaoIniciar.textContent = 'Iniciar combate';
    botaoIniciar.addEventListener('click', async () => {
      const personagemEscolhido = personagens.find((p) => p.id === seletorPersonagem.value);
      const monstroEscolhido = monstros[Number(seletorMonstro.value)];
      await this.iniciarCombate(personagemEscolhido, monstroEscolhido);
    });

    formulario.appendChild(seletorPersonagem);
    formulario.appendChild(seletorMonstro);
    formulario.appendChild(botaoIniciar);
    area.appendChild(formulario);
  },

  async iniciarCombate(personagem, monstro) {
    this.estado = {
      // atributos do jogador vêm da ficha como valores BRUTOS (ex: Sabedoria 13),
      // diferente do banco de monstros, que já guarda MODIFICADORES prontos — por
      // isso convertemos aqui uma vez, pra que o resto do código sempre trabalhe
      // com modificador em ambos os lados (this.modificadorAtributos faz a conversão).
      jogador: { nome: personagem.nome, ca: personagem.ca, pvMax: personagem.pv, pv: personagem.pv, ataques: this.acoesDoJogador(personagem), atributos: this.modificadorAtributos(personagem.atributos), cdMagia: personagem.cdMagia },
      monstro: { nome: monstro.nome, ca: monstro.ca, pvMax: monstro.pv, pv: monstro.pv, atributos: monstro.atributos, acoes: monstro.acoes },
      turnoDoJogador: true,
      log: [],
      terminado: false,
    };
    this.renderizarCombate();
  },

  modificadorAtributos(atributosBrutos) {
    const resultado = {};
    Object.entries(atributosBrutos).forEach(([chave, valor]) => {
      resultado[chave] = Math.floor((valor - 10) / 2);
    });
    return resultado;
  },

  acoesDoJogador(personagem) {
    const acoes = [
      { nome: 'Ataque corpo a corpo (Força)', tipo: 'ataque', bonusAcerto: personagem.bonusAtaqueForca, dano: null },
      { nome: 'Ataque à distância (Destreza)', tipo: 'ataque', bonusAcerto: personagem.bonusAtaqueDestreza, dano: null },
    ];
    (personagem.magiasConhecidas || [])
      .filter((m) => m.dano)
      .forEach((m) => {
        acoes.push({
          nome: `✨ ${m.nome}`,
          tipo: m.testeResistencia ? 'resistencia' : 'ataque',
          bonusAcerto: personagem.bonusAtaqueMagico,
          atributoResistencia: m.testeResistencia ? NOME_ATRIBUTO_PARA_CHAVE[m.testeResistencia.toLowerCase()] : null,
          cdMagia: personagem.cdMagia,
          dano: m.dano,
        });
      });
    return acoes;
  },

  renderizarCombate() {
    // Implementado na Task 10 (painel de ação) e Task 11 (passar turno/log/fim).
    const area = document.getElementById('area-combate');
    area.innerHTML = '<p class="carregando">Combate iniciado — painel de ação vem na próxima task.</p>';
  },
};
```

- [ ] **Step 5: Adicionar CSS mínimo pro formulário de setup**, logo depois de `.layout-jogadores` em `estilo.css`:

```css
.setup-combate {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
```

- [ ] **Step 6: Verificação manual (Playwright ou navegador real)**

Rode a API, abra o painel, importe pelo menos um personagem (ou use um já existente), clique em "⚔️ Combate", confirme que os dois dropdowns aparecem preenchidos (personagens da campanha e monstros do banco), escolha um de cada, clique "Iniciar combate", confirme que a mensagem placeholder aparece (a tela de combate de verdade vem nas próximas tasks).

- [ ] **Step 7: Commit**

```bash
git add src/PainelDed.Api/wwwroot/index.html src/PainelDed.Api/wwwroot/js/api.js src/PainelDed.Api/wwwroot/js/combate.js src/PainelDed.Api/wwwroot/js/app.js src/PainelDed.Api/wwwroot/css/estilo.css
git commit -m "feat(combate): aba Combate com setup de personagem x monstro"
```

---

### Task 10: Frontend — painel de ação (ataque e resistência) + barras de vida

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/combate.js`
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

- [ ] **Step 1: Substituir `renderizarCombate` por uma versão completa**, em `combate.js`:

```javascript
  renderizarCombate() {
    const area = document.getElementById('area-combate');
    area.innerHTML = '';

    const barras = document.createElement('div');
    barras.className = 'barras-combate';
    barras.appendChild(this.criarBarraVida('jogador', this.estado.jogador));
    barras.appendChild(this.criarBarraVida('monstro', this.estado.monstro));
    area.appendChild(barras);

    if (this.estado.terminado) {
      const vencedor = this.estado.jogador.pv > 0 ? this.estado.jogador.nome : this.estado.monstro.nome;
      const banner = document.createElement('div');
      banner.className = 'banner-fim-combate';
      banner.textContent = `🏆 ${vencedor} venceu!`;
      area.appendChild(banner);

      const botaoNovo = document.createElement('button');
      botaoNovo.className = 'botao-rolar';
      botaoNovo.textContent = 'Novo combate';
      botaoNovo.addEventListener('click', () => this.renderizarSetup());
      area.appendChild(botaoNovo);
      return;
    }

    area.appendChild(this.criarPainelAcao());

    const log = document.createElement('ul');
    log.className = 'log-combate';
    this.estado.log.forEach((linha) => {
      const item = document.createElement('li');
      item.textContent = linha;
      log.appendChild(item);
    });
    area.appendChild(log);
  },

  criarBarraVida(lado, combatente) {
    const container = document.createElement('div');
    container.className = `barra-vida barra-vida-${lado}`;

    const nome = document.createElement('strong');
    nome.textContent = combatente.nome;
    container.appendChild(nome);

    const detalhes = document.createElement('p');
    detalhes.className = 'detalhes-quest';
    detalhes.textContent = `CA ${combatente.ca}`;
    container.appendChild(detalhes);

    const trilho = document.createElement('div');
    trilho.className = 'trilho-vida';
    const preenchimento = document.createElement('div');
    preenchimento.className = 'preenchimento-vida';
    preenchimento.style.width = `${Math.max(0, (combatente.pv / combatente.pvMax) * 100)}%`;
    trilho.appendChild(preenchimento);
    container.appendChild(trilho);

    const texto = document.createElement('p');
    texto.className = 'detalhes-quest';
    texto.textContent = `${combatente.pv}/${combatente.pvMax} PV`;
    container.appendChild(texto);

    return container;
  },

  criarPainelAcao() {
    const painel = document.createElement('div');
    painel.className = 'painel-acao-combate';

    const atacante = this.estado.turnoDoJogador ? this.estado.jogador : this.estado.monstro;
    const alvo = this.estado.turnoDoJogador ? this.estado.monstro : this.estado.jogador;
    const acoesDisponiveis = this.estado.turnoDoJogador ? atacante.ataques : atacante.acoes;

    const tituloTurno = document.createElement('p');
    tituloTurno.textContent = `Turno de: ${atacante.nome}`;
    painel.appendChild(tituloTurno);

    const seletorAcao = document.createElement('select');
    acoesDisponiveis.forEach((acao, indice) => {
      const opcao = document.createElement('option');
      opcao.value = indice;
      opcao.textContent = acao.nome;
      seletorAcao.appendChild(opcao);
    });
    painel.appendChild(seletorAcao);

    const areaDinamica = document.createElement('div');
    areaDinamica.className = 'area-dinamica-acao';
    painel.appendChild(areaDinamica);

    const atualizarAreaDinamica = () => {
      const acao = acoesDisponiveis[Number(seletorAcao.value)];
      areaDinamica.innerHTML = '';
      if (acao.tipo === 'resistencia') {
        areaDinamica.appendChild(this.criarFluxoResistencia(acao, atacante, alvo));
      } else {
        areaDinamica.appendChild(this.criarFluxoAtaque(acao, atacante, alvo));
      }
    };
    seletorAcao.addEventListener('change', atualizarAreaDinamica);
    atualizarAreaDinamica();

    const botaoPassarTurno = document.createElement('button');
    botaoPassarTurno.className = 'botao-secundario';
    botaoPassarTurno.textContent = 'Passar turno';
    botaoPassarTurno.addEventListener('click', () => {
      this.estado.turnoDoJogador = !this.estado.turnoDoJogador;
      this.renderizarCombate();
    });
    painel.appendChild(botaoPassarTurno);

    return painel;
  },

  criarFluxoAtaque(acao, atacante, alvo) {
    const container = document.createElement('div');

    const bonus = acao.bonusAcerto ?? 0;
    const linhaAlvo = document.createElement('p');
    linhaAlvo.className = 'detalhes-quest';
    linhaAlvo.textContent = `Ataque +${bonus} vs CA de ${alvo.nome} (${alvo.ca})`;
    container.appendChild(linhaAlvo);

    const campoD20 = document.createElement('input');
    campoD20.type = 'number';
    campoD20.placeholder = 'd20 rolado';
    container.appendChild(campoD20);

    const resultado = document.createElement('p');
    container.appendChild(resultado);

    const campoDano = document.createElement('input');
    campoDano.type = 'number';
    campoDano.placeholder = 'dano rolado';
    campoDano.hidden = true;
    container.appendChild(campoDano);

    const botaoAplicar = document.createElement('button');
    botaoAplicar.className = 'botao-rolar';
    botaoAplicar.textContent = 'Aplicar';
    botaoAplicar.hidden = true;
    container.appendChild(botaoAplicar);

    campoD20.addEventListener('input', () => {
      const total = Number(campoD20.value) + bonus;
      const acertou = total >= alvo.ca;
      resultado.textContent = acertou ? `Acertou (total ${total})` : `Errou (total ${total})`;
      resultado.style.color = acertou ? 'var(--cor-sucesso, #5a5)' : 'var(--cor-erro, #c53)';
      campoDano.hidden = !acertou;
      botaoAplicar.hidden = !acertou;
    });

    botaoAplicar.addEventListener('click', () => {
      const dano = Number(campoDano.value) || 0;
      this.aplicarDano(alvo, dano);
      this.estado.log.push(`${atacante.nome} acertou ${alvo.nome} com ${acao.nome} (${dano} dano)`);
      this.renderizarCombate();
    });

    return container;
  },

  criarFluxoResistencia(acao, atacante, alvo) {
    const container = document.createElement('div');

    const cd = acao.cdResistencia ?? acao.cdMagia ?? 10;
    const linha = document.createElement('p');
    linha.className = 'detalhes-quest';
    linha.textContent = `${alvo.nome} resiste: 1d20 + ${acao.atributoResistencia} vs CD ${cd}`;
    container.appendChild(linha);

    const modificadorAlvo = (alvo.atributos && alvo.atributos[acao.atributoResistencia]) || 0;

    const campoD20 = document.createElement('input');
    campoD20.type = 'number';
    campoD20.placeholder = 'd20 de resistência (só o dado)';
    container.appendChild(campoD20);

    const resultado = document.createElement('p');
    container.appendChild(resultado);

    const campoDano = document.createElement('input');
    campoDano.type = 'number';
    campoDano.placeholder = 'dano rolado (se tiver)';
    campoDano.hidden = true;
    container.appendChild(campoDano);

    const botaoAplicar = document.createElement('button');
    botaoAplicar.className = 'botao-rolar';
    botaoAplicar.textContent = 'Registrar resultado';
    botaoAplicar.hidden = true;
    container.appendChild(botaoAplicar);

    // Campo de dano fica visível independente de passar ou falhar: várias magias
    // (ex: Toque Trovejante) causam METADE do dano mesmo quando o alvo resiste
    // ("metade se passar no teste") — o mestre lê o texto da magia e digita o valor
    // certo (cheio, metade ou zero), o site só aplica o número informado, nunca
    // tenta adivinhar/recalcular a partir da string de dano.
    let passou = false;
    const temDano = Boolean(acao.dano);
    campoDano.hidden = !temDano;
    campoDano.placeholder = temDano ? `dano rolado (${acao.dano})` : 'sem dano';
    botaoAplicar.hidden = !temDano;

    campoD20.addEventListener('input', () => {
      const total = Number(campoD20.value) + modificadorAlvo;
      passou = total >= cd;
      resultado.textContent = passou ? `Resistiu (total ${total})` : `Falhou (total ${total})`;
      resultado.style.color = passou ? 'var(--cor-sucesso, #5a5)' : 'var(--cor-erro, #c53)';
      botaoAplicar.hidden = false;
    });

    botaoAplicar.addEventListener('click', () => {
      const dano = Number(campoDano.value) || 0;
      if (dano > 0) {
        this.aplicarDano(alvo, dano);
      }
      this.estado.log.push(`${alvo.nome} ${passou ? 'resistiu' : 'falhou'} contra ${acao.nome} de ${atacante.nome}${dano > 0 ? ` (${dano} dano)` : ''}`);
      this.renderizarCombate();
    });

    return container;
  },

  aplicarDano(combatente, dano) {
    combatente.pv = Math.max(0, combatente.pv - dano);
    if (combatente.pv === 0) {
      this.estado.terminado = true;
    }
  },
```

- [ ] **Step 2: Adicionar CSS pras barras de vida e painel de ação**, logo depois de `.setup-combate` em `estilo.css`:

```css
.barras-combate {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.barra-vida {
  flex: 1;
  border: 1px solid var(--cor-borda);
  border-radius: 8px;
  padding: 0.6rem;
}

.trilho-vida {
  background: var(--cor-fundo);
  border-radius: 6px;
  height: 14px;
  overflow: hidden;
  margin: 0.3rem 0;
}

.preenchimento-vida {
  background: var(--cor-destaque-forte, #5a5);
  height: 100%;
}

.painel-acao-combate {
  border: 1px solid var(--cor-borda);
  border-radius: 8px;
  padding: 0.9rem;
  margin-bottom: 1rem;
}

.painel-acao-combate select,
.painel-acao-combate input {
  display: block;
  margin: 0.4rem 0;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--cor-borda);
  background: var(--cor-fundo);
  color: var(--cor-texto);
}

.banner-fim-combate {
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  padding: 1rem;
  margin-bottom: 1rem;
}

.log-combate {
  font-size: 0.8rem;
  opacity: 0.8;
  list-style: none;
  padding: 0;
}
```

Nota: essa task não faz nada com o botão "Passar turno" além de alternar `turnoDoJogador` — isso já é o comportamento completo pedido (permite múltiplas ações do mesmo lado antes de passar, já que nada força a passagem automática depois de aplicar dano). A Task 11 só adiciona verificação e2e completa, não precisa de código novo de "passar turno"/"log"/"fim de combate" — já foi tudo implementado nesta task junto, porque o `renderizarCombate` runs as one cohesive unit. Ajuste a Task 11 pra ser só verificação, sem código novo.

- [ ] **Step 3: Verificação manual completa (Playwright)**

Rode a API, monte um combate (personagem conjurador tipo Bardo/Druida com pelo menos uma magia de dano, contra um monstro qualquer do banco). Teste:
1. Ataque do jogador que acerta (d20 alto) → aplica dano, monstro desce de PV, log atualiza.
2. Ataque do jogador que erra (d20 baixo) → não mostra campo de dano, não aplica nada.
3. Trocar a ação selecionada pra uma magia de resistência (`testeResistencia` preenchido na ficha) → confirma que o painel muda pro fluxo de resistência, mostra o CD certo, soma o modificador de atributo certo do monstro.
4. Passar turno pro monstro, escolher uma ação de ataque do monstro, aplicar dano no jogador.
5. Repetir aplicando dano suficiente pra zerar o PV de um dos dois → confirma banner de vencedor aparece e painel de ação some.
6. "Novo combate" → volta pro setup.

- [ ] **Step 4: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/combate.js src/PainelDed.Api/wwwroot/css/estilo.css
git commit -m "feat(combate): painel de acao (ataque e resistencia), barras de vida, fim de combate"
```

---

### Task 11: Verificação final e push

**Files:** nenhum arquivo novo — só verificação.

- [ ] **Step 1: Rodar a suíte de testes .NET completa**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
Expected: todos os testes passam, incluindo os novos de `RepositorioMonstrosCombateTestes`.

- [ ] **Step 2: Rodar os testes JS do creator (garantir que nada foi afetado por engano)**

Run: `cd docs/creator/js && node dados.test.js && node calculo.test.js && node magias.test.js`
Expected: todos OK.

- [ ] **Step 3: Revisão de amostragem do banco de monstros contra o livro**

Escolha 5 monstros aleatórios dentre os extraídos nas Tasks 2-7 (pelo menos 1 de cada CD, se possível) e confira manualmente CA/PV/ações contra o texto real do livro (`grep -n "NOME_DO_MONSTRO" "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia\Livros\guia-dos-monstros.md"` pra achar o bloco de novo). Reporte qualquer discrepância encontrada — se achar erro, corrija o JSON antes de prosseguir.

- [ ] **Step 4: Push final**

```bash
git push origin main
```
