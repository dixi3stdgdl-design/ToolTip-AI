/**
 * Tooltip AI — Motor Interactivo de Paneles y Simuladores en Vivo
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Detección del tipo de simulador
  initInteractiveSimulators();

  // 2. Registro de eventos para Clarity y GA4
  initTrackingEvents();
});

function initInteractiveSimulators() {
  const simZones = document.querySelectorAll('.simulation-zone');
  
  simZones.forEach(zone => {
    const hud = zone.querySelector('.floating-hud');
    if (!hud) return;

    zone.addEventListener('mousemove', (e) => {
      const rect = zone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      hud.style.opacity = '1';
      hud.style.transform = `translate(${Math.min(x + 15, rect.width - 280)}px, ${Math.min(y + 15, rect.height - 120)}px)`;
    });

    zone.addEventListener('mouseleave', () => {
      hud.style.opacity = '0.15';
      hud.style.transform = 'translate(20px, 20px)';
    });
  });

  // Simulador de Voz Interactivo
  const voicePlayBtn = document.getElementById('testVoiceBtn');
  if (voicePlayBtn) {
    let isSpeaking = false;
    voicePlayBtn.addEventListener('click', () => {
      isSpeaking = !isSpeaking;
      const wave = document.getElementById('voiceWaveform');
      const duckingIndicator = document.getElementById('duckingIndicator');

      if (isSpeaking) {
        voicePlayBtn.textContent = '⏹ Pausar Lectura';
        if (wave) wave.style.opacity = '1';
        if (duckingIndicator) duckingIndicator.textContent = 'Atenuación Activa: Música bajó al 20%';

        // Sintetizar voz si el navegador lo soporta
        if ('speechSynthesis' in window) {
          const sampleText = document.getElementById('voiceSampleText')?.textContent || "ToolTip AI Voice activado.";
          const utter = new SpeechSynthesisUtterance(sampleText);
          utter.lang = 'es-ES';
          utter.onend = () => {
            isSpeaking = false;
            voicePlayBtn.textContent = '▶ Probar Lectura en Vivo';
            if (wave) wave.style.opacity = '0.3';
            if (duckingIndicator) duckingIndicator.textContent = 'En espera de voz';
          };
          window.speechSynthesis.speak(utter);
        }
      } else {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        voicePlayBtn.textContent = '▶ Probar Lectura en Vivo';
        if (wave) wave.style.opacity = '0.3';
        if (duckingIndicator) duckingIndicator.textContent = 'En espera de voz';
      }
    });
  }
}

function initTrackingEvents() {
  // Click a la Microsoft Store
  document.querySelectorAll('a[href^="ms-windows-store"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = new URL(btn.href).searchParams.get('productid') || 'general';
      
      // GA4 Event
      if (typeof gtag === 'function') {
        gtag('event', 'click_ms_store', {
          event_category: 'outbound_conversion',
          product_id: productId
        });
      }

      // Clarity Custom Event
      if (typeof clarity === 'function') {
        clarity('event', 'ms_store_click');
      }
    });
  });

  // Pruebas en simuladores
  document.querySelectorAll('.simulation-zone').forEach(sim => {
    sim.addEventListener('mouseenter', () => {
      const simType = sim.dataset.simType || 'general';
      if (typeof gtag === 'function') {
        gtag('event', 'interact_simulator', {
          simulator_type: simType
        });
      }
    }, { once: true });
  });
}
