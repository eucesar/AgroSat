// Lógica da tela Cadastrar Fazenda
import { montarNavbar, protegerPagina } from "../components/navbar.js";
import { registrarNovasAnimacoes } from "../components/animacoes-internas.js";
import { criarFazenda, listarFazendas, atualizarFazenda, excluirFazenda, setFazendaSelecionada } from "../services/firestore.js";

let uidGlobal = null;

const iconesCultura = {
  soja: "flower1",
  milho: "sun",
  cafe: "cup-hot",
  cana: "tree",
  hortalicas: "egg-fried",
  outro: "geo"
};

const nomesCultura = {
  soja: "Soja", milho: "Milho", cafe: "Café",
  cana: "Cana-de-açúcar", hortalicas: "Hortaliças", outro: "Outro"
};

protegerPagina(user => {
  uidGlobal = user.uid;
  montarNavbar("fazenda.html");
  carregarFazendas();
});

// Carregar lista de fazendas
async function carregarFazendas() {
  const container = document.getElementById("lista-fazendas");
  const semFazendas = document.getElementById("sem-fazendas");
  const fazendas = await listarFazendas(uidGlobal);

  if (fazendas.length === 0) {
    semFazendas.classList.remove("d-none");
    document.getElementById("contador-fazendas").textContent = "0 cadastradas";
    return;
  }

  semFazendas.classList.add("d-none");
  container.innerHTML = "";
  document.getElementById("contador-fazendas").textContent = fazendas.length + " cadastrada(s)";

  fazendas.forEach((f, i) => {
    const icone = iconesCultura[f.cultura] || "geo";
    const nomeCultura = nomesCultura[f.cultura] || f.cultura;
    const delay = Math.min(i + 1, 5);

    container.innerHTML += `
      <div class="col-md-6 anim-interno anim-delay-${delay}">
        <div class="card-fazenda-item">
          <div class="d-flex align-items-center gap-3">
            <div class="icone-cultura"><i class="bi bi-${icone}"></i></div>
            <div class="flex-grow-1">
              <h6 class="mb-0 fw-bold">${f.nome}</h6>
              <small class="text-muted">${nomeCultura} · ${f.areaHectares} ha</small>
              <br><small class="text-muted"><i class="bi bi-pin-map"></i> ${f.cidade}/${f.estado}</small>
            </div>
            <div class="d-flex gap-1">
              <a href="dashboard.html" class="btn btn-sm btn-teal btn-acao btn-ver" data-id="${f.id}" title="Ver dashboard">
                <i class="bi bi-eye"></i>
              </a>
              <button class="btn btn-sm btn-outline-primary btn-acao btn-editar" data-id="${f.id}" title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger btn-acao btn-excluir" data-id="${f.id}" title="Excluir">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  registrarNovasAnimacoes();

  // Eventos dos botões
  container.querySelectorAll(".btn-ver").forEach(btn => {
    btn.addEventListener("click", () => setFazendaSelecionada(btn.dataset.id));
  });

  container.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => editarFazenda(btn.dataset.id, fazendas));
  });

  container.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.addEventListener("click", () => excluirFazendaConfirm(btn.dataset.id));
  });
}

// Editar fazenda — preenche o formulário
function editarFazenda(id, fazendas) {
  const f = fazendas.find(x => x.id === id);
  if (!f) return;

  document.getElementById("fazendaId").value = id;
  document.getElementById("nome").value = f.nome;
  document.getElementById("cultura").value = f.cultura;
  document.getElementById("areaHectares").value = f.areaHectares;
  document.getElementById("cidade").value = f.cidade;
  document.getElementById("estado").value = f.estado;
  document.getElementById("latitude").value = f.latitude || "";
  document.getElementById("longitude").value = f.longitude || "";
  document.getElementById("form-titulo").innerHTML = '<i class="bi bi-pencil"></i> Editar fazenda';
  document.getElementById("btnCancelar").classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Cancelar edição
document.getElementById("btnCancelar").addEventListener("click", () => {
  document.getElementById("formFazenda").reset();
  document.getElementById("fazendaId").value = "";
  document.getElementById("form-titulo").innerHTML = '<i class="bi bi-plus-circle"></i> Nova fazenda';
  document.getElementById("btnCancelar").classList.add("d-none");
});

// Salvar fazenda (criar ou editar)
document.getElementById("formFazenda").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;

  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  const dados = {
    nome: document.getElementById("nome").value.trim(),
    cultura: document.getElementById("cultura").value,
    areaHectares: parseFloat(document.getElementById("areaHectares").value),
    cidade: document.getElementById("cidade").value.trim(),
    estado: document.getElementById("estado").value,
    latitude: parseFloat(document.getElementById("latitude").value) || 0,
    longitude: parseFloat(document.getElementById("longitude").value) || 0
  };

  const btn = document.getElementById("btnSalvar");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

  try {
    const idEdicao = document.getElementById("fazendaId").value;

    if (idEdicao) {
      await atualizarFazenda(uidGlobal, idEdicao, dados);
    } else {
      const novoId = await criarFazenda(uidGlobal, dados);
      setFazendaSelecionada(novoId);
    }

    form.reset();
    form.classList.remove("was-validated");
    document.getElementById("fazendaId").value = "";
    document.getElementById("form-titulo").innerHTML = '<i class="bi bi-plus-circle"></i> Nova fazenda';
    document.getElementById("btnCancelar").classList.add("d-none");
    await carregarFazendas();
  } catch (err) {
    alert("Erro ao salvar fazenda. Tente novamente.");
    console.error(err);
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar fazenda';
});

// Excluir fazenda
async function excluirFazendaConfirm(id) {
  if (!confirm("Tem certeza que deseja excluir esta fazenda? Todos os dados serão perdidos.")) return;

  try {
    await excluirFazenda(uidGlobal, id);
    await carregarFazendas();
  } catch (err) {
    alert("Erro ao excluir fazenda.");
    console.error(err);
  }
}
