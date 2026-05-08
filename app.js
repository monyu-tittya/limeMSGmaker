/* ============================================================
   LimeMSG Maker - app.js
   LINE風メッセージ画像ジェネレーター
   ============================================================ */

'use strict';

// ===== State =====
const state = {
  persons: {
    a: {
      name: '自分',
      iconMode: 'text',   // 'text' | 'image'
      iconChar: 'A',
      iconColor: '#4a90d9',
      iconImage: null,    // base64 string
      iconImageX: 50,
      iconImageY: 50,
    },
    b: {
      name: '相手',
      iconMode: 'text',
      iconChar: 'B',
      iconColor: '#e05c8a',
      iconImage: null,
      iconImageX: 50,
      iconImageY: 50,
    },
  },
  messages: [],
  currentSender: 'a',   // 'a' = self (right), 'b' = other (left)
  msgTime: '12:00',
  bgTop: '#7A9DCB',
  bgBottom: '#7A9DCB',
};

// ===== DOM references =====
const $ = id => document.getElementById(id);

const DOM = {
  app:             $('app'),
  chatBg:          $('chat-bg'),
  messageList:     $('message-list'),
  emptyHint:       $('empty-hint'),
  headerIcon:      $('header-icon'),
  headerName:      $('header-name'),
  senderToggle:    $('sender-toggle'),
  msgInput:        $('msg-input'),
  sendBtn:         $('send-btn'),
  savePngBtn:      $('save-png-btn'),
  postXBtn:        $('post-x-btn'),
  clearBtn:        $('clear-btn'),
  settingsBtn:     $('settings-btn'),
  settingsOverlay: $('settings-overlay'),
  settingsPanel:   $('settings-panel'),
  settingsClose:   $('settings-close'),
  toast:           $('toast'),
  // Settings inputs
  nameA:           $('name-a'),
  nameB:           $('name-b'),
  iconCharA:       $('icon-char-a'),
  iconCharB:       $('icon-char-b'),
  iconColorA:      $('icon-color-a'),
  iconColorB:      $('icon-color-b'),
  previewA:        $('preview-a'),
  previewAInner:   $('preview-a-inner'),
  previewB:        $('preview-b'),
  previewBInner:   $('preview-b-inner'),
  imgUploadA:      $('img-upload-a'),
  imgUploadB:      $('img-upload-b'),
  imgClearA:       $('img-clear-a'),
  imgClearB:       $('img-clear-b'),
  textControlsA:   $('text-controls-a'),
  textControlsB:   $('text-controls-b'),
  imgControlsA:    $('img-controls-a'),
  imgControlsB:    $('img-controls-b'),
  msgTimeInput:    $('msg-time-input'),
  bgColorTop:      $('bg-color-top'),
  bgColorBottom:   $('bg-color-bottom'),
  resetBgBtn:      $('reset-bg-btn'),
  // New feature elements
  callMenuBtn:     $('call-menu-btn'),
  callSubmenu:     $('call-submenu'),
  showCallScreenBtn: $('show-call-screen-btn'),
  insertMissedCallBtn: $('insert-missed-call-btn'),
  insertVoiceCallBtn:  $('insert-voice-call-btn'),
  imgMsgBtn:       $('img-msg-btn'),
  chatImgInput:    $('chat-img-input'),
  callScreen:      $('call-screen'),
  callScreenClose: $('call-screen-close'),
  callAvatar:      $('call-avatar'),
  callName:        $('call-name'),
  callDeclineBtn:  $('call-decline-btn'),
  callAcceptBtn:   $('call-accept-btn'),
};

// ===== Toast helper =====
let toastTimer = null;
function showToast(msg, duration = 2200) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), duration);
}

// ===== Icon rendering helpers =====

/**
 * Build a text-avatar element (colored circle with letter).
 */
function makeTextAvatarEl(char, color, sizePx = 36) {
  const el = document.createElement('div');
  el.className = 'text-avatar';
  el.style.background = color;
  el.style.fontSize = `${Math.round(sizePx * 0.52)}px`;
  el.textContent = char || '?';
  return el;
}

/**
 * Build an <img> element from a base64 data URL.
 */
function makeImgEl(dataUrl, x = 50, y = 50) {
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = 'アイコン';
  img.style.objectPosition = `${x}% ${y}%`;
  return img;
}

/**
 * Render icon into a target container based on person state.
 * @param {string} personKey 'a' | 'b'
 * @param {HTMLElement} container  Element to clear and fill
 * @param {number} sizePx  Container size in px (for font-size)
 */
function renderIconInto(personKey, container, sizePx = 36) {
  const p = state.persons[personKey];
  container.innerHTML = '';
  if (p.iconMode === 'image' && p.iconImage) {
    container.appendChild(makeImgEl(p.iconImage, p.iconImageX, p.iconImageY));
  } else {
    container.appendChild(makeTextAvatarEl(p.iconChar || '?', p.iconColor, sizePx));
  }
}

// ===== Header & toggle rendering =====

function renderHeader() {
  // Header shows Person B (other person)
  renderIconInto('b', DOM.headerIcon, 36);
  DOM.headerName.textContent = state.persons.b.name;
}

function renderSenderToggle() {
  const personKey = state.currentSender;
  DOM.senderToggle.innerHTML = '';
  const p = state.persons[personKey];
  if (p.iconMode === 'image' && p.iconImage) {
    const img = makeImgEl(p.iconImage, p.iconImageX, p.iconImageY);
    img.style.borderRadius = '50%';
    DOM.senderToggle.appendChild(img);
  } else {
    const ta = makeTextAvatarEl(p.iconChar || '?', p.iconColor, 36);
    DOM.senderToggle.appendChild(ta);
  }
  // Tooltip
  DOM.senderToggle.title = `送信者: ${p.name}（タップで切替）`;
}

// ===== Settings preview rendering =====
function renderSettingsPreview(personKey) {
  const p = state.persons[personKey];
  const inner = personKey === 'a' ? DOM.previewAInner : DOM.previewBInner;
  const container = personKey === 'a' ? DOM.previewA : DOM.previewB;

  container.innerHTML = '';
  if (p.iconMode === 'image' && p.iconImage) {
    const img = makeImgEl(p.iconImage, p.iconImageX, p.iconImageY);
    container.appendChild(img);
    $(`img-pos-${personKey}`).style.display = 'flex';
  } else {
    const ta = makeTextAvatarEl(p.iconChar || '?', p.iconColor, 52);
    ta.style.fontSize = '22px';
    container.appendChild(ta);
    $(`img-pos-${personKey}`).style.display = 'none';
  }
}


// ===== Background =====
function applyBackground() {
  DOM.chatBg.style.background =
    `linear-gradient(180deg, ${state.bgTop} 0%, ${state.bgBottom} 100%)`;
}

// ===== Message management =====
let msgIdCounter = 0;

function addMessage(text, senderKey) {
  if (!text.trim()) return;

  const id = ++msgIdCounter;
  const msg = {
    id,
    type: 'text',
    text: text.trim(),
    sender: senderKey,   // 'a' = self, 'b' = other
    time: state.msgTime,
    read: senderKey === 'a',
  };
  state.messages.push(msg);
  renderMessage(msg);
  updateEmptyHint();

  // Scroll to bottom
  requestAnimationFrame(() => {
    DOM.chatBg.scrollTop = DOM.chatBg.scrollHeight;
  });
}

function deleteMessage(id) {
  state.messages = state.messages.filter(m => m.id !== id);
  const el = DOM.messageList.querySelector(`[data-msg-id="${id}"]`);
  if (el) {
    el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.9)';
    setTimeout(() => el.remove(), 200);
  }
  updateEmptyHint();
}

function renderMessage(msg) {
  // System messages (missed-call, voice-call)
  if (msg.type === 'missed-call' || msg.type === 'voice-call') {
    return renderSystemMessage(msg);
  }

  const isSelf = msg.sender === 'a';
  const personKey = msg.sender;
  const p = state.persons[personKey];

  // Row
  const row = document.createElement('div');
  row.className = `msg-row ${isSelf ? 'self' : 'other'}`;
  row.setAttribute('data-msg-id', msg.id);
  row.setAttribute('role', 'listitem');

  // Avatar
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'msg-avatar';
  renderIconInto(personKey, avatarDiv, 36);

  // Body
  const body = document.createElement('div');
  body.className = 'msg-body';

  // Name (only for other)
  if (!isSelf) {
    const nameEl = document.createElement('div');
    nameEl.className = 'msg-name';
    nameEl.textContent = p.name;
    body.appendChild(nameEl);
  }

  // Content wrap (bubble + time)
  const wrap = document.createElement('div');
  wrap.className = 'msg-content-wrap';

  // Build bubble
  const bubble = document.createElement('div');
  if (msg.type === 'image' && msg.imageData) {
    bubble.className = 'msg-bubble image-bubble';
    const img = document.createElement('img');
    img.src = msg.imageData;
    img.alt = '画像メッセージ';
    bubble.appendChild(img);
  } else {
    bubble.className = 'msg-bubble';
    bubble.textContent = msg.text;
  }

  // Toggle read status by clicking the bubble (self messages only)
  if (isSelf) {
    bubble.title = 'タップで既読を切替';
    bubble.addEventListener('click', (e) => {
      e.stopPropagation();
      msg.read = !msg.read;
      timeWrap.querySelector('.msg-read').textContent = msg.read ? '既読' : '';
      saveState();
    });
  }

  // Time + read receipt container
  const timeWrap = document.createElement('div');
  timeWrap.style.display = 'flex';
  timeWrap.style.flexDirection = 'column';
  timeWrap.style.alignItems = isSelf ? 'flex-end' : 'flex-start';
  timeWrap.style.gap = '1px';

  // Read receipt (self messages only)
  if (isSelf) {
    const readEl = document.createElement('div');
    readEl.className = 'msg-read';
    readEl.textContent = msg.read ? '既読' : '';
    readEl.title = 'タップで既読を切替';
    readEl.addEventListener('click', (e) => {
      e.stopPropagation();
      msg.read = !msg.read;
      readEl.textContent = msg.read ? '既読' : '';
      saveState();
    });
    timeWrap.appendChild(readEl);
  }

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = msg.time;
  // Also allow clicking time to toggle read for self
  if (isSelf) {
    timeEl.style.cursor = 'pointer';
    timeEl.title = 'タップで既読を切替';
    timeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      msg.read = !msg.read;
      timeWrap.querySelector('.msg-read').textContent = msg.read ? '既読' : '';
      saveState();
    });
  }
  timeWrap.appendChild(timeEl);

  const delBtn = document.createElement('button');
  delBtn.className = 'msg-delete-btn';
  delBtn.title = '削除';
  delBtn.setAttribute('aria-label', 'メッセージを削除');
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteMessage(msg.id);
  });

  if (isSelf) {
    wrap.appendChild(delBtn);
    wrap.appendChild(timeWrap);
    wrap.appendChild(bubble);
  } else {
    wrap.appendChild(bubble);
    wrap.appendChild(timeWrap);
    wrap.appendChild(delBtn);
  }

  body.appendChild(wrap);

  // Assemble row
  if (isSelf) {
    row.appendChild(body);
    row.appendChild(avatarDiv);
  } else {
    row.appendChild(avatarDiv);
    row.appendChild(body);
  }

  DOM.messageList.appendChild(row);
}

function renderSystemMessage(msg) {
  const isMissed = msg.type === 'missed-call';
  const personKey = 'b'; // Always shown as from the other person
  const p = state.persons[personKey];

  // Row (same layout as 'other' messages - left aligned)
  const row = document.createElement('div');
  row.className = 'msg-row other';
  row.setAttribute('data-msg-id', msg.id);
  row.setAttribute('role', 'listitem');

  // Avatar
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'msg-avatar';
  renderIconInto(personKey, avatarDiv, 36);

  // Body
  const body = document.createElement('div');
  body.className = 'msg-body';

  // Content wrap (call card + time)
  const wrap = document.createElement('div');
  wrap.className = 'msg-content-wrap';

  // Call card (white rounded square with phone icon + label)
  const callCard = document.createElement('div');
  callCard.className = 'call-card';

  // Phone icon SVG
  const phoneSvg = document.createElement('div');
  phoneSvg.className = 'call-card-icon';
  phoneSvg.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" fill="#888"/>
  </svg>`;

  const labelEl = document.createElement('div');
  labelEl.className = 'call-card-label';
  labelEl.textContent = isMissed ? '不在着信' : 'キャンセル';

  callCard.appendChild(phoneSvg);
  callCard.appendChild(labelEl);

  // Time
  const timeWrap = document.createElement('div');
  timeWrap.style.display = 'flex';
  timeWrap.style.flexDirection = 'column';
  timeWrap.style.alignItems = 'flex-start';
  timeWrap.style.gap = '1px';

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = msg.time;
  timeWrap.appendChild(timeEl);

  // Delete button
  const delBtn = document.createElement('button');
  delBtn.className = 'msg-delete-btn';
  delBtn.title = '削除';
  delBtn.setAttribute('aria-label', 'メッセージを削除');
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteMessage(msg.id);
  });

  wrap.appendChild(callCard);
  wrap.appendChild(timeWrap);
  wrap.appendChild(delBtn);

  body.appendChild(wrap);

  // Assemble row
  row.appendChild(avatarDiv);
  row.appendChild(body);

  DOM.messageList.appendChild(row);
}

function rerenderAllMessages() {
  // Clear and re-render (used when settings change)
  DOM.messageList.innerHTML = '';
  state.messages.forEach(msg => renderMessage(msg));
  updateEmptyHint();
}

function updateEmptyHint() {
  const hint = $('empty-hint');
  if (hint) hint.style.display = state.messages.length === 0 ? 'block' : 'none';
}

// ===== Settings panel =====
function openSettings() {
  DOM.settingsOverlay.classList.add('open');
  DOM.settingsPanel.classList.add('open');
}

function closeSettings() {
  DOM.settingsOverlay.classList.remove('open');
  DOM.settingsPanel.classList.remove('open');
}

function switchIconMode(personKey, mode) {
  state.persons[personKey].iconMode = mode;

  // Update tab styles
  document.querySelectorAll(`.icon-mode-tab[data-person="${personKey}"]`).forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  // Show/hide controls
  const textControls = $(`text-controls-${personKey}`);
  const imgControls  = $(`img-controls-${personKey}`);
  textControls.style.display = mode === 'text'  ? '' : 'none';
  imgControls.style.display  = mode === 'image' ? '' : 'none';

  renderSettingsPreview(personKey);
  renderHeader();
  renderSenderToggle();
  rerenderAllMessages();
}

// ===== Image upload (FileReader) =====
function handleImageUpload(personKey, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.persons[personKey].iconImage = e.target.result;
    // reset position
    state.persons[personKey].iconImageX = 50;
    state.persons[personKey].iconImageY = 50;
    $(`pos-x-${personKey}`).value = 50;
    $(`pos-y-${personKey}`).value = 50;

    renderSettingsPreview(personKey);
    renderHeader();
    renderSenderToggle();
    rerenderAllMessages();
    saveState();
  };
  reader.readAsDataURL(file);
}

// ===== PNG Export =====
async function saveAsPng() {
  if (state.messages.length === 0) {
    showToast('⚠️ メッセージがありません');
    return;
  }

  showToast('🎨 画像を生成中…');

  // Temporarily hide action/input bars
  DOM.app.classList.add('capturing');

  // Hide all delete buttons during capture
  const delBtns = DOM.messageList.querySelectorAll('.msg-delete-btn');
  delBtns.forEach(b => b.style.display = 'none');

  // Scroll to top to capture full conversation
  const origScrollTop = DOM.chatBg.scrollTop;
  DOM.chatBg.scrollTop = 0;

  // Set chat area to full scroll height for capture
  const origOverflow = DOM.chatBg.style.overflow;
  DOM.chatBg.style.overflow = 'visible';
  const origHeight = DOM.chatBg.style.height;
  DOM.chatBg.style.height = 'auto';

  await sleep(100);

  try {
    const canvas = await html2canvas(DOM.app, {
      useCORS: true,
      allowTaint: false,
      scale: 2,        // High DPI for sharp text
      backgroundColor: null,
      logging: false,
      removeContainer: true,
      windowWidth: DOM.app.offsetWidth,
      windowHeight: DOM.app.scrollHeight,
      // Only capture header + message list (not input bar etc.)
      height: DOM.app.scrollHeight,
    });

    // Download
    const link = document.createElement('a');
    link.download = `LimeMSG_${formatDateForFilename()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ PNG保存完了！');
  } catch (err) {
    console.error(err);
    showToast('❌ 画像の生成に失敗しました');
  } finally {
    DOM.app.classList.remove('capturing');
    delBtns.forEach(b => b.style.display = '');
    DOM.chatBg.scrollTop = origScrollTop;
    DOM.chatBg.style.overflow = origOverflow;
    DOM.chatBg.style.height = origHeight;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDateForFilename() {
  const now = new Date();
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

// ===== X (Twitter) post =====
function postToX() {
  const text = encodeURIComponent('LimeMSG Maker で作成しました 💬\n#LimeMSGMaker');
  const url = `https://x.com/intent/tweet?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  showToast('📋 先にPNGを保存して画像を添付してください！', 3500);
}

// ===== LocalStorage persistence =====
const LS_KEY = 'limemsgmaker_state';

function saveState() {
  try {
    const toSave = {
      persons: state.persons,
      messages: state.messages,
      msgTime: state.msgTime,
      bgTop: state.bgTop,
      bgBottom: state.bgBottom,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
  } catch (e) {
    // Ignore quota errors (large images may fail)
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.persons) {
      Object.assign(state.persons.a, saved.persons.a);
      Object.assign(state.persons.b, saved.persons.b);
    }
    if (saved.messages) {
      state.messages = saved.messages;
      if (state.messages.length > 0) {
        msgIdCounter = Math.max(...state.messages.map(m => m.id));
      }
    }
    if (saved.msgTime)   state.msgTime   = saved.msgTime;
    if (saved.bgTop)     state.bgTop     = saved.bgTop;
    if (saved.bgBottom)  state.bgBottom  = saved.bgBottom;
  } catch (e) {
    // Ignore
  }
}

function syncSettingsInputsFromState() {
  const a = state.persons.a;
  const b = state.persons.b;

  DOM.nameA.value      = a.name;
  DOM.nameB.value      = b.name;
  DOM.iconCharA.value  = a.iconChar;
  DOM.iconCharB.value  = b.iconChar;
  DOM.iconColorA.value = a.iconColor;
  DOM.iconColorB.value = b.iconColor;
  DOM.msgTimeInput.value = state.msgTime;
  DOM.bgColorTop.value   = state.bgTop;
  DOM.bgColorBottom.value = state.bgBottom;

  // Icon modes
  ['a', 'b'].forEach(key => {
    const mode = state.persons[key].iconMode;
    document.querySelectorAll(`.icon-mode-tab[data-person="${key}"]`).forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    $(`text-controls-${key}`).style.display = mode === 'text'  ? '' : 'none';
    $(`img-controls-${key}`).style.display  = mode === 'image' ? '' : 'none';
    renderSettingsPreview(key);
  });
}

// ===== Auto-resize textarea =====
function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

// ===== Event Listeners =====
function initEvents() {

  // --- Send message ---
  DOM.sendBtn.addEventListener('click', () => {
    const text = DOM.msgInput.value.trim();
    if (!text) return;
    addMessage(text, state.currentSender);
    DOM.msgInput.value = '';
    autoResizeTextarea(DOM.msgInput);
    saveState();
  });

  DOM.msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      DOM.sendBtn.click();
    }
  });

  DOM.msgInput.addEventListener('input', () => autoResizeTextarea(DOM.msgInput));

  // --- Sender toggle ---
  DOM.senderToggle.addEventListener('click', () => {
    state.currentSender = state.currentSender === 'a' ? 'b' : 'a';
    renderSenderToggle();
  });

  // --- Clear all ---
  DOM.clearBtn.addEventListener('click', () => {
    if (state.messages.length === 0) return;
    if (!confirm('会話をすべて削除しますか？')) return;
    state.messages = [];
    DOM.messageList.innerHTML = '';
    const hint = document.createElement('div');
    hint.id = 'empty-hint';
    hint.className = '';
    hint.innerHTML = `<div class="hint-icon">💬</div><p>下の入力欄からメッセージを追加しましょう</p>`;
    DOM.messageList.appendChild(hint);
    saveState();
    showToast('🗑️ 会話をクリアしました');
  });

  // --- Settings open/close ---
  DOM.settingsBtn.addEventListener('click', openSettings);
  DOM.settingsClose.addEventListener('click', closeSettings);
  DOM.settingsOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.settingsOverlay) closeSettings();
  });

  // --- Icon mode tabs ---
  document.querySelectorAll('.icon-mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchIconMode(tab.dataset.person, tab.dataset.mode);
      saveState();
    });
  });

  // --- Name inputs ---
  DOM.nameA.addEventListener('input', () => {
    state.persons.a.name = DOM.nameA.value || '自分';
    // Auto-set icon char to first character
    if (!state.persons.a._charManuallySet) {
      const firstChar = getFirstChar(state.persons.a.name);
      if (firstChar) {
        state.persons.a.iconChar = firstChar;
        DOM.iconCharA.value = firstChar;
        renderSettingsPreview('a');
        renderSenderToggle();
        rerenderAllMessages();
      }
    }
    saveState();
  });

  DOM.nameB.addEventListener('input', () => {
    state.persons.b.name = DOM.nameB.value || '相手';
    if (!state.persons.b._charManuallySet) {
      const firstChar = getFirstChar(state.persons.b.name);
      if (firstChar) {
        state.persons.b.iconChar = firstChar;
        DOM.iconCharB.value = firstChar;
        renderSettingsPreview('b');
        renderHeader();
        rerenderAllMessages();
      }
    }
    saveState();
  });

  // --- Icon char inputs ---
  DOM.iconCharA.addEventListener('input', () => {
    state.persons.a.iconChar = DOM.iconCharA.value || 'A';
    state.persons.a._charManuallySet = true;
    renderSettingsPreview('a');
    renderSenderToggle();
    rerenderAllMessages();
    saveState();
  });

  DOM.iconCharB.addEventListener('input', () => {
    state.persons.b.iconChar = DOM.iconCharB.value || 'B';
    state.persons.b._charManuallySet = true;
    renderSettingsPreview('b');
    renderHeader();
    rerenderAllMessages();
    saveState();
  });

  // --- Icon color inputs ---
  DOM.iconColorA.addEventListener('input', () => {
    state.persons.a.iconColor = DOM.iconColorA.value;
    renderSettingsPreview('a');
    renderSenderToggle();
    rerenderAllMessages();
    saveState();
  });

  DOM.iconColorB.addEventListener('input', () => {
    state.persons.b.iconColor = DOM.iconColorB.value;
    renderSettingsPreview('b');
    renderHeader();
    rerenderAllMessages();
    saveState();
  });

  // --- Image upload ---
  DOM.imgUploadA.addEventListener('change', (e) => {
    handleImageUpload('a', e.target.files[0]);
    saveState();
  });

  DOM.imgUploadB.addEventListener('change', (e) => {
    handleImageUpload('b', e.target.files[0]);
    saveState();
  });

  // --- Image clear ---
  DOM.imgClearA.addEventListener('click', () => {
    state.persons.a.iconImage = null;
    DOM.imgUploadA.value = '';
    renderSettingsPreview('a');
    renderSenderToggle();
    rerenderAllMessages();
    saveState();
  });

  DOM.imgClearB.addEventListener('click', () => {
    state.persons.b.iconImage = null;
    DOM.imgUploadB.value = '';
    renderSettingsPreview('b');
    renderHeader();
    rerenderAllMessages();
    saveState();
  });

  // --- Image position sliders ---
  const updatePos = (personKey, axis, val) => {
    state.persons[personKey][`iconImage${axis.toUpperCase()}`] = parseInt(val, 10);
    renderSettingsPreview(personKey);
    if (personKey === 'a') renderSenderToggle();
    if (personKey === 'b') renderHeader();
    rerenderAllMessages();
    saveState();
  };

  $('pos-x-a').addEventListener('input', (e) => updatePos('a', 'x', e.target.value));
  $('pos-y-a').addEventListener('input', (e) => updatePos('a', 'y', e.target.value));
  $('pos-x-b').addEventListener('input', (e) => updatePos('b', 'x', e.target.value));
  $('pos-y-b').addEventListener('input', (e) => updatePos('b', 'y', e.target.value));

  // --- Time input ---
  DOM.msgTimeInput.addEventListener('change', () => {
    state.msgTime = DOM.msgTimeInput.value;
    saveState();
  });

  // --- Background color ---
  DOM.bgColorTop.addEventListener('input', () => {
    state.bgTop = DOM.bgColorTop.value;
    applyBackground();
    saveState();
  });

  DOM.bgColorBottom.addEventListener('input', () => {
    state.bgBottom = DOM.bgColorBottom.value;
    applyBackground();
    saveState();
  });

  DOM.resetBgBtn.addEventListener('click', () => {
    state.bgTop    = '#7A9DCB';
    state.bgBottom = '#7A9DCB';
    DOM.bgColorTop.value    = state.bgTop;
    DOM.bgColorBottom.value = state.bgBottom;
    applyBackground();
    saveState();
  });

  // --- Save PNG ---
  DOM.savePngBtn.addEventListener('click', saveAsPng);

  // --- Post to X ---
  DOM.postXBtn.addEventListener('click', postToX);

  // ===== NEW FEATURE EVENTS =====

  // --- Call submenu toggle ---
  DOM.callMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.callSubmenu.classList.toggle('open');
  });

  // Close submenu on outside click
  document.addEventListener('click', () => {
    DOM.callSubmenu.classList.remove('open');
  });

  DOM.callSubmenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // --- Show call screen ---
  DOM.showCallScreenBtn.addEventListener('click', () => {
    DOM.callSubmenu.classList.remove('open');
    showCallScreen();
  });

  // --- Insert missed call ---
  DOM.insertMissedCallBtn.addEventListener('click', () => {
    DOM.callSubmenu.classList.remove('open');
    addSystemMessage('missed-call');
    saveState();
  });

  // --- Insert voice call ---
  DOM.insertVoiceCallBtn.addEventListener('click', () => {
    DOM.callSubmenu.classList.remove('open');
    addSystemMessage('voice-call');
    saveState();
  });

  // --- Call screen close ---
  DOM.callScreenClose.addEventListener('click', closeCallScreen);
  DOM.callDeclineBtn.addEventListener('click', closeCallScreen);
  DOM.callAcceptBtn.addEventListener('click', closeCallScreen);

  // --- Image message ---
  DOM.imgMsgBtn.addEventListener('click', () => {
    DOM.chatImgInput.click();
  });

  DOM.chatImgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addImageMessage(ev.target.result, state.currentSender);
      saveState();
    };
    reader.readAsDataURL(file);
    DOM.chatImgInput.value = '';
  });
}

// ===== Call Screen =====
function showCallScreen() {
  const b = state.persons.b;
  renderIconInto('b', DOM.callAvatar, 100);
  DOM.callName.textContent = b.name;
  DOM.callScreen.classList.add('open');
}

function closeCallScreen() {
  DOM.callScreen.classList.remove('open');
}

// ===== System / Image message helpers =====
function addSystemMessage(type) {
  const id = ++msgIdCounter;
  const msg = { id, type, time: state.msgTime, sender: 'b' };
  state.messages.push(msg);
  renderMessage(msg);
  updateEmptyHint();
  requestAnimationFrame(() => {
    DOM.chatBg.scrollTop = DOM.chatBg.scrollHeight;
  });
}

function addImageMessage(imageData, senderKey) {
  const id = ++msgIdCounter;
  const msg = {
    id,
    type: 'image',
    imageData,
    sender: senderKey,
    time: state.msgTime,
    read: senderKey === 'a',
  };
  state.messages.push(msg);
  renderMessage(msg);
  updateEmptyHint();
  requestAnimationFrame(() => {
    DOM.chatBg.scrollTop = DOM.chatBg.scrollHeight;
  });
}

// ===== Utility =====
function getFirstChar(str) {
  if (!str) return '';
  // Support emoji (surrogate pairs)
  const arr = [...str];
  return arr[0] || '';
}

// ===== Init =====
function init() {
  loadState();
  applyBackground();

  syncSettingsInputsFromState();
  renderHeader();
  renderSenderToggle();
  renderSettingsPreview('a');
  renderSettingsPreview('b');

  // Render saved messages
  state.messages.forEach(msg => renderMessage(msg));
  updateEmptyHint();

  initEvents();
}

document.addEventListener('DOMContentLoaded', init);
