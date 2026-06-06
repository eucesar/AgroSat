// Animações da Landing Page — scroll reveal e contadores
document.addEventListener("DOMContentLoaded", () => {
  iniciarScrollReveal();
  iniciarContadores();
  iniciarNavbarScroll();
});

// Elementos aparecem ao rolar a página
function iniciarScrollReveal() {
  const elementos = document.querySelectorAll(".animate-on-scroll");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visivel");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  elementos.forEach(el => observer.observe(el));
}

// Contadores animados nos cards de problema (77%, 20%, 47%)
function iniciarContadores() {
  const numeros = document.querySelectorAll("[data-contador]");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animarContador(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  numeros.forEach(el => observer.observe(el));
}

function animarContador(elemento) {
  const alvo = parseInt(elemento.dataset.contador);
  const prefixo = elemento.dataset.prefixo || "";
  const sufixo = elemento.dataset.sufixo || "";
  const duracao = 1500;
  const inicio = performance.now();

  function atualizar(tempo) {
    const progresso = Math.min((tempo - inicio) / duracao, 1);
    const ease = 1 - Math.pow(1 - progresso, 3);
    const valor = Math.round(alvo * ease);
    elemento.textContent = prefixo + valor + sufixo;

    if (progresso < 1) {
      requestAnimationFrame(atualizar);
    }
  }

  requestAnimationFrame(atualizar);
}

// Navbar ganha sombra ao rolar
function iniciarNavbarScroll() {
  const navbar = document.querySelector(".navbar-landing");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}
