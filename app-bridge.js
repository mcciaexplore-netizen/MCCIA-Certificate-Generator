// app-bridge.js
// This file bridges your Certificate Generator app to the API server
// It exposes functions that Puppeteer calls to control the app

window.appReady = false;

// Wait for your app to fully initialize
function checkReady() {
  // Check if your app's main functions are available
  if (typeof loadSampleTemplateData === 'function') {
    window.appReady = true;
    console.log(`[Bridge] App ready.`);
  } else {
    setTimeout(checkReady, 500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkReady, 1000);
});

// Expose functions for puppeteer
window.loadTemplate = function() {
  if (typeof loadSampleTemplateData === 'function') {
    loadSampleTemplateData();
  }
};

window.importRecipients = function(recipients) {
  console.log(`[Bridge] Importing ${recipients.length} recipients`);
  if (typeof loadParsedRecipients === 'function') {
    loadParsedRecipients(recipients, 'api_data.csv');
  }
};

window.setCurrentRecipient = function(index) {
  console.log(`[Bridge] Setting recipient: ${index}`);
  if (typeof state !== 'undefined') {
    state.currentRecipientIndex = index;
    if (typeof renderOverlay === 'function') renderOverlay();
    if (typeof updateUIControls === 'function') updateUIControls();
    
    const currentRecipientIndexText = document.getElementById('current-recipient-index');
    if (currentRecipientIndexText) {
      currentRecipientIndexText.textContent = index + 1;
    }
  }
};

window.renderCertificate = function() {
  if (typeof renderOverlay === 'function') {
    renderOverlay();
  }
};
