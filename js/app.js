/**
 * ==========================================================================
 * CONSULTA DE CEPS — CARANGOLA / MG
 * Bacharelado em Sistemas de Informação — UEMG Carangola (2º Período)
 * Disciplina: Programação 2 (Desenvolvimento Web)
 * 
 * Lógica Vanilla ES6+:
 * - Carregamento assíncrono de base local (Fetch API)
 * - Filtro reativo com autocomplete (disparo a partir de 3 caracteres)
 * - Destaque absoluto aos dados e CEP selecionado
 * - Gestão acessível de modais (Trap focus, ESC, Backdrop)
 * - Cópia de CEP com feedback tátil/toast
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* --------------------------------------------------------------------------
     1. ESTADO GLOBAL DA APLICAÇÃO
     -------------------------------------------------------------------------- */
  const AppState = {
    cepsData: [],
    filteredResults: [],
    selectedIndex: -1,
    isLoading: false,
    selectedCep: null,
  };

  /* --------------------------------------------------------------------------
     2. SELETORES DO DOM
     -------------------------------------------------------------------------- */
  const DOM = {
    // Busca & Autocomplete
    inputBusca: document.getElementById('input-busca'),
    btnLimpar: document.getElementById('btn-limpar'),
    dropdownSugestoes: document.getElementById('dropdown-sugestoes'),
    listaSugestoes: document.getElementById('lista-sugestoes'),
    buscaHint: document.getElementById('busca-hint'),
    hintText: document.getElementById('hint-text'),
    buscaLoading: document.getElementById('busca-loading'),
    buscaSemResultados: document.getElementById('busca-sem-resultados'),

    // Card de Resultado
    cardResultado: document.getElementById('card-resultado'),
    tagTipoLogradouro: document.getElementById('tag-tipo-logradouro'),
    resCep: document.getElementById('res-cep'),
    resLogradouro: document.getElementById('res-logradouro'),
    resBairro: document.getElementById('res-bairro'),
    resLocalidade: document.getElementById('res-localidade'),
    resRegiaoDdd: document.getElementById('res-regiao-ddd'),
    btnCopiarCep: document.getElementById('btn-copiar-cep'),
    copyBtnText: document.getElementById('copy-btn-text'),

    // Estatísticas Hero
    statTotalCeps: document.getElementById('stat-total-ceps'),

    // Toast
    toast: document.getElementById('toast-notificacao'),
    toastMensagem: document.getElementById('toast-mensagem'),

    // Modais & Gatilhos
    modalTriggers: document.querySelectorAll('[data-modal-target]'),
    allModals: document.querySelectorAll('.modal-overlay'),
  };

  /* --------------------------------------------------------------------------
     3. FUNÇÕES AUXILIARES DE NORMALIZAÇÃO E FORMATAÇÃO
     -------------------------------------------------------------------------- */

  /**
   * Remove acentos e converte texto para minúsculas (busca insensível a acentos)
   * @param {string} text 
   * @returns {string}
   */
  function normalizarTexto(text) {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /**
   * Extrai o tipo de logradouro (Rua, Avenida, Praça, etc.)
   * @param {string} logradouro 
   * @returns {string}
   */
  function extrairTipoLogradouro(logradouro) {
    if (!logradouro) return 'Logradouro';
    const primeiroTermo = logradouro.split(' ')[0].trim();
    return primeiroTermo.charAt(0).toUpperCase() + primeiroTermo.slice(1).toLowerCase();
  }

  /**
   * Escapa caracteres especiais de regex
   * @param {string} string 
   * @returns {string}
   */
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* --------------------------------------------------------------------------
     4. CARREGAMENTO DOS DADOS LOCAIS (FETCH ASSÍNCRONO)
     -------------------------------------------------------------------------- */
  async function carregarBaseCeps() {
    AppState.isLoading = true;
    DOM.buscaLoading.classList.remove('hidden');

    try {
      const response = await fetch('./data/ceps.json');
      if (!response.ok) {
        throw new Error(`Erro HTTP ao carregar base: ${response.status}`);
      }

      const data = await response.json();
      AppState.cepsData = Array.isArray(data) ? data : [];

      // Atualiza indicador estatístico no Hero
      if (DOM.statTotalCeps) {
        DOM.statTotalCeps.textContent = AppState.cepsData.length.toString();
      }

      console.info(`[ViaCEP Carangola] Base de ${AppState.cepsData.length} logradouros carregada com sucesso.`);
    } catch (error) {
      console.error('Falha ao inicializar ceps.json:', error);
      DOM.hintText.textContent = 'Erro ao carregar os dados locais de Carangola. Atualize a página.';
      DOM.buscaHint.classList.add('error');
    } finally {
      AppState.isLoading = false;
      DOM.buscaLoading.classList.add('hidden');
    }
  }

  /* --------------------------------------------------------------------------
     5. MECANISMO DE BUSCA REATIVA E AUTOCOMPLETE (3+ CARACTERES)
     -------------------------------------------------------------------------- */

  /**
   * Processa a entrada do usuário conforme a regra de 3 caracteres mínimos
   */
  function lidarComEntradaBusca() {
    const termoOriginal = DOM.inputBusca.value;
    const termoNormalizado = normalizarTexto(termoOriginal);

    // Controle do botão de limpar
    if (termoOriginal.length > 0) {
      DOM.btnLimpar.classList.remove('hidden');
    } else {
      DOM.btnLimpar.classList.add('hidden');
    }

    // Regra do PDF: O disparo só ocorre após 3 ou mais caracteres
    if (termoNormalizado.length < 3) {
      fecharDropdown();
      DOM.buscaSemResultados.classList.add('hidden');
      DOM.buscaHint.className = 'search-hint';

      if (termoNormalizado.length === 0) {
        DOM.hintText.textContent = 'Digite pelo menos 3 caracteres para iniciar o filtro reativo.';
      } else {
        const faltam = 3 - termoNormalizado.length;
        DOM.hintText.textContent = `Digite mais ${faltam} caractere${faltam > 1 ? 's' : ''} para buscar...`;
      }
      return;
    }

    // Executa a filtragem em memória
    filtrarLogradouros(termoOriginal, termoNormalizado);
  }

  /**
   * Filtra registros por logradouro, bairro ou CEP
   * @param {string} termoOriginal 
   * @param {string} termoNormalizado 
   */
  function filtrarLogradouros(termoOriginal, termoNormalizado) {
    DOM.buscaHint.className = 'search-hint searching';
    DOM.hintText.textContent = 'Buscando correspondências...';

    const resultados = AppState.cepsData.filter(item => {
      const logradouroNorm = normalizarTexto(item.logradouro);
      const bairroNorm = normalizarTexto(item.bairro);
      const cepLimpo = item.cep.replace(/\D/g, '');
      const buscaLimpa = termoOriginal.replace(/\D/g, '');

      return (
        logradouroNorm.includes(termoNormalizado) ||
        bairroNorm.includes(termoNormalizado) ||
        (buscaLimpa.length >= 3 && cepLimpo.includes(buscaLimpa))
      );
    });

    AppState.filteredResults = resultados;
    AppState.selectedIndex = -1;

    if (resultados.length > 0) {
      DOM.buscaSemResultados.classList.add('hidden');
      DOM.buscaHint.className = 'search-hint valid';
      DOM.hintText.textContent = `${resultados.length} logradouro${resultados.length > 1 ? 's' : ''} encontrado${resultados.length > 1 ? 's' : ''}. Use as setas ou clique para selecionar.`;
      renderizarDropdown(resultados, termoOriginal);
    } else {
      fecharDropdown();
      DOM.buscaSemResultados.classList.remove('hidden');
      DOM.buscaHint.className = 'search-hint';
      DOM.hintText.textContent = 'Nenhuma correspondência encontrada na base de Carangola.';
    }
  }

  /**
   * Renderiza a lista flutuante de sugestões destacando a parte digitada
   * @param {Array} lista 
   * @param {string} termoDigitado 
   */
  function renderizarDropdown(lista, termoDigitado) {
    DOM.listaSugestoes.innerHTML = '';
    const safeRegex = new RegExp(`(${escapeRegex(termoDigitado)})`, 'gi');

    lista.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.setAttribute('role', 'option');
      li.setAttribute('id', `sugestao-${index}`);
      li.setAttribute('aria-selected', 'false');

      // Destaque visual do termo encontrado
      const nomeFormatado = item.logradouro.replace(safeRegex, '<mark class="suggestion-highlight">$1</mark>');

      li.innerHTML = `
        <div class="suggestion-info">
          <span class="suggestion-name">${nomeFormatado}</span>
          <span class="suggestion-bairro">${item.bairro || 'Zona Urbana'} • Carangola - MG</span>
        </div>
        <span class="suggestion-badge">${item.cep}</span>
      `;

      li.addEventListener('click', () => {
        selecionarLogradouro(item);
      });

      DOM.listaSugestoes.appendChild(li);
    });

    abrirDropdown();
  }

  function abrirDropdown() {
    DOM.dropdownSugestoes.classList.remove('hidden');
    DOM.dropdownSugestoes.setAttribute('aria-hidden', 'false');
    DOM.inputBusca.setAttribute('aria-expanded', 'true');
  }

  function fecharDropdown() {
    DOM.dropdownSugestoes.classList.add('hidden');
    DOM.dropdownSugestoes.setAttribute('aria-hidden', 'true');
    DOM.inputBusca.setAttribute('aria-expanded', 'false');
    AppState.selectedIndex = -1;
  }

  /**
   * Navegação acessível via teclado (Setas Cima / Baixo / Enter / Escape)
   * @param {KeyboardEvent} e 
   */
  function lidarComTecladoBusca(e) {
    const itens = DOM.listaSugestoes.querySelectorAll('.suggestion-item');
    if (!itens.length || DOM.dropdownSugestoes.classList.contains('hidden')) {
      if (e.key === 'Escape') fecharDropdown();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      AppState.selectedIndex = (AppState.selectedIndex + 1) % itens.length;
      atualizarItemAtivo(itens);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      AppState.selectedIndex = (AppState.selectedIndex - 1 + itens.length) % itens.length;
      atualizarItemAtivo(itens);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (AppState.selectedIndex >= 0 && AppState.selectedIndex < itens.length) {
        selecionarLogradouro(AppState.filteredResults[AppState.selectedIndex]);
      } else if (itens.length > 0) {
        selecionarLogradouro(AppState.filteredResults[0]);
      }
    } else if (e.key === 'Escape') {
      fecharDropdown();
    }
  }

  function atualizarItemAtivo(itens) {
    itens.forEach((el, idx) => {
      if (idx === AppState.selectedIndex) {
        el.classList.add('is-active');
        el.setAttribute('aria-selected', 'true');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        DOM.inputBusca.setAttribute('aria-activedescendant', el.id);
      } else {
        el.classList.remove('is-active');
        el.setAttribute('aria-selected', 'false');
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. RENDERIZAÇÃO DE DADOS & DESTAQUE ABSOLUTO AO CEP
     -------------------------------------------------------------------------- */

  /**
   * Seleciona o logradouro e exibe seus dados detalhados na tela
   * @param {Object} item 
   */
  function selecionarLogradouro(item) {
    if (!item) return;

    AppState.selectedCep = item;
    fecharDropdown();

    // Atualiza campo de busca com o nome completo
    DOM.inputBusca.value = item.logradouro;
    DOM.btnLimpar.classList.remove('hidden');

    // Preenche os dados detalhados
    const tipo = extrairTipoLogradouro(item.logradouro);
    DOM.tagTipoLogradouro.textContent = tipo;
    DOM.resCep.textContent = item.cep || 'Não informado';
    DOM.resLogradouro.textContent = item.logradouro || '—';
    DOM.resBairro.textContent = item.bairro || 'Centro / Zona Central';
    DOM.resLocalidade.textContent = `${item.localidade || 'Carangola'} / ${item.uf || 'MG'}`;
    DOM.resRegiaoDdd.textContent = `${item.regiao || 'Sudeste'} • DDD (${item.ddd || '32'})`;

    // Exibe o Card com Destaque
    DOM.cardResultado.classList.remove('hidden');

    // Suporte sutil ao foco para acessibilidade
    DOM.cardResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Limpa todo o formulário de busca e reseta os estados
   */
  function limparBusca() {
    DOM.inputBusca.value = '';
    DOM.btnLimpar.classList.add('hidden');
    DOM.buscaSemResultados.classList.add('hidden');
    DOM.cardResultado.classList.add('hidden');
    DOM.buscaHint.className = 'search-hint';
    DOM.hintText.textContent = 'Digite pelo menos 3 caracteres para iniciar o filtro reativo.';
    fecharDropdown();
    DOM.inputBusca.focus();
  }

  /* --------------------------------------------------------------------------
     7. CÓPIA DO CEP COM FEEDBACK INTERATIVO (TOAST)
     -------------------------------------------------------------------------- */
  let toastTimer = null;

  async function copiarCep() {
    if (!AppState.selectedCep || !AppState.selectedCep.cep) return;

    const cep = AppState.selectedCep.cep;

    try {
      await navigator.clipboard.writeText(cep);
      mostrarFeedbackCopia(true, `CEP ${cep} copiado com sucesso!`);
    } catch (err) {
      // Fallback para navegadores antigos
      const textarea = document.createElement('textarea');
      textarea.value = cep;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        mostrarFeedbackCopia(true, `CEP ${cep} copiado!`);
      } catch (e) {
        mostrarFeedbackCopia(false, 'Não foi possível copiar o CEP.');
      }
      document.body.removeChild(textarea);
    }
  }

  function mostrarFeedbackCopia(sucesso, mensagem) {
    DOM.copyBtnText.textContent = 'Copiado!';
    DOM.btnCopiarCep.classList.add('copied');

    DOM.toastMensagem.textContent = mensagem;
    DOM.toast.classList.remove('hidden');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      DOM.copyBtnText.textContent = 'Copiar CEP';
      DOM.btnCopiarCep.classList.remove('copied');
      DOM.toast.classList.add('hidden');
    }, 2500);
  }

  /* --------------------------------------------------------------------------
     8. CONTROLE DOS MODAIS FLUTUANTES (SOBRE, TERMOS, PRIVACIDADE)
     -------------------------------------------------------------------------- */

  let modalAberto = null;
  let ultimoElementoFocado = null;

  /**
   * Abre a janela flutuante com suporte a acessibilidade
   * @param {string} modalId 
   */
  function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    ultimoElementoFocado = document.activeElement;
    modalAberto = modal;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Evita rolagem da página

    // Foca no primeiro botão interativo do modal
    const closeBtn = modal.querySelector('.modal-btn-close') || modal.querySelector('.btn-modal-action');
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Fecha o modal aberto e devolve o foco
   */
  function fecharModal() {
    if (!modalAberto) return;

    modalAberto.classList.add('hidden');
    document.body.style.overflow = '';
    modalAberto = null;

    if (ultimoElementoFocado) {
      ultimoElementoFocado.focus();
    }
  }

  /* --------------------------------------------------------------------------
     9. REGISTRO DE EVENTOS (LISTENERS)
     -------------------------------------------------------------------------- */

  // Eventos de Busca e Teclado
  DOM.inputBusca.addEventListener('input', lidarComEntradaBusca);
  DOM.inputBusca.addEventListener('keydown', lidarComTecladoBusca);
  DOM.btnLimpar.addEventListener('click', limparBusca);

  // Copiar CEP
  DOM.btnCopiarCep.addEventListener('click', copiarCep);

  // Fechar dropdown ao clicar fora do container de busca
  document.addEventListener('click', (e) => {
    if (!DOM.inputBusca.contains(e.target) && !DOM.dropdownSugestoes.contains(e.target)) {
      fecharDropdown();
    }
  });

  // Gatilhos de Abertura de Modais
  DOM.modalTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      abrirModal(targetId);
    });
  });

  // Fechamento de Modais (Botões e Clique no Overlay)
  DOM.allModals.forEach(modal => {
    // Clique no overlay escuro de fundo fecha o modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        fecharModal();
      }
    });

    // Botões com classe de fechar
    const closeButtons = modal.querySelectorAll('.modal-btn-close, .modal-close-action');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', fecharModal);
    });
  });

  // Fechar modal com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalAberto) {
      fecharModal();
    }
  });

  /* --------------------------------------------------------------------------
     10. INICIALIZAÇÃO DA APLICAÇÃO
     -------------------------------------------------------------------------- */
  carregarBaseCeps();
});
