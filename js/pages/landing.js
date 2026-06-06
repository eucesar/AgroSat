// Lógica da Landing Page — login e cadastro
import { verificarAuth, fazerLogin, cadastrarUsuario, traduzirErro } from "../services/auth.js";
import { criarDocumentoUsuario, temFazendas } from "../services/firestore.js";

// Se já estiver logado, redireciona
verificarAuth(async user => {
  if (user) {
    const tem = await temFazendas(user.uid);
    window.location.href = tem ? "pages/dashboard.html" : "pages/fazenda.html";
  }
});

// Formulário de login
document.getElementById("formLogin").addEventListener("submit", async e => {
  e.preventDefault();
  const erroDiv = document.getElementById("login-erro");
  erroDiv.classList.add("d-none");

  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  try {
    const user = await fazerLogin(email, senha);
    const tem = await temFazendas(user.uid);
    window.location.href = tem ? "pages/dashboard.html" : "pages/fazenda.html";
  } catch (err) {
    erroDiv.textContent = traduzirErro(err.code);
    erroDiv.classList.remove("d-none");
  }
});

// Formulário de cadastro
document.getElementById("formCadastro").addEventListener("submit", async e => {
  e.preventDefault();
  const erroDiv = document.getElementById("cadastro-erro");
  erroDiv.classList.add("d-none");

  const nome = document.getElementById("cadastroNome").value;
  const email = document.getElementById("cadastroEmail").value;
  const senha = document.getElementById("cadastroSenha").value;

  try {
    const user = await cadastrarUsuario(nome, email, senha);
    await criarDocumentoUsuario(user.uid, nome, email);
    window.location.href = "pages/fazenda.html";
  } catch (err) {
    erroDiv.textContent = traduzirErro(err.code);
    erroDiv.classList.remove("d-none");
  }
});
