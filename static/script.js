/* =====================================================
   LaTeXForge — Frontend Script
   Preserving all original API calls, adding new View routing
   ===================================================== */

const RESEARCH_SECTIONS = window.RESEARCH_SECTIONS;
const RESUME_SECTIONS   = window.RESUME_SECTIONS;

// ── App State ─────────────────────────────────────────
let currentDocType = null; // 'research' or 'resume'
let documentSections = []; // [{key, label, latex, docType}]
let lastGeneratedLatex = null;
let currentDownloadUrl = null;

// ── DOM Elements: Navigation & Views ──────────────────
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const navItems = document.querySelectorAll('.nav-item[data-target]');
const viewPanels = document.querySelectorAll('.view-panel');
const progressSteps = document.querySelectorAll('.progress-indicator .step');

// Nav buttons specifically
const navSetup = document.getElementById('nav-setup');
const navBuilder = document.getElementById('nav-builder');
const navCompile = document.getElementById('nav-compile');
const continueBuilderBtn = document.getElementById('continue-builder-btn');

// ── DOM Elements: Setup ───────────────────────────────
const setupTypeLabel = document.getElementById('setup-type-label');
const metaResearch = document.getElementById('meta-research');
const metaResume = document.getElementById('meta-resume');

const metaTitle = document.getElementById('meta-title');
const metaAuthor = document.getElementById('meta-author');
const metaInstitution = document.getElementById('meta-institution');
const metaName = document.getElementById('meta-name');
const metaLocation = document.getElementById('meta-location');
const metaEmail = document.getElementById('meta-email');
const metaPhone = document.getElementById('meta-phone');
const metaLinkedin = document.getElementById('meta-linkedin');

// ── DOM Elements: Builder ─────────────────────────────
const sectionSelect = document.getElementById('section-select');
const rawContent = document.getElementById('raw-content');
const charCounter = document.getElementById('char-counter');
const fileInput = document.getElementById('file-upload');
const uploadBtn = document.getElementById('upload-btn');
const generateBtn = document.getElementById('generate-btn');
const generateStatus = document.getElementById('generate-status');
const snippetPreviewContainer = document.getElementById('snippet-preview-container');
const addSectionBtn = document.getElementById('add-section-btn');
const sectionListEl = document.getElementById('section-list');
const sectionCountEl = document.getElementById('section-count');

// ── DOM Elements: Compile ─────────────────────────────
const compileBtn = document.getElementById('compile-btn');
const downloadTexBtn = document.getElementById('download-tex-btn');
const previewDownloadBtn = document.getElementById('preview-download-btn');
const previewFullscreenBtn = document.getElementById('preview-fullscreen-btn');
const previewFrame = document.getElementById('preview-frame');
const previewPlaceholder = document.getElementById('preview-placeholder');
const compileLog = document.getElementById('compile-log');

// ── DOM Elements: Global ──────────────────────────────
const topDocTitle = document.getElementById('top-doc-title');
const saveStatusText = document.getElementById('save-status-text');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');

// ── CodeMirror Editors ────────────────────────────────
const snippetEditor = CodeMirror(document.getElementById('snippet-editor'), {
  mode: 'stex',
  theme: 'dracula',
  lineNumbers: true,
  lineWrapping: true,
  readOnly: false,
  value: '% Generated code appears here',
});

const masterEditor = CodeMirror(document.getElementById('master-editor'), {
  mode: 'stex',
  theme: 'dracula',
  lineNumbers: true,
  lineWrapping: true,
  value: '% Master document will appear here',
});

// Delay refresh to ensure they measure correctly when views unhide
function refreshEditors() {
  setTimeout(() => {
    snippetEditor.refresh();
    masterEditor.refresh();
  }, 50);
}

// ── UI Helpers ────────────────────────────────────────
function showLoading(msg = 'Processing...') {
  loadingMessage.textContent = msg;
  loadingOverlay.hidden = false;
  loadingOverlay.classList.remove('fade-out');
}

function hideLoading() {
  loadingOverlay.classList.add('fade-out');
  setTimeout(() => { loadingOverlay.hidden = true; }, 300);
}

function setBusy(btn, isBusy, originalHtml) {
  if (isBusy) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-sm"></span> Working...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

function updateProgressIndicator(stepNum) {
  progressSteps.forEach(step => {
    const s = parseInt(step.dataset.step);
    if (s === stepNum) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

function showSaveStatus(msg) {
  saveStatusText.textContent = msg;
  saveStatusText.style.color = 'var(--text-primary)';
  setTimeout(() => {
    saveStatusText.textContent = 'Saved locally';
    saveStatusText.style.color = 'var(--text-muted)';
  }, 2000);
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── View Routing ──────────────────────────────────────
function switchView(targetId) {
  // Update nav active state
  navItems.forEach(btn => {
    if (btn.dataset.target === targetId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle panels
  viewPanels.forEach(panel => {
    if (panel.id === targetId) {
      panel.hidden = false;
      // Slight delay to allow display:flex to apply before adding active class for opacity transition
      setTimeout(() => panel.classList.add('active'), 10);
    } else {
      panel.classList.remove('active');
      setTimeout(() => {
        if (!panel.classList.contains('active')) panel.hidden = true;
      }, 300); // match css transition
    }
  });

  // Specific view actions
  if (targetId === 'view-setup') updateProgressIndicator(1);
  if (targetId === 'view-builder') {
    updateProgressIndicator(2);
    refreshEditors();
  }
  if (targetId === 'view-compile') {
    updateProgressIndicator(3);
    refreshEditors();
    reassemble(); // Ensure master is up to date when switching here
  }
}

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!btn.disabled) switchView(btn.dataset.target);
  });
});

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// ── Templates -> Setup ────────────────────────────────
document.querySelectorAll('.template-card').forEach(card => {
  card.addEventListener('click', () => {
    const type = card.dataset.type; // 'research' or 'resume'
    currentDocType = type;
    
    // Unlock views
    navSetup.disabled = false;
    navBuilder.disabled = false;
    navCompile.disabled = false;

    // Update setup UI
    if (type === 'research') {
      setupTypeLabel.textContent = "Research Paper";
      metaResearch.hidden = false;
      metaResume.hidden = true;
    } else {
      setupTypeLabel.textContent = "Résumé";
      metaResearch.hidden = true;
      metaResume.hidden = false;
    }

    // Populate builder sections
    populateSections();

    // Clear existing document if switching types
    if (documentSections.length > 0 && documentSections[0].docType !== type) {
      if (confirm("Switching templates will clear your current document sections. Continue?")) {
        documentSections = [];
        renderSectionList();
      } else {
        return; // user cancelled
      }
    }

    // Move to setup
    switchView('view-setup');
  });
});

continueBuilderBtn.addEventListener('click', () => {
  switchView('view-builder');
});

// ── Builder Logic ─────────────────────────────────────
function populateSections() {
  const map = currentDocType === 'research' ? RESEARCH_SECTIONS : RESUME_SECTIONS;
  sectionSelect.innerHTML = '';
  Object.entries(map).forEach(([key, label]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    sectionSelect.appendChild(opt);
  });
}

// Character counter
function updateCharCounter() {
  const len = rawContent.value.length;
  const limit = parseInt(rawContent.getAttribute('maxlength') || '10000', 10);
  charCounter.textContent = `${len.toLocaleString()} / ${limit.toLocaleString()}`;
  charCounter.classList.toggle('near-limit', len > limit * 0.85);
}
rawContent.addEventListener('input', updateCharCounter);

// File upload
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    rawContent.value = e.target.result;
    updateCharCounter();
  };
  reader.readAsText(file);
});

// Generate API
const GENERATE_BTN_HTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Generate LaTeX`;

generateBtn.addEventListener('click', async () => {
  const content = rawContent.value.trim();
  if (!content) {
    generateStatus.textContent = "Please provide some content first.";
    generateStatus.className = "status error";
    return;
  }

  setBusy(generateBtn, true, GENERATE_BTN_HTML);
  generateStatus.textContent = "Generating LaTeX code...";
  generateStatus.className = "status";

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc_type: currentDocType,
        section: sectionSelect.value,
        content: content
      }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generation failed');

    lastGeneratedLatex = data.latex;
    snippetEditor.setValue(data.latex);
    
    snippetPreviewContainer.hidden = false;
    refreshEditors();
    
    generateStatus.textContent = "LaTeX generated successfully.";
    generateStatus.className = "status ok";
    addSectionBtn.disabled = false;

  } catch (err) {
    generateStatus.textContent = err.message;
    generateStatus.className = "status error";
  } finally {
    setBusy(generateBtn, false, GENERATE_BTN_HTML);
  }
});

// Add to outline
addSectionBtn.addEventListener('click', () => {
  const latex = snippetEditor.getValue();
  const key = sectionSelect.value;
  const label = sectionSelect.options[sectionSelect.selectedIndex].textContent;

  documentSections.push({ key, label, latex, docType: currentDocType });
  renderSectionList();
  
  // Visual feedback
  const original = addSectionBtn.innerHTML;
  addSectionBtn.innerHTML = `<i class="fa-solid fa-check"></i> Added!`;
  addSectionBtn.style.backgroundColor = "var(--success)";
  addSectionBtn.style.color = "#fff";
  
  setTimeout(() => {
    addSectionBtn.innerHTML = original;
    addSectionBtn.style.backgroundColor = "";
    addSectionBtn.style.color = "";
    // Reset generation state to encourage next section
    rawContent.value = '';
    updateCharCounter();
    snippetPreviewContainer.hidden = true;
    generateStatus.textContent = '';
  }, 1000);
});

// ── Outline Rendering ─────────────────────────────────
function renderSectionList() {
  sectionListEl.innerHTML = '';
  sectionCountEl.textContent = documentSections.length;

  if (documentSections.length === 0) {
    sectionListEl.innerHTML = `
      <li style="justify-content:center; color:var(--text-muted); font-style:italic;">
        No sections added yet.
      </li>`;
    return;
  }

  documentSections.forEach((s, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <i class="fa-solid fa-check-circle status-icon"></i>
      <span class="item-label">${escapeHtml(s.label)}</span>
      <div style="display:flex; gap:4px; margin-left:auto;">
        <button class="icon-btn-text btn-delete" style="color:var(--error); padding:4px;" title="Remove">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    
    const delBtn = li.querySelector('.btn-delete');
    delBtn.addEventListener('click', () => {
      li.classList.add('removing');
      setTimeout(() => {
        documentSections.splice(idx, 1);
        renderSectionList();
        reassemble(); // if they delete, update master text quietly
      }, 200);
    });

    sectionListEl.appendChild(li);
  });
}

// ── Assemble Master Document ──────────────────────────
function getCurrentMeta() {
  if (currentDocType === 'research') {
    return {
      title: metaTitle.value.trim(),
      author: metaAuthor.value.trim(),
      institution: metaInstitution.value.trim(),
    };
  }
  return {
    name: metaName.value.trim(),
    location: metaLocation.value.trim(),
    email: metaEmail.value.trim(),
    phone: metaPhone.value.trim(),
    linkedin: metaLinkedin.value.trim(),
  };
}

async function reassemble() {
  if (documentSections.length === 0) {
    masterEditor.setValue('% Add sections to build the full document\n');
    return;
  }
  
  try {
    const res = await fetch('/api/assemble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc_type: currentDocType,
        blocks: documentSections.map(s => s.latex),
        meta: getCurrentMeta(),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      // Only update if it changed to avoid wiping user manual edits in the master editor unnecessarily.
      // However, typical workflow is one-way. We'll just overwrite.
      masterEditor.setValue(data.tex);
      showSaveStatus('Auto-assembled');
    }
  } catch (e) {
    console.error("Assemble failed", e);
  }
}

// Auto-assemble when metadata changes
const debouncedReassemble = debounce(reassemble, 500);
[metaTitle, metaAuthor, metaInstitution, metaName, metaLocation, metaEmail, metaPhone, metaLinkedin]
  .forEach(input => input.addEventListener('input', debouncedReassemble));


// ── Compile & PDF ─────────────────────────────────────
const COMPILE_BTN_HTML = `<i class="fa-solid fa-play"></i> Compile`;

compileBtn.addEventListener('click', async () => {
  const tex = masterEditor.getValue();
  if (!tex || tex.trim().startsWith('% Add sections')) return;

  setBusy(compileBtn, true, COMPILE_BTN_HTML);
  showLoading('Compiling LaTeX (via ' + (document.body.dataset.compiler || 'backend') + ')...');
  compileLog.hidden = true;
  compileLog.classList.remove('error-log');
  previewPlaceholder.hidden = false;
  previewFrame.hidden = true;

  try {
    const res = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex }),
    });
    const data = await res.json();

    if (!res.ok) {
      compileLog.hidden = false;
      compileLog.classList.add('error-log');
      let msg = data.error || 'Compilation failed.';
      if (data.hint) msg += '\n\n' + data.hint;
      if (data.log) msg += '\n\nCompiler Log:\n' + data.log;
      compileLog.textContent = msg;
      return;
    }

    // Success
    currentDownloadUrl = data.download_url;
    previewFrame.src = data.view_url;
    
    previewPlaceholder.hidden = true;
    previewFrame.hidden = false;
    
    previewDownloadBtn.disabled = false;
    previewFullscreenBtn.disabled = false;
    
    // Note if it used online or local
    document.body.dataset.compiler = data.compiled_with || 'local';

  } catch (err) {
    compileLog.hidden = false;
    compileLog.classList.add('error-log');
    compileLog.textContent = 'Network error: ' + err.message;
  } finally {
    setBusy(compileBtn, false, COMPILE_BTN_HTML);
    hideLoading();
  }
});

downloadTexBtn.addEventListener('click', () => {
  const tex = masterEditor.getValue();
  const blob = new Blob([tex], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Use top document title for filename if available
  let fname = topDocTitle.value.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
  if (!fname || fname === 'untitled_document') fname = 'document';
  
  a.download = `${fname}.tex`;
  a.click();
  URL.revokeObjectURL(url);
});

previewDownloadBtn.addEventListener('click', () => {
  if (!currentDownloadUrl) return;
  const a = document.createElement('a');
  a.href = currentDownloadUrl;
  
  let fname = topDocTitle.value.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
  if (!fname || fname === 'untitled_document') fname = 'document';
  
  a.download = `${fname}.pdf`;
  a.click();
});

previewFullscreenBtn.addEventListener('click', () => {
  if (!previewFrame.hidden && previewFrame.src) {
    window.open(previewFrame.src, '_blank');
  }
});

// Update top doc title dynamically
topDocTitle.addEventListener('input', () => {
  document.title = `${topDocTitle.value || 'Untitled'} - LaTeXForge`;
});
