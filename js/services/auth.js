// Inicialização do Firebase e funções de autenticação
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { firebaseConfig } from "../config/firebase-config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cadastrar novo usuário
export async function cadastrarUsuario(nome, email, senha) {
  const resultado = await createUserWithEmailAndPassword(auth, email, senha);
  return resultado.user;
}

// Fazer login
export async function fazerLogin(email, senha) {
  const resultado = await signInWithEmailAndPassword(auth, email, senha);
  return resultado.user;
}

// Sair da conta
export async function sair() {
  sessionStorage.removeItem("fazendaSelecionada");
  await signOut(auth);
}

// Verificar se o usuário está logado
export function verificarAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// Traduzir erros do Firebase para português
export function traduzirErro(codigo) {
  const erros = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde."
  };
  return erros[codigo] || "Ocorreu um erro. Tente novamente.";
}
