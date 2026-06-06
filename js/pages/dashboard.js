// Lógica do Dashboard
import { montarNavbar, protegerPagina, montarSeletorFazenda } from "../components/navbar.js";
import { registrarNovasAnimacoes } from "../components/animacoes-internas.js";
import { listarFazendas, escutarLeituras, escutarAlertas, marcarAlertaLido } from "../services/firestore.js";
import {
  getStatusNDVI, getStatusUmidade, getStatusTemperatura,
  getStatusPrecipitacao, gerarResumo, classeSeveridade, nomeTipoAlerta
} from "../utils/alertas.js";
import { statusDoDia } from "../utils/simulacao.js";

const nomesCultura = {
  soja: "Soja", milho: "Milho", cafe: "Café",
  cana: "Cana-de-açúcar", hortalicas: "Hortaliças", outro: "Outro"
};

let uidGlobal = null;
let chartNdvi = null;
let chartUmidade = null;
let culturaAtual = "soja";
let fazendaAtual = null;
let unsubscribeLeituras = null;
let unsubscribeAlertas = null;

protegerPagina(async user => {
  uidGlobal = user.uid;
  montarNavbar("dashboard.html");

  const fazendas = await listarFazendas(uidGlobal);
  if (fazendas.length === 0) {
    document.getElementById("sem-dados").classList.remove("d-none");
    registrarNovasAnimacoes();
    return;
  }

  document.getElementById("dashboard-conteudo").classList.remove("d-none");
  registrarNovasAnimacoes();

  const fazendaId = await montarSeletorFazenda(uidGlobal, "seletor-fazenda", id => {
    carregarDadosFazenda(id, fazendas);
  });

  if (fazendaId) carregarDadosFazenda(fazendaId, fazendas);
});

function carregarDadosFazenda(fazendaId, fazendas) {
  fazendaAtual = fazendas.find(f => f.id === fazendaId);
  if (fazendaAtual) {
    culturaAtual = fazendaAtual.cultura;
    atualizarBanner(fazendaAtual);
  }

  if (unsubscribeLeituras) unsubscribeLeituras();
  if (unsubscribeAlertas) unsubscribeAlertas();

  unsubscribeLeituras = escutarLeituras(uidGlobal, fazendaId, leituras => {
    if (leituras.length === 0) return;
    const ultima = leituras[leituras.length - 1];
    const anterior = leituras.length > 1 ? leituras[leituras.length - 2] : null;

    atualizarBannerData(ultima.data);
    atualizarKPIs(ultima, anterior);
    atualizarMiniStats(leituras);
    atualizarGraficos(leituras.slice(-7));
  });

  unsubscribeAlertas = escutarAlertas(uidGlobal, fazendaId, alertas => {
    renderizarAlertas(alertas, fazendaId);
    document.getElementById("stat-alertas").textContent = alertas.filter(a => !a.lido).length;

    const ndvi = document.getElementById("val-ndvi").textContent;
    if (ndvi !== "—") {
      const leitura = {
        ndvi: parseFloat(ndvi),
        umidadeSolo: parseFloat(document.getElementById("val-umidade").textContent),
        temperatura: parseFloat(document.getElementById("val-temperatura").textContent.replace("°C", "")),
        precipitacao: parseFloat(document.getElementById("val-precipitacao").textContent.replace(" mm", ""))
      };
      document.getElementById("resumo-texto").textContent =
        gerarResumo(leitura, culturaAtual, alertas.filter(a => !a.lido));
    }
  });
}

function atualizarBanner(fazenda) {
  document.getElementById("banner-nome").textContent = fazenda.nome;
  document.getElementById("banner-info").textContent =
    `${nomesCultura[fazenda.cultura] || fazenda.cultura} · Monitoramento via satélite simulado`;
  document.getElementById("banner-area").textContent = fazenda.areaHectares;
  document.getElementById("banner-local").textContent = `${fazenda.cidade}/${fazenda.estado}`;
}

function atualizarBannerData(dataStr) {
  const p = dataStr.split("-");
  document.getElementById("banner-data").textContent = `${p[2]}/${p[1]}/${p[0]}`;
}

function atualizarMiniStats(leituras) {
  const saudaveis = leituras.filter(l => statusDoDia(l) === "saudavel").length;
  const ndviMedio = (leituras.reduce((s, l) => s + l.ndvi, 0) / leituras.length).toFixed(2);

  document.getElementById("stat-dias").textContent = leituras.length;
  document.getElementById("stat-saudaveis").textContent = saudaveis;
  document.getElementById("stat-ndvi-medio").textContent = ndviMedio;
}

function calcularTrend(atual, anterior, invertido = false) {
  if (anterior === null || anterior === undefined) return "";
  const diff = atual - anterior;
  if (Math.abs(diff) < 0.01) return '<span class="trend-neutro"><i class="bi bi-dash"></i> estável</span>';
  const subiu = diff > 0;
  const bom = invertido ? !subiu : subiu;
  const icone = subiu ? "bi-arrow-up-short" : "bi-arrow-down-short";
  const classe = bom ? "trend-bom" : "trend-ruim";
  return `<span class="${classe}"><i class="bi ${icone}"></i> ${Math.abs(diff).toFixed(1)}</span>`;
}

function atualizarKPIs(leitura, anterior) {
  const ndvi = getStatusNDVI(leitura.ndvi);
  const umidade = getStatusUmidade(leitura.umidadeSolo);
  const temp = getStatusTemperatura(leitura.temperatura, culturaAtual);
  const precip = getStatusPrecipitacao(leitura.precipitacao);

  document.getElementById("val-ndvi").textContent = leitura.ndvi;
  document.getElementById("status-ndvi").textContent = ndvi.texto;
  document.getElementById("kpi-ndvi").className = `kpi-card kpi-enriquecido ${ndvi.classe}`;
  document.getElementById("barra-ndvi").style.width = (leitura.ndvi * 100) + "%";
  document.getElementById("trend-ndvi").innerHTML = anterior
    ? calcularTrend(leitura.ndvi, anterior.ndvi) : "";

  document.getElementById("val-umidade").textContent = leitura.umidadeSolo + "%";
  document.getElementById("status-umidade").textContent = umidade.texto;
  document.getElementById("kpi-umidade").className = `kpi-card kpi-enriquecido ${umidade.classe}`;
  document.getElementById("barra-umidade").style.width = leitura.umidadeSolo + "%";
  document.getElementById("trend-umidade").innerHTML = anterior
    ? calcularTrend(leitura.umidadeSolo, anterior.umidadeSolo) : "";

  document.getElementById("val-temperatura").textContent = leitura.temperatura + "°C";
  document.getElementById("status-temperatura").textContent = temp.texto;
  document.getElementById("kpi-temperatura").className = `kpi-card kpi-enriquecido ${temp.classe}`;
  document.getElementById("barra-temperatura").style.width = Math.min(100, (leitura.temperatura / 40) * 100) + "%";
  document.getElementById("trend-temperatura").innerHTML = anterior
    ? calcularTrend(leitura.temperatura, anterior.temperatura, true) : "";

  document.getElementById("val-precipitacao").textContent = leitura.precipitacao + " mm";
  document.getElementById("status-precipitacao").textContent = precip.texto;
  document.getElementById("kpi-precipitacao").className = `kpi-card kpi-enriquecido ${precip.classe}`;
  document.getElementById("barra-precipitacao").style.width = Math.min(100, (leitura.precipitacao / 80) * 100) + "%";
  document.getElementById("trend-precipitacao").innerHTML = anterior
    ? calcularTrend(leitura.precipitacao, anterior.precipitacao) : "";

  const geral = statusDoDia(leitura);
  const bannerStatus = document.getElementById("banner-status");
  if (geral === "saudavel") {
    bannerStatus.innerHTML = '<i class="bi bi-circle-fill text-success"></i> Lavoura saudável';
  } else if (geral === "atencao") {
    bannerStatus.innerHTML = '<i class="bi bi-circle-fill text-warning"></i> Atenção necessária';
  } else {
    bannerStatus.innerHTML = '<i class="bi bi-circle-fill text-danger"></i> Situação crítica';
  }
}

function renderizarAlertas(alertas, fazendaId) {
  const container = document.getElementById("lista-alertas");
  const naoLidos = alertas.filter(a => !a.lido);
  document.getElementById("badge-alertas").textContent = naoLidos.length;

  if (naoLidos.length === 0) {
    container.innerHTML = `
      <div class="alerta-vazio">
        <i class="bi bi-check-circle-fill"></i>
        <p>Nenhum alerta ativo. Sua lavoura está em boas condições!</p>
      </div>`;
    return;
  }

  const icones = { seca: "droplet", chuva: "cloud-rain", estresse: "flower1", praga: "bug" };
  container.innerHTML = "";

  naoLidos.forEach(a => {
    const cls = classeSeveridade(a.severidade);
    const icone = icones[a.tipo] || "bell";
    container.innerHTML += `
      <div class="alerta-card alerta-${cls}">
        <div class="alerta-card-icone"><i class="bi bi-${icone}"></i></div>
        <div class="alerta-card-corpo">
          <div class="d-flex justify-content-between align-items-start">
            <strong>${nomeTipoAlerta(a.tipo)}</strong>
            <span class="badge bg-${cls}">${a.severidade}</span>
          </div>
          <p>${a.mensagem}</p>
          <small><i class="bi bi-calendar3"></i> ${formatarDataBR(a.data)}</small>
        </div>
        <button class="btn btn-sm btn-marcar-lido" data-id="${a.id}" title="Marcar como lido">
          <i class="bi bi-check-lg"></i>
        </button>
      </div>
    `;
  });

  container.querySelectorAll(".btn-marcar-lido").forEach(btn => {
    btn.addEventListener("click", async () => {
      await marcarAlertaLido(uidGlobal, fazendaId, btn.dataset.id);
    });
  });
}

function atualizarGraficos(leituras) {
  const labels = leituras.map(l => {
    const p = l.data.split("-");
    return p[2] + "/" + p[1];
  });

  if (chartNdvi) chartNdvi.destroy();
  chartNdvi = new Chart(document.getElementById("chartNdvi"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: leituras.map(l => l.ndvi),
        borderColor: "#52B788",
        backgroundColor: "rgba(82, 183, 136, 0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#52B788"
      }]
    },
    options: opcoesGrafico(0, 1)
  });

  if (chartUmidade) chartUmidade.destroy();
  chartUmidade = new Chart(document.getElementById("chartUmidade"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: leituras.map(l => l.umidadeSolo),
        borderColor: "#2A9D8F",
        backgroundColor: "rgba(42, 157, 143, 0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#2A9D8F"
      }]
    },
    options: opcoesGrafico(0, 100)
  });
}

function opcoesGrafico(min, max) {
  return {
    responsive: true,
    animation: { duration: 800, easing: "easeOutQuart" },
    plugins: { legend: { display: false } },
    scales: {
      y: { min, max, grid: { color: "rgba(42,157,143,0.1)" } },
      x: { grid: { display: false } }
    }
  };
}

function formatarDataBR(dataStr) {
  const p = dataStr.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}
