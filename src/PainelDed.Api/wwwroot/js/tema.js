const Tema = {
  chaveArmazenamento: 'painel-ded-tema',

  inicializar() {
    const temaSalvo = this.obterTemaSalvo();
    const temaInicial = temaSalvo ?? (this.prefereTemaEscuro() ? 'escuro' : 'claro');
    this.aplicar(temaInicial);

    const botao = document.getElementById('botao-tema');
    botao.addEventListener('click', () => this.alternar());
  },

  obterTemaSalvo() {
    try {
      return localStorage.getItem(this.chaveArmazenamento);
    } catch {
      return null;
    }
  },

  prefereTemaEscuro() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  aplicar(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    const botao = document.getElementById('botao-tema');
    if (botao) {
      botao.textContent = tema === 'escuro' ? '☀️' : '🌙';
    }
    try {
      localStorage.setItem(this.chaveArmazenamento, tema);
    } catch {
      // localStorage indisponível (ex: navegação privada) — segue sem persistir
    }
  },

  alternar() {
    const atual = document.documentElement.getAttribute('data-tema');
    this.aplicar(atual === 'escuro' ? 'claro' : 'escuro');
  },
};

document.addEventListener('DOMContentLoaded', () => Tema.inicializar());
