// Navbar interna compartilhada nas telas protegidas
import { sair, verificarAuth } from "../services/auth.js";
import { iniciarAnimacoesInternas } from "./animacoes-internas.js";

export function montarNavbar(paginaAtual) {
  const paginas = [
    { href: "dashboard.html", nome: "Dashboard", icone: "speedometer2" },
    { href: "fazenda.html", nome: "Fazendas", icone: "geo-alt" },
    { href: "graficos.html", nome: "Gráficos", icone: "graph-up" },
    { href: "historico.html", nome: "Histórico", icone: "clock-history" }
  ];

  let links = "";
  paginas.forEach(p => {
    const ativo = p.href === paginaAtual ? "active" : "";
    links += `<li class="nav-item">
      <a class="nav-link ${ativo}" href="${p.href}">
        <i class="bi bi-${p.icone}"></i> ${p.nome}
      </a>
    </li>`;
  });

  const navbar = document.getElementById("navbar-interna");
  if (!navbar) return;

  navbar.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark navbar-interna">
      <div class="container">
        <a class="navbar-brand" href="dashboard.html">
          <i class="bi bi-globe-americas"></i> AgroSat
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#menuInterno" aria-label="Menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menuInterno">
          <ul class="navbar-nav me-auto">${links}</ul>
          <button class="btn btn-outline-light btn-sm btn-sair-nav" id="btn-sair">
            <i class="bi bi-box-arrow-right"></i> Sair
          </button>
        </div>
      </div>
    </nav>
  `;

  document.getElementById("btn-sair").addEventListener("click", async () => {
    await sair();
    window.location.href = "../index.html";
  });

  iniciarAnimacoesInternas();
}

// Monta seletor de fazendas no topo da página
export async function montarSeletorFazenda(uid, containerId, onChange) {
  const { listarFazendas, getFazendaSelecionada, setFazendaSelecionada } = await import("../services/firestore.js");
  const container = document.getElementById(containerId);
  if (!container) return null;

  const fazendas = await listarFazendas(uid);
  if (fazendas.length === 0) return null;

  let selecionada = getFazendaSelecionada();
  if (!selecionada || !fazendas.find(f => f.id === selecionada)) {
    selecionada = fazendas[0].id;
    setFazendaSelecionada(selecionada);
  }

  let options = "";
  fazendas.forEach(f => {
    const sel = f.id === selecionada ? "selected" : "";
    options += `<option value="${f.id}" ${sel}>${f.nome} — ${f.cultura}</option>`;
  });

  container.innerHTML = `
    <label class="form-label fw-semibold"><i class="bi bi-pin-map"></i> Fazenda selecionada</label>
    <select class="form-select" id="select-fazenda">${options}</select>
  `;

  document.getElementById("select-fazenda").addEventListener("change", e => {
    setFazendaSelecionada(e.target.value);
    if (onChange) onChange(e.target.value);
  });

  return selecionada;
}

// Protege página — redireciona se não estiver logado
export function protegerPagina(callback) {
  verificarAuth(user => {
    if (!user) {
      window.location.href = "../index.html";
    } else if (callback) {
      callback(user);
    }
  });
}
