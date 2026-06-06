// Regras de alertas e interpretação dos indicadores

// Faixa ideal de temperatura por cultura (°C)
const tempIdeal = {
  soja: { min: 20, max: 30 },
  milho: { min: 18, max: 32 },
  cafe: { min: 18, max: 28 },
  cana: { min: 22, max: 35 },
  hortalicas: { min: 15, max: 28 },
  outro: { min: 18, max: 32 }
};

// Status do NDVI
export function getStatusNDVI(valor) {
  if (valor >= 0.6) return { texto: "Saudável", classe: "status-ok" };
  if (valor >= 0.3) return { texto: "Atenção", classe: "status-atencao" };
  return { texto: "Crítico", classe: "status-critico" };
}

// Status da umidade
export function getStatusUmidade(valor) {
  if (valor >= 35) return { texto: "Adequada", classe: "status-ok" };
  if (valor >= 20) return { texto: "Baixa", classe: "status-atencao" };
  return { texto: "Seca", classe: "status-critico" };
}

// Status da temperatura
export function getStatusTemperatura(valor, cultura) {
  const faixa = tempIdeal[cultura] || tempIdeal.outro;
  if (valor >= faixa.min && valor <= faixa.max) return { texto: "Normal", classe: "status-ok" };
  return { texto: "Fora da faixa", classe: "status-atencao" };
}

// Status da precipitação
export function getStatusPrecipitacao(valor) {
  if (valor > 50) return { texto: "Chuva forte", classe: "status-critico" };
  if (valor > 20) return { texto: "Chuva moderada", classe: "status-atencao" };
  return { texto: "Sem chuva", classe: "status-ok" };
}

// Analisa uma leitura e gera alertas
export function analisarLeitura(leitura, cultura) {
  const alertas = [];
  const hoje = leitura.data || new Date().toISOString().split("T")[0];

  if (leitura.ndvi < 0.3) {
    alertas.push({
      tipo: "estresse",
      severidade: "alta",
      data: hoje,
      mensagem: `NDVI em ${leitura.ndvi} — possível estresse da lavoura. Verifique pragas ou falta de nutrientes.`,
      lido: false
    });
  }

  if (leitura.umidadeSolo < 20) {
    alertas.push({
      tipo: "seca",
      severidade: "alta",
      data: hoje,
      mensagem: `Umidade do solo em ${leitura.umidadeSolo}% — risco de seca. Considere irrigação.`,
      lido: false
    });
  } else if (leitura.umidadeSolo < 35) {
    alertas.push({
      tipo: "seca",
      severidade: "media",
      data: hoje,
      mensagem: `Umidade do solo em ${leitura.umidadeSolo}% — abaixo do ideal. Monitore nos próximos dias.`,
      lido: false
    });
  }

  if (leitura.precipitacao > 50) {
    alertas.push({
      tipo: "chuva",
      severidade: "alta",
      data: hoje,
      mensagem: `Precipitação prevista de ${leitura.precipitacao} mm — risco de encharcamento.`,
      lido: false
    });
  } else if (leitura.precipitacao > 30) {
    alertas.push({
      tipo: "chuva",
      severidade: "media",
      data: hoje,
      mensagem: `Chuva prevista de ${leitura.precipitacao} mm — ajuste operações de campo.`,
      lido: false
    });
  }

  const faixa = tempIdeal[cultura] || tempIdeal.outro;
  if (leitura.temperatura < faixa.min || leitura.temperatura > faixa.max) {
    alertas.push({
      tipo: "estresse",
      severidade: "media",
      data: hoje,
      mensagem: `Temperatura de ${leitura.temperatura}°C fora da faixa ideal (${faixa.min}–${faixa.max}°C) para ${cultura}.`,
      lido: false
    });
  }

  return alertas;
}

// Gera resumo textual automático
export function gerarResumo(leitura, cultura, alertasAtivos) {
  const ndvi = getStatusNDVI(leitura.ndvi);
  const umidade = getStatusUmidade(leitura.umidadeSolo);

  if (alertasAtivos.length === 0) {
    return "Sua lavoura está em boas condições. Continue monitorando os indicadores regularmente.";
  }

  if (ndvi.classe === "status-ok" && umidade.classe !== "status-ok") {
    return "Sua lavoura está saudável, mas a umidade do solo está caindo. Considere irrigação nos próximos dias.";
  }

  if (ndvi.classe === "status-critico") {
    return "Atenção: o NDVI indica estresse na lavoura. Recomendamos inspeção no campo o quanto antes.";
  }

  if (umidade.classe === "status-critico") {
    return "Alerta de seca: umidade crítica no solo. Irrigação ou manejo hídrico são recomendados.";
  }

  return "Existem pontos de atenção nos indicadores. Verifique os alertas abaixo para mais detalhes.";
}

// Classe Bootstrap para severidade
export function classeSeveridade(severidade) {
  if (severidade === "alta") return "danger";
  if (severidade === "media") return "warning";
  return "success";
}

// Nome amigável do tipo de alerta
export function nomeTipoAlerta(tipo) {
  const nomes = { seca: "Seca", chuva: "Chuva", praga: "Praga", estresse: "Estresse" };
  return nomes[tipo] || tipo;
}
