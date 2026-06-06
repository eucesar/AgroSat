// Animações compartilhadas nas telas internas (pós-login)
export function iniciarAnimacoesInternas() {
  document.body.classList.add("app-carregado");
  observarScroll();
  animarContadoresInternos();
}

export function registrarNovasAnimacoes() {
  observarScroll();
  animarContadoresInternos();
}

function observarScroll() {
  const elementos = document.querySelectorAll(".anim-interno:not(.visivel)");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visivel");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -20px 0px" });

  elementos.forEach(el => observer.observe(el));
}

function animarContadoresInternos() {
  document.querySelectorAll(".contador-interno:not([data-animado])").forEach(el => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        el.dataset.animado = "1";
        const alvo = parseFloat(el.dataset.alvo);
        const sufixo = el.dataset.sufixo || "";
        const prefixo = el.dataset.prefixo || "";
        const decimais = parseInt(el.dataset.decimais || "0");
        animarNumero(el, alvo, prefixo, sufixo, decimais);
        observer.unobserve(el);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
  });
}

function animarNumero(el, alvo, prefixo, sufixo, decimais) {
  const duracao = 1200;
  const inicio = performance.now();

  function frame(tempo) {
    const p = Math.min((tempo - inicio) / duracao, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = prefixo + (alvo * ease).toFixed(decimais) + sufixo;
    if (p < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

export function reanimarElementos(seletor = ".anim-interno") {
  document.querySelectorAll(seletor).forEach(el => el.classList.add("visivel"));
}
