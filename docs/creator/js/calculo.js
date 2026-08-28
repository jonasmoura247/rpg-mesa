(function (raiz) {
  function modificador(valorAtributo) {
    return Math.floor((valorAtributo - 10) / 2);
  }

  const api = { modificador };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Calculo = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
