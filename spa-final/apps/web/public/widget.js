/**
 * Peacase Booking Widget Embed Script
 *
 * Usage:
 * <div id="peacase-booking" data-slug="your-business-slug"></div>
 * <script src="https://peacase.com/widget.js"></script>
 *
 * Optional attributes:
 * - data-location="location-id" - Pre-select a specific location (for multi-location businesses)
 */
(function() {
  'use strict';

  // Configuration
  var PEACASE_BASE_URL = 'https://peacase.com';

  // Find the container element
  var container = document.getElementById('peacase-booking');
  if (!container) {
    console.error('[Peacase] No element with id="peacase-booking" found on the page.');
    return;
  }

  // Read configuration from data attributes
  var slug = container.getAttribute('data-slug');
  var locationId = container.getAttribute('data-location');

  // Validate required attributes
  if (!slug) {
    console.error('[Peacase] Missing required data-slug attribute.');
    var errorMsg = document.createElement('p');
    errorMsg.style.cssText = 'color: #ef4444; padding: 16px; text-align: center; font-family: system-ui, sans-serif;';
    errorMsg.textContent = 'Booking widget configuration error: Missing business identifier.';
    container.appendChild(errorMsg);
    return;
  }

  // Build the iframe URL
  var iframeUrl = PEACASE_BASE_URL + '/embed/' + encodeURIComponent(slug);
  var params = [];
  if (locationId) {
    params.push('location=' + encodeURIComponent(locationId));
  }
  if (params.length > 0) {
    iframeUrl += '?' + params.join('&');
  }

  // Create loading placeholder using safe DOM methods
  var loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; min-height: 400px; background: #f9fafb; border-radius: 12px;';

  var loadingContent = document.createElement('div');
  loadingContent.style.cssText = 'text-align: center; color: #6b7280;';

  // Create SVG spinner using DOM methods
  var svgNS = 'http://www.w3.org/2000/svg';
  var spinner = document.createElementNS(svgNS, 'svg');
  spinner.setAttribute('width', '32');
  spinner.setAttribute('height', '32');
  spinner.setAttribute('viewBox', '0 0 24 24');
  spinner.setAttribute('fill', 'none');
  spinner.setAttribute('stroke', 'currentColor');
  spinner.setAttribute('stroke-width', '2');
  spinner.setAttribute('stroke-linecap', 'round');
  spinner.setAttribute('stroke-linejoin', 'round');
  spinner.style.animation = 'peacase-spin 1s linear infinite';

  var path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', 'M21 12a9 9 0 1 1-6.219-8.56');
  spinner.appendChild(path);

  var loadingText = document.createElement('p');
  loadingText.style.cssText = 'margin-top: 8px; font-family: system-ui, sans-serif; font-size: 14px;';
  loadingText.textContent = 'Loading booking widget...';

  loadingContent.appendChild(spinner);
  loadingContent.appendChild(loadingText);
  loadingDiv.appendChild(loadingContent);
  container.appendChild(loadingDiv);

  // Add spinner animation
  var style = document.createElement('style');
  style.textContent = '@keyframes peacase-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  // Create the iframe
  var iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.cssText = 'width: 100%; min-height: 600px; border: none; border-radius: 12px; display: none;';
  iframe.title = 'Book an appointment';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'payment');

  // Handle iframe load
  iframe.onload = function() {
    loadingDiv.style.display = 'none';
    iframe.style.display = 'block';
  };

  // Handle iframe resize messages from the widget
  window.addEventListener('message', function(event) {
    // Verify origin for security
    if (event.origin !== PEACASE_BASE_URL) {
      return;
    }

    if (event.data && event.data.type === 'peacase-resize') {
      var height = parseInt(event.data.height, 10);
      if (height && height > 0) {
        iframe.style.height = height + 'px';
      }
    }

    // Handle booking completion message
    if (event.data && event.data.type === 'peacase-booking-complete') {
      // Dispatch custom event for the host page to handle
      var customEvent = new CustomEvent('peacase:booking-complete', {
        detail: event.data.booking
      });
      container.dispatchEvent(customEvent);
    }
  });

  // Insert the iframe
  container.appendChild(iframe);
})();
