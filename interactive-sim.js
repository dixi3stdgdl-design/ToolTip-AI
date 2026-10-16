/**
 * Tooltip AI — Motor Fluent de Windows 11 & CursorBeam en Tiempo Real
 */
document.addEventListener('DOMContentLoaded', () => {
  initCursorBeam();
  initFluentWindowModes();
  initWASAPIDucking();
});

// Haz de luz que proyecta ToolTip AI bajo el cursor (CursorBeam)
function initCursorBeam() {
  const viewports = document.querySelectorAll('.w11-viewport');
  
  viewports.forEach(vp => {
    const beam = vp.querySelector('.cursor-beam-light');
    const hud = vp.querySelector('.w11-tooltip-hud');

    vp.addEventListener('mouseenter', () => {
      if (beam) beam.style.opacity = '1';
      if (hud) hud.style.opacity = '1';
    });

    vp.addEventListener('mousemove', (e) => {
      const rect = vp.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (beam) {
        beam.style.left = `${x}px`;
        beam.style.top = `${y}px`;
      }

      if (hud) {
        const maxX = rect.width - 340;
        const maxY = rect.height - 180;
        const targetX = Math.max(15, Math.min(x + 20, maxX));
        const targetY = Math.max(15, Math.min(y + 20, maxY));
        hud.style.transform = `translate(${targetX}px, ${targetY}px)`;
      }
    });

    vp.addEventListener('mouseleave', () => {
      if (beam) beam.style.opacity = '0';
      if (hud) hud.style.opacity = '0';
    });
  });
}

// Selector Dinámico de Módulos dentro de la Ventana de Windows 11
function initFluentWindowModes() {
  const tabs = document.querySelectorAll('.w11-tab');
  const hudStatus = document.getElementById('hudStatusText');
  const hudBody = document.getElementById('hudBodyText');
  const hudMeta = document.getElementById('hudMetaText');
  const appTag = document.getElementById('appTagText');
  const appSample = document.getElementById('appSampleText');

  const modes = {
    translate: {
      name: 'Translate',
      tag: 'OCR Óptico · Bounding Box Detectado',
      status: 'Traducción Directa [Dwell]',
      body: '"Haga clic aquí para verificar los permisos del sistema en la directiva de seguridad."',
      meta: 'Fuente: Francés (99.8%) · Latencia: 14ms',
      sample: '<span style="color:#f87171;">System Code 0x80070005:</span><br>"Accès refusé. Vous devez disposer des autorisations nécessaires pour exécuter cette application."',
      accent: '#06b6d4'
    },
    voice: {
      name: 'Voice',
      tag: 'WASAPI CoreAudio · Ducking Activo',
      status: 'Lectura con Atenuación',
      body: 'Leyendo síntesis de voz clara. La música de Spotify se atenuó automáticamente al 20%.',
      meta: 'Atenuación: -18 dB · Salida: Auriculares (Realtek Audio)',
      sample: '<span style="color:#c084fc;">Audio Ducking Session:</span><br>"Se detectó un cambio en el registro del sistema. Presione Ctrl+Shift+V para escuchar el informe completo."',
      accent: '#a855f7'
    },
    aura: {
      name: 'Aura',
      tag: 'UIAutomation Tree · Radar Preventivo',
      status: 'Aura Shield · Advertencia',
      body: 'Precaución: El enlace apunta a un ejecutable no firmado (.exe) con elevación UAC.',
      meta: 'Firmado: No · Riesgo: Medio · Acción: Inspeccionar',
      sample: '<span style="color:#f59e0b;">Control Inspector:</span><br>&lt;Button Name="Descargar_Setup_Gratis.exe" ElevationRequired="True" /&gt;',
      accent: '#f59e0b'
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const modeKey = tab.dataset.mode;
      const data = modes[modeKey];
      if (!data) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (hudStatus) hudStatus.textContent = data.status;
      if (hudBody) hudBody.textContent = data.body;
      if (hudMeta) hudMeta.textContent = data.meta;
      if (appTag) appTag.textContent = data.tag;
      if (appSample) appSample.innerHTML = data.sample;

      const hud = document.querySelector('.w11-tooltip-hud');
      if (hud) hud.style.borderColor = data.accent;
    });
  });
}

// Simulador de Audio Ducking Dinámico
function initWASAPIDucking() {
  const slider = document.getElementById('duckingSlider');
  const levelDisplay = document.getElementById('duckingLevelDisplay');

  if (slider && levelDisplay) {
    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      levelDisplay.textContent = `-${val} dB`;
    });
  }
}
