(function (raiz) {
  function parseFormula(formula) {
    const bruta = String(formula).trim();
    const match = /^(\d+)d(\d+)$/.exec(bruta);
    if (!match) {
      throw new Error(`Fórmula de dano inválida: ${formula}`);
    }
    return { quantidade: Number(match[1]), lados: Number(match[2]) };
  }

  function rolar(quantidade, lados) {
    let total = 0;
    for (let i = 0; i < quantidade; i++) {
      total += 1 + Math.floor(Math.random() * lados);
    }
    return total;
  }

  function rolarDano(formula, modDano, critico) {
    const { quantidade, lados } = parseFormula(formula);
    const quantidadeDados = critico ? quantidade * 2 : quantidade;
    const dadosRolados = rolar(quantidadeDados, lados);
    return { total: dadosRolados + modDano, dadosRolados, quantidadeDados, lados, modDano };
  }

  const api = { parseFormula, rolar, rolarDano };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Dado = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
