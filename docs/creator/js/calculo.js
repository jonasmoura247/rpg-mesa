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

  const api = { modificador, custoTotalPointBuy, pontosRestantes };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Calculo = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
