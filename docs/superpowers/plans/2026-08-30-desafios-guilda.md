# Desafios da Guilda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sortear 3 desafios de guilda por vez (banco curado de ~100), com recompensa em PO/XP escalada por dificuldade, editáveis antes de virarem quests reais no Quadro de Quests já existente.

**Architecture:** Reaproveita a infraestrutura existente de `Quest`/`RascunhoQuest`/`IDado`/padrão "Gerar Ideia" (`ServicoGeradorIdeiaQuest`). Nenhum campo novo em `Quest`. Banco de conteúdo novo em `content/guilda/desafios-guilda.json` (subpasta, pra não colidir com o scan não-recursivo de `RepositorioConteudo.CarregarDePasta` em `content/`). Novo repositório + serviço + endpoint + botão/modal no frontend.

**Tech Stack:** ASP.NET Core minimal API (C#), xUnit, vanilla JS (sem framework), mesmo padrão de todo o resto do painel.

---

### Task 1: Banco de desafios da guilda

**Files:**
- Create: `content/guilda/desafios-guilda.json`

- [ ] **Step 1: Criar a pasta e o arquivo com os 100 desafios**

Conteúdo exato de `content/guilda/desafios-guilda.json`:

```json
[
  { "titulo": "Entrega urgente", "descricao": "Entregar uma encomenda para um comerciante na vila vizinha, sem que se perca ou danifique no caminho.", "dificuldade": "facil" },
  { "titulo": "Ovelha perdida", "descricao": "Recuperar uma ovelha que fugiu do curral e se perdeu na floresta próxima.", "dificuldade": "facil" },
  { "titulo": "Companhia na estrada", "descricao": "Escoltar um viajante desarmado até o próximo povoado, sem incidentes.", "dificuldade": "facil" },
  { "titulo": "Poço entupido", "descricao": "Limpar um poço entupido por detritos no bairro velho da cidade.", "dificuldade": "facil" },
  { "titulo": "Gato sumido", "descricao": "Encontrar um gato de estimação que sumiu há dias.", "dificuldade": "facil" },
  { "titulo": "Mensagem urgente", "descricao": "Levar uma mensagem urgente para um posto avançado nas cercanias.", "dificuldade": "facil" },
  { "titulo": "Cerca quebrada", "descricao": "Ajudar a reparar uma cerca destruída por animais selvagens.", "dificuldade": "facil" },
  { "titulo": "Ervas do curandeiro", "descricao": "Recolher ervas medicinais específicas na beira da estrada para um curandeiro.", "dificuldade": "facil" },
  { "titulo": "Acompanhar o bêbado", "descricao": "Acompanhar um bêbado barulhento até em casa em segurança.", "dificuldade": "facil" },
  { "titulo": "Água do poço isolado", "descricao": "Verificar se um poço isolado ainda tem água potável.", "dificuldade": "facil" },
  { "titulo": "Item esquecido", "descricao": "Buscar um item esquecido na estalagem de uma cidade vizinha.", "dificuldade": "facil" },
  { "titulo": "Carregar suprimentos", "descricao": "Ajudar a carregar suprimentos para o armazém da guilda.", "dificuldade": "facil" },
  { "titulo": "Bando de corvos", "descricao": "Espantar um bando de corvos que está incomodando os moradores.", "dificuldade": "facil" },
  { "titulo": "Criança perdida na feira", "descricao": "Localizar uma criança que se afastou demais durante uma feira.", "dificuldade": "facil" },
  { "titulo": "Testemunha do acidente", "descricao": "Testemunhar e relatar um pequeno acidente na estrada pra guilda.", "dificuldade": "facil" },
  { "titulo": "Bota no brejo", "descricao": "Recuperar uma bota perdida presa em um brejo raso.", "dificuldade": "facil" },
  { "titulo": "Cavalo assustado", "descricao": "Acalmar um cavalo assustado preso entre as árvores.", "dificuldade": "facil" },
  { "titulo": "Convite formal", "descricao": "Entregar um convite formal a uma família influente da cidade.", "dificuldade": "facil" },
  { "titulo": "Luzes estranhas no rio", "descricao": "Verificar boatos sobre luzes estranhas vistas à noite perto do rio.", "dificuldade": "facil" },
  { "titulo": "Galinhas fugidas", "descricao": "Ajudar um fazendeiro a reunir galinhas fugidas antes do anoitecer.", "dificuldade": "facil" },
  { "titulo": "Remédio simples", "descricao": "Buscar um remédio simples na farmácia da cidade vizinha.", "dificuldade": "facil" },
  { "titulo": "Vigiar a barraca", "descricao": "Vigiar uma barraca no mercado por algumas horas para o dono.", "dificuldade": "facil" },
  { "titulo": "Lenha para o inverno", "descricao": "Recolher lenha extra para o inverno de uma família necessitada.", "dificuldade": "facil" },
  { "titulo": "Sementes da horta", "descricao": "Levar um pacote de sementes até uma horta comunitária.", "dificuldade": "facil" },
  { "titulo": "Barulho na taverna", "descricao": "Investigar um barulho estranho relatado numa taverna à noite.", "dificuldade": "facil" },
  { "titulo": "Corda dos pescadores", "descricao": "Buscar uma corda perdida na beira do rio, usada por pescadores.", "dificuldade": "facil" },
  { "titulo": "Ponte insegura", "descricao": "Confirmar se uma ponte de madeira ainda está segura para travessia.", "dificuldade": "facil" },
  { "titulo": "Pacote do viajante ausente", "descricao": "Recolher um pacote deixado na casa de um viajante ausente.", "dificuldade": "facil" },
  { "titulo": "Ferramentas pesadas", "descricao": "Ajudar um artesão a transportar ferramentas pesadas até a oficina.", "dificuldade": "facil" },
  { "titulo": "Ratos no depósito", "descricao": "Espantar ratos que invadiram o depósito de grãos da cidade.", "dificuldade": "facil" },
  { "titulo": "Flores para o túmulo", "descricao": "Levar flores para um túmulo recém-cavado, a pedido de um enlutado.", "dificuldade": "facil" },
  { "titulo": "Preço das mercadorias", "descricao": "Buscar informações sobre o preço de mercadorias em outra cidade.", "dificuldade": "facil" },
  { "titulo": "Mercador nervoso", "descricao": "Acompanhar um mercador nervoso até a praça central.", "dificuldade": "facil" },
  { "titulo": "Chave perdida", "descricao": "Recuperar uma chave perdida em algum lugar da estalagem.", "dificuldade": "facil" },
  { "titulo": "Sino da torre", "descricao": "Verificar se o sino da torre da cidade ainda funciona corretamente.", "dificuldade": "facil" },
  { "titulo": "Escolta da caravana", "descricao": "Escoltar uma pequena caravana de mercadores até a cidade vizinha, através de uma estrada pouco segura.", "dificuldade": "media" },
  { "titulo": "Saques na fazenda", "descricao": "Investigar relatos de saques a uma fazenda isolada nos arredores.", "dificuldade": "media" },
  { "titulo": "Ladrão do porto", "descricao": "Capturar vivo um ladrão conhecido que anda agindo perto do porto.", "dificuldade": "media" },
  { "titulo": "Item roubado", "descricao": "Recuperar um item roubado de um comerciante local, provavelmente escondido nos becos.", "dificuldade": "media" },
  { "titulo": "Caverna dos ataques", "descricao": "Explorar uma caverna próxima onde animais selvagens têm atacado viajantes.", "dificuldade": "media" },
  { "titulo": "Trégua entre famílias", "descricao": "Negociar (ou intimidar) uma trégua entre duas famílias rivais da cidade.", "dificuldade": "media" },
  { "titulo": "Cheiro pútrido", "descricao": "Encontrar a origem de um cheiro pútrido que vem incomodando um bairro inteiro.", "dificuldade": "media" },
  { "titulo": "Levantamento arqueológico", "descricao": "Escoltar um estudioso até ruínas próximas para um levantamento arqueológico.", "dificuldade": "media" },
  { "titulo": "Desaparecimentos na estrada", "descricao": "Investigar desaparecimentos recentes de viajantes numa estrada isolada.", "dificuldade": "media" },
  { "titulo": "Animal exótico fugido", "descricao": "Recuperar um animal de estimação exótico fugido, que pode ser perigoso.", "dificuldade": "media" },
  { "titulo": "Início de incêndio", "descricao": "Ajudar a conter um pequeno incêndio numa propriedade rural antes que se espalhe.", "dificuldade": "media" },
  { "titulo": "Bando de saqueadores", "descricao": "Rastrear e afugentar um bando de saqueadores menores que ameaça uma vila.", "dificuldade": "media" },
  { "titulo": "Contrabando na estrada", "descricao": "Investigar um caso de contrabando que passa pela estrada principal.", "dificuldade": "media" },
  { "titulo": "Informante nervoso", "descricao": "Encontrar e escoltar um informante nervoso até um local seguro.", "dificuldade": "media" },
  { "titulo": "Torre com luzes", "descricao": "Explorar uma torre abandonada onde luzes foram avistadas à noite.", "dificuldade": "media" },
  { "titulo": "Documentos perdidos", "descricao": "Recuperar documentos importantes perdidos durante um assalto a uma carroça.", "dificuldade": "media" },
  { "titulo": "Deslizamento de terra", "descricao": "Confirmar a extensão de um deslizamento de terra que bloqueou uma estrada.", "dificuldade": "media" },
  { "titulo": "Casa mal-assombrada", "descricao": "Investigar rumores de um espírito assombrando uma casa vazia.", "dificuldade": "media" },
  { "titulo": "Comerciante de joias", "descricao": "Escoltar um comerciante de joias até a cidade, discretamente.", "dificuldade": "media" },
  { "titulo": "Água contaminada", "descricao": "Localizar uma fonte de água contaminada que está deixando moradores doentes.", "dificuldade": "media" },
  { "titulo": "Cão no poço", "descricao": "Resgatar um cão de guarda que caiu num poço abandonado.", "dificuldade": "media" },
  { "titulo": "Terras usurpadas", "descricao": "Negociar a devolução de terras usurpadas por um vizinho hostil.", "dificuldade": "media" },
  { "titulo": "Roubo de gado", "descricao": "Investigar um roubo de gado que vem afetando várias fazendas.", "dificuldade": "media" },
  { "titulo": "Testemunha relutante", "descricao": "Escoltar uma testemunha relutante até o tribunal da cidade.", "dificuldade": "media" },
  { "titulo": "Mapa do explorador", "descricao": "Encontrar um mapa perdido que pertence a um velho explorador aposentado.", "dificuldade": "media" },
  { "titulo": "Combate na clareira", "descricao": "Investigar barulhos de combate ouvidos vindos de uma clareira isolada.", "dificuldade": "media" },
  { "titulo": "Arma de família", "descricao": "Recuperar uma arma de família roubada de um veterano de guerra.", "dificuldade": "media" },
  { "titulo": "Goblins na estrada", "descricao": "Localizar um bando de goblins que anda roubando suprimentos da estrada.", "dificuldade": "media" },
  { "titulo": "Praga na vila", "descricao": "Escoltar um curandeiro até uma vila afetada por uma pequena praga.", "dificuldade": "media" },
  { "titulo": "Furtos no mercado", "descricao": "Investigar uma série de pequenos furtos misteriosos no mercado.", "dificuldade": "media" },
  { "titulo": "Posto de guarda abandonado", "descricao": "Explorar um antigo posto de guarda abandonado nos limites do território.", "dificuldade": "media" },
  { "titulo": "Disputa territorial", "descricao": "Ajudar a resolver uma disputa territorial entre pescadores e caçadores.", "dificuldade": "media" },
  { "titulo": "Barco roubado", "descricao": "Recuperar um barco de pesca roubado escondido em algum lugar da costa.", "dificuldade": "media" },
  { "titulo": "Culto nos arredores", "descricao": "Investigar um culto pequeno se formando nos arredores da cidade.", "dificuldade": "media" },
  { "titulo": "Escolta de prisioneiros", "descricao": "Escoltar prisioneiros até a prisão mais próxima com segurança.", "dificuldade": "media" },
  { "titulo": "Esconderijo de assaltantes", "descricao": "Localizar o esconderijo de uma quadrilha de assaltantes de estrada.", "dificuldade": "media" },
  { "titulo": "Criaturas se aproximando", "descricao": "Investigar sinais de criaturas selvagens se aproximando perigosamente da cidade.", "dificuldade": "media" },
  { "titulo": "Cavalo de raça roubado", "descricao": "Recuperar um cavalo de raça roubado de um estábulo nobre.", "dificuldade": "media" },
  { "titulo": "Evacuação da enchente", "descricao": "Ajudar a evacuar moradores de uma área ameaçada por enchente.", "dificuldade": "media" },
  { "titulo": "Mensageiro real", "descricao": "Escoltar um mensageiro real através de território disputado.", "dificuldade": "media" },
  { "titulo": "Mina com ruídos estranhos", "descricao": "Investigar uma mina abandonada de onde vêm ruídos estranhos.", "dificuldade": "media" },
  { "titulo": "Mercenários desertores", "descricao": "Negociar com um grupo de mercenários desertores acampados nos arredores.", "dificuldade": "media" },
  { "titulo": "Artefato de família", "descricao": "Recuperar um artefato de família roubado por um espírito travesso.", "dificuldade": "media" },
  { "titulo": "Pegadas suspeitas", "descricao": "Rastrear pegadas suspeitas que levam a uma caverna próxima.", "dificuldade": "media" },
  { "titulo": "Refugiados desabrigados", "descricao": "Escoltar um grupo de refugiados até um abrigo seguro.", "dificuldade": "media" },
  { "titulo": "Ruína das Bruxas", "descricao": "Encontrar a Ruína das Bruxas, um local que ninguém mapeou ainda, e trazer um relatório detalhado.", "dificuldade": "dificil" },
  { "titulo": "Cabeça do Rei Goblin", "descricao": "Trazer a cabeça do Rei Goblin que lidera um bando cada vez mais ousado.", "dificuldade": "dificil" },
  { "titulo": "Machado sagrado", "descricao": "Roubar de volta o machado sagrado tomado por um orc renegado poderoso.", "dificuldade": "dificil" },
  { "titulo": "Espectador na caverna", "descricao": "Derrotar um espectador que se instalou numa caverna próxima e ataca viajantes.", "dificuldade": "dificil" },
  { "titulo": "Medusa das ruínas", "descricao": "Capturar viva uma medusa que aterroriza uma região de ruínas antigas.", "dificuldade": "dificil" },
  { "titulo": "Lâmia sedutora", "descricao": "Investigar e neutralizar uma lâmia que vem seduzindo e roubando viajantes ricos.", "dificuldade": "dificil" },
  { "titulo": "Duergar dos túneis", "descricao": "Confrontar um pequeno grupo de duergar que emergiu de túneis desconhecidos.", "dificuldade": "dificil" },
  { "titulo": "Reféns na fortaleza", "descricao": "Resgatar reféns mantidos por uma quadrilha bem armada numa fortaleza abandonada.", "dificuldade": "dificil" },
  { "titulo": "Catacumba amaldiçoada", "descricao": "Explorar profundamente uma catacumba amaldiçoada e recuperar uma relíquia perdida.", "dificuldade": "dificil" },
  { "titulo": "Troglodita alfa", "descricao": "Derrotar um troglodita alfa que lidera uma incursão contra assentamentos próximos.", "dificuldade": "dificil" },
  { "titulo": "Criatura do manguezal", "descricao": "Investigar desaparecimentos ligados a uma criatura desconhecida no manguezal.", "dificuldade": "dificil" },
  { "titulo": "Anomalia mágica", "descricao": "Localizar e neutralizar a origem de uma anomalia mágica que afeta a região.", "dificuldade": "dificil" },
  { "titulo": "Labirinto nas montanhas", "descricao": "Escoltar uma expedição perigosa até o labirinto em ruínas nas montanhas.", "dificuldade": "dificil" },
  { "titulo": "Saqueadores gigantes", "descricao": "Enfrentar um grupo de saqueadores gigantes que ameaça destruir uma vila inteira.", "dificuldade": "dificil" },
  { "titulo": "Tesouro da prisão antiga", "descricao": "Recuperar um tesouro perdido guardado por armadilhas mortais numa prisão antiga.", "dificuldade": "dificil" },
  { "titulo": "Zigurate esquecido", "descricao": "Investigar rumores sombrios vindos de um zigurate esquecido na selva.", "dificuldade": "dificil" },
  { "titulo": "Assentamento de fadas", "descricao": "Negociar (ou combater) com um assentamento hostil de fadas antes que ataquem.", "dificuldade": "dificil" },
  { "titulo": "Portal instável", "descricao": "Derrotar um grupo de corruptores menores que abriram um portal instável.", "dificuldade": "dificil" },
  { "titulo": "Criatura das profundezas", "descricao": "Confrontar diretamente uma criatura das profundezas avistada perto da costa.", "dificuldade": "dificil" },
  { "titulo": "O que desperta na Costa", "descricao": "Descobrir o que desperta criaturas antigas nas profundezas perto da Costa da Travessia.", "dificuldade": "dificil" }
]
```

- [ ] **Step 2: Validar o JSON e a distribuição de dificuldade**

Run: `python -c "import json; d=json.load(open('content/guilda/desafios-guilda.json',encoding='utf-8')); print(len(d)); from collections import Counter; print(Counter(x['dificuldade'] for x in d)); t=[x['titulo'] for x in d]; print('dup:', len(t)-len(set(t)))"`

Expected: `100`, `Counter({'media': 45, 'facil': 35, 'dificil': 20})`, `dup: 0`

- [ ] **Step 3: Commit**

```bash
git add content/guilda/desafios-guilda.json
git commit -m "feat(guilda): adiciona banco de 100 desafios da guilda"
```

---

### Task 2: `DesafioGuilda` + `RepositorioDesafiosGuilda`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Create: `src/PainelDed.Api/Campanhas/RepositorioDesafiosGuilda.cs`
- Create: `src/PainelDed.Api/Campanhas/LocalizadorConteudoGuilda.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/RepositorioDesafiosGuildaTestes.cs`

- [ ] **Step 1: Adicionar o record `DesafioGuilda` em `Modelos.cs`**

Adicione logo após o record `RascunhoQuest` (linha 40 hoje):

```csharp
public record DesafioGuilda(string Titulo, string Descricao, string Dificuldade);
```

- [ ] **Step 2: Escrever o teste de `RepositorioDesafiosGuilda` (falhando)**

Crie `tests/PainelDed.Api.Testes/Campanhas/RepositorioDesafiosGuildaTestes.cs`:

```csharp
using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioDesafiosGuildaTestes
{
    [Fact]
    public void CarregarDeArquivo_ComBancoReal_Carrega100DesafiosComDificuldadeValida()
    {
        var caminho = LocalizadorConteudoGuilda.Localizar(AppContext.BaseDirectory);

        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminho);

        Assert.Equal(100, repositorio.Todos.Count);
        Assert.All(repositorio.Todos, d => Assert.Contains(d.Dificuldade, new[] { "facil", "media", "dificil" }));
        Assert.All(repositorio.Todos, d => Assert.False(string.IsNullOrWhiteSpace(d.Titulo)));
    }

    [Fact]
    public void CarregarDeArquivo_ComArquivoDeTeste_CarregaOsItensNaOrdem()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario,
            "[{\"titulo\":\"A\",\"descricao\":\"desc A\",\"dificuldade\":\"facil\"}," +
            "{\"titulo\":\"B\",\"descricao\":\"desc B\",\"dificuldade\":\"dificil\"}]");

        try
        {
            var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);

            Assert.Equal(2, repositorio.Todos.Count);
            Assert.Equal("A", repositorio.Todos[0].Titulo);
            Assert.Equal("dificil", repositorio.Todos[1].Dificuldade);
        }
        finally
        {
            File.Delete(caminhoTemporario);
        }
    }
}
```

- [ ] **Step 3: Rodar os testes e confirmar que falham (classe não existe)**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter RepositorioDesafiosGuildaTestes`
Expected: erro de compilação — `RepositorioDesafiosGuilda`/`LocalizadorConteudoGuilda` não existem.

- [ ] **Step 4: Criar `LocalizadorConteudoGuilda.cs`**

Mesma estratégia de `LocalizadorConteudo.Localizar` (sobe a árvore de diretórios até achar `content/guilda/desafios-guilda.json`), mas apontando pro arquivo dentro da subpasta:

```csharp
namespace PainelDed.Api.Campanhas;

// Mesma estratégia de LocalizadorConteudo: sobe a árvore de diretórios a partir do
// ponto de partida até achar o arquivo, robusto tanto rodando via `dotnet run` quanto
// nos testes de integração (ContentRootPath varia conforme quem hospeda).
public static class LocalizadorConteudoGuilda
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            var candidato = Path.Combine(diretorio.FullName, "content", "guilda", "desafios-guilda.json");
            if (File.Exists(candidato))
            {
                return candidato;
            }

            diretorio = diretorio.Parent;
        }

        throw new FileNotFoundException(
            $"Não foi possível localizar 'content/guilda/desafios-guilda.json' subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
```

- [ ] **Step 5: Criar `RepositorioDesafiosGuilda.cs`**

```csharp
using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioDesafiosGuilda
{
    private readonly List<DesafioGuilda> _desafios;

    private RepositorioDesafiosGuilda(List<DesafioGuilda> desafios)
    {
        _desafios = desafios;
    }

    public IReadOnlyList<DesafioGuilda> Todos => _desafios;

    public static RepositorioDesafiosGuilda CarregarDeArquivo(string caminhoArquivo)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var json = File.ReadAllText(caminhoArquivo);
        var desafios = JsonSerializer.Deserialize<List<DesafioGuilda>>(json, opcoes)
            ?? throw new InvalidOperationException($"Falha ao carregar desafios de guilda de {caminhoArquivo}");

        return new RepositorioDesafiosGuilda(desafios);
    }
}
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter RepositorioDesafiosGuildaTestes`
Expected: PASS (2/2)

- [ ] **Step 7: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs src/PainelDed.Api/Campanhas/RepositorioDesafiosGuilda.cs src/PainelDed.Api/Campanhas/LocalizadorConteudoGuilda.cs tests/PainelDed.Api.Testes/Campanhas/RepositorioDesafiosGuildaTestes.cs
git commit -m "feat(guilda): adiciona DesafioGuilda e RepositorioDesafiosGuilda"
```

---

### Task 3: `ServicoGeradorDesafiosGuilda`

**Files:**
- Create: `src/PainelDed.Api/Campanhas/ServicoGeradorDesafiosGuilda.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/ServicoGeradorDesafiosGuildaTestes.cs`

- [ ] **Step 1: Escrever os testes (falhando)**

Crie `tests/PainelDed.Api.Testes/Campanhas/ServicoGeradorDesafiosGuildaTestes.cs`:

```csharp
using System.Collections.Generic;
using PainelDed.Api.Campanhas;
using PainelDed.Nucleo.Rolagem;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

// Retorna os valores da fila em ordem, um por chamada de Rolar. Permite testar
// sequências determinísticas de sorteio (índice + XP + PO), diferente de DadoFixo
// (que sempre retorna o mesmo valor e não serve pra testar "sem repetir índice").
public class DadoSequencia : IDado
{
    private readonly Queue<int> _valores;
    public DadoSequencia(params int[] valores) => _valores = new Queue<int>(valores);
    public int Rolar(string notacao) => _valores.Dequeue();
}

public class ServicoGeradorDesafiosGuildaTestes
{
    private static RepositorioDesafiosGuilda CriarRepositorioComCincoDesafios()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario, """
        [
          {"titulo":"Desafio 1","descricao":"desc 1","dificuldade":"facil"},
          {"titulo":"Desafio 2","descricao":"desc 2","dificuldade":"facil"},
          {"titulo":"Desafio 3","descricao":"desc 3","dificuldade":"media"},
          {"titulo":"Desafio 4","descricao":"desc 4","dificuldade":"media"},
          {"titulo":"Desafio 5","descricao":"desc 5","dificuldade":"dificil"}
        ]
        """);
        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);
        File.Delete(caminhoTemporario);
        return repositorio;
    }

    [Fact]
    public void SortearTres_NuncaRepeteIndice_MesmoComRolagemDuplicada()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // Seleção de índices (1-based, 1d5): 2, 2 (repetido, ignorado), 5, 1 -> escolhe [1,4,0] (0-based)
        // Depois, pra cada um dos 3 escolhidos (nessa ordem), rola XP e PO:
        //   Desafio 2 (facil):  XP 1d6=3 -> 30 | PO 1d10=4 -> 20
        //   Desafio 5 (dificil): XP 1d10=2 -> 180 | PO 1d10=3 -> 125
        //   Desafio 1 (facil):  XP 1d6=5 -> 50 | PO 1d10=6 -> 30
        var dado = new DadoSequencia(2, 2, 5, 1, /*Desafio2*/ 3, 4, /*Desafio5*/ 2, 3, /*Desafio1*/ 5, 6);
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Equal(3, rascunhos.Count);
        var titulos = rascunhos.Select(r => r.TituloSugerido).ToList();
        Assert.Equal(new[] { "Desafio 2", "Desafio 5", "Desafio 1" }, titulos);
        Assert.Equal(3, titulos.Distinct().Count());
    }

    [Fact]
    public void SortearTres_DesafioFacil_CalculaXpEPoNaFaixaCorreta()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // A seleção de índices acontece TODA ANTES do cálculo de XP/PO (o serviço
        // sorteia os 3 índices distintos primeiro, só depois rola recompensa pra
        // cada um, na ordem em que foram escolhidos) — por isso a sequência não
        // intercala índice/xp/po, e sim: [3 rolls de índice] + [2 rolls por item].
        // Índices 1,2,3 (1d5) -> escolhe Desafio1, Desafio2, Desafio3, nessa ordem.
        var dado = new DadoSequencia(
            1, 2, 3,       // seleção de índices: Desafio1 (0), Desafio2 (1), Desafio3 (2)
            6, 10,         // Desafio1 (facil): XP 1d6=6 -> 60 | PO 1d10=10 -> 50
            1, 1,          // Desafio2 (facil): XP 1d6=1 -> 10 | PO 1d10=1 -> 5
            1, 1);         // Desafio3 (media): valores não verificados nesse teste
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        var desafio1 = rascunhos[0];
        Assert.Equal(60, desafio1.XpSugerido); // 1d6=6 * 10
        Assert.Equal("50 PO", desafio1.RecompensaSugerida); // 1d10=10 * 5

        var desafio2 = rascunhos[1];
        Assert.Equal(10, desafio2.XpSugerido); // 1d6=1 * 10
        Assert.Equal("5 PO", desafio2.RecompensaSugerida); // 1d10=1 * 5
    }

    [Fact]
    public void SortearTres_DesafioMedio_CalculaXpEPoNaFaixaCorreta()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // Índices 3,1,2 (1d5) -> escolhe Desafio3 (media) primeiro, depois Desafio1, Desafio2.
        var dado = new DadoSequencia(
            3, 1, 2,       // seleção de índices: Desafio3 (2), Desafio1 (0), Desafio2 (1)
            10, 10,        // Desafio3 (media): XP 1d10=10 -> 200 | PO 1d10=10 -> 150
            1, 1,          // Desafio1 (facil): valores não verificados
            1, 1);         // Desafio2 (facil): valores não verificados
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        var desafioMedio = rascunhos[0];
        Assert.Equal(200, desafioMedio.XpSugerido); // 1d10=10 * 20
        Assert.Equal("150 PO", desafioMedio.RecompensaSugerida); // 1d10=10 * 15
    }

    [Fact]
    public void SortearTres_DesafioDificil_CalculaXpEPoNaFaixaCorreta()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // Índices 5,1,2 (1d5) -> escolhe Desafio5 (dificil) primeiro, depois Desafio1, Desafio2.
        var dado = new DadoSequencia(
            5, 1, 2,       // seleção de índices: Desafio5 (4), Desafio1 (0), Desafio2 (1)
            10, 10,        // Desafio5 (dificil): XP 1d10=10*40+100 -> 500 | PO 1d10=10*25+50 -> 300
            1, 1,          // Desafio1 (facil): valores não verificados
            1, 1);         // Desafio2 (facil): valores não verificados
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        var desafioDificil = rascunhos[0];
        Assert.Equal(500, desafioDificil.XpSugerido); // 1d10=10 * 40 + 100
        Assert.Equal("300 PO", desafioDificil.RecompensaSugerida); // 1d10=10 * 25 + 50
    }

    [Fact]
    public void SortearTres_ComBancoDeApenasDoisDesafios_RetornaSoDois()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario, """
        [
          {"titulo":"Único 1","descricao":"desc","dificuldade":"facil"},
          {"titulo":"Único 2","descricao":"desc","dificuldade":"facil"}
        ]
        """);
        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);
        File.Delete(caminhoTemporario);

        // Pool de 2 -> quantidade = min(3,2) = 2. Seleção de índices consome 2 rolls
        // (1,2 -> ambos distintos de primeira, sem precisar re-rolar), depois 2 rolls
        // de recompensa por item (4 no total) = 6 valores na fila.
        var dado = new DadoSequencia(1, 2, 1, 1, 1, 1);
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Equal(2, rascunhos.Count);
    }
}
```

- [ ] **Step 2: Rodar os testes e confirmar que falham (classe não existe)**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter ServicoGeradorDesafiosGuildaTestes`
Expected: erro de compilação — `ServicoGeradorDesafiosGuilda` não existe.

- [ ] **Step 3: Criar `ServicoGeradorDesafiosGuilda.cs`**

```csharp
using System.Linq;
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Campanhas;

public class ServicoGeradorDesafiosGuilda
{
    private readonly RepositorioDesafiosGuilda _repositorio;
    private readonly IDado _dado;

    public ServicoGeradorDesafiosGuilda(RepositorioDesafiosGuilda repositorio, IDado dado)
    {
        _repositorio = repositorio;
        _dado = dado;
    }

    public List<RascunhoQuest> SortearTres()
    {
        var desafios = _repositorio.Todos;
        var quantidade = Math.Min(3, desafios.Count);

        var indicesEscolhidos = new List<int>();
        while (indicesEscolhidos.Count < quantidade)
        {
            var indice = _dado.Rolar($"1d{desafios.Count}") - 1;
            if (!indicesEscolhidos.Contains(indice))
            {
                indicesEscolhidos.Add(indice);
            }
        }

        return indicesEscolhidos.Select(indice => GerarRascunho(desafios[indice])).ToList();
    }

    private RascunhoQuest GerarRascunho(DesafioGuilda desafio)
    {
        var (xp, po) = desafio.Dificuldade switch
        {
            "facil" => (_dado.Rolar("1d6") * 10, _dado.Rolar("1d10") * 5),
            "media" => (_dado.Rolar("1d10") * 20, _dado.Rolar("1d10") * 15),
            "dificil" => (_dado.Rolar("1d10") * 40 + 100, _dado.Rolar("1d10") * 25 + 50),
            _ => throw new InvalidOperationException($"Dificuldade desconhecida: '{desafio.Dificuldade}' no desafio '{desafio.Titulo}'."),
        };

        return new RascunhoQuest(desafio.Titulo, desafio.Descricao, xp, $"{po} PO");
    }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter ServicoGeradorDesafiosGuildaTestes`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoGeradorDesafiosGuilda.cs tests/PainelDed.Api.Testes/Campanhas/ServicoGeradorDesafiosGuildaTestes.cs
git commit -m "feat(guilda): adiciona ServicoGeradorDesafiosGuilda (sorteia 3 sem repetir)"
```

---

### Task 4: Wiring no `Program.cs`

**Files:**
- Modify: `src/PainelDed.Api/Program.cs`

- [ ] **Step 1: Registrar o repositório e o serviço (logo abaixo do registro de `ServicoGeradorIdeiaQuest`, linha 19)**

```csharp
builder.Services.AddSingleton(RepositorioDesafiosGuilda.CarregarDeArquivo(
    LocalizadorConteudoGuilda.Localizar(builder.Environment.ContentRootPath)));
builder.Services.AddSingleton<ServicoGeradorDesafiosGuilda>();
```

- [ ] **Step 2: Adicionar o endpoint (logo abaixo do endpoint `gerar-ideia`, linha 86)**

```csharp
app.MapPost("/api/campanhas/{campanhaId}/quests/sortear-desafios-guilda", (string campanhaId, RepositorioCampanhas repositorioCampanhas, ServicoGeradorDesafiosGuilda servico) =>
{
    if (repositorioCampanhas.Obter(campanhaId) is null)
    {
        return Results.NotFound();
    }
    return Results.Ok(servico.SortearTres());
});
```

- [ ] **Step 3: Rodar toda a suíte de testes pra garantir que nada quebrou**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
Expected: todos os testes passam (nenhum teste de integração cobre `Program.cs` diretamente hoje — mesmo padrão dos endpoints existentes).

- [ ] **Step 4: Rodar a API localmente e verificar o endpoint manualmente**

Run: `dotnet run --project src/PainelDed.Api` (em outro terminal, depois de criar uma campanha via UI ou `POST /api/campanhas`):
`curl -k -X POST https://localhost:7004/api/campanhas/{id}/quests/sortear-desafios-guilda`
Expected: 200 com um array JSON de 3 objetos `{ tituloSugerido, descricaoSugerida, xpSugerido, recompensaSugerida }`.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Program.cs
git commit -m "feat(guilda): registra servico e adiciona endpoint sortear-desafios-guilda"
```

---

### Task 5: Frontend — botão e 3 cards editáveis

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`
- Modify: `src/PainelDed.Api/wwwroot/js/quests.js`
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

- [ ] **Step 1: Adicionar `Api.sortearDesafiosGuilda` em `api.js`**

Logo abaixo de `gerarIdeiaDeQuest` (linha 78):

```javascript
  async sortearDesafiosGuilda(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/sortear-desafios-guilda`, { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao sortear desafios da guilda');
    return resposta.json();
  },
```

- [ ] **Step 2: Adicionar o botão no cabeçalho do Quadro de Quests (`quests.js`, dentro de `exibir()`, logo após o botão "+ Nova Quest" existente, linha 24)**

```javascript
    const botaoSortearGuilda = document.createElement('button');
    botaoSortearGuilda.className = 'botao-rolar';
    botaoSortearGuilda.textContent = '🎲 Sortear Desafios da Guilda';
    botaoSortearGuilda.addEventListener('click', () => this.abrirSorteioDesafiosGuilda());
    cabecalho.appendChild(botaoSortearGuilda);
```

- [ ] **Step 3: Adicionar os métodos `abrirSorteioDesafiosGuilda` e `criarCardRascunhoGuilda` no objeto `Quests` (logo depois de `abrirFormulario`, antes do fechamento `}` da linha 274 — viram os últimos dois métodos do objeto, então a vírgula final de `abrirFormulario` continua igual)**

```javascript
  async abrirSorteioDesafiosGuilda() {
    let rascunhos;
    try {
      rascunhos = await Api.sortearDesafiosGuilda(Campanha.ativa.id);
    } catch (erro) {
      console.error(erro);
      window.alert('Falha ao sortear desafios da guilda.');
      return;
    }

    const fundo = document.createElement('div');
    fundo.className = 'fundo-modal';

    const modal = document.createElement('div');
    modal.className = 'modal-formulario modal-sorteio-guilda';

    const titulo = document.createElement('h3');
    titulo.textContent = '🎲 Desafios da Guilda';
    modal.appendChild(titulo);

    const grade = document.createElement('div');
    grade.className = 'grade-sorteio-guilda';
    modal.appendChild(grade);

    rascunhos.forEach((rascunho) => {
      const card = this.criarCardRascunhoGuilda(rascunho, () => {
        grade.removeChild(card);
        if (grade.children.length === 0) {
          document.body.removeChild(fundo);
        }
      });
      grade.appendChild(card);
    });

    const botaoFechar = document.createElement('button');
    botaoFechar.className = 'botao-secundario';
    botaoFechar.textContent = 'Fechar';
    botaoFechar.addEventListener('click', () => document.body.removeChild(fundo));
    modal.appendChild(botaoFechar);

    fundo.appendChild(modal);
    document.body.appendChild(fundo);
  },

  criarCardRascunhoGuilda(rascunho, aoRemover) {
    const card = document.createElement('div');
    card.className = 'card-rascunho-guilda';

    const campoTitulo = criarCampoTexto('Título', rascunho.tituloSugerido);
    const campoDescricao = criarCampoTextarea('Descrição', rascunho.descricaoSugerida);
    const campoXp = criarCampoTexto('XP sugerido', rascunho.xpSugerido);
    const campoRecompensa = criarCampoTexto('Recompensa', rascunho.recompensaSugerida);
    const campoSemana = criarCampoTexto('Semana', '1');

    [campoTitulo, campoDescricao, campoXp, campoRecompensa, campoSemana].forEach((campo) =>
      card.appendChild(campo.container),
    );

    const acoes = document.createElement('div');
    acoes.className = 'acoes-modal';

    const botaoSalvar = document.createElement('button');
    botaoSalvar.className = 'botao-rolar';
    botaoSalvar.textContent = 'Salvar';
    botaoSalvar.addEventListener('click', async () => {
      const dados = {
        titulo: campoTitulo.entrada.value.trim(),
        descricao: campoDescricao.entrada.value.trim(),
        recompensa: campoRecompensa.entrada.value.trim(),
        xpSugerido: parseInt(campoXp.entrada.value, 10) || 0,
        semana: parseInt(campoSemana.entrada.value, 10) || 1,
        responsavel: null,
      };

      if (!dados.titulo) {
        window.alert('Título é obrigatório.');
        return;
      }

      try {
        await Api.criarQuest(Campanha.ativa.id, dados);
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao salvar o desafio.');
        return;
      }

      aoRemover();
      await this.recarregar();
    });
    acoes.appendChild(botaoSalvar);

    const botaoDescartar = document.createElement('button');
    botaoDescartar.className = 'botao-secundario';
    botaoDescartar.textContent = 'Descartar';
    botaoDescartar.addEventListener('click', () => aoRemover());
    acoes.appendChild(botaoDescartar);

    card.appendChild(acoes);
    return card;
  },
```

- [ ] **Step 4: Adicionar CSS pro modal maior e a grade de 3 colunas em `estilo.css` (logo depois de `.acoes-modal`, linha 671)**

```css
.modal-sorteio-guilda {
  max-width: 60rem;
}

.grade-sorteio-guilda {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-rascunho-guilda {
  border: 1px solid var(--cor-borda);
  border-radius: 8px;
  padding: 0.9rem;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/api.js src/PainelDed.Api/wwwroot/js/quests.js src/PainelDed.Api/wwwroot/css/estilo.css
git commit -m "feat(guilda): botao e cards editaveis pra sortear desafios da guilda"
```

---

### Task 6: Verificação end-to-end (Playwright) + push final

**Files:** nenhum arquivo novo — só verificação.

- [ ] **Step 1: Rodar a suíte de testes .NET completa**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
Expected: todos os testes passam, incluindo os novos de `RepositorioDesafiosGuilda` e `ServicoGeradorDesafiosGuilda`.

- [ ] **Step 2: Verificação manual/Playwright do fluxo completo**

Com `dotnet run --project src/PainelDed.Api` rodando:
1. Abrir o painel, selecionar/criar uma campanha, ir em "📋 Quadro de Quests".
2. Clicar em "🎲 Sortear Desafios da Guilda".
3. Confirmar que aparecem exatamente 3 cards, cada um com título/descrição/XP/recompensa preenchidos e vindos do banco de 100 (conferir que os títulos batem com algum item de `content/guilda/desafios-guilda.json`).
4. Editar o texto de um card, clicar "Salvar" — confirmar que ele some do modal e aparece como quest de verdade na coluna "Disponível" do quadro, com o texto editado.
5. Clicar "Descartar" num segundo card — confirmar que some sem virar quest.
6. Clicar "Fechar" com o terceiro card ainda aberto — confirmar que o modal fecha sem criar quest nenhuma pro que sobrou.
7. Repetir o sorteio 3-4 vezes seguidas — confirmar que nunca vêm 2 desafios iguais na mesma leva de 3, e que o texto de XP/recompensa varia entre sorteios do mesmo desafio (prova que a rolagem por dificuldade está de fato aleatória, não fixa).

- [ ] **Step 3: Push final**

```bash
git push origin main
```
