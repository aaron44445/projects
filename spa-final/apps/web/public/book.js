(function() {
  'use strict';

  // Find the script tag
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];

  // Get configuration from data attributes
  var salon = currentScript.getAttribute('data-salon');
  var buttonText = currentScript.getAttribute('data-text') || 'Book Now';
  var buttonColor = currentScript.getAttribute('data-color') || '#7C9A82';
  var position = currentScript.getAttribute('data-position') || 'inline';

  if (!salon) {
    console.error('Peacase Widget: data-salon attribute is required');
    return;
  }

  // Widget base URL
  var baseUrl = 'https://peacase.com';

  // Create styles
  var styles = document.createElement('style');
  styles.textContent = [
    '.peacase-booking-btn {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 8px;',
    '  padding: 12px 24px;',
    '  background-color: ' + buttonColor + ';',
    '  color: white;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
    '  font-size: 16px;',
    '  font-weight: 600;',
    '  border: none;',
    '  border-radius: 12px;',
    '  cursor: pointer;',
    '  transition: all 0.2s ease;',
    '  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);',
    '}',
    '.peacase-booking-btn:hover {',
    '  transform: translateY(-2px);',
    '  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);',
    '}',
    '.peacase-booking-btn:active {',
    '  transform: translateY(0);',
    '}',
    '.peacase-booking-btn svg {',
    '  width: 20px;',
    '  height: 20px;',
    '}',
    '.peacase-booking-btn-floating {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  right: 24px;',
    '  z-index: 9998;',
    '}',
    '.peacase-modal-overlay {',
    '  position: fixed;',
    '  top: 0;',
    '  left: 0;',
    '  right: 0;',
    '  bottom: 0;',
    '  background-color: rgba(0, 0, 0, 0.5);',
    '  z-index: 9999;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  padding: 16px;',
    '  opacity: 0;',
    '  visibility: hidden;',
    '  transition: all 0.3s ease;',
    '}',
    '.peacase-modal-overlay.active {',
    '  opacity: 1;',
    '  visibility: visible;',
    '}',
    '.peacase-modal-container {',
    '  width: 100%;',
    '  max-width: 480px;',
    '  height: 90vh;',
    '  max-height: 700px;',
    '  background: white;',
    '  border-radius: 16px;',
    '  overflow: hidden;',
    '  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);',
    '  transform: translateY(20px) scale(0.95);',
    '  transition: all 0.3s ease;',
    '}',
    '.peacase-modal-overlay.active .peacase-modal-container {',
    '  transform: translateY(0) scale(1);',
    '}',
    '.peacase-modal-iframe {',
    '  width: 100%;',
    '  height: 100%;',
    '  border: none;',
    '}',
    '@media (max-width: 480px) {',
    '  .peacase-modal-container {',
    '    max-width: 100%;',
    '    height: 100%;',
    '    max-height: 100%;',
    '    border-radius: 0;',
    '  }',
    '  .peacase-modal-overlay {',
    '    padding: 0;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(styles);

  // Create calendar icon SVG
  function createCalendarIcon() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '3');
    rect.setAttribute('y', '4');
    rect.setAttribute('width', '18');
    rect.setAttribute('height', '18');
    rect.setAttribute('rx', '2');
    rect.setAttribute('ry', '2');
    svg.appendChild(rect);

    var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '16');
    line1.setAttribute('y1', '2');
    line1.setAttribute('x2', '16');
    line1.setAttribute('y2', '6');
    svg.appendChild(line1);

    var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '8');
    line2.setAttribute('y1', '2');
    line2.setAttribute('x2', '8');
    line2.setAttribute('y2', '6');
    svg.appendChild(line2);

    var line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line3.setAttribute('x1', '3');
    line3.setAttribute('y1', '10');
    line3.setAttribute('x2', '21');
    line3.setAttribute('y2', '10');
    svg.appendChild(line3);

    return svg;
  }

  // Create button
  var button = document.createElement('button');
  button.className = 'peacase-booking-btn' + (position === 'floating' ? ' peacase-booking-btn-floating' : '');
  button.appendChild(createCalendarIcon());
  var buttonTextNode = document.createTextNode(buttonText);
  button.appendChild(buttonTextNode);

  // Create modal overlay
  var overlay = document.createElement('div');
  overlay.className = 'peacase-modal-overlay';

  var container = document.createElement('div');
  container.className = 'peacase-modal-container';

  var iframe = document.createElement('iframe');
  iframe.className = 'peacase-modal-iframe';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'payment');

  container.appendChild(iframe);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Open modal
  function openModal() {
    iframe.src = baseUrl + '/embed/' + encodeURIComponent(salon);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close modal
  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    // Clear iframe after animation
    setTimeout(function() {
      iframe.src = '';
    }, 300);
  }

  // Event listeners
  button.addEventListener('click', openModal);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Listen for messages from iframe
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'peacase-booking-close') {
      closeModal();
    }
    if (e.data && e.data.type === 'peacase-booking-complete') {
      // Trigger a custom event for the parent page
      var event = new CustomEvent('peacase:booking-complete', { detail: e.data });
      document.dispatchEvent(event);
    }
  });

  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Insert button
  if (position === 'inline') {
    currentScript.parentNode.insertBefore(button, currentScript.nextSibling);
  } else {
    document.body.appendChild(button);
  }

  // Expose API for programmatic control
  window.PeacaseBooking = {
    open: openModal,
    close: closeModal
  };
})();
