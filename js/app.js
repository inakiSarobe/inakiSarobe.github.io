(function () {
  "use strict";

  // ===== DATA STORE =====
  let state = {
    chats: [],
    currentChatId: null,
    globalScopes: [],
    globalPrompt: "",
    userName: "Empresa",
    userEmail: "admin@empresa.com",
    userPlan: "Básico",
    theme: "light", // 'light' | 'dark'
    nextChatId: 1,
    nextScopeId: 1,
  };

  // ===== DOM REFS =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen = $("#loginScreen");
  const app = $("#app");
  const loginForm = $("#loginForm");
  const loginError = $("#loginError");

  const sidebar = $("#sidebar");
  const toggleSidebarBtn = $("#toggleSidebar");
  const chatList = $("#chatList");
  const currentChatName = $("#currentChatName");
  const chatMessages = $("#chatMessages");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");
  const sendBtn = $("#sendBtn");

  const newChatBtn = $("#newChatBtn");
  const statsBtn = $("#statsBtn");
  const scopesBtn = $("#scopesBtn");
  const themeToggle = $("#themeToggle");

  const userCard = $("#userCard");
  const upgradeBtn = $("#upgradeBtn");

  // Modales
  const userModal = $("#userModal");
  const chatScopesModal = $("#chatScopesModal");
  const chatStatsModal = $("#chatStatsModal");
  const upgradeModal = $("#upgradeModal");

  // Tabs user modal
  const tabBtns = $$(".tab-btn");
  const tabContents = {
    profile: $("#profileTab"),
    scopes: $("#scopesTab"),
    stats: $("#statsTab"),
    globalPrompt: $("#globalPromptTab"),
  };
  const globalScopeList = $("#globalScopeList");
  const addGlobalScopeBtn = $("#addGlobalScopeBtn");
  const globalPromptTextarea = $("#globalPrompt");
  const saveUserConfigBtn = $("#saveUserConfig");
  const userNameInput = $("#userName");
  const userEmailInput = $("#userEmail");
  const userPlanInput = $("#userPlan");
  const totalMessagesSpan = $("#totalMessages");
  const totalChatsSpan = $("#totalChats");
  const lastActivitySpan = $("#lastActivity");

  // Chat scopes modal
  const chatScopeList = $("#chatScopeList");
  const chatPromptTextarea = $("#chatPrompt");
  const saveChatScopesBtn = $("#saveChatScopes");

  // Chat stats modal
  const chatMsgCount = $("#chatMsgCount");
  const chatLastMsg = $("#chatLastMsg");

  // Misc
  const closeModalBtns = $$(".close-modal");
  const closeModalData = $$("[data-close]");

  // ===== INIT =====
  function init() {
    loadState();
    applyTheme(state.theme);
    renderChatList();
    if (state.chats.length === 0) {
      createNewChat("Chat de ejemplo");
    }
    if (state.currentChatId === null && state.chats.length > 0) {
      state.currentChatId = state.chats[0].id;
    }
    renderCurrentChat();
    renderGlobalScopes();
    globalPromptTextarea.value = state.globalPrompt || "";
    updateStatsTab();
    updateUserInfo();

    // Event listeners
    loginForm.addEventListener("submit", handleLogin);
    toggleSidebarBtn.addEventListener("click", toggleSidebar);
    chatForm.addEventListener("submit", handleSendMessage);
    newChatBtn.addEventListener("click", openNewChatModal);
    statsBtn.addEventListener("click", openChatStats);
    scopesBtn.addEventListener("click", openChatScopesModal);
    themeToggle.addEventListener("click", toggleTheme);
    userCard.addEventListener("click", openUserModal);
    upgradeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(upgradeModal);
    });

    // Modales
    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modalId = btn.dataset.modal;
        closeModal(document.getElementById(modalId));
      });
    });
    closeModalData.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modalId = btn.dataset.close;
        closeModal(document.getElementById(modalId));
      });
    });
    // Cerrar modal clic fuera
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });
    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const openModal = document.querySelector(".modal-overlay:not(.hidden)");
        if (openModal) closeModal(openModal);
      }
    });

    // Tabs
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.dataset.tab;
        Object.keys(tabContents).forEach((key) => {
          tabContents[key].classList.toggle("hidden", key !== tab);
        });
      });
    });

    addGlobalScopeBtn.addEventListener("click", () =>
      addScopeItem(globalScopeList, "global"),
    );
    saveUserConfigBtn.addEventListener("click", saveUserConfig);
    saveChatScopesBtn.addEventListener("click", saveChatScopes);

    // Inicializar barra de progreso
    initProgressBar();

    // Evento de click fuera de la barra de progreso
    document.addEventListener("click", handleProgressBarClickOutside);

    // Cargar scopes del chat actual en el modal de scopes
    // Se hace al abrir
  }

  // ===== LOGIN =====
  function handleLogin(e) {
    e.preventDefault();
    const email = $("#email").value.trim();
    const password = $("#password").value.trim();
    if (email === "admin@empresa.com" && password === "password") {
      loginScreen.classList.add("hidden");
      app.classList.remove("hidden");
      loginError.classList.add("hidden");
    } else {
      loginError.classList.remove("hidden");
    }
  }

  // ===== SIDEBAR =====
  function toggleSidebar() {
    sidebar.classList.toggle("collapsed");
    sidebar.classList.toggle("expanded");
  }

  function renderChatList() {
    chatList.innerHTML = "";
    state.chats.forEach((chat) => {
      const div = document.createElement("div");
      div.className = `chat-item${chat.id === state.currentChatId ? " active" : ""}`;
      div.dataset.chatId = chat.id;
      div.innerHTML = `
                <span class="chat-item-icon"><i class="fas fa-comment"></i></span>
                <span class="chat-item-text">${escapeHtml(chat.name)}</span>
            `;
      div.addEventListener("click", () => switchChat(chat.id));
      chatList.appendChild(div);
    });
  }

  function switchChat(chatId) {
    state.currentChatId = chatId;
    renderChatList();
    renderCurrentChat();
    saveState();
  }

  function renderCurrentChat() {
    const chat = state.chats.find((c) => c.id === state.currentChatId);
    if (!chat) return;
    currentChatName.textContent = chat.name;
    chatMessages.innerHTML = "";
    chat.messages.forEach((msg) => {
      appendMessage(msg.role, msg.content, false);
    });
    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
    // Actualizar stats del chat
    updateChatStats();
  }

  function appendMessage(role, content, animate = true) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}`;
    const avatar = role === "user" ? "U" : "AI";
    msgDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-bubble">${escapeHtml(content)}</div>
        `;
    chatMessages.appendChild(msgDiv);
    if (animate) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    return msgDiv;
  }

  function appendTypingIndicator() {
    const div = document.createElement("div");
    div.className = "message ai";
    div.id = "typingIndicator";
    div.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="spinner"></div>
                    <span>pensando…</span>
                </div>
            </div>
        `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
  }

  // ===== SEND MESSAGE =====
  async function handleSendMessage(e) {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    const chat = state.chats.find((c) => c.id === state.currentChatId);
    if (!chat) return;

    // Reiniciar barra de progreso
    startProgressSimulation();

    // Añadir mensaje usuario
    chat.messages.push({ role: "user", content: text });
    appendMessage("user", text);
    chatInput.value = "";
    sendBtn.disabled = true;
    saveState();

    // Mostrar indicador
    appendTypingIndicator();

    // Simular respuesta IA con efecto máquina de escribir
    const responseText =
      "**Análisis terminado, se encontraron...**\n\nDurante la ejecución del análisis, la IA debe mostrar en tiempo real cada acción que está realizando para que el usuario pueda seguir el progreso, pausar el proceso en cualquier momento, enviar comentarios o instrucciones adicionales y reanudar el análisis sin perder el contexto.\n\nTodo el proceso debe transmitir la sensación de que la IA está trabajando en tiempo real mediante una línea temporal de tareas, estados de ejecución, animaciones y actualizaciones dinámicas.\n\nSi se detecta una vulnerabilidad válida, la IA generará automáticamente un informe técnico en PDF con:\n- Resumen ejecutivo.\n- Descripción técnica del hallazgo.\n- Severidad.\n- Impacto.\n- Pasos para reproducir la vulnerabilidad.\n- Evidencias obtenidas durante el análisis.\n- Archivos utilizados para desarrollar la Proof of Concept (PoC).\n- Código, scripts o payloads generados.\n- Requests, responses, logs, capturas y cualquier otra evidencia relevante.\n- Recomendaciones de mitigación.\n\nAdemás del informe, el usuario podrá descargar todos los archivos generados o utilizados durante el análisis.\n\nSi el resultado corresponde únicamente a un Lead, comportamiento sospechoso o cualquier otro hallazgo que requiera validación adicional, la IA responderá normalmente dentro del chat mostrando los resultados obtenidos, el nivel de confianza del análisis y los próximos pasos recomendados, sin generar un informe PDF.";
    await typeWriterEffect(responseText);

    // Añadir mensaje IA
    removeTypingIndicator();
    chat.messages.push({ role: "ai", content: responseText });
    appendMessage("ai", responseText);
    sendBtn.disabled = false;
    saveState();
    updateChatStats();
    updateStatsTab();
  }

  function typeWriterEffect(text) {
    return new Promise((resolve) => {
      const bubble = document.querySelector("#typingIndicator .message-bubble");
      if (!bubble) {
        resolve();
        return;
      }
      // Limpiar contenido del indicador
      bubble.innerHTML = "";
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < text.length) {
          bubble.textContent += text.charAt(idx);
          idx++;
          chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 30); // velocidad
    });
  }

  // ===== CHAT CRUD =====
  function createNewChat(name) {
    const chat = {
      id: state.nextChatId++,
      name: name || `Chat ${state.chats.length + 1}`,
      messages: [],
      scopes: [],
      prompt: "",
    };
    state.chats.push(chat);
    state.currentChatId = chat.id;
    renderChatList();
    renderCurrentChat();
    saveState();
    updateStatsTab();
    return chat;
  }

  function renderSelectableScopes(container, selectedScopes = []) {
    container.innerHTML = "";

    if (state.globalScopes.length === 0) {
      container.innerHTML = `
        <p class="scope-empty-state">No hay scopes configurados. Añádelos primero en la configuración del usuario.</p>
      `;
      return;
    }

    const selectedIds = new Set(
      (selectedScopes || []).map((scope) => scope.id),
    );
    const list = document.createElement("div");
    list.className = "scope-selection-list";

    state.globalScopes.forEach((scope) => {
      const label = document.createElement("label");
      label.className = "scope-option";
      const checked = selectedIds.has(scope.id);
      label.innerHTML = `
        <input type="checkbox" class="scope-option-checkbox" value="${scope.id}" ${checked ? "checked" : ""}>
        <span class="scope-option-text">
          <strong>${escapeHtml(scope.type)}</strong>
          <span>${escapeHtml(scope.value)}</span>
        </span>
      `;
      list.appendChild(label);
    });

    container.appendChild(list);
  }

  function getSelectedScopesFromModal() {
    const checkedInputs = chatScopeList.querySelectorAll(
      ".scope-option-checkbox:checked",
    );
    const selectedIds = new Set(
      Array.from(checkedInputs).map((input) => Number(input.value)),
    );

    return state.globalScopes
      .filter((scope) => selectedIds.has(scope.id))
      .map((scope) => ({ ...scope }));
  }

  function openNewChatModal() {
    chatScopeList.innerHTML = "";
    chatPromptTextarea.value = "";
    renderSelectableScopes(chatScopeList, []);
    openModal(chatScopesModal);
    saveChatScopesBtn.dataset.mode = "new";
  }

  function saveChatScopes() {
    const scopes = getSelectedScopesFromModal();
    const prompt = chatPromptTextarea.value.trim();
    const mode = saveChatScopesBtn.dataset.mode || "edit";

    if (mode === "new") {
      const chat = createNewChat(`Chat ${state.chats.length + 1}`);
      chat.scopes = scopes;
      chat.prompt = prompt;
      saveState();
      renderCurrentChat();
      renderChatList();
      updateStatsTab();
    } else {
      const chat = state.chats.find((c) => c.id === state.currentChatId);
      if (chat) {
        chat.scopes = scopes;
        chat.prompt = prompt;
        saveState();
      }
    }
    closeModal(chatScopesModal);
  }

  function openChatScopesModal() {
    const chat = state.chats.find((c) => c.id === state.currentChatId);
    if (!chat) return;

    renderSelectableScopes(chatScopeList, chat.scopes || []);
    chatPromptTextarea.value = chat.prompt || "";
    saveChatScopesBtn.dataset.mode = "edit";
    openModal(chatScopesModal);
  }

  // ===== SCOPES =====
  function addScopeItem(container, type, existingScope) {
    const item = document.createElement("div");
    item.className = "scope-item";
    const scope = existingScope || {
      id: state.nextScopeId++,
      value: "",
      type: "Dominio",
    };
    item.innerHTML = `
            <input type="text" class="scope-value" placeholder="Valor del scope" value="${escapeHtml(scope.value)}">
            <select class="scope-type">
                <option value="Dominio" ${scope.type === "Dominio" ? "selected" : ""}>Dominio</option>
                <option value="API" ${scope.type === "API" ? "selected" : ""}>API</option>
                <option value="URL" ${scope.type === "URL" ? "selected" : ""}>URL</option>
                <option value="Archivo" ${scope.type === "Archivo" ? "selected" : ""}>Archivo</option>
            </select>
            <button class="remove-scope"><i class="fas fa-times"></i></button>
        `;
    item.querySelector(".remove-scope").addEventListener("click", () => {
      item.remove();
    });
    container.appendChild(item);
    // Guardar referencia del id si es nuevo
    if (!existingScope) {
      item.dataset.scopeId = state.nextScopeId++;
    } else {
      item.dataset.scopeId = scope.id;
    }
  }

  function getScopesFromList(container) {
    const items = container.querySelectorAll(".scope-item");
    const scopes = [];
    items.forEach((item) => {
      const value = item.querySelector(".scope-value").value.trim();
      const type = item.querySelector(".scope-type").value;
      if (value) {
        scopes.push({
          id: parseInt(item.dataset.scopeId) || state.nextScopeId++,
          value,
          type,
        });
      }
    });
    return scopes;
  }

  function renderGlobalScopes() {
    globalScopeList.innerHTML = "";
    state.globalScopes.forEach((scope) => {
      addScopeItem(globalScopeList, "global", scope);
    });
  }

  // ===== USER MODAL =====
  function openUserModal() {
    userNameInput.value = state.userName;
    userEmailInput.value = state.userEmail;
    userPlanInput.value = state.userPlan;
    // Scopes globales ya están renderizados
    renderGlobalScopes();
    globalPromptTextarea.value = state.globalPrompt || "";
    updateStatsTab();
    openModal(userModal);
  }

  function saveUserConfig() {
    state.userName = userNameInput.value.trim() || "Administrador";
    state.userEmail = userEmailInput.value.trim() || "admin@empresa.com";
    state.userPlan = userPlanInput.value.trim() || "Básico";
    state.globalScopes = getScopesFromList(globalScopeList);
    state.globalPrompt = globalPromptTextarea.value.trim();
    updateUserInfo();
    saveState();
    closeModal(userModal);
  }

  function updateUserInfo() {
    const nameEl = document.querySelector(".user-name");
    if (nameEl) nameEl.textContent = state.userName;
    const planEl = document.querySelector(".user-plan");
    if (planEl) planEl.textContent = `Plan ${state.userPlan}`;
  }

  // ===== STATS =====
  function updateStatsTab() {
    const totalMsgs = state.chats.reduce(
      (acc, c) => acc + c.messages.length,
      0,
    );
    totalMessagesSpan.textContent = totalMsgs;
    totalChatsSpan.textContent = state.chats.length;
    const last = state.chats.flatMap((c) => c.messages).pop();
    lastActivitySpan.textContent = last
      ? `"${last.content.substring(0, 30)}..."`
      : "-";
  }

  function openChatStats() {
    const chat = state.chats.find((c) => c.id === state.currentChatId);
    if (!chat) return;
    chatMsgCount.textContent = chat.messages.length;
    const last =
      chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1].content
        : "-";
    chatLastMsg.textContent = last;
    openModal(chatStatsModal);
  }

  function updateChatStats() {
    // Se actualiza al abrir el modal
  }

  // ===== THEME =====
  function toggleTheme() {
    const newTheme = state.theme === "light" ? "dark" : "light";
    state.theme = newTheme;
    applyTheme(newTheme);
    saveState();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const icon = themeToggle.querySelector("i");
    if (icon) {
      icon.className = theme === "light" ? "fas fa-moon" : "fas fa-sun";
    }
    state.theme = theme;
  }

  // ===== MODAL HELPERS =====
  function openModal(modal) {
    if (modal) modal.classList.remove("hidden");
  }

  function closeModal(modal) {
    if (modal) modal.classList.add("hidden");
  }

  // ===== PERSISTENCE =====
  function saveState() {
    try {
      const data = {
        chats: state.chats,
        currentChatId: state.currentChatId,
        globalScopes: state.globalScopes,
        globalPrompt: state.globalPrompt,
        userName: state.userName,
        userEmail: state.userEmail,
        userPlan: state.userPlan,
        theme: state.theme,
        nextChatId: state.nextChatId,
        nextScopeId: state.nextScopeId,
      };
      localStorage.setItem("aiChatState", JSON.stringify(data));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem("aiChatState");
      if (!raw) return;
      const data = JSON.parse(raw);
      state.chats = data.chats || [];
      state.currentChatId = data.currentChatId || null;
      state.globalScopes = data.globalScopes || [];
      state.globalPrompt = data.globalPrompt || "";
      state.userName = data.userName || "Administrador";
      state.userEmail = data.userEmail || "admin@empresa.com";
      state.userPlan = data.userPlan || "Básico";
      state.theme = data.theme || "light";
      state.nextChatId = data.nextChatId || 1;
      state.nextScopeId = data.nextScopeId || 1;
    } catch (e) {}
  }

  // ===== UTILS =====
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Detectar preferencia del sistema
  function detectSystemTheme() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }

  // ===== PROGRESS BAR =====
  const STAGES = [
    { id: 0, label: "Planificación y Reconocimiento", symbol: "🔍" },
    { id: 1, label: "Análisis y Escaneo", symbol: "📡" },
    { id: 2, label: "Evaluación de Vulnerabilidades", symbol: "⚠️" },
    { id: 3, label: "Explotación (Obtención de acceso)", symbol: "🔓" },
    { id: 4, label: "Análisis y Reporte", symbol: "📋" },
  ];

  let progressState = {
    isRunning: false,
    progress: -30,
    stageStatus: ["active", "pending", "pending", "pending", "pending"],
    isHidden: false,
  };

  function initProgressBar() {
    const stages = $$(".stage");
    stages.forEach((stage, index) => {
      const stageData = STAGES[index];
      stage.dataset.status = index === 0 ? "active" : "pending";
      const symbol = stage.querySelector(".stage-symbol");
      symbol.setAttribute("data-label", stageData.label);
    });

    // Ocultar la barra inicialmente
    const progressContainer = $("#progressContainer");
    progressContainer.classList.add("hide");
    progressState.isHidden = true;
  }

  function handleProgressBarClickOutside(e) {
    // Si la barra ya está oculta, no hacer nada
    if (progressState.isHidden) return;

    const progressContainer = $("#progressContainer");
    if (!progressContainer) return;

    // Obtener las coordenadas del contenedor y del click
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;

    // Verificar si el click fue dentro de la barra
    const isInside =
      clickX >= rect.left &&
      clickX <= rect.right &&
      clickY >= rect.top &&
      clickY <= rect.bottom;

    // Si fue afuera, ocultar la barra
    if (!isInside) {
      hideProgressBar();
    }
  }

  function showProgressBar() {
    const progressContainer = $("#progressContainer");
    progressContainer.classList.remove("hide");
    progressState.isHidden = false;
  }

  function hideProgressBar() {
    const progressContainer = $("#progressContainer");
    progressContainer.classList.add("hide");
    progressState.isHidden = true;
  }

  function startProgressSimulation() {
    if (progressState.isRunning) return;
    progressState.isRunning = true;

    showProgressBar();

    // Reset de estado: comienza en -30% con el primer item activo
    progressState.progress = -30;
    progressState.stageStatus = [
      "active",
      "pending",
      "pending",
      "pending",
      "pending",
    ];

    const progressLine = $("#progressLine");
    const stages = $$(".stage");

    // Duración total: 15 segundos
    const totalDuration = 15000;
    const startTime = Date.now();

    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let progress = -30 + (elapsed / totalDuration) * 130; // De -30% a 100%

      if (progress >= 100) {
        progress = 100;
        clearInterval(animationInterval);
        progressState.isRunning = false;

        // Finalizar todas las etapas
        updateProgressBar(100);
        return;
      }

      updateProgressBar(progress);
    }, 50);
  }

  function updateProgressBar(progress) {
    progressState.progress = progress;

    const progressLine = $("#progressLine");
    const wrapper = document.querySelector('.progress-bar-wrapper');
    const computed = getComputedStyle(wrapper);
    const padLeft = parseFloat(computed.paddingLeft) || 0;
    const padRight = parseFloat(computed.paddingRight) || 0;
    const availWidth = Math.max(0, wrapper.clientWidth - padLeft - padRight);

    // Convert progress (-30 .. 100) into 0..1 fraction for the available track
    const fraction = Math.max(0, Math.min(1, (progress + 30) / 130));

    // Position the line in pixels within the padded track
    progressLine.style.left = padLeft + 'px';
    progressLine.style.width = Math.max(0, availWidth * fraction) + 'px';

    const stages = $$(".stage");
    const totalStages = stages.length;

    // Stage positions as fractions (0..1)
    const stagePositions = Array.from({ length: totalStages }, (_, i) => i / (totalStages - 1));

    stages.forEach((stage, index) => {
      const stagePos = stagePositions[index];
      const nextStagePos = index < totalStages - 1 ? stagePositions[index + 1] : 1;

      // First stage should be active immediately when loading starts
      if (index === 0) {
        if (fraction < stagePos) {
          stage.dataset.status = 'active';
          progressState.stageStatus[index] = 'active';
          return;
        }
        // else continue to normal logic
      }

      if (fraction < stagePos) {
        // Not reached yet
        stage.dataset.status = 'pending';
        progressState.stageStatus[index] = 'pending';
      } else if (fraction >= stagePos && fraction < nextStagePos) {
        // In progress (the line is passing this item)
        if (index === totalStages - 1) {
          // Last stage: yellow until 85% absolute progress, then red
          if (progress >= 85) {
            stage.dataset.status = 'error';
            progressState.stageStatus[index] = 'error';
          } else {
            stage.dataset.status = 'active';
            progressState.stageStatus[index] = 'active';
          }
        } else {
          stage.dataset.status = 'active';
          progressState.stageStatus[index] = 'active';
        }
      } else {
        // Completed (the line passed this item)
        if (index === totalStages - 1) {
          stage.dataset.status = 'error';
          progressState.stageStatus[index] = 'error';
        } else {
          stage.dataset.status = 'success';
          progressState.stageStatus[index] = 'success';
        }
      }
    });
  }

  // Reiniciar progreso cada vez que se envía un mensaje
  async function handleSendMessage_Original(e) {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Reiniciar la barra de progreso
    startProgressSimulation();

    const chat = state.chats.find((c) => c.id === state.currentChatId);
    if (!chat) return;

    // Añadir mensaje usuario
    chat.messages.push({ role: "user", content: text });
    appendMessage("user", text);
    chatInput.value = "";
    sendBtn.disabled = true;
    saveState();

    // Mostrar indicador
    appendTypingIndicator();

    // Simular respuesta IA con efecto máquina de escribir
    const responseText =
      "**Análisis terminado, se encontraron...**\n\nDurante la ejecución del análisis, la IA debe mostrar en tiempo real cada acción que está realizando para que el usuario pueda seguir el progreso, pausar el proceso en cualquier momento, enviar comentarios o instrucciones adicionales y reanudar el análisis sin perder el contexto.\n\nTodo el proceso debe transmitir la sensación de que la IA está trabajando en tiempo real mediante una línea temporal de tareas, estados de ejecución, animaciones y actualizaciones dinámicas.\n\nSi se detecta una vulnerabilidad válida, la IA generará automáticamente un informe técnico en PDF con:\n- Resumen ejecutivo.\n- Descripción técnica del hallazgo.\n- Severidad.\n- Impacto.\n- Pasos para reproducir la vulnerabilidad.\n- Evidencias obtenidas durante el análisis.\n- Archivos utilizados para desarrollar la Proof of Concept (PoC).\n- Código, scripts o payloads generados.\n- Requests, responses, logs, capturas y cualquier otra evidencia relevante.\n- Recomendaciones de mitigación.\n\nAdemás del informe, el usuario podrá descargar todos los archivos generados o utilizados durante el análisis.\n\nSi el resultado corresponde únicamente a un Lead, comportamiento sospechoso o cualquier otro hallazgo que requiera validación adicional, la IA responderá normalmente dentro del chat mostrando los resultados obtenidos, el nivel de confianza del análisis y los próximos pasos recomendados, sin generar un informe PDF.";
    await typeWriterEffect(responseText);

    // Añadir mensaje IA
    removeTypingIndicator();
    chat.messages.push({ role: "ai", content: responseText });
    appendMessage("ai", responseText);
    sendBtn.disabled = false;
    saveState();
    updateChatStats();
    updateStatsTab();
  }

  // Inicializar tema
  (function initTheme() {
    const saved = localStorage.getItem("aiChatState");
    let theme = "light";
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.theme) theme = data.theme;
      } catch (e) {}
    } else {
      theme = detectSystemTheme();
    }
    state.theme = theme;
    applyTheme(theme);
  })();

  // Iniciar app
  document.addEventListener("DOMContentLoaded", init);
})();
