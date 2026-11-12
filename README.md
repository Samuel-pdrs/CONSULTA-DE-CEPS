# 📍 Consulta Inteligente de CEPs — Carangola / MG

> **Atividade Prática:** Desenvolvimento de Landing Page Canônica para Consulta de CEPs  
> **Instituição:** Universidade do Estado de Minas Gerais (UEMG) — Unidade Acadêmica de Carangola  
> **Curso:** Bacharelado em Sistemas de Informação — 2º Período  
> **Disciplina:** Programação 2 (Desenvolvimento Web)  

---

## 👥 Equipe de Desenvolvimento
* **Samuel Pedrosa do Carmo**
* **Davy Gomes Souza**
* **Gabriel da Silva Fonseca**

---

## 🎯 Sobre o Projeto

Aplicação web canônica de página única desenvolvida para consulta reativa, ágil e acessível de logradouros e Códigos de Endereçamento Postal (CEPs) do município mineiro de **Carangola - MG**.

A ferramenta foi projetada seguindo rigorosamente a **arquitetura Vanilla Web**, operando com **100% de processamento local no navegador**, sem qualquer dependência de bibliotecas ou frameworks externos.

---

## 🚀 Principais Funcionalidades e Diferenciais Técnicos

* **Consolidação e Higienização de Dados (ViaCEP):**
  * Extração automatizada e desduplicação de ruas, avenidas e praças de Carangola/MG obtidas via API pública do ViaCEP.
  * Armazenamento estático em `data/ceps.json` e consumo assíncrono via `fetch()`.
* **Filtro Reativo e Autocomplete Inteligente:**
  * Disparo automático do filtro condicionado à digitação de **3 ou mais caracteres**.
  * Destaque visual dos caracteres pesquisados dentro da lista flutuante de sugestões.
  * Suporte completo à navegação por teclado (Setas `↑` / `↓`, `Enter` e `Esc`).
* **Destaque Absoluto ao CEP:**
  * Renderização instantânea dos dados do logradouro (Bairro, Localidade/UF, Região, DDD).
  * Painel de destaque com escala tipográfica ampliada para o CEP e botão de cópia com feedback tátil (*Toast Notification*).
* **Modais Flutuantes Acessíveis:**
  * Modais de **Sobre o Projeto**, **Termos de Uso** e **Política de Privacidade** (conforme LGPD).
  * Fechamento ergonômico via botão de fechar, clique no overlay escurecido de fundo ou tecla `Escape`.
* **Design System & Acessibilidade (WCAG 2.2 AA):**
  * Paleta orientada pela **Regra 60-30-10** em Dark Mode confortável.
  * Tipografia fluida com `clamp()` e espaçamento modular.
  * Design 100% responsivo **Mobile-First** (de 375px até monitores ultra-wide).
  * Suporte à diretiva `@media (prefers-reduced-motion: reduce)`.

---

## 🛠️ Stack Tecnológica (Vanilla Pura)

| Tecnologia | Finalidade no Projeto |
| :--- | :--- |
| **HTML5 Semântico** | Marcação estrutural, metatags de acessibilidade (WAI-ARIA) e SEO. |
| **CSS3 Moderno Puro** | CSS Custom Properties (variáveis), Flexbox, CSS Grid, Glassmorphism e Media Queries nativas. |
| **JavaScript (ES6+) Puro** | Manipulação do DOM, requisição assíncrona (`fetch`), autocomplete e gestão de modais. |
| **JSON Local** | Base consolidada e normalizada de logradouros de Carangola. |

> ⚠️ **Atenção:** Em estrito cumprimento às exigências acadêmicas, este projeto **NÃO utiliza** Tailwind, Bootstrap, jQuery, React, Vue, Angular ou qualquer pacote NPM.

---

## 📁 Estrutura de Diretórios do Repositório

```text
CONSULTA-DE-CEPS/
├── index.html              # Documento principal em HTML5 semântico
├── css/
│   └── styles.css          # Estilização completa pura e regras responsivas
├── js/
│   └── app.js              # Lógica de fetch local, busca reativa, autocomplete e modais
├── data/
│   └── ceps.json           # Base unificada e higienizada de CEPs de Carangola
├── assets/                 # Imagens e logotipos institucionais
│   ├── hero-cidade.jpg     # Fotografia em alta resolução de Carangola
│   ├── logo-si.png         # Identidade visual de Sistemas de Informação
│   └── logo-uemg.png       # Logotipo oficial da UEMG Carangola
└── README.md               # Documentação técnica e autoria do projeto
```

---

## 💻 Como Executar Localmente

Como o projeto faz requisições locais a um arquivo JSON estático (`./data/ceps.json`), alguns navegadores bloqueiam requisições `fetch()` abertas via protocolo `file://` devido a políticas de segurança CORS. Recomenda-se utilizar qualquer servidor HTTP estático local:

### Opção 1: Extensão Live Server (VS Code)
1. Abra a pasta do projeto no **VS Code**.
2. Clique com o botão direito sobre o arquivo `index.html`.
3. Selecione **"Open with Live Server"**.

### Opção 2: Python (Terminal)
```bash
# Na raiz do projeto:
python -m http.server 8000
# Acesse http://localhost:8000 no navegador
```

### Opção 3: Node.js (npx)
```bash
npx serve .
```

---

## 🌐 Publicação Web (Deploy)

A aplicação está configurada para deploy estático gratuito e imediato:
* **GitHub Pages:**
  1. No repositório no GitHub, vá em **Settings** > **Pages**.
  2. Em *Branch*, selecione `main` e a pasta `/ (root)`.
  3. Salve para gerar a URL pública.
* **Vercel:**
  1. Conecte o repositório no dashboard da Vercel.
  2. O deploy é feito automaticamente sem configurações adicionais.

---

## 📢 Publicação Técnica no LinkedIn

Modelo de postagem técnica para cumprimento do requisito 5.3:

```text
🚀 Desenvolvimento Front-End Vanilla: Consulta Inteligente de CEPs com JavaScript Puro!

Como parte das atividades práticas do curso de Bacharelado em Sistemas de Informação da Universidade do Estado de Minas Gerais (UEMG Carangola), nossa equipe desenvolveu uma landing page canônica para busca interativa de logradouros da cidade de Carangola - MG.

Principais desafios e soluções técnicas implementadas:
• Manipulação de JSON local consolidado via requisições assíncronas (Fetch API);
• Algoritmo de busca reativa (autocomplete) sensível a partir de 3 caracteres digitados;
• Interface limpa e totalmente responsiva construída com HTML5 Semântico e CSS3 puro;
• Arquitetura 100% Vanilla (zero dependências, sem o uso de frameworks);
• Modais acessíveis para apresentação do projeto, termos de uso e política de privacidade.

Equipe: Samuel Pedrosa do Carmo, Davy Gomes Souza e Gabriel da Silva Fonseca.

🔗 Acesse a aplicação online: [LINK DO DEPLOY NO GITHUB PAGES OU VERCEL]
💻 Confira o código-fonte no GitHub: [LINK DO REPOSITÓRIO GITHUB]

Agradecimento especial ao nosso professor pela condução da disciplina de Programação 2.

#sistemasuemgcarangola2p20262 #DesenvolvimentoWeb #JavaScript #VanillaJS #HTML5 #CSS3 #SistemasDeInformacao #UEMGCarangola #FrontEnd #TechStudents
```

---

## 🤖 Nota de Transparência sobre o Uso de IA

Em consonância com os princípios de integridade acadêmica e transparência tecnológica, declara-se que ferramentas de Inteligência Artificial generativa **foram utilizadas** durante o desenvolvimento deste projeto. Foram aplicadas como suporte na depuração de expressões regulares do JavaScript, na estruturação semântica e na revisão sintática do CSS3, sendo toda a arquitetura, lógica de negócios e validação final concebidas e auditadas pelos membros da equipe.
