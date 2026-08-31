(function (raiz) {
  const XP_POR_CD = {
    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450,
    '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  };
  const XP_PARA_NIVEL = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000]; // índice = nível - 1

  function xpPorCd(cd) {
    return XP_POR_CD[cd] ?? 0;
  }

  function xpNivelAtual(nivel) {
    return XP_PARA_NIVEL[nivel - 1] ?? 0;
  }

  function xpProximoNivel(nivel) {
    return XP_PARA_NIVEL[nivel] ?? null;
  }

  const api = { xpPorCd, xpNivelAtual, xpProximoNivel };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Experiencia = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
