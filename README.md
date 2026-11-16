# 📍 Consulta Inteligente de CEPs — Carangola / MG

> **Atividade Prática:** Desenvolvimento de Landing Page Canônica para Consulta Oficial de CEPs  
> **Instituição:** Universidade do Estado de Minas Gerais (UEMG) — Unidade Acadêmica de Carangola  
> **Curso:** Bacharelado em Sistemas de Informação — 2º Período  
> **Disciplina:** Programação 2 (Desenvolvimento Web)  
> **Fonte Oficial da Verdade:** [Base de Referência de CEPs - Carangola MG.md](file:///c:/WorkSpace/Samuel/Consulta%20de%20CEPS/CONSULTA-DE-CEPS/Base%20de%20Refer%C3%AAncia%20de%20CEPs%20-%20Carangola%20MG.md)

---

## 👥 Equipe de Desenvolvimento
* **Samuel Pedrosa do Carmo**
* **Davy Gomes Souza**
* **Gabriel da Silva Fonseca**

---

## 🎯 Sobre o Projeto

Aplicação web canônica desenvolvida para consulta reativa, precisa e acessível de Códigos de Endereçamento Postal (CEPs) e logradouros do município de **Carangola - MG** (Código IBGE: `3113305` • DDD: `32` • Faixa Postal: `36800-000` a `36809-999`).

A plataforma foi concebida conforme as diretrizes do **DNE dos Correios** e orientada pelo manifesto de **Engenharia Front-end Premium (SKILL.MD)**, priorizando arte intencional, acessibilidade WCAG 2.2 AA, responsividade rigorosa e arquitetura **100% Vanilla Web** (zero frameworks ou bibliotecas pesadas).

---

## 🚀 Principais Funcionalidades e Diferenciais Técnicos

### 1. Motor Dual de Busca & APIs Resilientes
* **Busca Direta por CEP:**
  * Máscara automática interativa (`00000-000`) e validação estrita de 8 dígitos.
  * **Consulta Primária:** API oficial do [ViaCEP](https://viacep.com.br/) (`https://viacep.com.br/ws/{cep}/json/`).
  * **Fallback Automático:** API da [BrasilAPI v2](https://brasilapi.com.br/) (`https://brasilapi.com.br/api/cep/v2/{cep}`) em caso de instabilidade.
  * **Fallback Offline:** Base local consolidada em `data/ceps.json` para operação contínua sem internet.
  * Indicador em tempo real da fonte de dados (`ViaCEP Oficial`, `BrasilAPI Fallback` ou `Base Local Offline`).
* **Busca Reversa por Logradouro / Bairro:**
  * Disparo inteligente com debounce (280ms) a partir de **3 caracteres**.
  * Consome o endpoint reverso oficial do ViaCEP (`https://viacep.com.br/ws/MG/Carangola/{termo}/json/`) mesclando dinamicamente com dados da base local.
  * Autocomplete com destaque visual do termo pesquisado e navegação integral por teclado (`↑`, `↓`, `Enter`, `Esc`).

### 2. Regras de Negócio Oficiais de Carangola (DNE / Correios)
* **Caso A — Logradouros Codificados (Sede Urbana e Distrito de Lacerdina):**
  * Sede (`36800-001` a `36804-899`) e Lacerdina (`36805-001` a `36805-899`) possuem CEP individual por via pública.
  * Preenchimento automático dos dados e bloqueio de inconsistências em Cidade/UF.
* **Caso B — CEPs Únicos dos Distritos e Zona Rural:**
  * **Área Rural de Carangola:** `36806-899` (CEP Único Rural).
  * **Distrito de Alvorada:** `36807-000` (CEP Único Distrital).
  * **Distrito de Ponte Alta de Minas:** `36808-000` (CEP Único Distrital).
  * **Comunidade São Manoel do Boi:** `36809-000` (CEP Único Local).
  * Identificação contextual e liberação de campo de digitação livre de logradouro/número/córrego para cópia formatada do endereço completo para entregas.
* **Caso C — Alerta de Redirecionamento para CEPs Legados Pré-2023:**
  * Ao digitar o CEP geral antigo **`36800-000`**, a interface intercepta a consulta e exibe um alerta oficial amigável:
    > *"Carangola agora possui CEP individual por rua. Digite o nome da sua rua para encontrar o CEP atualizado."*
    Acompanhado de botão de ação direta que chaveia para a aba de logradouro e foca no campo de busca.
  * Tratamento análogo para os CEPs legados de Lacerdina (`36802-000`), Alvorada (`36803-000`), São Manoel do Boi (`36804-000`) e Ponte Alta de Minas (`36805-000`).

### 3. Destaque Absoluto ao CEP & Utilidades
* Painel de destaque em escala tipográfica ampliada em fonte monoespaçada.
* Botão de cópia rápida do CEP com notificação tátil (*Toast Notification*).
* Botão para **Copiar Endereço Formatado** (padrão de correspondência dos Correios).
* Botão com link direto para visualização precisa no **Google Maps**.

### 4. Guia Postal Oficial de Carangola
* Seção institucional detalhada com o mapa de faixas da sede urbana, distritos rurais, unidades operacionais dos Correios (AC, UD, Clique e Retire e AGC Lacerdina) e tabela histórica de transição de códigos postais.
* Botões de consulta instantânea em um clique integrados a cada localidade.

---

## 🛠️ Stack Tecnológica (Vanilla Pura)

| Tecnologia | Finalidade no Projeto |
| :--- | :--- |
| **HTML5 Semântico** | Marcação estrutural, WAI-ARIA tabs/listbox/dialog e metatags de acessibilidade/SEO. |
| **CSS3 Moderno Puro** | Tokens em CSS Custom Properties, layout fluido com `clamp()`, Flexbox, CSS Grid, Glassmorphism e Media Queries nativas. |
| **JavaScript (ES6+) Puro** | Orquestração assíncrona (`fetch`), debounce, gestão de abas, autocomplete reativo, modais e clipboard API. |
| **JSON Local** | Base consolidada de mais de 113 logradouros, distritos e unidades dos Correios de Carangola. |

> ⚠️ **Atenção:** Em estrito cumprimento às diretrizes acadêmicas e ao Manifesto Anti-Vibe-Coding, este projeto **NÃO utiliza** Tailwind, Bootstrap, jQuery, React, Vue, Angular ou pacotes NPM.

---

## 📁 Estrutura de Diretórios do Repositório

```text
CONSULTA-DE-CEPS/
├── index.html                                 # Aplicação principal em HTML5 semântico
├── css/
│   └── styles.css                             # Estilização completa pura e responsiva
├── js/
│   └── app.js                                 # Orquestrador assíncrono (ViaCEP, BrasilAPI, regras DNE)
├── data/
│   └── ceps.json                              # Base postal consolidada de Carangola
├── assets/                                    # Recursos visuais institucionais
│   ├── hero-cidade.jpg                        # Fotografia panorâmica de Carangola
│   ├── logo-si.png                            # Identidade visual de Sistemas de Informação
│   └── logo-uemg.png                          # Logotipo oficial da UEMG Carangola
├── Base de Referência de CEPs - Carangola MG.md # Especificação técnica postal DNE oficial
├── SKILL.MD                                   # Manifesto de Engenharia Front-end Premium
└── README.md                                  # Documentação técnica e autoria do projeto
```

---

## 💻 Como Executar Localmente

### Opção 1: Python HTTP Server (Recomendado)
```bash
# Na raiz do projeto:
python -m http.server 8080
# Acesse no navegador: http://localhost:8080
```

### Opção 2: VS Code Live Server
1. Abra a pasta do projeto no **VS Code**.
2. Clique com o botão direito sobre o arquivo `index.html`.
3. Selecione **"Open with Live Server"**.

### Opção 3: Node.js (npx)
```bash
npx serve .
```

---

## 🌐 Publicação Web (Deploy)

* **GitHub Pages:**
  1. No repositório no GitHub, acesse **Settings** > **Pages**.
  2. Em *Branch*, selecione `main` e a pasta `/ (root)`.
  3. Salve para gerar a URL pública.
* **Vercel:**
  1. Conecte o repositório no dashboard da Vercel.
  2. Deploy estático automático sem configurações adicionais.

---

## 📢 Publicação Técnica no LinkedIn

```text
📍 Consulta Inteligente de CEPs de Carangola-MG: Engenharia Web Vanilla com Integração Dual API!

Como atividade prática da disciplina de Programação 2 no curso de Bacharelado em Sistemas de Informação da Universidade do Estado de Minas Gerais (UEMG Carangola), nossa equipe desenvolveu uma solução canônica e acessível para consulta postal oficial do município de Carangola - MG.

Destaques da implementação:
• Arquitetura Dual API: Consulta primária ao ViaCEP com fallback resiliente na BrasilAPI e operação offline via base local;
• Busca Reversa por Logradouro / Bairro com debounce e autocomplete sensível;
• Tratamento especializado dos distritos rurais com CEP único (Lacerdina, Alvorada, Ponte Alta e São Manoel);
• Alerta institucional amigável de redirecionamento para o CEP legado 36800-000;
• Guia Postal interativo DNE / Correios;
• Design System moderno 100% Vanilla (HTML5 semântico, CSS3 e JavaScript puro, sem frameworks ou dependências).

Equipe: Samuel Pedrosa do Carmo, Davy Gomes Souza e Gabriel da Silva Fonseca.

🔗 Aplicação online: [LINK DO DEPLOY]
💻 Código-fonte: [LINK DO REPOSITÓRIO GITHUB]

#sistemasuemgcarangola2p20262 #DesenvolvimentoWeb #JavaScript #VanillaJS #HTML5 #CSS3 #SistemasDeInformacao #UEMGCarangola #FrontEnd #ViaCEP #BrasilAPI
```

---

## 🤖 Nota de Transparência sobre o Uso de IA

Em consonância com os princípios de integridade acadêmica e transparência tecnológica, declara-se que ferramentas de Inteligência Artificial generativa **foram utilizadas** durante o desenvolvimento deste projeto como suporte na revisão sintática de código, depuração de expressões regulares e estruturação semântica, sendo toda a arquitetura, regras de negócio e validação final concebidas e auditadas pelos membros da equipe.
