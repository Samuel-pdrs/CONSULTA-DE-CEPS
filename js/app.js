/**
 * ==========================================================================
 * LOCALIZADOR DE CEPS E ENDEREÇOS — CARANGOLA / MG
 * Bacharelado em Sistemas de Informação — UEMG Carangola (2º Período)
 * Disciplina: Programação 2 (Desenvolvimento Web)
 * 
 * Lógica Vanilla ES6+ refinada:
 * - Direção de arte editorial, clean e institucional (SKILL.MD)
 * - Consulta primária ViaCEP com fallback resiliente BrasilAPI e base local
 * - Busca reversa com debounce e autocomplete de alta usabilidade
 * - Tratamento de CEPs únicos distritais e rurais
 * - Alerta contextual e amigável para CEPs legados descontinuados
 * - Acessibilidade WCAG 2.2 AA (foco visível, teclado e leitor de tela)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* --------------------------------------------------------------------------
     1. CONSTANTES E REGRAS DE NEGÓCIO (FONTE DA VERDADE)
     -------------------------------------------------------------------------- */
  const POSTAL_RULES = {
    cidade: 'Carangola',
    uf: 'MG',
    ibge: '3113305',
    ddd: '32',
    regiao: 'Sudeste',
    faixaInicio: 36800000,
    faixaFim: 36809999,

    // Distritos e Área Rural com CEP Único
    distritosRurais: {
      '36806-899': {
        cep: '36806-899',
        nome: 'Área Rural de Carangola',
        tipo: 'rural',
        descricao: 'Área Rural de Carangola',
        legado: '36800-000',
        rotuloTipo: 'CEP único (área rural)'
      },
      '36807-000': {
        cep: '36807-000',
        nome: 'Distrito de Alvorada',
        tipo: 'distrito',
        descricao: 'Distrito de Alvorada',
        legado: '36803-000',
        rotuloTipo: 'CEP único por localidade'
      },
      '36808-000': {
        cep: '36808-000',
        nome: 'Ponte Alta de Minas',
        tipo: 'distrito',
        descricao: 'Distrito de Ponte Alta de Minas',
        legado: '36805-000',
        rotuloTipo: 'CEP único por localidade'
      },
      '36809-000': {
        cep: '36809-000',
        nome: 'São Manoel do Boi',
        tipo: 'comunidade',
        descricao: 'Comunidade de São Manoel do Boi',
        legado: '36804-000',
        rotuloTipo: 'CEP único por localidade'
      }
    },

    // CEPs Legados Pré-2023
    cepsLegados: {
      '36800-000': {
        legado: '36800-000',
        tag: 'Código descontinuado',
        titulo: 'CEP 36800-000 descontinuado',
        mensagem: 'Carangola agora possui CEP individual por rua. Digite o nome da sua rua para encontrar o código atualizado.',
        acaoTexto: 'Buscar endereço',
        acaoTipo: 'mudar_aba_rua'
      },
      '36802-000': {
        legado: '36802-000',
        tag: 'Código anterior',
        titulo: 'CEP 36802-000 substituído',
        mensagem: 'O Distrito de Lacerdina agora possui CEP individual por rua (faixa 36805-001 a 36805-899). Digite o nome da rua para localizar.',
        acaoTexto: 'Buscar ruas de Lacerdina',
        acaoTipo: 'buscar_termo',
        termo: 'Lacerdina'
      },
      '36803-000': {
        legado: '36803-000',
        tag: 'Código anterior',
        titulo: 'CEP 36803-000 substituído',
        mensagem: 'O código do Distrito de Alvorada foi atualizado para 36807-000.',
        acaoTexto: 'Consultar 36807-000',
        acaoTipo: 'consultar_cep',
        cepNovo: '36807-000'
      },
      '36804-000': {
        legado: '36804-000',
        tag: 'Código anterior',
        titulo: 'CEP 36804-000 substituído',
        mensagem: 'O código de São Manoel do Boi foi atualizado para 36809-000.',
        acaoTexto: 'Consultar 36809-000',
        acaoTipo: 'consultar_cep',
        cepNovo: '36809-000'
      },
      '36805-000': {
        legado: '36805-000',
        tag: 'Código anterior',
        titulo: 'CEP 36805-000 substituído',
        mensagem: 'O código de Ponte Alta de Minas foi atualizado para 36808-000.',
        acaoTexto: 'Consultar 36808-000',
        acaoTipo: 'consultar_cep',
        cepNovo: '36808-000'
      }
    },

    // Unidades dos Correios / CEPs Especiais
    unidadesCorreios: {
      '36800-970': { nome: 'AC Carangola (Agência Central)', endereco: 'Praça Coronel Maximiano, 36', bairro: 'Centro' },
      '36800-973': { nome: 'UD Carangola (Distribuição)', endereco: 'Praça Coronel Maximiano, 36', bairro: 'Centro' },
      '36800-959': { nome: 'Clique e Retire AC Carangola', endereco: 'Praça Coronel Maximiano, 36', bairro: 'Centro' },
      '36805-970': { nome: 'AGC Lacerdina', endereco: 'Rua Josina Fraga Lacerda, 200', bairro: 'Lacerdina' }
    }
  };

  /* --------------------------------------------------------------------------
     2. ESTADO GLOBAL DA APLICAÇÃO
     -------------------------------------------------------------------------- */
  const AppState = {
    cepsData: [],
    activeTab: 'rua',          // 'rua' | 'cep'
    filteredResults: [],
    selectedIndex: -1,
    selectedItem: null,
    isLoading: false,
    debounceTimer: null,
  };

  /* --------------------------------------------------------------------------
     3. SELETORES DO DOM
     -------------------------------------------------------------------------- */
  const DOM = {
    // Abas
    tabBtnRua: document.getElementById('tab-btn-rua'),
    tabBtnCep: document.getElementById('tab-btn-cep'),
    panelBuscaRua: document.getElementById('panel-busca-rua'),
    panelBuscaCep: document.getElementById('panel-busca-cep'),

    // Modo 1: Endereço
    inputBuscaRua: document.getElementById('input-busca-rua'),
    btnLimparRua: document.getElementById('btn-limpar-rua'),
    buscaRuaHint: document.getElementById('busca-rua-hint'),
    hintRuaText: document.getElementById('hint-rua-text'),
    dropdownSugestoes: document.getElementById('dropdown-sugestoes'),
    listaSugestoes: document.getElementById('lista-sugestoes'),

    // Modo 2: CEP
    formBuscaCep: document.getElementById('form-busca-cep'),
    inputBuscaCep: document.getElementById('input-busca-cep'),
    btnLimparCep: document.getElementById('btn-limpar-cep'),
    btnConsultarCep: document.getElementById('btn-consultar-cep'),
    buscaCepHint: document.getElementById('busca-cep-hint'),
    hintCepText: document.getElementById('hint-cep-text'),

    // Exemplos rápidos e botões de tabela
    quickChips: document.querySelectorAll('.quick-chip'),
    tableQueryBtns: document.querySelectorAll('.btn-table-query'),

    // Feedbacks
    buscaLoading: document.getElementById('busca-loading'),
    loadingTitle: document.getElementById('loading-title'),
    buscaSemResultados: document.getElementById('busca-sem-resultados'),
    emptyTitle: document.getElementById('empty-title'),
    emptyDesc: document.getElementById('empty-desc'),

    // Alerta de CEP Legado
    alertaCepLegado: document.getElementById('alerta-cep-legado'),
    legacyAlertTag: document.getElementById('legacy-alert-tag'),
    legacyAlertTitle: document.getElementById('legacy-alert-title'),
    legacyAlertDesc: document.getElementById('legacy-alert-desc'),
    btnRedirecionarLegado: document.getElementById('btn-redirecionar-legado'),
    btnLegacyText: document.getElementById('btn-legacy-text'),

    // Resultado
    cardResultado: document.getElementById('card-resultado'),
    tagFonteDados: document.getElementById('tag-fonte-dados'),
    resCep: document.getElementById('res-cep'),
    resJurisdicao: document.getElementById('res-jurisdicao'),
    resLogradouro: document.getElementById('res-logradouro'),
    resBairro: document.getElementById('res-bairro'),
    resLocalidade: document.getElementById('res-localidade'),
    resIbge: document.getElementById('res-ibge'),
    resRegiaoDdd: document.getElementById('res-regiao-ddd'),
    resStatusPostal: document.getElementById('res-status-postal'),

    // Bloco Zona Rural / CEP Único
    boxCasoDistritoRural: document.getElementById('box-caso-distrito-rural'),
    ruralNoticeTitle: document.getElementById('rural-notice-title'),
    ruralNoticeDesc: document.getElementById('rural-notice-desc'),
    inputLogradouroRural: document.getElementById('input-logradouro-rural'),

    // Ações
    btnCopiarCep: document.getElementById('btn-copiar-cep'),
    copyBtnText: document.getElementById('copy-btn-text'),
    btnCopiarEnderecoCompleto: document.getElementById('btn-copiar-endereco-completo'),
    btnAbrirMapa: document.getElementById('btn-abrir-mapa'),

    // Métricas Hero
    statTotalCeps: document.getElementById('stat-total-ceps'),

    // Toast
    toast: document.getElementById('toast-notificacao'),
    toastMensagem: document.getElementById('toast-mensagem'),

    // Modais
    modalTriggers: document.querySelectorAll('[data-modal-target]'),
    allModals: document.querySelectorAll('.modal-overlay'),
  };

  /* --------------------------------------------------------------------------
     4. UTILITÁRIOS E NORMALIZAÇÃO
     -------------------------------------------------------------------------- */

  function normalizarTexto(text) {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function apenasDigitos(str) {
    if (!str) return '';
    return str.toString().replace(/\D/g, '');
  }

  function formatarCep(cep) {
    const limpo = apenasDigitos(cep);
    if (limpo.length !== 8) return cep || '';
    return `${limpo.slice(0, 5)}-${limpo.slice(5)}`;
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function aplicarMascaraCepInput(input) {
    let valor = apenasDigitos(input.value);
    if (valor.length > 8) valor = valor.slice(0, 8);
    if (valor.length > 5) {
      input.value = `${valor.slice(0, 5)}-${valor.slice(5)}`;
    } else {
      input.value = valor;
    }
  }

  async function fetchComTimeout(url, timeoutMs = 6000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  /* --------------------------------------------------------------------------
     5. CARREGAMENTO DA BASE LOCAL
     -------------------------------------------------------------------------- */
  async function carregarBaseLocal() {
    try {
      const response = await fetch('./data/ceps.json');
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      AppState.cepsData = Array.isArray(data) ? data : [];

      if (DOM.statTotalCeps) {
        DOM.statTotalCeps.textContent = AppState.cepsData.length.toString();
      }
    } catch (error) {
      console.warn('[Base Local] Erro ao carregar base estática:', error.message);
    }
  }

  /* --------------------------------------------------------------------------
     6. GESTÃO DE MODALIDADE DE BUSCA (ENDEREÇO VS CEP)
     -------------------------------------------------------------------------- */
  function alternarAbaBusca(novaAba) {
    if (AppState.activeTab === novaAba) return;
    AppState.activeTab = novaAba;

    ocultarTodosAlertas();

    if (novaAba === 'rua') {
      DOM.tabBtnRua.classList.add('active');
      DOM.tabBtnRua.setAttribute('aria-selected', 'true');
      DOM.tabBtnRua.setAttribute('tabindex', '0');

      DOM.tabBtnCep.classList.remove('active');
      DOM.tabBtnCep.setAttribute('aria-selected', 'false');
      DOM.tabBtnCep.setAttribute('tabindex', '-1');

      DOM.panelBuscaRua.classList.remove('hidden');
      DOM.panelBuscaCep.classList.add('hidden');

      DOM.inputBuscaRua.focus();
    } else {
      DOM.tabBtnCep.classList.add('active');
      DOM.tabBtnCep.setAttribute('aria-selected', 'true');
      DOM.tabBtnCep.setAttribute('tabindex', '0');

      DOM.tabBtnRua.classList.remove('active');
      DOM.tabBtnRua.setAttribute('aria-selected', 'false');
      DOM.tabBtnRua.setAttribute('tabindex', '-1');

      DOM.panelBuscaCep.classList.remove('hidden');
      DOM.panelBuscaRua.classList.add('hidden');

      fecharDropdown();
      DOM.inputBuscaCep.focus();
    }
  }

  function ocultarTodosAlertas() {
    DOM.alertaCepLegado.classList.add('hidden');
    DOM.buscaSemResultados.classList.add('hidden');
    DOM.buscaLoading.classList.add('hidden');
  }

  /* --------------------------------------------------------------------------
     7. BUSCA DIRETA POR CEP
     -------------------------------------------------------------------------- */

  async function consultarViaCep(cleanCep) {
    const url = `https://viacep.com.br/ws/${cleanCep}/json/`;
    const response = await fetchComTimeout(url, 5000);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.erro === true || data.erro === 'true') return null;

    return {
      cep: formatarCep(data.cep || cleanCep),
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      localidade: data.localidade || 'Carangola',
      uf: data.uf || 'MG',
      ibge: data.ibge || POSTAL_RULES.ibge,
      ddd: data.ddd || POSTAL_RULES.ddd,
      regiao: data.regiao || POSTAL_RULES.regiao,
      fonte: 'Fonte: ViaCEP'
    };
  }

  async function consultarBrasilApi(cleanCep) {
    const url = `https://brasilapi.com.br/api/cep/v2/${cleanCep}`;
    const response = await fetchComTimeout(url, 6000);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.cep) return null;

    return {
      cep: formatarCep(data.cep),
      logradouro: data.street || '',
      complemento: '',
      bairro: data.neighborhood || '',
      localidade: data.city || 'Carangola',
      uf: data.state || 'MG',
      ibge: (data.ibge && data.ibge.city) ? data.ibge.city : POSTAL_RULES.ibge,
      ddd: POSTAL_RULES.ddd,
      regiao: POSTAL_RULES.regiao,
      fonte: 'Fonte: BrasilAPI'
    };
  }

  function consultarBaseLocal(cleanCep) {
    const item = AppState.cepsData.find(x => apenasDigitos(x.cep) === cleanCep);
    if (!item) return null;

    return {
      cep: formatarCep(item.cep),
      logradouro: item.logradouro || '',
      complemento: item.complemento || '',
      bairro: item.bairro || '',
      localidade: item.localidade || 'Carangola',
      uf: item.uf || 'MG',
      ibge: item.ibge || POSTAL_RULES.ibge,
      ddd: item.ddd || POSTAL_RULES.ddd,
      regiao: item.regiao || POSTAL_RULES.regiao,
      unidade: item.unidade || '',
      fonte: 'Fonte: Base local'
    };
  }

  async function executarBuscaPorCep(cepOriginal) {
    const cleanCep = apenasDigitos(cepOriginal);
    const cepComMascara = formatarCep(cleanCep);

    if (cleanCep.length !== 8) {
      DOM.buscaCepHint.className = 'input-hint hint-error';
      DOM.hintCepText.textContent = 'Digite os 8 dígitos do CEP.';
      return;
    }

    // Interceptação de CEPs antigos descontinuados
    if (POSTAL_RULES.cepsLegados[cepComMascara]) {
      acionarAlertaCepLegado(POSTAL_RULES.cepsLegados[cepComMascara]);
      return;
    }

    AppState.isLoading = true;
    ocultarTodosAlertas();
    DOM.cardResultado.classList.add('hidden');
    DOM.buscaLoading.classList.remove('hidden');
    DOM.loadingTitle.textContent = `Consultando ${cepComMascara}...`;

    let resultado = null;

    try {
      resultado = await consultarViaCep(cleanCep);
    } catch (err) {
      // continua para fallback
    }

    if (!resultado) {
      try {
        resultado = await consultarBrasilApi(cleanCep);
      } catch (err) {
        // continua para base local
      }
    }

    if (!resultado) {
      resultado = consultarBaseLocal(cleanCep);
    }

    AppState.isLoading = false;
    DOM.buscaLoading.classList.add('hidden');

    if (resultado) {
      aplicarRegrasDeNegocioResultado(resultado);
      renderizarCardResultado(resultado);
    } else {
      exibirFeedbackCepNaoEncontrado(cleanCep);
    }
  }

  function aplicarRegrasDeNegocioResultado(item) {
    const cepFormatado = formatarCep(item.cep);

    // Caso B: Distritos e Área Rural com CEP único
    if (POSTAL_RULES.distritosRurais[cepFormatado]) {
      const distInfo = POSTAL_RULES.distritosRurais[cepFormatado];
      item.isDistritoRural = true;
      item.bairro = item.bairro || distInfo.nome;
      item.statusPostal = distInfo.rotuloTipo;
      item.distritoDesc = distInfo.descricao;
      return;
    }

    // Unidades dos Correios
    if (POSTAL_RULES.unidadesCorreios[cepFormatado]) {
      const unid = POSTAL_RULES.unidadesCorreios[cepFormatado];
      item.isUnidadeCorreios = true;
      item.logradouro = unid.endereco;
      item.bairro = unid.bairro;
      item.statusPostal = 'Unidade dos Correios';
      return;
    }

    // Caso A: Codificado por logradouro
    item.isDistritoRural = false;
    item.statusPostal = 'CEP individual por logradouro';
  }

  function exibirFeedbackCepNaoEncontrado(cleanCep) {
    DOM.buscaSemResultados.classList.remove('hidden');
    DOM.emptyTitle.textContent = `CEP ${formatarCep(cleanCep)} não encontrado`;
    DOM.emptyDesc.textContent = 'Verifique se os números foram digitados corretamente ou tente a busca por endereço.';
  }

  /* --------------------------------------------------------------------------
     8. BUSCA POR ENDEREÇO / LOGRADOURO
     -------------------------------------------------------------------------- */

  function lidarComEntradaBuscaRua() {
    const termoOriginal = DOM.inputBuscaRua.value;
    const termoNormalizado = normalizarTexto(termoOriginal);

    if (termoOriginal.length > 0) {
      DOM.btnLimparRua.classList.remove('hidden');
    } else {
      DOM.btnLimparRua.classList.add('hidden');
    }

    // Se o usuário digitou ou colou um CEP no campo de endereço
    const digitos = apenasDigitos(termoOriginal);
    if (digitos.length === 8 && termoOriginal.length <= 9) {
      alternarAbaBusca('cep');
      DOM.inputBuscaCep.value = formatarCep(digitos);
      executarBuscaPorCep(digitos);
      return;
    }

    if (termoNormalizado.length < 3) {
      fecharDropdown();
      DOM.buscaSemResultados.classList.add('hidden');
      DOM.buscaRuaHint.className = 'input-hint';
      DOM.hintRuaText.textContent = 'Digite o nome da rua ou localidade.';
      return;
    }

    clearTimeout(AppState.debounceTimer);
    AppState.debounceTimer = setTimeout(() => {
      executarBuscaReversaLogradouros(termoOriginal, termoNormalizado);
    }, 280);
  }

  async function executarBuscaReversaLogradouros(termoOriginal, termoNormalizado) {
    DOM.buscaRuaHint.className = 'input-hint hint-searching';
    DOM.hintRuaText.textContent = 'Pesquisando logradouros em Carangola...';

    const resultadosLocais = filtrarBaseLocal(termoOriginal, termoNormalizado);
    let resultadosRemotos = [];

    try {
      const url = `https://viacep.com.br/ws/MG/Carangola/${encodeURIComponent(termoOriginal)}/json/`;
      const response = await fetchComTimeout(url, 4500);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) resultadosRemotos = data;
      }
    } catch (err) {
      // fallback na base local
    }

    const mapaUnico = new Map();

    resultadosRemotos.forEach(item => {
      if (item.cep) {
        mapaUnico.set(formatarCep(item.cep), {
          ...item,
          cep: formatarCep(item.cep),
          fonte: 'Fonte: ViaCEP'
        });
      }
    });

    resultadosLocais.forEach(item => {
      const cepFormatado = formatarCep(item.cep);
      if (!mapaUnico.has(cepFormatado)) {
        mapaUnico.set(cepFormatado, {
          ...item,
          cep: cepFormatado,
          fonte: 'Fonte: Base local'
        });
      }
    });

    const listaFinal = Array.from(mapaUnico.values());
    AppState.filteredResults = listaFinal;
    AppState.selectedIndex = -1;

    if (listaFinal.length > 0) {
      DOM.buscaSemResultados.classList.add('hidden');
      DOM.buscaRuaHint.className = 'input-hint hint-valid';
      DOM.hintRuaText.textContent = `${listaFinal.length} endereço${listaFinal.length > 1 ? 's' : ''} encontrado${listaFinal.length > 1 ? 's' : ''}.`;
      renderizarDropdown(listaFinal, termoOriginal);
    } else {
      fecharDropdown();
      DOM.buscaSemResultados.classList.remove('hidden');
      DOM.emptyTitle.textContent = 'Nenhum endereço encontrado';
      DOM.emptyDesc.textContent = `Não encontramos correspondências para "${termoOriginal}". Verifique a ortografia ou consulte o Guia Postal abaixo.`;
      DOM.buscaRuaHint.className = 'input-hint';
      DOM.hintRuaText.textContent = 'Nenhuma correspondência em Carangola.';
    }
  }

  function filtrarBaseLocal(termoOriginal, termoNormalizado) {
    const cleanCepBusca = apenasDigitos(termoOriginal);

    return AppState.cepsData.filter(item => {
      const logradouroNorm = normalizarTexto(item.logradouro);
      const bairroNorm = normalizarTexto(item.bairro);
      const cleanItemCep = apenasDigitos(item.cep);

      return (
        logradouroNorm.includes(termoNormalizado) ||
        bairroNorm.includes(termoNormalizado) ||
        (cleanCepBusca.length >= 3 && cleanItemCep.includes(cleanCepBusca))
      );
    });
  }

  function renderizarDropdown(lista, termoDigitado) {
    DOM.listaSugestoes.innerHTML = '';
    const safeRegex = new RegExp(`(${escapeRegex(termoDigitado)})`, 'gi');

    lista.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.setAttribute('role', 'option');
      li.setAttribute('id', `sugestao-${index}`);
      li.setAttribute('aria-selected', 'false');

      const nomeExibicao = item.logradouro || item.bairro || 'Logradouro de Carangola';
      const nomeFormatado = nomeExibicao.replace(safeRegex, '<mark class="suggestion-highlight">$1</mark>');
      const bairroFormatado = item.bairro || 'Carangola';

      li.innerHTML = `
        <div class="suggestion-info">
          <span class="suggestion-name">${nomeFormatado}</span>
          <span class="suggestion-bairro">${bairroFormatado} • Carangola / MG</span>
        </div>
        <span class="suggestion-badge">${formatarCep(item.cep)}</span>
      `;

      li.addEventListener('click', () => {
        aplicarRegrasDeNegocioResultado(item);
        renderizarCardResultado(item);
        DOM.inputBuscaRua.value = item.logradouro || item.bairro;
        fecharDropdown();
      });

      DOM.listaSugestoes.appendChild(li);
    });

    abrirDropdown();
  }

  function abrirDropdown() {
    DOM.dropdownSugestoes.classList.remove('hidden');
    DOM.dropdownSugestoes.setAttribute('aria-hidden', 'false');
    DOM.inputBuscaRua.setAttribute('aria-expanded', 'true');
  }

  function fecharDropdown() {
    DOM.dropdownSugestoes.classList.add('hidden');
    DOM.dropdownSugestoes.setAttribute('aria-hidden', 'true');
    DOM.inputBuscaRua.setAttribute('aria-expanded', 'false');
    AppState.selectedIndex = -1;
  }

  function lidarComTecladoAutocomplete(e) {
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
        const item = AppState.filteredResults[AppState.selectedIndex];
        aplicarRegrasDeNegocioResultado(item);
        renderizarCardResultado(item);
        DOM.inputBuscaRua.value = item.logradouro || item.bairro;
        fecharDropdown();
      } else if (itens.length > 0) {
        const item = AppState.filteredResults[0];
        aplicarRegrasDeNegocioResultado(item);
        renderizarCardResultado(item);
        DOM.inputBuscaRua.value = item.logradouro || item.bairro;
        fecharDropdown();
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
        DOM.inputBuscaRua.setAttribute('aria-activedescendant', el.id);
      } else {
        el.classList.remove('is-active');
        el.setAttribute('aria-selected', 'false');
      }
    });
  }

  /* --------------------------------------------------------------------------
     9. CASO C — ALERTA DE CEP LEGADO
     -------------------------------------------------------------------------- */
  function acionarAlertaCepLegado(regraLegado) {
    ocultarTodosAlertas();
    DOM.cardResultado.classList.add('hidden');
    fecharDropdown();

    DOM.legacyAlertTag.textContent = regraLegado.tag;
    DOM.legacyAlertTitle.textContent = regraLegado.titulo;
    DOM.legacyAlertDesc.textContent = regraLegado.mensagem;
    DOM.btnLegacyText.textContent = regraLegado.acaoTexto;

    DOM.btnRedirecionarLegado.onclick = () => {
      DOM.alertaCepLegado.classList.add('hidden');

      if (regraLegado.acaoTipo === 'mudar_aba_rua') {
        alternarAbaBusca('rua');
        DOM.inputBuscaRua.value = '';
        DOM.inputBuscaRua.focus();
      } else if (regraLegado.acaoTipo === 'buscar_termo') {
        alternarAbaBusca('rua');
        DOM.inputBuscaRua.value = regraLegado.termo;
        lidarComEntradaBuscaRua();
      } else if (regraLegado.acaoTipo === 'consultar_cep') {
        alternarAbaBusca('cep');
        DOM.inputBuscaCep.value = formatarCep(regraLegado.cepNovo);
        executarBuscaPorCep(regraLegado.cepNovo);
      }
    };

    DOM.alertaCepLegado.classList.remove('hidden');
    DOM.alertaCepLegado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* --------------------------------------------------------------------------
     10. RENDERIZAÇÃO DO RESULTADO
     -------------------------------------------------------------------------- */
  function renderizarCardResultado(item) {
    if (!item) return;
    AppState.selectedItem = item;

    ocultarTodosAlertas();

    const cepFormatado = formatarCep(item.cep);

    // Fonte precisa e discreta
    DOM.tagFonteDados.textContent = item.fonte || 'Fonte: ViaCEP';

    // CEP em destaque absoluto
    DOM.resCep.textContent = cepFormatado;
    const isOutroMunicipio = (item.localidade && item.localidade.toLowerCase() !== 'carangola');
    DOM.resJurisdicao.textContent = isOutroMunicipio 
      ? `${item.localidade} • ${item.uf}` 
      : 'Carangola • MG';

    // Detalhes ordenados
    DOM.resLogradouro.textContent = item.logradouro || (item.isDistritoRural ? '(Aguardando complemento)' : '—');
    DOM.resBairro.textContent = item.bairro || 'Carangola';
    DOM.resLocalidade.textContent = `${item.localidade || 'Carangola'} / ${item.uf || 'MG'}`;
    DOM.resIbge.textContent = item.ibge || POSTAL_RULES.ibge;
    DOM.resRegiaoDdd.textContent = item.ddd || POSTAL_RULES.ddd;
    DOM.resStatusPostal.textContent = item.statusPostal || 'CEP individual por logradouro';

    // Caso B: Distrito / Zona Rural com CEP único
    if (item.isDistritoRural) {
      DOM.boxCasoDistritoRural.classList.remove('hidden');
      DOM.ruralNoticeTitle.textContent = `${item.distritoDesc || item.bairro} — CEP único`;
      DOM.ruralNoticeDesc.textContent = 'Esta localidade opera com CEP único. Informe o logradouro ou fazenda para formatar o endereço completo.';
      DOM.inputLogradouroRural.value = '';
      DOM.inputLogradouroRural.focus();
    } else {
      DOM.boxCasoDistritoRural.classList.add('hidden');
    }

    atualizarLinkMapa(item);

    DOM.cardResultado.classList.remove('hidden');
    DOM.cardResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function atualizarLinkMapa(item) {
    const viaRural = DOM.inputLogradouroRural ? DOM.inputLogradouroRural.value.trim() : '';
    const logradouro = viaRural || item.logradouro || '';
    const query = [
      logradouro,
      item.bairro,
      item.localidade || 'Carangola',
      item.uf || 'MG',
      formatarCep(item.cep)
    ].filter(Boolean).join(', ');

    DOM.btnAbrirMapa.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  /* --------------------------------------------------------------------------
     11. CÓPIA COM FEEDBACK VISUAL
     -------------------------------------------------------------------------- */
  let toastTimer = null;

  async function copiarTexto(texto, mensagemSucesso) {
    try {
      await navigator.clipboard.writeText(texto);
      exibirToast(mensagemSucesso);
      return true;
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        exibirToast(mensagemSucesso);
        document.body.removeChild(textarea);
        return true;
      } catch (e) {
        document.body.removeChild(textarea);
        exibirToast('Não foi possível copiar.');
        return false;
      }
    }
  }

  function exibirToast(mensagem) {
    DOM.toastMensagem.textContent = mensagem;
    DOM.toast.classList.remove('hidden');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      DOM.toast.classList.add('hidden');
    }, 2500);
  }

  function copiarCepAtual() {
    if (!AppState.selectedItem || !AppState.selectedItem.cep) return;
    const cep = formatarCep(AppState.selectedItem.cep);

    DOM.copyBtnText.textContent = 'Copiado!';
    DOM.btnCopiarCep.classList.add('btn-copied');

    copiarTexto(cep, `CEP ${cep} copiado com sucesso!`);

    setTimeout(() => {
      DOM.copyBtnText.textContent = 'Copiar CEP';
      DOM.btnCopiarCep.classList.remove('btn-copied');
    }, 2000);
  }

  function copiarEnderecoCompleto() {
    if (!AppState.selectedItem) return;
    const item = AppState.selectedItem;
    const viaRural = DOM.inputLogradouroRural ? DOM.inputLogradouroRural.value.trim() : '';
    const logradouroFinal = viaRural || item.logradouro || '';

    const partes = [];
    if (logradouroFinal) partes.push(logradouroFinal);
    if (item.bairro) partes.push(item.bairro);
    partes.push(`${item.localidade || 'Carangola'} - ${item.uf || 'MG'}`);
    partes.push(`CEP: ${formatarCep(item.cep)}`);

    const textoCompleto = partes.join(', ');
    copiarTexto(textoCompleto, 'Endereço copiado com sucesso!');
  }

  /* --------------------------------------------------------------------------
     12. CONTROLE DE MODAIS
     -------------------------------------------------------------------------- */
  let modalAberto = null;
  let ultimoElementoFocado = null;

  function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    ultimoElementoFocado = document.activeElement;
    modalAberto = modal;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const closeBtn = modal.querySelector('.modal-btn-close') || modal.querySelector('.btn-modal-action');
    if (closeBtn) closeBtn.focus();
  }

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
     13. LISTENERS DE EVENTOS
     -------------------------------------------------------------------------- */

  DOM.tabBtnRua.addEventListener('click', () => alternarAbaBusca('rua'));
  DOM.tabBtnCep.addEventListener('click', () => alternarAbaBusca('cep'));

  DOM.inputBuscaRua.addEventListener('input', lidarComEntradaBuscaRua);
  DOM.inputBuscaRua.addEventListener('keydown', lidarComTecladoAutocomplete);
  DOM.btnLimparRua.addEventListener('click', () => {
    DOM.inputBuscaRua.value = '';
    DOM.btnLimparRua.classList.add('hidden');
    fecharDropdown();
    DOM.buscaSemResultados.classList.add('hidden');
    DOM.buscaRuaHint.className = 'input-hint';
    DOM.hintRuaText.textContent = 'Digite o nome da rua ou localidade.';
    DOM.inputBuscaRua.focus();
  });

  DOM.inputBuscaCep.addEventListener('input', () => {
    aplicarMascaraCepInput(DOM.inputBuscaCep);
    const digitos = apenasDigitos(DOM.inputBuscaCep.value);

    if (digitos.length > 0) {
      DOM.btnLimparCep.classList.remove('hidden');
    } else {
      DOM.btnLimparCep.classList.add('hidden');
    }

    if (digitos.length === 8) {
      executarBuscaPorCep(digitos);
    }
  });

  DOM.formBuscaCep.addEventListener('submit', (e) => {
    e.preventDefault();
    executarBuscaPorCep(DOM.inputBuscaCep.value);
  });

  DOM.btnLimparCep.addEventListener('click', () => {
    DOM.inputBuscaCep.value = '';
    DOM.btnLimparCep.classList.add('hidden');
    DOM.buscaSemResultados.classList.add('hidden');
    DOM.alertaCepLegado.classList.add('hidden');
    DOM.buscaCepHint.className = 'input-hint';
    DOM.hintCepText.textContent = 'Digite os 8 dígitos do CEP.';
    DOM.inputBuscaCep.focus();
  });

  if (DOM.inputLogradouroRural) {
    DOM.inputLogradouroRural.addEventListener('input', () => {
      const valor = DOM.inputLogradouroRural.value.trim();
      DOM.resLogradouro.textContent = valor || '(Aguardando complemento)';
      if (AppState.selectedItem) {
        atualizarLinkMapa(AppState.selectedItem);
      }
    });
  }

  // Exemplos rápidos
  DOM.quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.getAttribute('data-search-type');
      const val = chip.getAttribute('data-search-val');

      if (type === 'rua') {
        alternarAbaBusca('rua');
        DOM.inputBuscaRua.value = val;
        lidarComEntradaBuscaRua();
      } else {
        alternarAbaBusca('cep');
        DOM.inputBuscaCep.value = formatarCep(val);
        executarBuscaPorCep(val);
      }
    });
  });

  // Botões de consulta na tabela do guia
  DOM.tableQueryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-search-type');
      const val = btn.getAttribute('data-search-val');

      if (type === 'rua') {
        alternarAbaBusca('rua');
        DOM.inputBuscaRua.value = val;
        lidarComEntradaBuscaRua();
      } else {
        alternarAbaBusca('cep');
        DOM.inputBuscaCep.value = formatarCep(val);
        executarBuscaPorCep(val);
      }

      const searchSec = document.getElementById('busca-secao');
      if (searchSec) {
        searchSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!DOM.inputBuscaRua.contains(e.target) && !DOM.dropdownSugestoes.contains(e.target)) {
      fecharDropdown();
    }
  });

  DOM.btnCopiarCep.addEventListener('click', copiarCepAtual);
  DOM.btnCopiarEnderecoCompleto.addEventListener('click', copiarEnderecoCompleto);

  DOM.modalTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      abrirModal(targetId);
    });
  });

  DOM.allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharModal();
    });

    const closeBtns = modal.querySelectorAll('.modal-btn-close, .modal-close-action');
    closeBtns.forEach(b => b.addEventListener('click', fecharModal));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalAberto) {
      fecharModal();
    }
  });

  /* --------------------------------------------------------------------------
     14. INICIALIZAÇÃO
     -------------------------------------------------------------------------- */
  carregarBaseLocal();
});
