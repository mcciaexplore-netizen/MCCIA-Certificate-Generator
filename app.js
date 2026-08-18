/**
 * app.js
 * Core application logic for CertifyFlow certificate customizer.
 * Handles state, visual editor canvas, drag/resize events, parsing, and exporting.
 */

// Application State
const state = {
  templateImage: null,        // Image object of loaded template
  templateDataUrl: null,      // Raw base64 source of template
  elements: [],               // Text overlay fields
  selectedElementId: null,    // ID of selected element
  recipients: [],             // Parsed spreadsheet rows
  currentRecipientIndex: 0,   // Pointer for live preview
  mode: 'design'              // 'design' or 'preview'
};

// UI Selectors
const DOM = {
  toastContainer: document.getElementById('toast-container'),
  welcomeView: document.getElementById('welcome-view'),
  editorView: document.getElementById('editor-view'),
  templateImgDisplay: document.getElementById('template-img-display'),
  interactiveOverlay: document.getElementById('interactive-overlay'),
  canvasWorkspace: document.getElementById('canvas-workspace'),
  
  templateDropzone: document.getElementById('template-dropzone'),
  templateFileInput: document.getElementById('template-file-input'),
  btnLoadSample: document.getElementById('btn-load-sample'),
  welcomeBtnBrowse: document.getElementById('welcome-btn-browse'),
  welcomeBtnSample: document.getElementById('welcome-btn-sample'),
  
  btnAddElement: document.getElementById('btn-add-element'),
  elementsList: document.getElementById('elements-list'),
  
  csvDropzone: document.getElementById('csv-dropzone'),
  csvFileInput: document.getElementById('csv-file-input'),
  btnDownloadSampleCsv: document.getElementById('btn-download-sample-csv'),
  btnManualData: document.getElementById('btn-manual-data'),
  csvStatusCard: document.getElementById('csv-status-card'),
  csvFilename: document.getElementById('csv-filename'),
  csvTotalCount: document.getElementById('csv-total-count'),
  csvHeadersTags: document.getElementById('csv-headers-tags'),
  btnClearCsv: document.getElementById('btn-clear-csv'),
  
  modeDesign: document.getElementById('mode-design'),
  modePreview: document.getElementById('mode-preview'),
  previewPagination: document.getElementById('preview-pagination'),
  btnPrevRecipient: document.getElementById('btn-prev-recipient'),
  btnNextRecipient: document.getElementById('btn-next-recipient'),
  btnDeleteRecipient: document.getElementById('btn-delete-recipient'),
  currentRecipientIndexText: document.getElementById('current-recipient-index'),
  totalRecipientCountText: document.getElementById('total-recipient-count'),
  
  btnExportSinglePng: document.getElementById('btn-export-single-png'),
  btnExportSinglePdf: document.getElementById('btn-export-single-pdf'),
  btnExportZip: document.getElementById('btn-export-zip'),
  btnExportPdf: document.getElementById('btn-export-pdf'),
  exportCanvas: document.getElementById('export-canvas'),
  
  propertyPanel: document.getElementById('property-panel'),
  selectedElementName: document.getElementById('selected-element-name'),
  propText: document.getElementById('prop-text'),
  propFont: document.getElementById('prop-font'),
  propSizeNum: document.getElementById('prop-size-num'),
  propSizeRange: document.getElementById('prop-size-range'),
  propColor: document.getElementById('prop-color'),
  propColorHex: document.getElementById('prop-color-hex'),
  propBold: document.getElementById('prop-bold'),
  propItalic: document.getElementById('prop-italic'),
  propAlignLeft: document.getElementById('prop-align-left'),
  propAlignCenter: document.getElementById('prop-align-center'),
  propAlignRight: document.getElementById('prop-align-right'),
  btnDeleteElement: document.getElementById('btn-delete-element'),
  propBinding: document.getElementById('prop-binding'),
  
  manualDataModal: document.getElementById('manual-data-modal'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelModal: document.getElementById('btn-cancel-modal'),
  btnApplyManualData: document.getElementById('btn-apply-manual-data'),
  manualCsvTextarea: document.getElementById('manual-csv-textarea')
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';
  
  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <div class="toast-message">${message}</div>
  `;
  
  DOM.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ==========================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    window.addEventListener('resize', renderOverlay);
  });
} else {
  initEventListeners();
  window.addEventListener('resize', renderOverlay);
}

function initEventListeners() {
  // Template upload actions
  DOM.welcomeBtnBrowse.addEventListener('click', () => DOM.templateFileInput.click());
  DOM.templateDropzone.addEventListener('click', () => DOM.templateFileInput.click());
  
  DOM.templateFileInput.addEventListener('change', (e) => handleTemplateFile(e.target.files[0]));
  setupDragAndDrop(DOM.templateDropzone, handleTemplateFile);
  
  // Sample templates load
  DOM.btnLoadSample.addEventListener('click', loadSampleTemplateData);
  DOM.welcomeBtnSample.addEventListener('click', loadSampleTemplateData);
  
  // Elements management
  DOM.btnAddElement.addEventListener('click', addNewElement);
  DOM.btnDeleteElement.addEventListener('click', deleteSelectedElement);
  
  // CSV load actions
  DOM.csvDropzone.addEventListener('click', () => DOM.csvFileInput.click());
  DOM.csvFileInput.addEventListener('change', (e) => handleCsvFile(e.target.files[0]));
  setupDragAndDrop(DOM.csvDropzone, handleCsvFile);
  DOM.btnDownloadSampleCsv.addEventListener('click', downloadSampleCsvFile);
  DOM.btnClearCsv.addEventListener('click', clearCsvData);
  
  // Manual data entry modal
  DOM.btnManualData.addEventListener('click', () => {
    DOM.manualCsvTextarea.value = '';
    DOM.manualDataModal.classList.remove('hidden');
  });
  DOM.btnCloseModal.addEventListener('click', () => DOM.manualDataModal.classList.add('hidden'));
  DOM.btnCancelModal.addEventListener('click', () => DOM.manualDataModal.classList.add('hidden'));
  DOM.btnApplyManualData.addEventListener('click', loadManualCsvData);
  
  // Workspace Mode switching
  DOM.modeDesign.addEventListener('click', () => setMode('design'));
  DOM.modePreview.addEventListener('click', () => setMode('preview'));
  
  // Pagination controls
  if (DOM.btnPrevRecipient) DOM.btnPrevRecipient.addEventListener('click', showPreviousRecipient);
  if (DOM.btnNextRecipient) DOM.btnNextRecipient.addEventListener('click', showNextRecipient);
  if (DOM.btnDeleteRecipient) DOM.btnDeleteRecipient.addEventListener('click', deleteCurrentRecipient);
  
  // Exports
  if (DOM.btnExportSinglePng) DOM.btnExportSinglePng.addEventListener('click', exportSingleCertificatePng);
  if (DOM.btnExportSinglePdf) DOM.btnExportSinglePdf.addEventListener('click', exportSingleCertificatePdf);
  if (DOM.btnExportZip) DOM.btnExportZip.addEventListener('click', exportCertificatesZip);
  if (DOM.btnExportPdf) DOM.btnExportPdf.addEventListener('click', exportCertificatesPdf);
  
  // Property editing fields live listeners
  DOM.propText.addEventListener('input', (e) => updateSelectedElement('text', e.target.value));
  DOM.propFont.addEventListener('change', (e) => updateSelectedElement('fontFamily', e.target.value));
  
  DOM.propSizeRange.addEventListener('input', (e) => {
    DOM.propSizeNum.value = e.target.value;
    updateSelectedElement('fontSize', parseInt(e.target.value));
  });
  DOM.propSizeNum.addEventListener('input', (e) => {
    let val = parseInt(e.target.value) || 12;
    val = Math.max(10, Math.min(200, val));
    DOM.propSizeRange.value = val;
    updateSelectedElement('fontSize', val);
  });
  
  DOM.propColor.addEventListener('input', (e) => {
    DOM.propColorHex.value = e.target.value.toUpperCase();
    updateSelectedElement('color', e.target.value);
  });
  DOM.propColorHex.addEventListener('input', (e) => {
    const val = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      DOM.propColor.value = val;
      updateSelectedElement('color', val);
    }
  });
  
  DOM.propBold.addEventListener('click', () => {
    const el = getSelectedElement();
    if (el) {
      const active = !el.bold;
      DOM.propBold.classList.toggle('active', active);
      updateSelectedElement('bold', active);
    }
  });
  
  DOM.propItalic.addEventListener('click', () => {
    const el = getSelectedElement();
    if (el) {
      const active = !el.italic;
      DOM.propItalic.classList.toggle('active', active);
      updateSelectedElement('italic', active);
    }
  });
  
  DOM.propAlignLeft.addEventListener('click', () => setAlignment('left'));
  DOM.propAlignCenter.addEventListener('click', () => setAlignment('center'));
  DOM.propAlignRight.addEventListener('click', () => setAlignment('right'));

  if (DOM.propBinding) DOM.propBinding.addEventListener('change', (e) => updateSelectedElement('binding', e.target.value));

  // Deselect if clicking on empty workspace area
  DOM.interactiveOverlay.addEventListener('mousedown', (e) => {
    if (e.target === DOM.interactiveOverlay) {
      setSelectedElement(null);
    }
  });
}

function setupDragAndDrop(dropzone, fileHandler) {
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      fileHandler(e.dataTransfer.files[0]);
    }
  });
}

// ==========================================
// FILE HANDLERS
// ==========================================
function handleTemplateFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please upload a valid image file (PNG, JPG, etc.)', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    loadTemplateImage(dataUrl, file.name);
  };
  reader.readAsDataURL(file);
}

function loadTemplateImage(dataUrl, filename) {
  showToast('Loading certificate template...', 'info');
  const img = new Image();
  img.onload = function() {
    state.templateImage = img;
    state.templateDataUrl = dataUrl;
    
    // Set workspace display image
    DOM.templateImgDisplay.src = dataUrl;
    
    // Calculate aspect ratio
    const aspect = img.naturalWidth / img.naturalHeight;
    DOM.canvasWorkspace.style.aspectRatio = aspect;
    
    // Toggle UI views
    DOM.welcomeView.classList.add('hidden');
    DOM.editorView.classList.remove('hidden');
    
    // Setup default elements if elements list is empty
    if (state.elements.length === 0) {
      // Add default elements positioned relative to standard template sizes
      setupDefaultPlaceholders();
    }
    
    setSelectedElement(null);
    renderOverlay();
    updateUIControls();
    
    showToast(`Template "${filename}" successfully loaded.`, 'success');
  };
  img.onerror = function() {
    showToast('Failed to load image template.', 'error');
  };
  img.src = dataUrl;
}

function loadSampleTemplateData() {
  generateSampleTemplate().then(dataUrl => {
    // Inject default fields
    state.elements = [
      {
        id: 'el_name',
        text: '{{Name}}',
        x: 15,
        y: 36.5,
        width: 70,
        height: 10,
        fontSize: 70, // 7% of template height normalized
        fontFamily: 'Great Vibes',
        color: '#1e293b',
        bold: false,
        italic: false,
        align: 'center'
      },
      {
        id: 'el_course',
        text: '{{Course}}',
        x: 10,
        y: 53.5,
        width: 80,
        height: 7,
        fontSize: 38,
        fontFamily: 'Montserrat',
        color: '#b48a1c',
        bold: true,
        italic: false,
        align: 'center'
      },
      {
        id: 'el_date',
        text: '{{Date}}',
        x: 60.5,
        y: 73.5,
        width: 16,
        height: 5,
        fontSize: 22,
        fontFamily: 'Montserrat',
        color: '#1e293b',
        bold: false,
        italic: false,
        align: 'center'
      },
      {
        id: 'el_id',
        text: 'ID: {{Id}}',
        x: 8.5,
        y: 88,
        width: 20,
        height: 4,
        fontSize: 16,
        fontFamily: 'Montserrat',
        color: '#94a3b8',
        bold: false,
        italic: false,
        align: 'left'
      }
    ];
    
    loadTemplateImage(dataUrl, 'Premium Sample Template');
  });
}

function setupDefaultPlaceholders() {
  state.elements = [
    {
      id: 'el_name',
      text: '{{Name}}',
      x: 25,
      y: 40,
      width: 50,
      height: 8,
      fontSize: 50,
      fontFamily: 'Playfair Display',
      color: '#1e293b',
      bold: true,
      italic: false,
      align: 'center'
    }
  ];
}

// Parse and handle CSV file upload
function handleCsvFile(file) {
  if (!file) return;
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      loadParsedRecipients(results.data, file.name);
    },
    error: function(err) {
      showToast(`Error parsing CSV: ${err.message}`, 'error');
    }
  });
}

function loadParsedRecipients(data, name) {
  if (!data || data.length === 0) {
    showToast('CSV file appears to be empty.', 'error');
    return;
  }
  
  state.recipients = data;
  state.currentRecipientIndex = 0;
  
  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Update status UI card
  DOM.csvFilename.textContent = name;
  DOM.csvTotalCount.textContent = data.length;
  
  DOM.csvHeadersTags.innerHTML = '';
  headers.forEach(h => {
    const badge = document.createElement('span');
    badge.className = 'header-tag';
    badge.textContent = h;
    badge.title = `Use {{${h}}} tag in canvas`;
    DOM.csvHeadersTags.appendChild(badge);
  });
  
  DOM.csvStatusCard.classList.remove('hidden');
  DOM.previewPagination.classList.remove('hidden');
  
  // Auto-bind placeholders to CSV columns if they match headers
  state.elements.forEach(el => {
    if (!el.binding) {
      const cleanText = el.text.replace(/[{}]/g, '').trim().toLowerCase();
      const matchingHeader = headers.find(h => h.trim().toLowerCase() === cleanText);
      if (matchingHeader) {
        el.binding = matchingHeader;
      }
    }
  });
  
  updateBindingDropdownOptions();
  updateUIControls();
  
  // Set preview index display and refresh canvas elements
  DOM.currentRecipientIndexText.textContent = '1';
  DOM.totalRecipientCountText.textContent = data.length;
  
  showToast(`Successfully loaded ${data.length} recipients.`, 'success');
  
  // Automatically switch to preview mode to verify results
  setMode('preview');
}

function loadManualCsvData() {
  const csvText = DOM.manualCsvTextarea.value.trim();
  if (!csvText) {
    showToast('Please enter CSV formatted data.', 'error');
    return;
  }
  
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (results.errors.length > 0) {
        showToast(`Parsed with some errors: ${results.errors[0].message}`, 'warning');
      }
      loadParsedRecipients(results.data, 'manual_input.csv');
      DOM.manualDataModal.classList.add('hidden');
    },
    error: function(err) {
      showToast(`Failed to parse CSV: ${err.message}`, 'error');
    }
  });
}

function clearCsvData() {
  state.recipients = [];
  state.currentRecipientIndex = 0;
  
  DOM.csvStatusCard.classList.add('hidden');
  DOM.previewPagination.classList.add('hidden');
  DOM.csvFileInput.value = '';
  
  updateBindingDropdownOptions();
  updateUIControls();
  setMode('design');
  showToast('Recipient database cleared.', 'info');
}

function downloadSampleCsvFile() {
  // Generate sample CSV content matching loaded placeholders
  let headers = ['Name', 'Course', 'Date', 'Id'];
  
  // If user defined custom elements, let's extract their tags instead
  if (state.elements.length > 0) {
    const tags = [];
    state.elements.forEach(el => {
      // Find matches for {{tag}}
      const regex = /\{\{([^}]+)\}\}/g;
      let match;
      while ((match = regex.exec(el.text)) !== null) {
        tags.push(match[1].trim());
      }
    });
    if (tags.length > 0) {
      headers = [...new Set(tags)];
    }
  }
  
  const csvContent = [
    headers.join(','),
    ['Jane Smith', 'Advanced Web Development', 'July 27, 2026', 'CF-10041'].slice(0, headers.length).join(','),
    ['Arthur Pendragon', 'Executive Leadership Certificate', 'August 12, 2026', 'CF-10042'].slice(0, headers.length).join(','),
    ['Elizabeth Holmes', 'Forensic Data Analytics', 'September 1, 2026', 'CF-10043'].slice(0, headers.length).join(',')
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'certifyflow_recipients_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Downloaded sample recipients template.', 'success');
}

// ==========================================
// STATE MANAGEMENT & RENDERING
// ==========================================
function setMode(newMode) {
  state.mode = newMode;
  DOM.modeDesign.classList.toggle('active', newMode === 'design');
  DOM.modePreview.classList.toggle('active', newMode === 'preview');
  
  if (newMode === 'preview') {
    DOM.canvasWorkspace.classList.add('preview-mode');
    setSelectedElement(null); // Deselect in preview mode
  } else {
    DOM.canvasWorkspace.classList.remove('preview-mode');
  }
  
  renderOverlay();
}

function updateUIControls() {
  const hasTemplate = state.templateImage !== null;
  const hasRecipients = state.recipients.length > 0;
  
  // Enable/disable buttons based on template loading
  if (DOM.btnAddElement) DOM.btnAddElement.disabled = !hasTemplate;
  if (DOM.btnExportSinglePng) DOM.btnExportSinglePng.disabled = !hasTemplate;
  if (DOM.btnExportSinglePdf) DOM.btnExportSinglePdf.disabled = !hasTemplate;
  if (DOM.btnExportZip) DOM.btnExportZip.disabled = !(hasTemplate && hasRecipients);
  if (DOM.btnExportPdf) DOM.btnExportPdf.disabled = !(hasTemplate && hasRecipients);
  
  // Pagination buttons
  if (DOM.btnPrevRecipient) DOM.btnPrevRecipient.disabled = !hasRecipients || state.currentRecipientIndex === 0;
  if (DOM.btnNextRecipient) DOM.btnNextRecipient.disabled = !hasRecipients || state.currentRecipientIndex >= state.recipients.length - 1;
}

function addNewElement() {
  if (!state.templateImage) return;
  
  const id = 'el_' + Date.now();
  const newElement = {
    id: id,
    text: '{{NewPlaceholder}}',
    x: 35,
    y: 45,
    width: 30,
    height: 8,
    fontSize: 40, // out of 1000 pixels height units
    fontFamily: 'Inter',
    color: '#0f172a',
    bold: false,
    italic: false,
    align: 'center',
    binding: ''
  };
  
  state.elements.push(newElement);
  setSelectedElement(id);
  renderOverlay();
  showToast('Added new placeholder field. Double click or use property panel to edit.', 'success');
}

function deleteSelectedElement() {
  if (!state.selectedElementId) return;
  
  state.elements = state.elements.filter(el => el.id !== state.selectedElementId);
  setSelectedElement(null);
  renderOverlay();
  showToast('Placeholder deleted.', 'info');
}

function getSelectedElement() {
  return state.elements.find(el => el.id === state.selectedElementId) || null;
}

function setSelectedElement(id) {
  state.selectedElementId = id;
  
  // Update elements list in sidebar
  renderElementsList();
  
  // Highlight visually on canvas
  const allOverlayFields = DOM.interactiveOverlay.querySelectorAll('.overlay-field');
  allOverlayFields.forEach(f => {
    if (f.dataset.id === id) {
      f.classList.add('selected');
    } else {
      f.classList.remove('selected');
    }
  });
  
  if (id && state.mode === 'design') {
    const el = getSelectedElement();
    // Populate property panel input controls
    DOM.propText.value = el.text;
    DOM.propBinding.value = el.binding || '';
    DOM.propFont.value = el.fontFamily;
    DOM.propSizeNum.value = el.fontSize;
    DOM.propSizeRange.value = el.fontSize;
    DOM.propColor.value = el.color;
    DOM.propColorHex.value = el.color.toUpperCase();
    
    // Button styling toggles
    DOM.propBold.classList.toggle('active', el.bold);
    DOM.propItalic.classList.toggle('active', el.italic);
    
    DOM.propAlignLeft.classList.toggle('active', el.align === 'left');
    DOM.propAlignCenter.classList.toggle('active', el.align === 'center');
    DOM.propAlignRight.classList.toggle('active', el.align === 'right');
    
    DOM.selectedElementName.textContent = `Placeholder Tag: ${el.text}`;
    DOM.propertyPanel.classList.remove('hidden');
  } else {
    DOM.propertyPanel.classList.add('hidden');
  }
}

function updateBindingDropdownOptions() {
  DOM.propBinding.innerHTML = '<option value="">None (Static Text)</option>';
  if (state.recipients.length > 0) {
    const headers = Object.keys(state.recipients[0]);
    headers.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = `CSV: ${h}`;
      DOM.propBinding.appendChild(opt);
    });
  }
}

function updateSelectedElement(property, value) {
  const el = getSelectedElement();
  if (el) {
    el[property] = value;
    
    // Auto-sync text and dropdown selections when bindings are updated
    if (property === 'binding') {
      if (value) {
        el.text = `{{${value}}}`;
        DOM.propText.value = `{{${value}}}`;
        DOM.selectedElementName.textContent = `Placeholder Tag: {{${value}}}`;
        const listItem = DOM.elementsList.querySelector(`.element-item[data-id="${el.id}"] .element-tag-text`);
        if (listItem) listItem.textContent = `{{${value}}}`;
      }
    }
    
    if (property === 'text') {
      DOM.selectedElementName.textContent = `Placeholder Tag: ${value}`;
      const listItem = DOM.elementsList.querySelector(`.element-item[data-id="${el.id}"] .element-tag-text`);
      if (listItem) listItem.textContent = value;
      
      // Auto-bind to CSV header if matches, or clear binding if it doesn't match columns
      if (state.recipients.length > 0) {
        const headers = Object.keys(state.recipients[0]);
        const cleanText = value.replace(/[{}]/g, '').trim().toLowerCase();
        const matchingHeader = headers.find(h => h.trim().toLowerCase() === cleanText);
        if (matchingHeader) {
          el.binding = matchingHeader;
          DOM.propBinding.value = matchingHeader;
        } else {
          el.binding = '';
          DOM.propBinding.value = '';
        }
      }
    }
    
    // Update visual text content directly on canvas wrapper element
    const visualDiv = DOM.interactiveOverlay.querySelector(`.overlay-field[data-id="${el.id}"]`);
    if (visualDiv) {
      applyStylesToVisualDiv(el, visualDiv);
      const textDiv = visualDiv.querySelector('.field-text');
      if (textDiv) {
        const recipient = state.recipients[state.currentRecipientIndex] || null;
        textDiv.textContent = state.mode === 'preview' && recipient ? getElementDisplayValue(el, recipient) : el.text;
      }
    }
  }
}

function setAlignment(alignType) {
  const el = getSelectedElement();
  if (el) {
    el.align = alignType;
    DOM.propAlignLeft.classList.toggle('active', alignType === 'left');
    DOM.propAlignCenter.classList.toggle('active', alignType === 'center');
    DOM.propAlignRight.classList.toggle('active', alignType === 'right');
    
    const visualDiv = DOM.interactiveOverlay.querySelector(`.overlay-field[data-id="${el.id}"]`);
    if (visualDiv) {
      visualDiv.querySelector('.field-text').style.textAlign = alignType;
    }
  }
}

// Case-insensitive CSV column interpolation
function interpolateText(templateStr, dataRow) {
  if (!dataRow) return templateStr;
  
  return templateStr.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
    const key = p1.trim().toLowerCase();
    // Find matching key in dataRow case-insensitively
    const actualKey = Object.keys(dataRow).find(k => k.toLowerCase() === key);
    return actualKey !== undefined ? dataRow[actualKey] : match;
  });
}

// Helper to evaluate binding vs. interpolation for element visual text display
function getElementDisplayValue(el, recipientRow) {
  if (recipientRow && el.binding && recipientRow[el.binding] !== undefined) {
    return recipientRow[el.binding].toString();
  }
  return interpolateText(el.text, recipientRow);
}

// Render dynamic overlays on canvas wrapper
function renderOverlay() {
  DOM.interactiveOverlay.innerHTML = '';
  
  if (!state.templateImage) return;
  
  const containerHeight = DOM.interactiveOverlay.clientHeight;
  const currentRecipient = state.recipients[state.currentRecipientIndex] || null;
  
  state.elements.forEach(el => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'overlay-field';
    fieldDiv.dataset.id = el.id;
    
    // Position styling
    fieldDiv.style.left = `${el.x}%`;
    fieldDiv.style.top = `${el.y}%`;
    fieldDiv.style.width = `${el.width}%`;
    fieldDiv.style.height = `${el.height}%`;
    
    // Field interior text wrapper
    const innerTextDiv = document.createElement('div');
    innerTextDiv.className = 'field-text';
    
    // Interpolated text display
    if (state.mode === 'preview' && currentRecipient) {
      innerTextDiv.textContent = getElementDisplayValue(el, currentRecipient);
    } else {
      innerTextDiv.textContent = el.text;
    }
    
    fieldDiv.appendChild(innerTextDiv);
    applyStylesToVisualDiv(el, fieldDiv);
    
    // Selected state border styling
    if (state.selectedElementId === el.id && state.mode === 'design') {
      fieldDiv.classList.add('selected');
      
      // Add resizing drag handles (left & right)
      const leftHandle = document.createElement('div');
      leftHandle.className = 'resize-handle left';
      fieldDiv.appendChild(leftHandle);
      
      const rightHandle = document.createElement('div');
      rightHandle.className = 'resize-handle right';
      fieldDiv.appendChild(rightHandle);
      
      // Initialize handlers resize click listeners
      setupResizeEvents(leftHandle, rightHandle, el, fieldDiv);
    }
    
    // Mouse events drag listeners (Only in design mode)
    if (state.mode === 'design') {
      setupDragEvents(fieldDiv, el);
    }
    
    DOM.interactiveOverlay.appendChild(fieldDiv);
  });
}

function applyStylesToVisualDiv(el, div) {
  const containerHeight = DOM.interactiveOverlay.clientHeight || 500;
  
  // Calculate relative font size based on natural window scaled viewport height
  // (el.fontSize is relative to a virtual 1000px height coordinate framework)
  const pxFontSize = (el.fontSize / 1000) * containerHeight;
  
  div.style.fontFamily = el.fontFamily;
  div.style.fontSize = `${pxFontSize}px`;
  div.style.color = el.color;
  div.style.fontWeight = el.bold ? 'bold' : 'normal';
  div.style.fontStyle = el.italic ? 'italic' : 'normal';
  
  const textDiv = div.querySelector('.field-text');
  if (textDiv) {
    textDiv.style.textAlign = el.align;
  }
}

// Sidebars text tags tracker listing
function renderElementsList() {
  DOM.elementsList.innerHTML = '';
  
  if (state.elements.length === 0) {
    DOM.elementsList.innerHTML = '<p class="empty-state-text">No placeholders added yet.</p>';
    return;
  }
  
  state.elements.forEach(el => {
    const item = document.createElement('div');
    item.className = `element-item ${state.selectedElementId === el.id ? 'active' : ''}`;
    item.dataset.id = el.id;
    
    item.innerHTML = `
      <div class="element-info">
        <i class="fa-solid fa-tag"></i>
        <span class="element-tag-text">${el.text}</span>
      </div>
      <div class="element-item-actions">
        <button class="btn-item-delete" title="Delete placeholder"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;
    
    // Click selection
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-item-delete')) {
        setSelectedElement(el.id);
        renderOverlay();
      }
    });
    
    // Inline quick delete
    item.querySelector('.btn-item-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      state.elements = state.elements.filter(x => x.id !== el.id);
      if (state.selectedElementId === el.id) setSelectedElement(null);
      renderOverlay();
      showToast('Placeholder deleted.', 'info');
    });
    
    DOM.elementsList.appendChild(item);
  });
}

// ==========================================
// DRAG & RESIZE ALGORITHMS
// ==========================================
function setupDragEvents(fieldDiv, el) {
  fieldDiv.addEventListener('mousedown', (e) => {
    // Prevent dragging if clicking handles or inputs
    if (e.target.classList.contains('resize-handle')) return;
    e.preventDefault();
    
    setSelectedElement(el.id);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = el.x;
    const startElY = el.y;
    
    const containerW = DOM.interactiveOverlay.clientWidth;
    const containerH = DOM.interactiveOverlay.clientHeight;
    
    fieldDiv.classList.add('dragging');
    
    function onMouseMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Convert pixel deltas to percentages
      const pctDx = (dx / containerW) * 100;
      const pctDy = (dy / containerH) * 100;
      
      // Drag coordinates limits clamp
      el.x = Math.max(0, Math.min(100 - el.width, startElX + pctDx));
      el.y = Math.max(0, Math.min(100 - el.height, startElY + pctDy));
      
      // Directly render style adjustment for instant visual update
      fieldDiv.style.left = `${el.x}%`;
      fieldDiv.style.top = `${el.y}%`;
    }
    
    function onMouseUp() {
      fieldDiv.classList.remove('dragging');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderOverlay(); // Snap properly and refresh context state fully
    }
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
  
  // Double-click shortcut to focus properties panel
  fieldDiv.addEventListener('dblclick', () => {
    DOM.propText.focus();
    DOM.propText.select();
  });
}

function setupResizeEvents(leftHandle, rightHandle, el, fieldDiv) {
  const containerW = DOM.interactiveOverlay.clientWidth;
  
  // Right Handle Resize: adjusts width
  rightHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = el.width;
    
    fieldDiv.classList.add('resizing');
    
    function onMouseMove(e) {
      const dx = e.clientX - startX;
      const pctDx = (dx / containerW) * 100;
      
      el.width = Math.max(5, Math.min(100 - el.x, startWidth + pctDx));
      fieldDiv.style.width = `${el.width}%`;
    }
    
    function onMouseUp() {
      fieldDiv.classList.remove('resizing');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderOverlay();
    }
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
  
  // Left Handle Resize: adjusts both left offset (x) and width
  leftHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = el.width;
    const startElX = el.x;
    const rightBoundary = startElX + startWidth; // Fixed right edge position
    
    fieldDiv.classList.add('resizing');
    
    function onMouseMove(e) {
      const dx = e.clientX - startX;
      const pctDx = (dx / containerW) * 100;
      
      let proposedX = startElX + pctDx;
      // Clamp left edge between 0 and 5% away from right edge
      proposedX = Math.max(0, Math.min(rightBoundary - 5, proposedX));
      
      el.x = proposedX;
      el.width = rightBoundary - proposedX;
      
      fieldDiv.style.left = `${el.x}%`;
      fieldDiv.style.width = `${el.width}%`;
    }
    
    function onMouseUp() {
      fieldDiv.classList.remove('resizing');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderOverlay();
    }
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

// ==========================================
// PAGINATION CONTROLS
// ==========================================
function showPreviousRecipient() {
  if (state.currentRecipientIndex > 0) {
    state.currentRecipientIndex--;
    DOM.currentRecipientIndexText.textContent = state.currentRecipientIndex + 1;
    renderOverlay();
    updateUIControls();
  }
}

function showNextRecipient() {
  if (state.currentRecipientIndex < state.recipients.length - 1) {
    state.currentRecipientIndex++;
    DOM.currentRecipientIndexText.textContent = state.currentRecipientIndex + 1;
    renderOverlay();
    updateUIControls();
  }
}

function deleteCurrentRecipient() {
  if (state.recipients.length === 0) return;
  
  const row = state.recipients[state.currentRecipientIndex];
  const name = row.Name || row.name || `recipient_${state.currentRecipientIndex + 1}`;
  
  // Remove from recipients array
  state.recipients.splice(state.currentRecipientIndex, 1);
  
  // Adjust pointer if it's out of bounds
  if (state.currentRecipientIndex >= state.recipients.length && state.currentRecipientIndex > 0) {
    state.currentRecipientIndex = state.recipients.length - 1;
  }
  
  // If no recipients are left
  if (state.recipients.length === 0) {
    clearCsvData();
    showToast('All recipients deleted.', 'info');
    return;
  }
  
  // Update displays
  DOM.currentRecipientIndexText.textContent = state.currentRecipientIndex + 1;
  DOM.totalRecipientCountText.textContent = state.recipients.length;
  DOM.csvTotalCount.textContent = state.recipients.length;
  
  renderOverlay();
  updateUIControls();
  
  showToast(`Deleted certificate for "${name}".`, 'info');
}

// ==========================================
// CANVAS EXPORT COMPILATION ENGINE
// ==========================================
// Renders a single certificate at full high-resolution matching templates
function drawCertificateOnCanvas(canvas, ctx, recipientRow) {
  return new Promise((resolve) => {
    // Set matching bounds
    canvas.width = state.templateImage.naturalWidth;
    canvas.height = state.templateImage.naturalHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base template
    ctx.drawImage(state.templateImage, 0, 0);
    
    // Draw text overlays
    state.elements.forEach(el => {
      // Replaced string tag values
      const val = getElementDisplayValue(el, recipientRow);
      
      // Calculate drawing pixel values mapped from percentages
      const pxX = (el.x / 100) * canvas.width;
      const pxY = (el.y / 100) * canvas.height;
      const pxW = (el.width / 100) * canvas.width;
      const pxH = (el.height / 100) * canvas.height;
      
      // Scale font relative to standard base 1000 units
      const scaledFontSize = (el.fontSize / 1000) * canvas.height;
      
      // Build styling font string
      let fontStyle = '';
      if (el.bold) fontStyle += 'bold ';
      if (el.italic) fontStyle += 'italic ';
      
      ctx.font = `${fontStyle}${scaledFontSize}px "${el.fontFamily}"`;
      ctx.fillStyle = el.color;
      ctx.textAlign = el.align;
      ctx.textBaseline = 'middle'; // Center text vertically in bounding block
      
      // Calculate precise text rendering anchor coordinates
      let textAnchorX = pxX + (pxW / 2); // default center
      const textAnchorY = pxY + (pxH / 2);
      
      if (el.align === 'left') {
        textAnchorX = pxX;
      } else if (el.align === 'right') {
        textAnchorX = pxX + pxW;
      }
      
      // Render text
      ctx.fillText(val, textAnchorX, textAnchorY);
    });
    
    resolve();
  });
}

// Export Current preview or design single Certificate as a PNG image
function exportSingleCertificatePng() {
  if (!state.templateImage) return;
  
  const currentRecipient = state.recipients.length > 0 ? state.recipients[state.currentRecipientIndex] : null;
  
  let filename = 'certificate.png';
  if (currentRecipient) {
    const name = (currentRecipient.Name || currentRecipient.name || 'recipient').toString().replace(/[^a-z0-9_-]/gi, '_');
    filename = `${name}_certificate.png`;
  } else {
    const nameEl = state.elements.find(el => el.id === 'el_name' || el.text.toLowerCase().includes('name'));
    if (nameEl && nameEl.text && !nameEl.text.includes('{{')) {
      filename = `${nameEl.text.toLowerCase().replace(/[^a-z0-9_-]/gi, '_')}_certificate.png`;
    }
  }
  
  showToast('Generating single PNG certificate...', 'info');
  
  const canvas = DOM.exportCanvas;
  const ctx = canvas.getContext('2d');
  
  drawCertificateOnCanvas(canvas, ctx, currentRecipient).then(() => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Single PNG certificate downloaded successfully.', 'success');
  });
}

// Export Current preview or design single Certificate as a PDF document
function exportSingleCertificatePdf() {
  if (!state.templateImage) return;
  
  const currentRecipient = state.recipients.length > 0 ? state.recipients[state.currentRecipientIndex] : null;
  
  let filename = 'certificate.pdf';
  if (currentRecipient) {
    const name = (currentRecipient.Name || currentRecipient.name || 'recipient').toString().replace(/[^a-z0-9_-]/gi, '_');
    filename = `${name}_certificate.pdf`;
  } else {
    const nameEl = state.elements.find(el => el.id === 'el_name' || el.text.toLowerCase().includes('name'));
    if (nameEl && nameEl.text && !nameEl.text.includes('{{')) {
      filename = `${nameEl.text.toLowerCase().replace(/[^a-z0-9_-]/gi, '_')}_certificate.pdf`;
    }
  }
  
  showToast('Generating single PDF certificate...', 'info');
  
  const canvas = DOM.exportCanvas;
  const ctx = canvas.getContext('2d');
  
  drawCertificateOnCanvas(canvas, ctx, currentRecipient).then(() => {
    const { jsPDF } = window.jspdf;
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
    
    showToast('Single PDF certificate downloaded successfully.', 'success');
  });
}

// Export All Certificates as zipped PNG images
function exportCertificatesZip() {
  if (state.recipients.length === 0 || !state.templateImage) return;
  
  showToast('Preparing certificates generation. Processing ZIP payload...', 'info');
  
  const zip = new JSZip();
  const canvas = DOM.exportCanvas;
  const ctx = canvas.getContext('2d');
  
  let processed = 0;
  
  // Sequential async process loop to avoid browser canvas overload
  function processNext(index) {
    if (index >= state.recipients.length) {
      // All certificates rendered, compile ZIP
      showToast('Compiling ZIP package...', 'info');
      zip.generateAsync({ type: 'blob' }).then(function(content) {
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'certifyflow_generated_certificates.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Successfully exported ${state.recipients.length} certificates as ZIP!`, 'success');
      });
      return;
    }
    
    const row = state.recipients[index];
    // Find candidate name for file designation, fall back to index if not detected
    const candidateName = (row.Name || row.name || `recipient_${index + 1}`).toString().replace(/[^a-z0-9_-]/gi, '_');
    
    drawCertificateOnCanvas(canvas, ctx, row).then(() => {
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      
      zip.file(`${candidateName}_certificate.png`, base64Data, { base64: true });
      
      processed++;
      if (processed % 10 === 0 || processed === state.recipients.length) {
        showToast(`Generated ${processed} of ${state.recipients.length} certificates...`, 'info');
      }
      
      // Delay slightly for main thread rendering breathing space
      setTimeout(() => processNext(index + 1), 40);
    });
  }
  
  // Start sequence
  processNext(0);
}

// Export all certificates concatenated as a single PDF document
function exportCertificatesPdf() {
  if (state.recipients.length === 0 || !state.templateImage) return;
  
  showToast('Preparing certificates generation. Processing PDF layout...', 'info');
  
  const canvas = DOM.exportCanvas;
  const ctx = canvas.getContext('2d');
  
  const w = state.templateImage.naturalWidth;
  const h = state.templateImage.naturalHeight;
  
  // Initialize jsPDF. Set page size to match canvas dimensions in pixels or points.
  // Note: standard jsPDF coordinates are based on 72 pt per inch, but we can configure it in pixels
  const { jsPDF } = window.jspdf;
  
  // Landscape orientation, pixels units, matching template original size aspect width/height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [w, h]
  });
  
  let processed = 0;
  
  function processNext(index) {
    if (index >= state.recipients.length) {
      showToast('Compiling PDF book file...', 'info');
      doc.save('certifyflow_certificates_book.pdf');
      showToast(`Successfully exported ${state.recipients.length} page PDF document!`, 'success');
      return;
    }
    
    const row = state.recipients[index];
    
    drawCertificateOnCanvas(canvas, ctx, row).then(() => {
      const dataUrl = canvas.toDataURL('image/png');
      
      // If it's not the first page, add a new empty page
      if (index > 0) {
        doc.addPage([w, h], 'landscape');
      }
      
      // Add visual image to current page
      doc.addImage(dataUrl, 'PNG', 0, 0, w, h);
      
      processed++;
      if (processed % 10 === 0 || processed === state.recipients.length) {
        showToast(`Generated ${processed} of ${state.recipients.length} PDF pages...`, 'info');
      }
      
      // Short yield delay
      setTimeout(() => processNext(index + 1), 40);
    });
  }
  
  // Start sequence
  processNext(0);
}
