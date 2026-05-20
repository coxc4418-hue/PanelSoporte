(function() {
  // Prevent duplicate initialization
  if (window.OroDigAIInitialized) return;
  window.OroDigAIInitialized = true;

  let apiKey = '';
  let iframe = null;
  let container = null;
  
  // Find host URL from script source
  const scriptTag = document.currentScript;
  let hostUrl = 'http://localhost:5000'; // Default fallback
  if (scriptTag && scriptTag.src) {
    try {
      const url = new URL(scriptTag.src);
      hostUrl = url.origin;
    } catch (e) {
      console.error('OroDig AI: Could not parse script URL.', e);
    }
  }

  // Define global init function
  window.OroDigAI = {
    init: function(config) {
      if (!config || !config.apiKey) {
        console.error('OroDig AI: apiKey is required in init() config.');
        return;
      }
      apiKey = config.apiKey;
      
      // Allow overriding backend URL if needed
      if (config.backendUrl) {
        hostUrl = config.backendUrl;
      }

      // Create container element
      createWidgetIframe();
    }
  };

  function createWidgetIframe() {
    // Style and insert the widget container
    container = document.createElement('div');
    container.id = 'orodig-ai-widget-container';
    
    // Default initial style (closed bubble button space)
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '90px',
      height: '90px',
      zIndex: '999999',
      border: 'none',
      overflow: 'hidden',
      transition: 'width 0.3s ease, height 0.3s ease, bottom 0.3s ease, right 0.3s ease, left 0.3s ease',
      display: 'block',
      backgroundColor: 'transparent'
    });

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.id = 'orodig-ai-widget-iframe';
    
    // Set source pointing to the frontend widget page
    iframe.src = `${hostUrl}/widget-iframe?apiKey=${apiKey}&parentOrigin=${encodeURIComponent(window.location.origin)}`;
    
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      background: 'transparent',
      colorScheme: 'light dark'
    });

    iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
    container.appendChild(iframe);
    document.body.appendChild(container);

    // Listen to messages from the iframe widget
    window.addEventListener('message', function(event) {
      // Validate origin if necessary (optional in local dev)
      if (event.origin !== hostUrl && !event.origin.includes('localhost') && !event.origin.includes('web.app') && !event.origin.includes('firebaseapp')) {
        return;
      }

      const data = event.data;
      if (!data || data.source !== 'orodig-ai-widget') return;

      if (data.type === 'ORODIG_TOGGLE') {
        if (data.open) {
          // Open state: enlarge container
          Object.assign(container.style, {
            width: '420px',
            height: '680px',
            maxHeight: 'calc(100vh - 40px)',
            maxWidth: 'calc(100vw - 40px)'
          });
        } else {
          // Closed state: restore small size
          Object.assign(container.style, {
            width: '90px',
            height: '90px'
          });
        }
      }

      // Configure position dynamically from widget config loaded in iframe
      if (data.type === 'ORODIG_CONFIG_LOADED') {
        const config = data.config;
        if (config && config.position === 'left') {
          Object.assign(container.style, {
            right: 'auto',
            left: '20px'
          });
        } else {
          Object.assign(container.style, {
            right: '20px',
            left: 'auto'
          });
        }
        
        // Hide container if IA is set inactive
        if (config.isActive === false) {
          container.style.display = 'none';
        }
      }
    });
  }
})();
