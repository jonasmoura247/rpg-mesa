(function (raiz) {
  function modificador(valorAtributo) {
    return Math.floor((valorAtributo - 10) / 2);
  }

  function custoTotalPointBuy(atributos, tabelaCusto) {
    return Object.values(atributos).reduce((soma, valor) => soma + tabelaCusto[valor], 0);
  }

  function pontosRestantes(atributos, tabelaCusto, orcamento) {
    return orcamento - custoTotalPointBuy(atributos, tabelaCusto);
  }

  function pvInicial(dadoDeVida, modConstituicao) {
    return dadoDeVida + modConstituicao;
  }

  function caBase(modDestreza) {
    return 10 + modDestreza;
  }

  function bonusPericia(modAtributo, proficiente, bonusProficiencia) {
    return proficiente ? modAtributo + bonusProficiencia : modAtributo;
  }

  function cdMagia(modAtributoConjuracao, bonusProficiencia) {
    return 8 + bonusProficiencia + modAtributoConjuracao;
  }

  function quantidadeMagiasNivel1(infoMagiasClasse, modAtributoConjuracao) {
    if (infoMagiasClasse.tipo === 'fixo') {
      return infoMagiasClasse.magiasConhecidasFixo;
    }
    return Math.max(1, modAtributoConjuracao + 1);
  }

  const api = { modificador, custoTotalPointBuy, pontosRestantes, pvInicial, caBase, bonusPericia, cdMagia, quantidadeMagiasNivel1 };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Calculo = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
