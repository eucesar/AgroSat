// Funções para ler e gravar dados no Firestore
import { db } from "./auth.js";
import {
  doc, setDoc, getDoc, collection, addDoc, getDocs,
  deleteDoc, updateDoc, query, orderBy, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { gerarHistoricoLeituras } from "../utils/simulacao.js";
import { analisarLeitura } from "../utils/alertas.js";

// Criar documento do usuário após cadastro
export async function criarDocumentoUsuario(uid, nome, email) {
  await setDoc(doc(db, "users", uid), {
    nome: nome,
    email: email,
    plano: "free",
    criadoEm: serverTimestamp()
  });
}

// Buscar dados do usuário
export async function buscarUsuario(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Criar fazenda + histórico simulado de leituras e alertas
export async function criarFazenda(uid, dados) {
  const ref = await addDoc(collection(db, "users", uid, "fazendas"), {
    nome: dados.nome,
    cultura: dados.cultura,
    areaHectares: dados.areaHectares,
    cidade: dados.cidade,
    estado: dados.estado,
    latitude: dados.latitude,
    longitude: dados.longitude,
    criadoEm: serverTimestamp()
  });

  const leituras = gerarHistoricoLeituras(dados.cultura, 30);
  const ultimaLeitura = leituras[leituras.length - 1];

  for (const leitura of leituras) {
    await addDoc(collection(db, "users", uid, "fazendas", ref.id, "leituras"), leitura);
  }

  const alertas = analisarLeitura(ultimaLeitura, dados.cultura);
  for (const alerta of alertas) {
    await addDoc(collection(db, "users", uid, "fazendas", ref.id, "alertas"), alerta);
  }

  return ref.id;
}

// Listar todas as fazendas do usuário
export async function listarFazendas(uid) {
  const snap = await getDocs(collection(db, "users", uid, "fazendas"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Atualizar fazenda
export async function atualizarFazenda(uid, fazendaId, dados) {
  await updateDoc(doc(db, "users", uid, "fazendas", fazendaId), dados);
}

// Excluir fazenda
export async function excluirFazenda(uid, fazendaId) {
  await deleteDoc(doc(db, "users", uid, "fazendas", fazendaId));
}

// Buscar leituras de uma fazenda (ordenadas por data)
export async function buscarLeituras(uid, fazendaId, dias = null) {
  const q = query(
    collection(db, "users", uid, "fazendas", fazendaId, "leituras"),
    orderBy("data", "asc")
  );
  const snap = await getDocs(q);
  let leituras = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (dias) {
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    const dataLimite = limite.toISOString().split("T")[0];
    leituras = leituras.filter(l => l.data >= dataLimite);
  }

  return leituras;
}

// Buscar última leitura
export async function buscarUltimaLeitura(uid, fazendaId) {
  const leituras = await buscarLeituras(uid, fazendaId);
  return leituras.length > 0 ? leituras[leituras.length - 1] : null;
}

// Buscar alertas de uma fazenda
export async function buscarAlertas(uid, fazendaId) {
  const q = query(
    collection(db, "users", uid, "fazendas", fazendaId, "alertas"),
    orderBy("data", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Marcar alerta como lido
export async function marcarAlertaLido(uid, fazendaId, alertaId) {
  await updateDoc(doc(db, "users", uid, "fazendas", fazendaId, "alertas", alertaId), {
    lido: true
  });
}

// Escutar alertas em tempo real
export function escutarAlertas(uid, fazendaId, callback) {
  const q = query(
    collection(db, "users", uid, "fazendas", fazendaId, "alertas"),
    orderBy("data", "desc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Escutar última leitura em tempo real
export function escutarLeituras(uid, fazendaId, callback) {
  const q = query(
    collection(db, "users", uid, "fazendas", fazendaId, "leituras"),
    orderBy("data", "asc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Verificar se o usuário tem fazendas
export async function temFazendas(uid) {
  const lista = await listarFazendas(uid);
  return lista.length > 0;
}

// Fazenda selecionada (sessionStorage)
export function getFazendaSelecionada() {
  return sessionStorage.getItem("fazendaSelecionada");
}

export function setFazendaSelecionada(id) {
  sessionStorage.setItem("fazendaSelecionada", id);
}
