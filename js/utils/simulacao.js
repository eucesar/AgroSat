// Simulação de dados de satélite (curvas agronômicas realistas)

// Valor NDVI inicial por cultura
const ndviInicial = {
  soja: 0.45,
  milho: 0.42,
  cafe: 0.55,
  cana: 0.50,
  hortalicas: 0.40,
  outro: 0.43
};

// Gera um número aleatório entre min e max
function aleatorio(min, max) {
  return min + Math.random() * (max - min);
}

// Formata data como string YYYY-MM-DD
export function formatarData(data) {
  return data.toISOString().split("T")[0];
}

// Gera uma leitura simulada para um dia
function gerarLeituraDia(data, cultura, anterior) {
  const ndviBase = anterior ? anterior.ndvi : (ndviInicial[cultura] || 0.43);
  let ndvi = ndviBase + aleatorio(-0.03, 0.04);
  ndvi = Math.max(0.2, Math.min(0.9, ndvi));

  const precipitacao = Math.random() < 0.15 ? aleatorio(5, 80) : aleatorio(0, 3);

  let umidade = anterior ? anterior.umidadeSolo : aleatorio(35, 65);
  if (precipitacao > 10) {
    umidade = Math.min(95, umidade + precipitacao * 0.4);
  } else {
    umidade = Math.max(8, umidade - aleatorio(1, 5));
  }

  const temperatura = aleatorio(18, 34);

  return {
    data: formatarData(data),
    ndvi: parseFloat(ndvi.toFixed(2)),
    umidadeSolo: parseFloat(umidade.toFixed(1)),
    temperatura: parseFloat(temperatura.toFixed(1)),
    precipitacao: parseFloat(precipitacao.toFixed(1))
  };
}

// Gera leitura inicial (hoje)
export function gerarLeituraInicial(cultura) {
  const hoje = new Date();
  return gerarLeituraDia(hoje, cultura, null);
}

// Gera histórico de leituras (últimos N dias)
export function gerarHistoricoLeituras(cultura, dias = 30) {
  const leituras = [];
  let anterior = null;
  const hoje = new Date();

  for (let i = dias - 1; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    const leitura = gerarLeituraDia(data, cultura, anterior);
    leituras.push(leitura);
    anterior = leitura;
  }

  return leituras;
}

// Calcula status do dia com base nos indicadores
export function statusDoDia(leitura) {
  if (leitura.ndvi < 0.3 || leitura.umidadeSolo < 20) return "critico";
  if (leitura.ndvi < 0.5 || leitura.umidadeSolo < 35) return "atencao";
  return "saudavel";
}
