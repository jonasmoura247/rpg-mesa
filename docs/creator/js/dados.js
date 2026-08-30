(function (raiz) {
  const PERICIAS = [
    { nome: 'Atletismo', atributo: 'forca', descricao: 'Escalar, saltar, nadar e outras proezas físicas de força.' },
    { nome: 'Acrobacia', atributo: 'destreza', descricao: 'Manter o equilíbrio e sair de situações fisicamente complicadas com agilidade.' },
    { nome: 'Furtividade', atributo: 'destreza', descricao: 'Esconder-se e se mover sem ser visto ou ouvido.' },
    { nome: 'Prestidigitacao', atributo: 'destreza', descricao: 'Trapaças manuais, roubar bolsos, esconder objetos e outros truques com as mãos.' },
    { nome: 'Arcanismo', atributo: 'inteligencia', descricao: 'Conhecimento sobre magia, itens mágicos e planos de existência.' },
    { nome: 'Historia', atributo: 'inteligencia', descricao: 'Conhecimento sobre eventos históricos, povos, reinos e guerras passadas.' },
    { nome: 'Investigacao', atributo: 'inteligencia', descricao: 'Deduzir pistas, encontrar detalhes escondidos e juntar informações.' },
    { nome: 'Natureza', atributo: 'inteligencia', descricao: 'Conhecimento sobre terrenos, plantas, animais e o clima.' },
    { nome: 'Religiao', atributo: 'inteligencia', descricao: 'Conhecimento sobre deuses, ritos, símbolos sagrados e práticas religiosas.' },
    { nome: 'Adestramento', atributo: 'sabedoria', descricao: 'Acalmar, treinar e entender o comportamento de animais.' },
    { nome: 'Intuicao', atributo: 'sabedoria', descricao: 'Perceber as reais intenções de alguém e detectar mentiras pelo comportamento.' },
    { nome: 'Medicina', atributo: 'sabedoria', descricao: 'Estabilizar feridos, diagnosticar doenças e identificar causas de morte.' },
    { nome: 'Percepcao', atributo: 'sabedoria', descricao: 'Notar detalhes, perigos e coisas escondidas ao redor.' },
    { nome: 'Sobrevivencia', atributo: 'sabedoria', descricao: 'Rastrear, encontrar comida e água, e se orientar em ambientes selvagens.' },
    { nome: 'Atuacao', atributo: 'carisma', descricao: 'Entreter uma plateia com música, dança, atuação ou contação de histórias.' },
    { nome: 'Engano', atributo: 'carisma', descricao: 'Mentir de forma convincente e disfarçar suas verdadeiras intenções.' },
    { nome: 'Intimidacao', atributo: 'carisma', descricao: 'Influenciar alguém através de ameaças, hostilidade ou força de vontade.' },
    { nome: 'Persuasao', atributo: 'carisma', descricao: 'Convencer alguém através de tato, boas maneiras ou bons argumentos.' }
  ];

  const CUSTO_POINT_BUY = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const ORCAMENTO_PONTOS = 27;
  const ATRIBUTO_MINIMO = 8;
  const ATRIBUTO_MAXIMO = 15;

  const RACAS = [
    { nome: 'Humano', bonus: { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 },
      descricao: 'Adaptáveis e ambiciosos, os humanos são a raça mais numerosa e versátil, com um pouco de talento em tudo.',
      tracos: [
        { nome: 'Versátil', descricao: 'Fala, lê e escreve Comum e mais um idioma à escolha.' }
      ] },
    { nome: 'Anão da Colina', bonus: { constituicao: 2, sabedoria: 1 },
      descricao: 'Anões resistentes e perceptivos, com instintos aguçados forjados em sociedades subterrâneas antigas.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliência Anã', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' },
        { nome: 'Treinamento de Combate Anão', descricao: 'Proficiência com machado de guerra, machadinha, martelo leve e malho.' },
        { nome: 'Perspicácia Anã', descricao: '+1 ponto de vida máximo para cada nível do personagem.' },
        { nome: 'Proficiência com Ferramentas', descricao: 'Proficiência com um tipo de ferramenta de artesão à escolha: ferreiro, cervejeiro ou pedreiro.' },
        { nome: 'Afinidade com a Pedra', descricao: 'Soma o dobro do bônus de proficiência em testes de História relacionados à origem de trabalhos em pedra, mesmo sem proficiência.' }
      ] },
    { nome: 'Anão da Montanha', bonus: { constituicao: 2, forca: 2 },
      descricao: 'Anões fortes e habituados à armadura pesada, vindos de fortalezas talhadas na rocha.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliência Anã', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' },
        { nome: 'Treinamento de Combate Anão', descricao: 'Proficiência com machado de guerra, machadinha, martelo leve e malho.' },
        { nome: 'Treinamento com Armadura', descricao: 'Proficiência com armaduras leves e médias.' },
        { nome: 'Proficiência com Ferramentas', descricao: 'Proficiência com um tipo de ferramenta de artesão à escolha: ferreiro, cervejeiro ou pedreiro.' },
        { nome: 'Afinidade com a Pedra', descricao: 'Soma o dobro do bônus de proficiência em testes de História relacionados à origem de trabalhos em pedra, mesmo sem proficiência.' }
      ] },
    { nome: 'Elfo Alto', bonus: { destreza: 2, inteligencia: 1 },
      descricao: 'Elfos graciosos com afinidade natural pela magia arcana e memória precisa.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Sentidos Aguçados', descricao: 'Proficiência em Percepção.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Transe', descricao: 'Não precisa dormir; medita profundamente por 4 horas ao dia para obter o mesmo benefício de um descanso longo.' },
        { nome: 'Truque Élfico', descricao: 'Conhece um truque (cantrip) de Magista à escolha.' },
        { nome: 'Treinamento com Armas Élficas', descricao: 'Proficiência com espada longa, espada curta, arco curto e arco longo.' }
      ] },
    { nome: 'Elfo da Floresta', bonus: { destreza: 2, sabedoria: 1 },
      descricao: 'Elfos ágeis e furtivos, criados entre as árvores, com sentidos aguçados para a natureza.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Sentidos Aguçados', descricao: 'Proficiência em Percepção.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Transe', descricao: 'Não precisa dormir; medita profundamente por 4 horas ao dia para obter o mesmo benefício de um descanso longo.' },
        { nome: 'Passo Élfico', descricao: 'Deslocamento base de 10,5 metros.' },
        { nome: 'Máscara da Natureza', descricao: 'Pode tentar se esconder mesmo levemente obscurecido por folhagem, chuva forte, neve, névoa ou outro fenômeno natural.' },
        { nome: 'Treinamento com Armas Élficas', descricao: 'Proficiência com espada longa, espada curta, arco curto e arco longo.' }
      ] },
    { nome: 'Elfo Negro (Drow)', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Elfos de vida subterrânea, ágeis e carismáticos, acostumados à escuridão e à intriga.',
      tracos: [
        { nome: 'Visão no Escuro Superior', descricao: 'Enxerga no escuro até 36 metros.' },
        { nome: 'Sensibilidade à Luz do Sol', descricao: 'Desvantagem em testes de ataque e de Percepção baseados em visão sob luz solar direta.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Magia Drow', descricao: 'Conhece o truque Luzes Dançantes; a partir do nível 3 pode lançar Fogo Feérico 1x/dia, e a partir do nível 5, Escuridão 1x/dia (Carisma como atributo de conjuração).' },
        { nome: 'Treinamento com Armas Drow', descricao: 'Proficiência com rapieira, espada curta e besta de mão.' }
      ] },
    { nome: 'Halfling Pés Leves', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Pequenos e discretos, hábeis em passar despercebidos e fazer amizade com estranhos.',
      tracos: [
        { nome: 'Sortudo', descricao: 'Ao tirar 1 num d20 para um teste de ataque, de habilidade ou de resistência, pode rolar de novo e deve usar o novo resultado.' },
        { nome: 'Corajoso', descricao: 'Vantagem em testes de resistência contra ficar amedrontado.' },
        { nome: 'Agilidade Halfling', descricao: 'Pode se mover através do espaço de qualquer criatura de tamanho maior que o dele.' },
        { nome: 'Furtivo por Natureza', descricao: 'Pode tentar se esconder mesmo estando apenas atrás de uma criatura pelo menos um tamanho maior.' }
      ] },
    { nome: 'Halfling Robusto', bonus: { destreza: 2, constituicao: 1 },
      descricao: 'Halflings resistentes, com constituição mais forte que a média da sua raça.',
      tracos: [
        { nome: 'Sortudo', descricao: 'Ao tirar 1 num d20 para um teste de ataque, de habilidade ou de resistência, pode rolar de novo e deve usar o novo resultado.' },
        { nome: 'Corajoso', descricao: 'Vantagem em testes de resistência contra ficar amedrontado.' },
        { nome: 'Agilidade Halfling', descricao: 'Pode se mover através do espaço de qualquer criatura de tamanho maior que o dele.' },
        { nome: 'Resiliência Robusta', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' }
      ] },
    { nome: 'Draconato', bonus: { forca: 2, carisma: 1 },
      descricao: 'Descendentes de dragões, orgulhosos e imponentes, com um sopro elemental herdado da linhagem.',
      tracos: [
        { nome: 'Ancestralidade Dracônica', descricao: 'Determina o tipo de dano da Arma de Sopro e a resistência a dano (ex: linhagem vermelha = fogo).' },
        { nome: 'Arma de Sopro', descricao: 'Como ação, expele energia destrutiva do tipo da ancestralidade (dano e área conforme o nível; teste de resistência de Constituição ou Destreza).' },
        { nome: 'Resistência a Dano', descricao: 'Resistência ao tipo de dano associado à ancestralidade dracônica.' }
      ] },
    { nome: 'Gnomo da Floresta', bonus: { inteligencia: 2, destreza: 1 },
      descricao: 'Gnomos curiosos e ágeis, com talento natural para ilusões e comunicação com pequenos animais.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Astúcia Gnômica', descricao: 'Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia.' },
        { nome: 'Ilusionista Natural', descricao: 'Conhece o truque Ilusão Menor (Inteligência como atributo de conjuração).' },
        { nome: 'Falar com Pequenos Animais', descricao: 'Consegue se comunicar de forma simples com bestas pequenas.' }
      ] },
    { nome: 'Gnomo das Rochas', bonus: { inteligencia: 2, constituicao: 1 },
      descricao: 'Gnomos inventivos e resistentes, hábeis com mecanismos e engenhocas.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Astúcia Gnômica', descricao: 'Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia.' },
        { nome: 'Conhecimento de Artífice', descricao: 'Soma o dobro do bônus de proficiência em testes de História relacionados a itens mágicos, mecanismos ou alquímicos, mesmo sem proficiência.' },
        { nome: 'Engenhoqueiro', descricao: 'Proficiência com ferramentas de ladrão e ferramentas de artesão (mecânico); pode construir pequenos autômatos.' }
      ] },
    { nome: 'Meio-Elfo', bonus: { carisma: 2 }, escolhaLivre: 2,
      descricao: 'Nascidos entre dois mundos, carismáticos e versáteis, sem se encaixar totalmente em nenhum dos dois.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Versatilidade de Perícia', descricao: 'Ganha proficiência em duas perícias à escolha, além das concedidas pela classe.' }
      ] },
    { nome: 'Meio-Orc', bonus: { forca: 2, constituicao: 1 },
      descricao: 'Fortes e implacáveis em combate, com resistência notável e ímpeto selvagem.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliente e Implacável', descricao: 'Quando reduzido a 0 pontos de vida sem morrer instantaneamente, pode optar por ficar com 1 ponto de vida (1x por descanso longo).' },
        { nome: 'Intimidação Ameaçadora', descricao: 'Proficiência em Intimidação.' },
        { nome: 'Ataques Selvagens', descricao: 'Ao acertar um ataque corpo a corpo com crítico, rola um dado de dano adicional.' }
      ] },
    { nome: 'Tiefling', bonus: { carisma: 2, inteligencia: 1 },
      descricao: 'Marcados por uma herança infernal distante, carismáticos e frequentemente incompreendidos.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resistência Infernal', descricao: 'Resistência a dano de fogo.' },
        { nome: 'Legado Infernal', descricao: 'Conhece o truque Taumaturgia; a partir do nível 3 pode lançar Repreensão Infernal 1x/dia, e a partir do nível 5, Escuridão 1x/dia (Carisma como atributo de conjuração).' }
      ] }
  ];

  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      descricao: 'Guerreiro que canaliza fúria primitiva em combate, resistente e devastador corpo a corpo.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'],
      habilidades: [
        { nome: 'Fúria', nivel: 1, descricao: 'Usos: 2 por descanso longo. Em fúria: +2 de dano corpo a corpo, resistência a dano de arma comum, não pode conjurar magias.' },
        { nome: 'Defesa sem Armadura', nivel: 1, descricao: 'CA = 10 + modificador de Destreza + modificador de Constituição quando sem armadura e sem escudo.' },
        { nome: 'Ataque Imprudente', nivel: 2, descricao: 'Pode trocar vantagem em ataques corpo a corpo por dar vantagem aos inimigos contra você até seu próximo turno.' },
        { nome: 'Sentido de Perigo', nivel: 2, descricao: 'Vantagem em testes de resistência de Destreza contra efeitos que você consegue ver.' },
        { nome: 'Caminho Primitivo', nivel: 3, descricao: 'Escolhe uma subclasse (Caminho do Bárbaro) que concede habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' },
        { nome: 'Movimento Rápido', nivel: 5, descricao: 'Deslocamento +3m enquanto não estiver usando armadura pesada.' }
      ] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [],
      descricao: 'Conjurador versátil que inspira aliados e desarma inimigos através de música, palavras e magia.',
      atributoConjuracao: 'carisma', resistencias: ['destreza', 'carisma'],
      magias: { cantripsConhecidos: 2, tipo: 'fixo', magiasConhecidasFixo: 4 },
      habilidades: [
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Carisma); conhece um número limitado de magias, todas fixas (não precisa preparar).' },
        { nome: 'Inspiração de Bardo', nivel: 1, descricao: 'Ação bônus: concede 1d6 a um aliado para somar num teste, ataque ou resistência. Usos = modificador de Carisma, recarrega em descanso longo.' },
        { nome: 'Canção de Descanso', nivel: 2, descricao: 'Durante um descanso curto, aliados que gastarem Dados de Vida recuperam pontos de vida extras.' },
        { nome: 'Perícia Versátil', nivel: 2, descricao: 'Soma metade do seu bônus de proficiência (arredondado para baixo) a qualquer teste de habilidade que já não tenha proficiência.' },
        { nome: 'Colégio de Bardo', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Especialização', nivel: 3, descricao: 'Dobra o bônus de proficiência em duas perícias proficientes à escolha.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Inspiração de Bardo (d8)', nivel: 5, descricao: 'O dado de Inspiração de Bardo aumenta de 1d6 para 1d8.' },
        { nome: 'Fonte Inesgotável', nivel: 5, descricao: 'Recupera todos os usos de Inspiração de Bardo ao terminar um descanso curto ou longo.' }
      ] },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador que obtém poder através de um pacto com uma entidade sobrenatural.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'],
      magias: { cantripsConhecidos: 2, tipo: 'fixo', magiasConhecidasFixo: 2 },
      habilidades: [
        { nome: 'Patrono Sobrenatural', nivel: 1, descricao: 'Escolhe a entidade que concede seu poder (subclasse), definindo magias e habilidades extras.' },
        { nome: 'Magia de Pacto', nivel: 1, descricao: 'Conjurador (Carisma) com poucos espaços de magia, mas que recarregam completamente num descanso curto.' },
        { nome: 'Invocações Místicas', nivel: 2, descricao: 'Aprende invocações que concedem benefícios mágicos variados.' },
        { nome: 'Ofício do Pacto', nivel: 3, descricao: 'Escolhe um pacto (Lâmina, Corrente ou Tomo) que concede um benefício especial.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' }
      ] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador divino que cura, protege e combate em nome de uma divindade ou ideal.',
      atributoConjuracao: 'sabedoria', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'],
      magias: { cantripsConhecidos: 3, tipo: 'preparado' },
      habilidades: [
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Sabedoria); prepara magias diariamente a partir de toda a lista de Clérigo.' },
        { nome: 'Domínio Divino', nivel: 1, descricao: 'Escolhe um domínio (Conhecimento, Vida, Luz, Natureza, Tempestade, Enganação ou Guerra) que concede magias e habilidades extras.' },
        { nome: 'Canalizar Divindade', nivel: 2, descricao: '1x por descanso curto ou longo, usa um efeito sobrenatural da sua divindade, incluindo Expulsar Mortos-Vivos.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Destruir Mortos-Vivos', nivel: 5, descricao: 'Ao expulsar mortos-vivos, criaturas com desafio baixo o suficiente são destruídas em vez de apenas expulsas.' }
      ] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador ligado à natureza, capaz de assumir formas animais e comandar os elementos.',
      atributoConjuracao: 'sabedoria', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'],
      magias: { cantripsConhecidos: 2, tipo: 'preparado' },
      habilidades: [
        { nome: 'Druídico', nivel: 1, descricao: 'Conhece o idioma secreto dos druidas.' },
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Sabedoria); prepara magias diariamente a partir de toda a lista de Druida.' },
        { nome: 'Forma Selvagem', nivel: 2, descricao: 'Pode se transformar em uma besta conhecida, um número de vezes por descanso curto/longo limitado pelo nível e pelo desafio da besta.' },
        { nome: 'Círculo Druídico', nivel: 2, descricao: 'Escolhe uma subclasse que concede magias e habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Forma Selvagem (Melhorias)', nivel: 4, descricao: 'Pode assumir formas de besta com desafio e restrições maiores.' }
      ] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador cujo poder mágico vem de uma origem inata, no sangue ou na alma.',
      atributoConjuracao: 'carisma', resistencias: ['constituicao', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'],
      magias: { cantripsConhecidos: 4, tipo: 'fixo', magiasConhecidasFixo: 2 },
      habilidades: [
        { nome: 'Origem Mágica', nivel: 1, descricao: 'Escolhe a fonte do seu poder inato (subclasse), concedendo magias e habilidades extras.' },
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Carisma); conhece um número limitado de magias.' },
        { nome: 'Fontes de Feitiçaria', nivel: 2, descricao: 'Ganha Pontos de Feitiçaria, um recurso flexível usado para criar espaços de magia ou alimentar a Metamagia.' },
        { nome: 'Metamagia', nivel: 3, descricao: 'Aprende opções para modificar suas magias (ex: conjurar mais rápido, afetar mais alvos) gastando Pontos de Feitiçaria.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' }
      ] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      descricao: 'Combatente versátil e treinado, mestre em armas e táticas de batalha.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'],
      habilidades: [
        { nome: 'Estilo de Combate', nivel: 1, descricao: 'Escolhe uma especialização de combate (ex: Arquearia, Defesa, Duelo) que concede um bônus permanente.' },
        { nome: 'Segundo Fôlego', nivel: 1, descricao: 'Ação bônus: recupera 1d10 + nível em pontos de vida. 1x por descanso curto ou longo.' },
        { nome: 'Ação Surpreendente', nivel: 2, descricao: 'Ganha uma ação adicional no seu turno. 1x por descanso curto ou longo.' },
        { nome: 'Arquétipo Marcial', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' }
      ] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      descricao: 'Especialista em furtividade, precisão e golpes certeiros contra alvos desprevenidos.',
      atributoConjuracao: null, resistencias: ['destreza', 'inteligencia'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'],
      habilidades: [
        { nome: 'Especialização', nivel: 1, descricao: 'Dobra o bônus de proficiência em duas perícias proficientes à escolha.' },
        { nome: 'Ataque Furtivo', nivel: 1, descricao: '1d6 de dano extra (escala com o nível) quando tem vantagem no ataque ou um aliado está adjacente ao alvo.' },
        { nome: 'Argot de Ladrão', nivel: 1, descricao: 'Conhece uma linguagem secreta de sinais e códigos usada por criminosos.' },
        { nome: 'Ação Ardilosa', nivel: 2, descricao: 'Ação bônus: pode usar Disparada, Desengajar ou Esconder-se.' },
        { nome: 'Arquétipo de Ladrão', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Esquiva Sobrenatural', nivel: 5, descricao: 'Quando atingido por um ataque que consegue ver, sofre metade do dano em vez de dano total.' }
      ] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador erudito que domina a magia arcana através de estudo e um grimório pessoal.',
      atributoConjuracao: 'inteligencia', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'],
      magias: { cantripsConhecidos: 3, tipo: 'preparado' },
      habilidades: [
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Inteligência); guarda magias conhecidas num grimório e prepara um número delas por dia.' },
        { nome: 'Recuperação Arcana', nivel: 1, descricao: '1x por dia, num descanso curto, recupera espaços de magia gastos (total igual à metade do nível, arredondado para cima).' },
        { nome: 'Tradição Arcana', nivel: 2, descricao: 'Escolhe uma escola de magia como subclasse, concedendo benefícios extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' }
      ] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      descricao: 'Guerreiro disciplinado que canaliza energia interior em golpes rápidos e precisos.',
      atributoConjuracao: null, resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'],
      habilidades: [
        { nome: 'Defesa sem Armadura', nivel: 1, descricao: 'CA = 10 + modificador de Destreza + modificador de Sabedoria quando sem armadura e sem escudo.' },
        { nome: 'Artes Marciais', nivel: 1, descricao: 'Pode usar Destreza em vez de Força para ataques desarmados e armas de monge; o dano desarmado escala com o nível.' },
        { nome: 'Ki', nivel: 2, descricao: 'Ganha pontos de Ki para alimentar habilidades especiais (Rajada de Golpes, Defesa Paciente, Passo do Vento).' },
        { nome: 'Movimento sem Armadura', nivel: 2, descricao: 'Deslocamento aumenta quando está sem armadura e sem escudo.' },
        { nome: 'Tradição Monástica', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Desvio de Projéteis', nivel: 3, descricao: 'Pode usar a reação para reduzir o dano de um ataque à distância, às vezes pegando o projétil e arremessando-o de volta.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Queda Lenta', nivel: 4, descricao: 'Pode usar a reação para reduzir o dano de queda.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' },
        { nome: 'Rajada de Golpes Aturdente', nivel: 5, descricao: 'Ao acertar um ataque corpo a corpo, pode gastar 1 ponto de Ki para forçar um teste de resistência de Constituição ou atordoar o alvo.' }
      ] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      descricao: 'Guerreiro sagrado ligado por um juramento, combinando força marcial e magia divina.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'],
      habilidades: [
        { nome: 'Sentido Divino', nivel: 1, descricao: 'Detecta a presença de celestiais, corruptores ou mortos-vivos poderosos nas proximidades.' },
        { nome: 'Imposição de Mãos', nivel: 1, descricao: 'Reserva de cura (5 × nível) que pode usar tocando uma criatura para curar pontos de vida.' },
        { nome: 'Estilo de Combate', nivel: 2, descricao: 'Escolhe uma especialização de combate que concede um bônus permanente.' },
        { nome: 'Conjuração', nivel: 2, descricao: 'Conjurador (Carisma) com meia progressão de espaços de magia.' },
        { nome: 'Punição Divina', nivel: 2, descricao: 'Ao acertar um ataque corpo a corpo, pode gastar um espaço de magia para causar dano radiante extra.' },
        { nome: 'Juramento Sagrado', nivel: 3, descricao: 'Escolhe uma subclasse que concede magias e habilidades extras.' },
        { nome: 'Canalizar Divindade', nivel: 3, descricao: '1x por descanso curto ou longo, usa um efeito sobrenatural definido pelo Juramento.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' }
      ] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      descricao: 'Caçador e explorador habilidoso, especialista em rastreamento, sobrevivência e combate à distância.',
      atributoConjuracao: 'sabedoria', resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'],
      habilidades: [
        { nome: 'Inimigo Favorito', nivel: 1, descricao: 'Vantagem em testes de Sabedoria (Sobrevivência) para rastrear um tipo de criatura escolhido, e em testes de Inteligência para lembrar informações sobre ele.' },
        { nome: 'Explorador Nato', nivel: 1, descricao: 'Escolhe um tipo de terreno favorito; ganha benefícios de viagem e +2 em Percepção e Sobrevivência nesse terreno.' },
        { nome: 'Estilo de Combate', nivel: 2, descricao: 'Escolhe uma especialização de combate que concede um bônus permanente.' },
        { nome: 'Conjuração', nivel: 2, descricao: 'Conjurador (Sabedoria) com meia progressão de espaços de magia.' },
        { nome: 'Arquétipo de Patrulheiro', nivel: 3, descricao: 'Escolhe uma subclasse que concede magias e habilidades extras.' },
        { nome: 'Consciência Primeva', nivel: 3, descricao: 'Pode gastar 1 minuto em sintonia com a natureza para sentir a presença de aberrações, celestiais, corruptores, elementais, fadas e mortos-vivos numa grande área ao redor, sem revelar localização exata nem quantidade.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' }
      ] }
  ];

  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO, RACAS, CLASSES };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.DADOS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
