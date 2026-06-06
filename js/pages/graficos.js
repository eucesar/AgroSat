// Lógica da tela Gráficos / Análise
import { montarNavbar, protegerPagina, montarSeletorFazenda } from "../components/navbar.js";
import { registrarNovasAnimacoes } from "../components/animacoes-internas.js";
import { listarFazendas, buscarLeituras } from "../services/firestore.js";

let uidGlobal = null;
let fazendaIdAtual = null;
let chartPrincipal = null;
let diasAtual = 7;

protegerPagina(async user => {
  uidGlobal = user.uid;
  montarNavbar("graficos.html");

  const fazendas = await listarFazendas(uidGlobal);
  if (fazendas.length === 0) {
    document.getElementById("sem-dados").classList.remove("d-none");
    registrarNovasAnimacoes();
    return;
  }

  document.getElementById("graficos-conteudo").classList.remove("d-none");

  fazendaIdAtual = await montarSeletorFazenda(uidGlobal, "seletor-fazenda", id => {
    fazendaIdAtual = id;
    carregarGrafico();
  });

  registrarNovasAnimacoes();

  if (fazendaIdAtual) carregarGrafico();
});

// Botões de período
document.querySelectorAll(".btn-periodo").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn-periodo").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    diasAtual = parseInt(btn.dataset.dias);
    carregarGrafico();
  });
});

document.getElementById("btn-atualizar").addEventListener("click", carregarGrafico);
document.getElementById("select-indicador").addEventListener("change", carregarGrafico);

async function carregarGrafico() {
  if (!fazendaIdAtual) return;

  const leituras = await buscarLeituras(uidGlobal, fazendaIdAtual, diasAtual);
  if (leituras.length === 0) return;

  const indicador = document.getElementById("select-indicador").value;
  const labels = leituras.map(l => formatarDataCurta(l.data));

  document.getElementById("badge-periodo").textContent = diasAtual + " dias";

  if (chartPrincipal) chartPrincipal.destroy();

  const datasets = montarDatasets(leituras, indicador, labels);

  const opcoes = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { position: "top" } },
    scales: {
      y: { grid: { color: "rgba(42,157,143,0.12)" }, position: "left" },
      x: { grid: { display: false } }
    }
  };

  if (indicador === "todos") {
    opcoes.scales.y1 = { grid: { drawOnChartArea: false }, position: "right" };
  }

  chartPrincipal = new Chart(document.getElementById("chartPrincipal"), {
    type: indicador === "precipitacao" ? "bar" : "line",
    data: { labels, datasets },
    options: {
      ...opcoes,
      animation: { duration: 900, easing: "easeOutQuart" }
    }
  });

  renderizarEstatisticas(leituras);
}

function montarDatasets(leituras, indicador, labels) {
  const configs = {
    ndvi: { label: "NDVI", data: leituras.map(l => l.ndvi), cor: "#52B788", tipo: "line" },
    umidade: { label: "Umidade (%)", data: leituras.map(l => l.umidadeSolo), cor: "#2A9D8F", tipo: "line" },
    temperatura: { label: "Temperatura (°C)", data: leituras.map(l => l.temperatura), cor: "#E76F51", tipo: "line" },
    precipitacao: { label: "Precipitação (mm)", data: leituras.map(l => l.precipitacao), cor: "#1B3A4B", tipo: "bar" }
  };

  if (indicador === "todos") {
    return Object.values(configs).map((c, i) => ({
      label: c.label,
      data: c.data,
      borderColor: c.cor,
      backgroundColor: c.cor + "33",
      fill: false,
      tension: 0.3,
      yAxisID: i < 2 ? "y" : "y1"
    }));
  }

  const c = configs[indicador];
  return [{
    label: c.label,
    data: c.data,
    borderColor: c.cor,
    backgroundColor: indicador === "precipitacao" ? c.cor + "88" : c.cor + "33",
    fill: indicador === "temperatura",
    tension: 0.3
  }];
}

function renderizarEstatisticas(leituras) {
  const campos = [
    { key: "ndvi", label: "NDVI", sufixo: "", icone: "flower1", cls: "stat-icone-ndvi" },
    { key: "umidadeSolo", label: "Umidade", sufixo: "%", icone: "droplet", cls: "stat-icone-umidade" },
    { key: "temperatura", label: "Temperatura", sufixo: "°C", icone: "thermometer-half", cls: "stat-icone-temp" },
    { key: "precipitacao", label: "Precipitação", sufixo: " mm", icone: "cloud-rain", cls: "stat-icone-chuva" }
  ];

  const container = document.getElementById("stats-container");
  container.innerHTML = "";

  campos.forEach((c, i) => {
    const valores = leituras.map(l => l[c.key]);
    const media = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
    const max = Math.max(...valores).toFixed(2);
    const min = Math.min(...valores).toFixed(2);
    const delay = Math.min(i + 1, 4);

    container.innerHTML += `
      <div class="col-6 col-md-3 anim-interno anim-delay-${delay}">
        <div class="stat-card-v2">
          <div class="stat-icone ${c.cls}"><i class="bi bi-${c.icone}"></i></div>
          <div class="stat-label">${c.label}</div>
          <div class="stat-valor contador-interno" data-alvo="${media}" data-sufixo="${c.sufixo}" data-decimais="2">0</div>
          <small class="text-muted">Mín: ${min} · Máx: ${max}</small>
        </div>
      </div>
    `;
  });

  registrarNovasAnimacoes();
}

function formatarDataCurta(dataStr) {
  const p = dataStr.split("-");
  return p[2] + "/" + p[1];
}
