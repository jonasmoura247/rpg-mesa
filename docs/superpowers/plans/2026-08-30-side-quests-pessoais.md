# Side Quests Pessoais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada personagem ganha uma "Side Quest" pessoal opcional — o mestre sorteia uma missão pequena e cotidiana de um banco de 100, entrega em segredo (fora do sistema), e marca como concluída ou descartada depois da sessão.

**Architecture:** Banco fixo de 100 itens (`content/side-quests/catalogo.json`), carregado uma vez na inicialização (mesmo padrão de `RepositorioDesafiosGuilda`). `ServicoPersonagens` ganha dois métodos novos que sorteiam/atualizam a side quest de um personagem específico, persistindo no mesmo arquivo de estado da campanha (`Personagem.SideQuestAtual`). Frontend mostra isso como uma seção nova na ficha de cada personagem, na aba Jogadores.

**Tech Stack:** ASP.NET Core minimal API (C#), xUnit, vanilla JS (sem framework), mesmo padrão do resto do painel.

---

### Task 1: Banco de side quests

**Files:**
- Create: `content/side-quests/catalogo.json`

- [ ] **Step 1: Criar a pasta e o arquivo com os 100 itens**

Conteúdo exato de `content/side-quests/catalogo.json`:

```json
[
  { "titulo": "Pescar um peixe", "descricao": "Consiga pescar (ou comprar, ou até roubar) um peixe fresco e entregue a alguém que pediu." },
  { "titulo": "Quebrar uma árvore", "descricao": "Derrube ou quebre um galho grosso só com força bruta, pra provar que consegue." },
  { "titulo": "Enviar uma carta", "descricao": "Escreva e envie uma carta pra alguém de fora da cidade, por qualquer meio disponível." },
  { "titulo": "Aprender um cumprimento", "descricao": "Aprenda uma nova saudação ou expressão de cumprimento em outro idioma ou dialeto." },
  { "titulo": "Trocar de roupa", "descricao": "Troque uma peça de roupa com um estranho por um dia inteiro." },
  { "titulo": "Provar algo novo", "descricao": "Coma ou beba algo que você nunca experimentou antes." },
  { "titulo": "Moeda misteriosa", "descricao": "Dê uma moeda pra um estranho sem explicar o motivo." },
  { "titulo": "Piada pro guarda", "descricao": "Conte uma piada (de preferência ruim) pra um guarda da cidade." },
  { "titulo": "Pena incomum", "descricao": "Encontre uma pena de pássaro de cor ou formato incomum e guarde como lembrança." },
  { "titulo": "Assobiar uma melodia", "descricao": "Aprenda a assobiar uma canção ou melodia popular do lugar." },
  { "titulo": "Flor significativa", "descricao": "Deixe uma flor num lugar que tenha algum significado pessoal pra você." },
  { "titulo": "Histórias de taverna", "descricao": "Troque histórias de viagem com um estranho numa taverna." },
  { "titulo": "Mapa rudimentar", "descricao": "Desenhe um mapa simples do local onde você está agora." },
  { "titulo": "Prender a respiração", "descricao": "Prenda a respiração por um minuto inteiro, com alguém cronometrando." },
  { "titulo": "Ensinar um truque", "descricao": "Ensine um truque simples (mágica de baralho, malabarismo, nó) pra uma criança." },
  { "titulo": "Achado e perdido", "descricao": "Encontre um objeto perdido de alguém e devolva ao dono." },
  { "titulo": "Bebida local", "descricao": "Prove uma bebida típica do lugar que você nunca bebeu antes." },
  { "titulo": "Apelido novo", "descricao": "Escolha um apelido pra si mesmo e use-o por um dia inteiro." },
  { "titulo": "Carga pesada", "descricao": "Ajude um estranho a carregar algo pesado, sem que ele peça." },
  { "titulo": "Três nomes novos", "descricao": "Aprenda o nome de três pessoas que você ainda não conhecia." },
  { "titulo": "Promessa boba", "descricao": "Faça uma promessa boba a si mesmo e cumpra ela até o fim do dia." },
  { "titulo": "Cantar em público", "descricao": "Cante uma música em voz alta em algum lugar público, mesmo desafinando." },
  { "titulo": "Compra inútil", "descricao": "Compre algo completamente inútil só porque achou engraçado ou curioso." },
  { "titulo": "Marca discreta", "descricao": "Deixe seu nome ou símbolo em algum lugar discreto e inofensivo." },
  { "titulo": "Bicho perdido", "descricao": "Encontre um animal de estimação perdido e ajude a reencontrar o dono." },
  { "titulo": "Trocar equipamento", "descricao": "Troque uma peça de equipamento com um companheiro por um dia inteiro." },
  { "titulo": "Pergunta filosófica", "descricao": "Faça uma pergunta filosófica inesperada a um estranho e ouça a resposta." },
  { "titulo": "Contar até cem", "descricao": "Conte até cem numa língua que não seja a sua, ou invente uma própria." },
  { "titulo": "Prato favorito", "descricao": "Descubra qual é o prato favorito de algum morador local." },
  { "titulo": "Gorjeta generosa", "descricao": "Deixe uma gorjeta bem maior que o normal, sem dar explicações." },
  { "titulo": "Nó novo", "descricao": "Aprenda a amarrar um tipo de nó que você não conhecia." },
  { "titulo": "Andar descalço", "descricao": "Ande descalço por pelo menos uma hora, chova ou faça sol." },
  { "titulo": "Item mais caro", "descricao": "Entre numa loja, ache o item mais caro e pergunte o preço, só por curiosidade." },
  { "titulo": "Aposta boba", "descricao": "Faça uma aposta sem importância com um companheiro de jornada." },
  { "titulo": "Sotaque emprestado", "descricao": "Imite o sotaque de outra região por um dia inteiro." },
  { "titulo": "Presente feito à mão", "descricao": "Dê de presente algo que você mesmo fez, coletou ou encontrou pelo caminho." },
  { "titulo": "Superstição local", "descricao": "Aprenda uma superstição ou crendice popular do lugar onde está." },
  { "titulo": "Contar estrelas", "descricao": "Numa noite clara, tente contar quantas estrelas consegue ver." },
  { "titulo": "O mais velho da cidade", "descricao": "Encontre a pessoa mais velha do lugar e puxe conversa com ela." },
  { "titulo": "Pedra bonita", "descricao": "Encontre uma pedra com formato ou cor interessante e guarde com você." },
  { "titulo": "Refeição em silêncio", "descricao": "Faça uma refeição inteira sozinho, sem pressa, só refletindo sobre a jornada." },
  { "titulo": "Nome de uma constelação", "descricao": "Aprenda o nome (real ou inventado por alguém local) de uma constelação." },
  { "titulo": "Travessia gentil", "descricao": "Ajude alguém a atravessar um lugar perigoso ou difícil sem que peçam." },
  { "titulo": "Bilhete anônimo", "descricao": "Deixe um bilhete anônimo de agradecimento pra alguém que fez algo gentil." },
  { "titulo": "Dez minutos de silêncio", "descricao": "Fique em silêncio absoluto por dez minutos seguidos, aconteça o que acontecer." },
  { "titulo": "Mapa desatualizado", "descricao": "Compre um mapa velho e impreciso só por curiosidade de como era o lugar antes." },
  { "titulo": "Arte na terra", "descricao": "Faça um pequeno desenho ou escultura na terra, areia ou neve." },
  { "titulo": "Lenda local", "descricao": "Escute uma lenda ou história contada por um morador do lugar." },
  { "titulo": "Moeda estrangeira", "descricao": "Troque uma moeda de outra região por uma local, só por curiosidade." },
  { "titulo": "Corrida sem motivo", "descricao": "Corra uma curta distância só pelo prazer de correr, sem nenhum motivo prático." },
  { "titulo": "Obrigado em três línguas", "descricao": "Aprenda a dizer 'obrigado' em três idiomas ou dialetos diferentes." },
  { "titulo": "Companhia na taverna", "descricao": "Faça companhia a alguém que está bebendo sozinho numa taverna." },
  { "titulo": "Sombra interessante", "descricao": "Encontre uma sombra com formato curioso e descreva o que ela parece ser." },
  { "titulo": "Galho seco", "descricao": "Quebre um galho seco só pelo estalo que ele faz." },
  { "titulo": "Doce típico", "descricao": "Experimente um doce ou sobremesa típica do lugar." },
  { "titulo": "Cheiro de flor", "descricao": "Cheire uma flor ou erva que você nunca tinha sentido antes." },
  { "titulo": "Acender uma fogueira", "descricao": "Ajude a acender ou manter uma fogueira ou lareira de alguém." },
  { "titulo": "Comida pro bicho de rua", "descricao": "Dê comida a um animal de rua que encontrar pelo caminho." },
  { "titulo": "História de viajante", "descricao": "Escute com atenção a história de vida de um viajante desconhecido." },
  { "titulo": "Receita simples", "descricao": "Aprenda uma receita simples de comida com um morador local." },
  { "titulo": "Boa ação anônima", "descricao": "Faça uma pequena boa ação sem deixar ninguém saber que foi você." },
  { "titulo": "Mensagem escondida", "descricao": "Esconda uma mensagem em algum lugar pra alguém encontrar por acaso no futuro." },
  { "titulo": "Memória de infância", "descricao": "Compartilhe uma memória de infância com um companheiro de jornada." },
  { "titulo": "Inseto curioso", "descricao": "Encontre um inseto interessante e observe ele por um momento antes de seguir." },
  { "titulo": "Jogo local", "descricao": "Aprenda a jogar um jogo de mesa, dados ou cartas típico do lugar." },
  { "titulo": "Aposta de habilidade", "descricao": "Faça uma aposta amistosa de habilidade com alguém (mira, força, agilidade)." },
  { "titulo": "Lembrança de taverna", "descricao": "Guarde algum objeto pequeno de uma taverna como lembrança da visita." },
  { "titulo": "Equilíbrio na cabeça", "descricao": "Tente equilibrar um objeto na cabeça por meio minuto sem deixar cair." },
  { "titulo": "Pedra redonda perfeita", "descricao": "Encontre a pedra mais redonda e lisa que conseguir na natureza." },
  { "titulo": "Convite espontâneo", "descricao": "Convide um estranho pra se juntar a você numa refeição." },
  { "titulo": "Símbolo local", "descricao": "Descubra o significado de um símbolo, brasão ou bandeira local." },
  { "titulo": "Elogio sincero", "descricao": "Troque um elogio sincero e específico com um desconhecido." },
  { "titulo": "Folha interessante", "descricao": "Guarde uma folha caída com formato ou cor incomum." },
  { "titulo": "Mentira inofensiva", "descricao": "Conte uma mentira pequena e inofensiva só pra ver se alguém acredita." },
  { "titulo": "Consertar algo pequeno", "descricao": "Ajude a consertar um objeto pequeno e quebrado de alguém." },
  { "titulo": "Anotação no diário", "descricao": "Escreva uma anotação sincera sobre como foi o seu dia." },
  { "titulo": "Fase da lua", "descricao": "Observe o céu à noite e identifique em que fase está a lua." },
  { "titulo": "Comida picante", "descricao": "Experimente algo bem picante e reaja com total honestidade." },
  { "titulo": "Construção antiga", "descricao": "Encontre uma ponte, escada ou muro antigo e admire como foi construído." },
  { "titulo": "Gesto de cortesia", "descricao": "Faça um gesto pequeno de cortesia com um completo desconhecido." },
  { "titulo": "Sonho de vida", "descricao": "Pergunte a alguém qual é o maior sonho de vida dessa pessoa." },
  { "titulo": "Talismã da natureza", "descricao": "Guarde uma concha, pedra ou item natural como uma espécie de talismã." },
  { "titulo": "Provérbio local", "descricao": "Aprenda um provérbio ou frase de efeito típica do lugar." },
  { "titulo": "Companhia animal", "descricao": "Passe um tempo fazendo companhia a um animal (cão, gato, cavalo)." },
  { "titulo": "Sorte no jogo", "descricao": "Tente a sorte numa aposta bem pequena e sem risco real." },
  { "titulo": "Carta nunca enviada", "descricao": "Escreva uma carta que você nunca vai enviar, só pra desabafar." },
  { "titulo": "Manutenção do equipamento", "descricao": "Faça uma pequena manutenção no seu próprio equipamento (afiar, remendar, limpar)." },
  { "titulo": "Nome da planta", "descricao": "Descubra o nome de uma árvore ou planta que você não reconhece." },
  { "titulo": "Promessa de equipe", "descricao": "Faça uma promessa simples a um companheiro de jornada." },
  { "titulo": "Não rir primeiro", "descricao": "Conte uma piada pra alguém e tente não ser o primeiro a rir." },
  { "titulo": "Minutos de quietude", "descricao": "Encontre um lugar tranquilo e fique alguns minutos só respirando e observando." },
  { "titulo": "Desenho de memória", "descricao": "Tente desenhar algo de memória, sem olhar pro objeto real." },
  { "titulo": "Dança simples", "descricao": "Aprenda um passo de dança simples e típico do lugar." },
  { "titulo": "Objeto de jornada", "descricao": "Guarde um pequeno objeto encontrado durante a jornada como lembrança dela." },
  { "titulo": "Favor ao comerciante", "descricao": "Faça um pequeno favor a um comerciante sem cobrar nada em troca." },
  { "titulo": "Criança perdida", "descricao": "Ajude uma criança perdida a reencontrar os responsáveis por ela." },
  { "titulo": "Chá ou infusão", "descricao": "Experimente um chá ou infusão típica que você nunca tinha provado." },
  { "titulo": "Fazer as pazes", "descricao": "Faça as pazes com alguém depois de um pequeno desentendimento." },
  { "titulo": "Nome dos ventos", "descricao": "Pergunte a um morador local o nome que eles dão aos ventos ou estações." },
  { "titulo": "Roupa emprestada", "descricao": "Empreste uma peça sua a alguém que precise, mesmo sem conhecer a pessoa." }
]
```

- [ ] **Step 2: Validar o JSON**

Run: `python -c "import json; d=json.load(open('content/side-quests/catalogo.json',encoding='utf-8')); print(len(d)); titulos=[x['titulo'] for x in d]; print('dup:', len(titulos)-len(set(titulos)))"`
Expected: `100`, `dup: 0`

- [ ] **Step 3: Commit**

```bash
git add content/side-quests/catalogo.json
git commit -m "feat(side-quests): adiciona banco de 100 side quests pessoais"
```

---

### Task 2: Modelos + `RepositorioSideQuests`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Create: `src/PainelDed.Api/Campanhas/LocalizadorConteudoSideQuests.cs`
- Create: `src/PainelDed.Api/Campanhas/RepositorioSideQuests.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/RepositorioSideQuestsTestes.cs`

- [ ] **Step 1: Adicionar os records em `Modelos.cs`**

Logo após o record `MonstroCombate` (adicionado pela feature de combate), adicione:

```csharp
public record SideQuestCatalogo(string Titulo, string Descricao);

public record SideQuestPersonagem(string Titulo, string Descricao, int XpSugerido, string Status);
```

E adicione `SideQuestAtual` como o ÚLTIMO parâmetro do record `Personagem` (não em `ImportarPersonagemRequisicao` — essa side quest é gerenciada inteiramente pelo backend, o creator nunca produz esse campo):

```csharp
SideQuestPersonagem? SideQuestAtual = null);
```

(ou seja: pegue a lista de parâmetros existente de `Personagem`, que termina em `List<MagiaPersonagem>? MagiasConhecidas = null);`, e adicione `SideQuestPersonagem? SideQuestAtual = null` depois desse, ajustando o `);` de fechamento pra ficar só no último parâmetro novo).

- [ ] **Step 2: Escrever os testes (falhando)**

Crie `tests/PainelDed.Api.Testes/Campanhas/RepositorioSideQuestsTestes.cs`:

```csharp
using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioSideQuestsTestes
{
    [Fact]
    public void CarregarDeArquivo_ComBancoReal_Carrega100ItensComTituloEDescricao()
    {
        var caminho = LocalizadorConteudoSideQuests.Localizar(AppContext.BaseDirectory);

        var repositorio = RepositorioSideQuests.CarregarDeArquivo(caminho);

        Assert.Equal(100, repositorio.Todos.Count);
        Assert.All(repositorio.Todos, s => Assert.False(string.IsNullOrWhiteSpace(s.Titulo)));
        Assert.All(repositorio.Todos, s => Assert.False(string.IsNullOrWhiteSpace(s.Descricao)));
    }

    [Fact]
    public void CarregarDeArquivo_ComArquivoDeTeste_CarregaOsItensNaOrdem()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario,
            "[{\"titulo\":\"A\",\"descricao\":\"desc A\"},{\"titulo\":\"B\",\"descricao\":\"desc B\"}]");

        try
        {
            var repositorio = RepositorioSideQuests.CarregarDeArquivo(caminhoTemporario);

            Assert.Equal(2, repositorio.Todos.Count);
            Assert.Equal("A", repositorio.Todos[0].Titulo);
            Assert.Equal("desc B", repositorio.Todos[1].Descricao);
        }
        finally
        {
            File.Delete(caminhoTemporario);
        }
    }
}
```

- [ ] **Step 3: Rodar os testes e confirmar que falham (classe não existe)**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter RepositorioSideQuestsTestes`
Expected: erro de compilação.

- [ ] **Step 4: Criar `LocalizadorConteudoSideQuests.cs`**

```csharp
namespace PainelDed.Api.Campanhas;

// Mesma estratégia de LocalizadorConteudoGuilda: sobe a árvore de diretórios a partir
// do ponto de partida até achar o arquivo, robusto tanto rodando via `dotnet run`
// quanto nos testes de integração (ContentRootPath varia conforme quem hospeda).
public static class LocalizadorConteudoSideQuests
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            var candidato = Path.Combine(diretorio.FullName, "content", "side-quests", "catalogo.json");
            if (File.Exists(candidato))
            {
                return candidato;
            }

            diretorio = diretorio.Parent;
        }

        throw new FileNotFoundException(
            $"Não foi possível localizar 'content/side-quests/catalogo.json' subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
```

- [ ] **Step 5: Criar `RepositorioSideQuests.cs`**

```csharp
using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioSideQuests
{
    private readonly List<SideQuestCatalogo> _itens;

    private RepositorioSideQuests(List<SideQuestCatalogo> itens)
    {
        _itens = itens;
    }

    public IReadOnlyList<SideQuestCatalogo> Todos => _itens;

    public static RepositorioSideQuests CarregarDeArquivo(string caminhoArquivo)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var json = File.ReadAllText(caminhoArquivo);
        var itens = JsonSerializer.Deserialize<List<SideQuestCatalogo>>(json, opcoes)
            ?? throw new InvalidOperationException($"Falha ao carregar side quests de {caminhoArquivo}");

        return new RepositorioSideQuests(itens);
    }
}
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter RepositorioSideQuestsTestes`
Expected: PASS (2/2)

- [ ] **Step 7: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs src/PainelDed.Api/Campanhas/LocalizadorConteudoSideQuests.cs src/PainelDed.Api/Campanhas/RepositorioSideQuests.cs tests/PainelDed.Api.Testes/Campanhas/RepositorioSideQuestsTestes.cs
git commit -m "feat(side-quests): adiciona modelos e RepositorioSideQuests"
```

---

### Task 3: `ServicoPersonagens` — sortear e atualizar side quest

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`

**ATENÇÃO — leia isso antes de editar `ServicoPersonagensTestes.cs`:** o construtor de `ServicoPersonagens` vai ganhar dois parâmetros novos (`RepositorioSideQuests`, `IDado`). Isso quebra a construção do `_servico` no `ServicoPersonagensTestes()` (o construtor de teste, chamado antes de CADA teste da classe) — você precisa atualizar essa linha, senão TODOS os testes existentes desse arquivo (não só os novos) vão parar de compilar. Não pule isso.

- [ ] **Step 1: Escrever os testes novos (falhando) e corrigir a construção existente**

Abra `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`. No topo do arquivo, adicione (se ainda não tiver) `using PainelDed.Api.Testes.Rolagem;` (pra reaproveitar o dublê `DadoFixo` já usado por outros testes do projeto) e `using PainelDed.Nucleo.Rolagem;`.

Modifique o construtor `ServicoPersonagensTestes()` — ele hoje é:
```csharp
    public ServicoPersonagensTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-personagens-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);
        _servico = new ServicoPersonagens(_repositorio);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }
```

Troque pra:
```csharp
    public ServicoPersonagensTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-personagens-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);

        var arquivoSideQuests = Path.Combine(_pastaTemporaria, "side-quests.json");
        Directory.CreateDirectory(_pastaTemporaria);
        File.WriteAllText(arquivoSideQuests,
            "[{\"titulo\":\"Pescar um peixe\",\"descricao\":\"Pesque um peixe fresco.\"}," +
            "{\"titulo\":\"Enviar uma carta\",\"descricao\":\"Envie uma carta a alguem.\"}]");
        _repositorioSideQuests = RepositorioSideQuests.CarregarDeArquivo(arquivoSideQuests);

        _dado = new DadoFixo(1);
        _servico = new ServicoPersonagens(_repositorio, _repositorioSideQuests, _dado);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }
```

E adicione dois campos privados novos na classe, junto dos existentes (`_pastaTemporaria`, `_repositorio`, `_servico`, `_campanhaId`):
```csharp
    private readonly RepositorioSideQuests _repositorioSideQuests;
    private readonly IDado _dado;
```

Adicione estes 6 testes novos no final da classe, antes do `}` de fechamento:

```csharp
    [Fact]
    public void SortearSideQuest_ComPersonagemExistente_AtribuiItemDoCatalogoComStatusPendente()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var atualizado = _servico.SortearSideQuest(_campanhaId, criado.Id);

        Assert.NotNull(atualizado);
        Assert.NotNull(atualizado!.SideQuestAtual);
        Assert.Equal("Pescar um peixe", atualizado.SideQuestAtual!.Titulo); // DadoFixo(1) -> índice 0
        Assert.Equal("Pesque um peixe fresco.", atualizado.SideQuestAtual.Descricao);
        Assert.Equal("pendente", atualizado.SideQuestAtual.Status);
        Assert.True(atualizado.SideQuestAtual.XpSugerido > 0);
    }

    [Fact]
    public void SortearSideQuest_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.SortearSideQuest("nao-existe", "qualquer-id"));
    }

    [Fact]
    public void SortearSideQuest_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.SortearSideQuest(_campanhaId, "nao-existe"));
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComSideQuestPendente_MudaSoOStatus()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;
        _servico.SortearSideQuest(_campanhaId, criado.Id);

        var atualizado = _servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "concluida");

        Assert.NotNull(atualizado);
        Assert.Equal("concluida", atualizado!.SideQuestAtual!.Status);
        Assert.Equal("Pescar um peixe", atualizado.SideQuestAtual.Titulo); // título/descrição/XP preservados
    }

    [Fact]
    public void AtualizarStatusSideQuest_SemSideQuestAtiva_RetornaNulo()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        Assert.Null(_servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "concluida"));
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.AtualizarStatusSideQuest(_campanhaId, "nao-existe", "concluida"));
    }
```

- [ ] **Step 2: Rodar os testes e confirmar que falham (classe não compila ainda)**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter ServicoPersonagensTestes`
Expected: erro de compilação — `SortearSideQuest`/`AtualizarStatusSideQuest` não existem, construtor de `ServicoPersonagens` não bate com a assinatura nova ainda.

- [ ] **Step 3: Modificar `ServicoPersonagens.cs`**

Atualize o construtor:

```csharp
public class ServicoPersonagens
{
    private readonly RepositorioCampanhas _repositorio;
    private readonly RepositorioSideQuests _repositorioSideQuests;
    private readonly IDado _dado;

    public ServicoPersonagens(RepositorioCampanhas repositorio, RepositorioSideQuests repositorioSideQuests, IDado dado)
    {
        _repositorio = repositorio;
        _repositorioSideQuests = repositorioSideQuests;
        _dado = dado;
    }
```

Adicione `using PainelDed.Nucleo.Rolagem;` no topo do arquivo (pra `IDado`).

Adicione os dois métodos novos no final da classe, antes do `}` de fechamento:

```csharp
    public Personagem? SortearSideQuest(string campanhaId, string personagemId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Id == personagemId);
        if (existente is null)
        {
            return null;
        }

        var itens = _repositorioSideQuests.Todos;
        var escolhido = itens[_dado.Rolar($"1d{itens.Count}") - 1];
        var xp = _dado.Rolar("1d6") * 5;

        var atualizado = existente with
        {
            SideQuestAtual = new SideQuestPersonagem(escolhido.Titulo, escolhido.Descricao, xp, "pendente")
        };

        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });
        return atualizado;
    }

    public Personagem? AtualizarStatusSideQuest(string campanhaId, string personagemId, string novoStatus)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Id == personagemId);
        if (existente is null || existente.SideQuestAtual is null)
        {
            return null;
        }

        var atualizado = existente with
        {
            SideQuestAtual = existente.SideQuestAtual with { Status = novoStatus }
        };

        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });
        return atualizado;
    }
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj --filter ServicoPersonagensTestes`
Expected: PASS (todos, incluindo os 6 novos e os que já existiam antes — confirme que nenhum teste antigo quebrou por causa da mudança no construtor).

- [ ] **Step 5: Rodar a suíte completa**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
Expected: todos os testes passam (nada mais no projeto instancia `ServicoPersonagens` diretamente além desse arquivo de teste e do `Program.cs`, que será ajustado na Task 4).

- [ ] **Step 6: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
git commit -m "feat(side-quests): adiciona SortearSideQuest e AtualizarStatusSideQuest"
```

---

### Task 4: Wiring no `Program.cs`

**Files:**
- Modify: `src/PainelDed.Api/Program.cs`

- [ ] **Step 1: Registrar o repositório novo**

Logo abaixo do registro de `RepositorioMonstrosCombate` (da feature de combate):

```csharp
builder.Services.AddSingleton(RepositorioSideQuests.CarregarDeArquivo(
    LocalizadorConteudoSideQuests.Localizar(builder.Environment.ContentRootPath)));
```

Não precisa mudar a linha `builder.Services.AddSingleton<ServicoPersonagens>();` — o container de DI resolve os parâmetros novos do construtor (`RepositorioSideQuests`, `IDado`) automaticamente, já que os dois já estão registrados (o `IDado` já é registrado bem no início do arquivo pra outras features).

- [ ] **Step 2: Adicionar os dois endpoints novos**

Logo depois do endpoint existente `POST /api/campanhas/{campanhaId}/personagens/importar`:

```csharp
app.MapPost("/api/campanhas/{campanhaId}/personagens/{personagemId}/side-quest/sortear", (string campanhaId, string personagemId, ServicoPersonagens servico) =>
{
    var personagem = servico.SortearSideQuest(campanhaId, personagemId);
    return personagem is null ? Results.NotFound() : Results.Ok(personagem);
});

app.MapPut("/api/campanhas/{campanhaId}/personagens/{personagemId}/side-quest/status", (string campanhaId, string personagemId, AtualizarStatusSideQuestRequisicao requisicao, ServicoPersonagens servico) =>
{
    var personagem = servico.AtualizarStatusSideQuest(campanhaId, personagemId, requisicao.Status);
    return personagem is null ? Results.NotFound() : Results.Ok(personagem);
});
```

- [ ] **Step 3: Adicionar o record de requisição em `Modelos.cs`**

Logo após o record `ImportarPersonagemRequisicao`:

```csharp
public record AtualizarStatusSideQuestRequisicao(string Status);
```

- [ ] **Step 4: Rodar toda a suíte de testes**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
Expected: todos os testes passam.

- [ ] **Step 5: Rodar a API localmente e verificar os endpoints manualmente**

1. Rode `dotnet run --project src/PainelDed.Api`.
2. Crie uma campanha e importe um personagem (via `/creator` ou diretamente por `POST /api/campanhas/{id}/personagens/importar` com um JSON de exemplo).
3. `POST /api/campanhas/{id}/personagens/{personagemId}/side-quest/sortear` → confirme 200 com o personagem retornando `sideQuestAtual` preenchido (`titulo`, `descricao`, `xpSugerido`, `status: "pendente"`).
4. `PUT /api/campanhas/{id}/personagens/{personagemId}/side-quest/status` com body `{"status":"concluida"}` → confirme 200 com `sideQuestAtual.status` atualizado, título/descrição/XP preservados.
5. Chame sortear de novo → confirme que substitui a side quest anterior por uma nova (pode ser a mesma, já que é aleatório, mas o status volta pra `"pendente"`).
6. Teste `personagemId` inexistente em ambos os endpoints → confirme 404.
7. Pare o processo no final.

- [ ] **Step 6: Commit**

```bash
git add src/PainelDed.Api/Program.cs src/PainelDed.Api/Campanhas/Modelos.cs
git commit -m "feat(side-quests): registra repositorio e adiciona endpoints de sortear/atualizar side quest"
```

---

### Task 5: Frontend — seção Side Quest na ficha do personagem

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`
- Modify: `src/PainelDed.Api/wwwroot/js/personagens.js`
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

Antes de implementar, leia `src/PainelDed.Api/wwwroot/js/personagens.js` inteiro — a seção nova vai entrar dentro de `exibirDetalhe`, logo depois do bloco de Magias e antes do bloco de História (mesmo padrão dos blocos condicionais já existentes: `if (personagem.campo) { ... cria elementos ... }`).

- [ ] **Step 1: Adicionar os métodos novos em `api.js`**, logo abaixo de `importarPersonagem`:

```javascript
  async sortearSideQuest(campanhaId, personagemId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens/${personagemId}/side-quest/sortear`, { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao sortear side quest');
    return resposta.json();
  },

  async atualizarStatusSideQuest(campanhaId, personagemId, status) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens/${personagemId}/side-quest/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!resposta.ok) throw new Error('Falha ao atualizar side quest');
    return resposta.json();
  },
```

- [ ] **Step 2: Adicionar a seção "Side Quest" em `exibirDetalhe`**, logo depois do bloco de Magias (`criarListaMagias('Magias de 1º Círculo', ...)` e o `}` que fecha o `if (personagem.magiasConhecidas...)`) e antes do bloco `if (personagem.historia) { ... }`:

```javascript
    const tituloSideQuest = document.createElement('h4');
    tituloSideQuest.textContent = 'Side Quest';
    detalhe.appendChild(tituloSideQuest);

    const containerSideQuest = document.createElement('div');
    containerSideQuest.className = 'side-quest-ficha';

    if (personagem.sideQuestAtual && personagem.sideQuestAtual.status === 'pendente') {
      const sq = personagem.sideQuestAtual;

      const linhaTitulo = document.createElement('p');
      const negrito = document.createElement('strong');
      negrito.textContent = `${sq.titulo} `;
      linhaTitulo.appendChild(negrito);
      linhaTitulo.appendChild(document.createTextNode(`(XP sugerido: ${sq.xpSugerido})`));
      containerSideQuest.appendChild(linhaTitulo);

      const descricao = document.createElement('p');
      descricao.className = 'texto-livre-ficha';
      descricao.textContent = sq.descricao;
      containerSideQuest.appendChild(descricao);

      const acoes = document.createElement('div');
      acoes.className = 'acoes-side-quest';

      const botaoConcluir = document.createElement('button');
      botaoConcluir.className = 'botao-rolar';
      botaoConcluir.textContent = '✅ Concluída';
      botaoConcluir.addEventListener('click', async () => {
        botaoConcluir.disabled = true;
        try {
          await Api.atualizarStatusSideQuest(Campanha.ativa.id, personagem.id, 'concluida');
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao atualizar a side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
      });
      acoes.appendChild(botaoConcluir);

      const botaoDescartar = document.createElement('button');
      botaoDescartar.className = 'botao-secundario';
      botaoDescartar.textContent = '❌ Descartar';
      botaoDescartar.addEventListener('click', async () => {
        botaoDescartar.disabled = true;
        try {
          await Api.atualizarStatusSideQuest(Campanha.ativa.id, personagem.id, 'descartada');
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao atualizar a side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
      });
      acoes.appendChild(botaoDescartar);

      containerSideQuest.appendChild(acoes);
    } else {
      const botaoSortear = document.createElement('button');
      botaoSortear.className = 'botao-rolar';
      botaoSortear.textContent = '🎲 Sortear Side Quest';
      botaoSortear.addEventListener('click', async () => {
        botaoSortear.disabled = true;
        try {
          await Api.sortearSideQuest(Campanha.ativa.id, personagem.id);
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao sortear side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
      });
      containerSideQuest.appendChild(botaoSortear);
    }

    detalhe.appendChild(containerSideQuest);
```

Note que `exibirDetalhe(personagemId, cartaoSelecionado)` tem `cartaoSelecionado` como segundo parâmetro opcional — ao chamar `this.exibirDetalhe(personagem.id)` de dentro dos listeners acima, o card selecionado na lista à esquerda não é re-passado, então a função vai limpar a seleção visual (`document.querySelectorAll('.cartao-personagem.selecionado').forEach(...)` roda mesmo sem `cartaoSelecionado`, então nenhum card fica marcado como selecionado depois — isso é uma pequena regressão visual aceitável nesta fase, não bloqueante).

- [ ] **Step 3: Adicionar CSS pro container de ações da side quest**, logo depois de `.log-combate` em `estilo.css` (ou qualquer lugar razoável do arquivo):

```css
.acoes-side-quest {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
}
```

- [ ] **Step 4: Verificação manual (Playwright ou navegador real)**

1. Rode a API, abra a aba Jogadores, clique num personagem.
2. Confirme que aparece a seção "Side Quest" com o botão "🎲 Sortear Side Quest" (personagem ainda não tem nenhuma).
3. Clique — confirme que a ficha recarrega mostrando título, descrição e XP sugerido de uma side quest real do banco de 100, com os botões "✅ Concluída" e "❌ Descartar".
4. Clique "✅ Concluída" — confirme que a ficha recarrega e volta a mostrar o botão "🎲 Sortear Side Quest" (já que o status não é mais `"pendente"`).
5. Sorteie de novo, dessa vez clique "❌ Descartar" — confirme o mesmo comportamento (volta pro botão de sortear).
6. Sorteie mais uma vez e recarregue a página inteira (F5) — confirme que a side quest pendente continua lá (prova que está persistindo no arquivo de estado da campanha, não só em memória).

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/api.js src/PainelDed.Api/wwwroot/js/personagens.js src/PainelDed.Api/wwwroot/css/estilo.css
git commit -m "feat(side-quests): secao Side Quest na ficha do personagem"
```

---

### Task 6: Verificação final e push

**Files:** nenhum arquivo novo — só verificação.

- [ ] **Step 1: Rodar a suíte de testes .NET completa**

Run: `dotnet test tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
Expected: todos os testes passam.

- [ ] **Step 2: Rodar os testes JS do creator (garantir que nada foi afetado por engano)**

Run: `cd docs/creator/js && node dados.test.js && node calculo.test.js && node magias.test.js`
Expected: todos OK.

- [ ] **Step 3: Verificação end-to-end final**

Com a API rodando: importe (ou reaproveite) 2-3 personagens numa campanha, sorteie side quests diferentes pra cada um, confirme que cada ficha mostra a sua própria side quest independente das outras (não vaza entre personagens). Marque uma como concluída, outra como descartada, deixe uma pendente. Recarregue a página e confirme que os três estados persistiram corretamente.

- [ ] **Step 4: Push final**

```bash
git push origin main
```
