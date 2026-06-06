// Lógica da tela Histórico
import { montarNavbar, protegerPagina, montarSeletorFazenda } from "../components/navbar.js";
import { registrarNovasAnimacoes } from "../components/animacoes-internas.js";
import { listarFazendas, buscarLeituras, buscarAlertas } from "../services/firestore.js";
import { statusDoDia } from "../utils/simulacao.js";
import { classeSeveridade, nomeTipoAlerta } from "../utils/alertas.js";

const nomesCultura = {
  soja: "Soja", milho: "Milho", cafe: "Café",
  cana: "Cana-de-açúcar", hortalicas: "Hortaliças", outro: "Outro"
};

const POR_PAGINA = 10;
let uidGlobal = null;
let fazendaIdAtual = null;
let fazendaAtual = null;
let leiturasCache = [];
let alertasCache = [];
let paginaAtual = 1;
let chartStatus = null;

protegerPagina(async user => {
  uidGlobal = user.uid;
  montarNavbar("historico.html");

  const fazendas = await listarFazendas(uidGlobal);
  if (fazendas.length === 0) {
    document.getElementById("sem-dados").classList.remove("d-none");
    registrarNovasAnimacoes();
    return;
  }

  document.getElementById("historico-conteudo").classList.remove("d-none");
  registrarNovasAnimacoes();

  fazendaIdAtual = await montarSeletorFazenda(uidGlobal, "seletor-fazenda", id => {
    fazendaIdAtual = id;
    fazendaAtual = fazendas.find(f => f.id === id);
    carregarHistorico();
  });

  if (fazendaIdAtual) {
    fazendaAtual = fazendas.find(f => f.id === fazendaIdAtual);
    carregarHistorico();
  }
});

document.getElementById("filtro-data").addEventListener("change", () => { paginaAtual = 1; aplicarFiltros(); });
document.getElementById("filtro-tipo").addEventListener("change", () => { paginaAtual = 1; aplicarFiltros(); });
document.getElementById("filtro-status").addEventListener("change", () => { paginaAtual = 1; aplicarFiltros(); });
document.getElementById("btn-limpar-filtro").addEventListener("click", () => {
  document.getElementById("filtro-data").value = "";
  document.getElementById("filtro-tipo").value = "todos";
  document.getElementById("filtro-status").value = "todos";
  paginaAtual = 1;
  aplicarFiltros();
});
document.getElementById("btn-exportar").addEventListener("click", exportarCSV);

async function carregarHistorico() {
  leiturasCache = await buscarLeituras(uidGlobal, fazendaIdAtual);
  alertasCache = await buscarAlertas(uidGlobal, fazendaIdAtual);
  renderizarResumoSafra(leiturasCache, alertasCache);
  renderizarMedias(leiturasCache);
  renderizarGraficoStatus(leiturasCache);
  aplicarFiltros();
}

function renderizarResumoSafra(leituras, alertas) {
  const saudaveis = leituras.filter(l => statusDoDia(l) === "saudavel").length;
  const atencao = leituras.filter(l => statusDoDia(l) === "atencao").length;

  document.getElementById("res-total").textContent = leituras.length;
  document.getElementById("res-saudaveis").textContent = saudaveis;
  document.getElementById("res-atencao").textContent = atencao;
  document.getElementById("res-alertas").textContent = alertas.length;
}

function renderizarMedias(leituras) {
  if (leituras.length === 0) return;

  const ndvi = (leituras.reduce((s, l) => s + l.ndvi, 0) / leituras.length).toFixed(2);
  const umidade = (leituras.reduce((s, l) => s + l.umidadeSolo, 0) / leituras.length).toFixed(1);
  const temp = (leituras.reduce((s, l) => s + l.temperatura, 0) / leituras.length).toFixed(1);
  const chuva = leituras.reduce((s, l) => s + l.precipitacao, 0).toFixed(1);

  document.getElementById("media-ndvi").textContent = ndvi;
  document.getElementById("media-umidade").textContent = umidade + "%";
  document.getElementById("media-temp").textContent = temp + "°C";
  document.getElementById("media-chuva").textContent = chuva + " mm";

  document.getElementById("bar-media-ndvi").style.width = (ndvi * 100) + "%";
  document.getElementById("bar-media-umidade").style.width = umidade + "%";
  document.getElementById("bar-media-temp").style.width = Math.min(100, (temp / 40) * 100) + "%";
  document.getElementById("bar-media-chuva").style.width = Math.min(100, (chuva / 200) * 100) + "%";

  const ordenadas = [...leituras].sort((a, b) => a.data.localeCompare(b.data));
  document.getElementById("periodo-inicio").textContent = formatarDataBR(ordenadas[0].data);
  document.getElementById("periodo-fim").textContent = formatarDataBR(ordenadas[ordenadas.length - 1].data);
  document.getElementById("periodo-cultura").textContent =
    fazendaAtual ? (nomesCultura[fazendaAtual.cultura] || fazendaAtual.cultura) : "—";
}

function renderizarGraficoStatus(leituras) {
  const contagem = { saudavel: 0, atencao: 0, critico: 0 };
  leituras.forEach(l => contagem[statusDoDia(l)]++);

  document.getElementById("legenda-status").innerHTML = `
    <span><i class="bi bi-circle-fill text-success"></i> Saudável: ${contagem.saudavel} dias</span>
    <span><i class="bi bi-circle-fill text-warning"></i> Atenção: ${contagem.atencao} dias</span>
    <span><i class="bi bi-circle-fill text-danger"></i> Crítico: ${contagem.critico} dias</span>
  `;

  if (chartStatus) chartStatus.destroy();

  if (leituras.length === 0) return;

  chartStatus = new Chart(document.getElementById("chartStatus"), {
    type: "doughnut",
    data: {
      labels: ["Saudável", "Atenção", "Crítico"],
      datasets: [{
        data: [contagem.saudavel, contagem.atencao, contagem.critico],
        backgroundColor: ["#52B788", "#E9C46A", "#E76F51"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: { legend: { display: false } }
    }
  });
}

function aplicarFiltros() {
  const dataFiltro = document.getElementById("filtro-data").value;
  const tipoFiltro = document.getElementById("filtro-tipo").value;
  const statusFiltro = document.getElementById("filtro-status").value;

  let leituras = [...leiturasCache];
  let alertas = [...alertasCache];

  if (dataFiltro) {
    leituras = leituras.filter(l => l.data === dataFiltro);
    alertas = alertas.filter(a => a.data === dataFiltro);
  }

  if (statusFiltro !== "todos") {
    leituras = leituras.filter(l => statusDoDia(l) === statusFiltro);
  }

  document.getElementById("secao-leituras").style.display =
    tipoFiltro === "alertas" ? "none" : "block";
  document.getElementById("secao-alertas").style.display =
    tipoFiltro === "leituras" ? "none" : "block";

  document.getElementById("contador-registros").textContent =
    `${leituras.length} leitura(s) · ${alertas.length} alerta(s)`;

  renderizarTabela(leituras);
  renderizarTimeline(alertas);
}

function renderizarTabela(leituras) {
  const tbody = document.getElementById("tabela-leituras");
  document.getElementById("badge-leituras").textContent = leituras.length + " registros";

  if (leituras.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma leitura encontrada.</td></tr>';
    document.getElementById("paginacao").innerHTML = "";
    return;
  }

  const ordenadas = leituras.sort((a, b) => b.data.localeCompare(a.data));
  const totalPaginas = Math.ceil(ordenadas.length / POR_PAGINA);
  if (paginaAtual > totalPaginas) paginaAtual = 1;

  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = ordenadas.slice(inicio, inicio + POR_PAGINA);

  tbody.innerHTML = "";
  pagina.forEach(l => {
    const status = statusDoDia(l);
    const badgeClass = status === "saudavel" ? "badge-saudavel" :
                       status === "atencao" ? "badge-atencao" : "badge-critico";
    const statusTexto = status === "saudavel" ? "Saudável" :
                        status === "atencao" ? "Atenção" : "Crítico";

    tbody.innerHTML += `
      <tr class="linha-${status}">
        <td><strong>${formatarDataBR(l.data)}</strong></td>
        <td>
          <span class="celula-valor">${l.ndvi}</span>
          <div class="celula-barra"><div class="celula-barra-fill bar-ndvi" style="width:${l.ndvi * 100}%"></div></div>
        </td>
        <td>
          <span class="celula-valor">${l.umidadeSolo}%</span>
          <div class="celula-barra"><div class="celula-barra-fill bar-umidade" style="width:${l.umidadeSolo}%"></div></div>
        </td>
        <td><span class="celula-valor">${l.temperatura}°C</span></td>
        <td>
          <span class="celula-valor">${l.precipitacao} mm</span>
          ${l.precipitacao > 10 ? '<i class="bi bi-cloud-rain-fill text-info ms-1"></i>' : ''}
        </td>
        <td><span class="badge ${badgeClass}">${statusTexto}</span></td>
      </tr>
    `;
  });

  renderizarPaginacao(totalPaginas);
}

function renderizarPaginacao(total) {
  const nav = document.getElementById("paginacao");
  if (total <= 1) { nav.innerHTML = ""; return; }

  let html = '<ul class="pagination pagination-sm justify-content-center mb-0">';
  for (let i = 1; i <= total; i++) {
    html += `<li class="page-item ${i === paginaAtual ? "active" : ""}">
      <a class="page-link" href="#" data-pag="${i}">${i}</a></li>`;
  }
  html += "</ul>";
  nav.innerHTML = html;

  nav.querySelectorAll(".page-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      paginaAtual = parseInt(link.dataset.pag);
      aplicarFiltros();
      window.scrollTo({ top: document.getElementById("secao-leituras").offsetTop - 80, behavior: "smooth" });
    });
  });
}

function renderizarTimeline(alertas) {
  const container = document.getElementById("timeline-alertas");
  document.getElementById("badge-alertas-hist").textContent = alertas.length + " alertas";

  if (alertas.length === 0) {
    container.innerHTML = `
      <div class="alerta-vazio">
        <i class="bi bi-check-circle-fill"></i>
        <p>Nenhum alerta registrado neste período.</p>
      </div>`;
    return;
  }

  const icones = { seca: "droplet", chuva: "cloud-rain", estresse: "flower1", praga: "bug" };
  container.innerHTML = "";

  alertas.forEach(a => {
    const cls = classeSeveridade(a.severidade);
    const icone = icones[a.tipo] || "bell";
    const lido = a.lido
      ? '<span class="badge bg-secondary ms-2">Lido</span>'
      : '<span class="badge bg-primary ms-2">Novo</span>';

    container.innerHTML += `
      <div class="timeline-item">
        <div class="timeline-card timeline-${cls}">
          <div class="timeline-icone"><i class="bi bi-${icone}"></i></div>
          <div class="timeline-corpo">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge bg-${cls}">${nomeTipoAlerta(a.tipo)}</span>
              <span class="badge bg-light text-dark">${a.severidade}</span>${lido}
            </div>
            <p class="mt-2 mb-1">${a.mensagem}</p>
            <small class="text-muted"><i class="bi bi-calendar3"></i> ${formatarDataBR(a.data)}</small>
          </div>
        </div>
      </div>
    `;
  });
}

function exportarCSV() {
  if (leiturasCache.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }

  let csv = "Data,NDVI,Umidade (%),Temperatura (C),Precipitacao (mm),Status\n";
  leiturasCache.forEach(l => {
    csv += `${l.data},${l.ndvi},${l.umidadeSolo},${l.temperatura},${l.precipitacao},${statusDoDia(l)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "agrosat_historico.csv";
  link.click();
}

function formatarDataBR(dataStr) {
  const p = dataStr.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}
