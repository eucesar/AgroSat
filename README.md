# AgroSat

> Monitoramento agrícola via satélite para pequenos e médios produtores rurais.

**Global Solution — FIAP · Space Connect 2026**  
**Turma 4SIOA — Sistemas de Informação**

**Repositório:** [github.com/eucesar/AgroSat](https://github.com/eucesar/AgroSat)

---

## Como rodar

Baixe ou clone o repositório e siga estes passos — **funciona normal** para qualquer pessoa com internet.

### Passo a passo

1. Baixe o projeto ou clone:
   ```bash
   git clone https://github.com/eucesar/AgroSat.git
   cd AgroSat
   ```
2. Abra a pasta no **VS Code** e instale a extensão **Live Server**.
3. Clique com botão direito em `index.html` → **Open with Live Server**.
4. Acesse `http://127.0.0.1:5500` no navegador.

> **Importante:** não abra o HTML com duplo clique (`file://`). Os módulos JavaScript (`import/export`) exigem um **servidor HTTP local**.

**Alternativa sem Live Server:**
```bash
npx serve .
```

### O que já vem pronto

- Firebase configurado (projeto `agrosat-gs`)
- Login e cadastro por e-mail/senha
- Dados de satélite **simulados** ao cadastrar uma fazenda
- Todas as telas: landing → fazendas → dashboard → gráficos → histórico

**Não precisa** instalar Node, npm ou banco de dados local — só servidor HTTP + internet (Firebase e CDNs).

### Firebase (obrigatório para gravar dados)

As regras do Firestore precisam estar publicadas no [Console Firebase](https://console.firebase.google.com) → projeto `agrosat-gs` → **Firestore → Regras** → colar o conteúdo de `firestore.rules` → **Publicar**.

### Teste rápido

1. Criar conta na landing  
2. Cadastrar uma fazenda  
3. Abrir o dashboard e ver KPIs + gráficos  

Se isso funcionar, o projeto está ok.

---

## Integrantes

| Nome | RM | Curso |
|---|---|---|
| Cesar Iglesias | 98007 | Sistemas de Informação |
| Samuel Aguiar | 550212 | Sistemas de Informação |

**Turma:** 4SIOA  
**Instituição:** FIAP — Graduação (Sistemas de Informação / FIAP ON)

---

## Sobre o projeto

O **AgroSat** é uma plataforma web que traduz dados orbitais em informações práticas para o produtor rural. Índices técnicos como **NDVI**, **umidade do solo**, **temperatura** e **precipitação** deixam de ser abstratos e passam a gerar **alertas automáticos**, **gráficos** e **histórico de safra** em uma interface simples e acessível.

O projeto conecta o tema **Space Connect** — uso de dados de satélite — a um problema real do agronegócio brasileiro: a **exclusão de pequenos e médios produtores** das ferramentas de agricultura de precisão, que ainda são caras, complexas e dependentes de consultoria especializada.

### O problema

- Produtores familiares não têm acesso a monitoramento remoto da lavoura.
- Dados de satélite existem, mas chegam em formatos técnicos e difíceis de interpretar.
- Decisões sobre irrigação, colheita e manejo acabam sendo tomadas no “feeling”, com risco de perda de safra.

### A solução

- Cadastro simples de fazendas com cultura, área e localização.
- Simulação realista de leituras de satélite (30 dias de histórico ao cadastrar).
- Dashboard com KPIs coloridos, tendências e resumo automático em linguagem clara.
- Alertas de seca, chuva forte, estresse da lavoura e temperatura fora da faixa ideal.
- Gráficos temporais e histórico completo com exportação CSV.

---

## Funcionalidades

| Tela | O que faz |
|---|---|
| **Landing Page** | Apresentação do produto, seções de problema/solução, login e cadastro em modais |
| **Fazendas** | CRUD de propriedades (plano free: até 2 fazendas), geração automática de dados simulados |
| **Dashboard** | Banner da fazenda, mini-stats, 4 KPIs com barras de status, alertas, gráficos de 7 dias e análise automática |
| **Gráficos** | Filtros de período (7/30/90 dias) e indicador, Chart.js interativo, estatísticas do período |
| **Histórico** | Resumo da safra, gráfico de distribuição, tabela paginada, timeline de alertas e export CSV |

### Indicadores monitorados

| Indicador | O que representa | Faixas de referência |
|---|---|---|
| **NDVI** | Vigor e saúde da vegetação | Saudável ≥ 0,6 · Atenção 0,3–0,6 · Crítico < 0,3 |
| **Umidade do solo** | Retenção hídrica (% simulada) | Adequada ≥ 35% · Baixa 20–35% · Seca < 20% |
| **Temperatura** | Condição térmica (°C) | Faixa ideal varia por cultura (soja, milho, café, etc.) |
| **Precipitação** | Volume de chuva (mm/dia) | Sem chuva · Moderada · Chuva forte (> 50 mm) |

### Alertas automáticos

Gerados a partir das regras em `js/utils/alertas.js`:

- **Estresse da lavoura** — NDVI abaixo de 0,3
- **Seca** — umidade do solo abaixo de 20%
- **Chuva forte** — precipitação acima de 50 mm
- **Temperatura** — fora da faixa ideal da cultura cadastrada

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Estrutura | HTML5 semântico |
| Estilo | CSS3 + Bootstrap 5 + animações customizadas |
| Tipografia | Plus Jakarta Sans (Google Fonts) |
| Lógica | JavaScript ES Modules (sem bundler) |
| Gráficos | Chart.js 4 |
| Ícones | Bootstrap Icons |
| Autenticação | Firebase Authentication (e-mail/senha) |
| Banco de dados | Cloud Firestore |
| Hospedagem | Execução local via Live Server |

> **Nota:** os dados de satélite são **simulados** com curvas agronômicas realistas (`js/utils/simulacao.js`), adequados para demonstração acadêmica e prova de conceito.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    index.html (Landing)                  │
│              login / cadastro → Firebase Auth            │
└──────────────────────────┬──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    fazenda.html    dashboard.html   graficos.html
          │                │                │
          └────────────────┼────────────────┘
                           │
                    historico.html
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
   js/services/firestore.js        js/utils/simulacao.js
   (CRUD + listeners)              (geração de leituras)
          │                                 │
          └────────────────┬────────────────┘
                           ▼
                    Cloud Firestore
              users/{uid}/fazendas/{id}/
                ├── leituras/
                └── alertas/
```

### Fluxo do usuário

1. Acessa a landing e cria conta ou faz login.
2. Se não tem fazenda → redirecionado para **Cadastrar Fazenda**.
3. Ao salvar uma fazenda → sistema gera **30 dias de leituras** + **alertas** iniciais.
4. Navega pelo **Dashboard**, **Gráficos** e **Histórico** com seletor de fazenda.
5. Faz logout → retorna à landing (sessão encerrada no Firebase Auth).

---

## Estrutura de pastas

```
AgroSat/
├── index.html                         → Landing Page (pública)
├── pages/                             → Telas internas (protegidas por auth)
│   ├── fazenda.html                   → Cadastro e gestão de fazendas
│   ├── dashboard.html                 → Central de monitoramento
│   ├── graficos.html                  → Análise temporal
│   └── historico.html                 → Histórico e exportação
├── css/
│   ├── styles.css                     → Estilos globais + landing + componentes
│   └── interno.css                    → Visual pós-login (gradientes, animações)
├── js/
│   ├── config/
│   │   └── firebase-config.js         → Credenciais do Firebase
│   ├── services/
│   │   ├── auth.js                    → Login, cadastro, logout
│   │   └── firestore.js               → CRUD, listeners, sessionStorage
│   ├── utils/
│   │   ├── simulacao.js               → Simulação de leituras de satélite
│   │   └── alertas.js                 → Regras e interpretação dos indicadores
│   ├── components/
│   │   ├── navbar.js                  → Navbar compartilhada + proteção de rotas
│   │   └── animacoes-internas.js      → Scroll reveal e contadores animados
│   └── pages/
│       ├── landing.js                 → Auth na landing
│       ├── landing-animacoes.js       → Animações da landing
│       ├── fazenda.js
│       ├── dashboard.js
│       ├── graficos.js
│       └── historico.js
├── firestore.rules                    → Regras de segurança do Firestore
└── README.md
```

---

## Modelo de dados (Firestore)

```
users/{uid}
  ├── nome: string
  ├── email: string
  ├── plano: "free"
  └── criadoEm: timestamp
      │
      └── fazendas/{fazendaId}
            ├── nome, cultura, areaHectares
            ├── cidade, estado, latitude, longitude
            ├── criadoEm: timestamp
            │
            ├── leituras/{leituraId}
            │     ├── data: "YYYY-MM-DD"
            │     ├── ndvi: number
            │     ├── umidadeSolo: number
            │     ├── temperatura: number
            │     └── precipitacao: number
            │
            └── alertas/{alertaId}
                  ├── tipo: "seca" | "estresse" | "chuva" | "temperatura"
                  ├── severidade: "alta" | "media" | "baixa"
                  ├── data: string
                  ├── mensagem: string
                  └── lido: boolean
```

### Regras de segurança

Cada usuário acessa **apenas seus próprios dados**. As regras estão em `firestore.rules`:

```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
  // subcoleções fazendas, leituras e alertas herdam a mesma restrição
}
```

---

## Como executar

Instruções completas no início deste README → [Como rodar](#como-rodar).

---

## Configuração do Firebase

O projeto já está conectado ao Firebase **`agrosat-gs`**. Para rodar localmente, basta executar com Live Server — nenhuma instalação extra é necessária.

### Usar seu próprio projeto Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. Ative **Authentication** → provedor **E-mail/Senha**.
3. Crie um banco **Cloud Firestore**.
4. Registre um app Web e copie o objeto `firebaseConfig`.
5. Cole em `js/config/firebase-config.js`.
6. Publique as regras de `firestore.rules` em **Firestore → Regras → Publicar**.

### Checklist pós-configuração

- [ ] Authentication com e-mail/senha ativado
- [ ] Firestore criado
- [ ] Regras de `firestore.rules` publicadas
- [ ] App testado: cadastro → fazenda → dashboard

---

## Telas em detalhe

### 1. Landing Page (`index.html`)

Hero animado com cards flutuantes de indicadores, seções explicativas (problema, solução, como funciona), contadores animados no scroll e modais de login/cadastro com validação e mensagens de erro em português.

### 2. Cadastro de Fazenda (`pages/fazenda.html`)

Formulário com nome, cultura (soja, milho, café, cana, hortaliças), área em hectares, cidade/estado e coordenadas. Lista de fazendas com edição e exclusão. Ao criar, o sistema popula automaticamente 30 dias de leituras simuladas.

### 3. Dashboard (`pages/dashboard.html`)

Visão geral da lavoura selecionada: banner com status, mini-stats (dias monitorados, dias saudáveis, alertas, NDVI médio), 4 KPIs com barra de progresso e tendência, painel de alertas em tempo real, mini-gráficos de NDVI e umidade (7 dias) e bloco de análise automática em texto.

### 4. Gráficos (`pages/graficos.html`)

Análise temporal com filtros de período e indicador. Suporte a visualização individual ou combinada de todos os indicadores. Cards de estatísticas (média, mínimo, máximo) com contadores animados e legenda agronômica de referência.

### 5. Histórico (`pages/historico.html`)

Resumo da safra, gráfico de rosca com distribuição de status, tabela enriquecida com paginação, timeline de alertas e botão de exportação CSV para uso externo (planilhas, relatórios).

---

## Equipe

Projeto desenvolvido pelos integrantes da turma **4SIOA — Sistemas de Informação (FIAP)**:

| Integrante | RM |
|---|---|
| Cesar Iglesias | 98007 |
| Samuel Aguiar | 550212 |

**Projeto:** Global Solution · Space Connect 2026

---

## Licença

Projeto acadêmico desenvolvido para fins educacionais no âmbito do curso FIAP Global Solution. Todos os direitos reservados © 2026 AgroSat.
