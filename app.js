/* Tooltip AI — WebGL light-field + interactions */
(function () {
  'use strict';

  /* ---------- WebGL ambient light-field ---------- */
  var canvas = document.getElementById('gl');
  if (canvas && canvas.getContext) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (gl) {
      var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      var fs = [
        'precision highp float;',
        'uniform vec2 u_res;uniform float u_t;uniform vec2 u_m;',
        'void main(){',
        '  vec2 p=(gl_FragCoord.xy-.5*u_res)/u_res.y;',
        '  vec2 m=(u_m-.5)*vec2(u_res.x/u_res.y,1.);',
        '  float t=u_t*.10;',
        // thin flowing ribbons over deep void
        '  float w1=sin(p.x*1.6+t*1.15+p.y*2.2)+.55*sin(p.y*2.4-t*.85);',
        '  float w2=sin(p.x*2.1-t*.7-p.y*1.8)+.45*sin(length(p)*2.2+t*.5);',
        '  float ribbon1=pow(max(0.,1.-abs(w1)*.95),6.0);',
        '  float ribbon2=pow(max(0.,1.-abs(w2)*.9),7.0);',
        '  float halo=exp(-abs(p.y+.22*sin(t*.6+p.x*1.1))*3.2);',
        '  float d=length(p-m*.55);',
        '  float lens=exp(-d*d*5.5);',
        '  float r=length(p);',
        '  float fade=smoothstep(1.45,.12,r);',
        '  vec3 c1=vec3(.012,.018,.032);',
        '  vec3 teal=vec3(.12,.78,.70);',
        '  vec3 sky=vec3(.18,.62,.95);',
        '  vec3 vio=vec3(.58,.42,.95);',
        '  vec3 col=c1;',
        '  col+=teal*ribbon1*.85*fade;',
        '  col+=sky*ribbon2*.65*fade;',
        '  col+=vio*halo*.22*fade;',
        '  col+=vec3(.35,.75,.85)*lens*.35;',
        '  col*=.88+.12*smoothstep(1.8,0.,r);',
        '  gl_FragColor=vec4(col,1.);',
        '}'
      ].join('\n');

      function sh(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      }
      var prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      var uRes = gl.getUniformLocation(prog, 'u_res');
      var uT = gl.getUniformLocation(prog, 'u_t');
      var uM = gl.getUniformLocation(prog, 'u_m');

      var mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
      function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
        var w = window.innerWidth || document.documentElement.clientWidth;
        var h = window.innerHeight || document.documentElement.clientHeight;
        // 100dvh / visualViewport evita que el canvas se quede corto al hacer scroll
        if (window.visualViewport) {
          w = window.visualViewport.width;
          h = window.visualViewport.height;
        }
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      addEventListener('resize', resize);
      resize();

      addEventListener('pointermove', function (e) {
        tmx = e.clientX / innerWidth;
        tmy = 1 - e.clientY / innerHeight;
      }, { passive: true });

      var t0 = performance.now();
      function frame(now) {
        mx += (tmx - mx) * 0.06;
        my += (tmy - my) * 0.06;
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uT, (now - t0) * 0.001);
        gl.uniform2f(uM, mx, my);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  }

  /* ---------- scroll progress + reveals ---------- */
  var progress = document.getElementById('progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  // hero visible immediately
  document.querySelectorAll('.hero .reveal').forEach(function (el) {
    requestAnimationFrame(function () { el.classList.add('in'); });
  });

  /* ---------- magnetic buttons ---------- */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.22 + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- mobile nav ---------- */
  var menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
  }

  /* ---------- checkout modal (PayPal in popup, no redirect) ---------- */
  /* Solo Assistant es descarga directa. Los módulos de pago NUNCA se sirven
     desde la web: se entregan tras confirmar el pago (correo / Store). */
  var catalog = {
    bundle: {
      title: 'Bundle Suite (5 Apps)',
      desc: 'Oferta de Lanzamiento (Regular: 56.96 USD) · Assistant + Aura + Voice + Translate + Bridge · licencia de por vida',
      product: 'Tooltip AI Bundle',
      total: '48.88 USD',
      url: 'https://paypal.me/DixLqb/48.88',
      downloads: [
        { label: 'Bridge Companion Android (APK)', href: '/downloads/ToolTipAIBridge.apk' }
      ],
      delivery: 'paid'
    },
    module: {
      title: 'Módulo suelto',
      desc: 'Aura, Voice, Translate o Bridge · elige el tuyo',
      product: 'Tooltip AI Module',
      total: '9.99 USD',
      url: 'https://paypal.me/DixLqb/9.99',
      downloads: [],
      delivery: 'paid'
    },
    aura: {
      title: 'ToolTip AI Aura',
      desc: 'Contexto por reposo · licencia de por vida',
      product: 'Aura',
      total: '9.99 USD',
      url: 'https://paypal.me/DixLqb/9.99',
      storeId: '9P33P1P5Z8DC',
      storeUri: 'ms-windows-store://pdp/?productid=9P33P1P5Z8DC',
      storeWeb: 'https://apps.microsoft.com/detail/9P33P1P5Z8DC',
      downloads: [],
      delivery: 'paid'
    },
    voice: {
      title: 'ToolTip AI Voice',
      desc: 'Voz y ducking · licencia de por vida',
      product: 'Voice',
      total: '9.99 USD',
      url: 'https://paypal.me/DixLqb/9.99',
      storeId: '9P417GZB0FVB',
      storeUri: 'ms-windows-store://pdp/?productid=9P417GZB0FVB',
      storeWeb: 'https://apps.microsoft.com/detail/9P417GZB0FVB',
      downloads: [],
      delivery: 'paid'
    },
    translate: {
      title: 'ToolTip AI Translate',
      desc: 'Traducción en pantalla · licencia de por vida',
      product: 'Translate',
      total: '9.99 USD',
      url: 'https://paypal.me/DixLqb/9.99',
      storeId: '9NQN3RZ2Z655',
      storeUri: 'ms-windows-store://pdp/?productid=9NQN3RZ2Z655',
      storeWeb: 'https://apps.microsoft.com/detail/9NQN3RZ2Z655',
      downloads: [],
      delivery: 'paid'
    },
    bridge: {
      title: 'ToolTip AI Bridge',
      desc: 'Sincronización PC-Móvil en tiempo real · Wi-Fi local · licencia de por vida',
      product: 'Bridge',
      total: '9.99 USD',
      url: 'https://paypal.me/DixLqb/9.99',
      storeId: '9PN1B2M4N7DK',
      storeUri: 'ms-windows-store://pdp/?productid=9PN1B2M4N7DK',
      storeWeb: 'https://apps.microsoft.com/detail/9PN1B2M4N7DK',
      downloads: [
        { label: 'Companion Android (APK)', href: '/downloads/ToolTipAIBridge.apk' }
      ],
      delivery: 'paid'
    },
    assistant: {
      title: 'ToolTip AI Assistant',
      desc: 'Inspector de pantalla · Prueba de 3 días · Incluido de por vida en la Suite',
      product: 'Assistant',
      total: 'Prueba 3 días gratis · Gratis con la Suite (48.88 USD)',
      url: '',
      storeId: '9N3D02KXKD3D',
      storeUri: 'ms-windows-store://pdp/?productid=9N3D02KXKD3D',
      storeWeb: 'https://apps.microsoft.com/detail/9N3D02KXKD3D',
      downloads: [
        { label: 'Assistant 1.1.8 (MSIX Oficial)', href: '/downloads/ToolTipAIAssistant_1.1.8.0_x64.msix' },
        { label: 'Assistant (EXE portable)', href: '/downloads/TooltipAI.exe' }
      ],
      delivery: 'free'
    },
    team: {
      title: 'Tooltip AI Team',
      desc: 'Licencias por volumen · 299–999 USD',
      product: 'Team / Enterprise',
      total: 'A medida',
      url: 'mailto:dixstdgdl3@gmail.com?subject=Tooltip%20AI%20Team',
      downloads: [],
      delivery: 'team'
    }
  };

  var modal = document.getElementById('checkout');
  var ckTitle = document.getElementById('ckTitle');
  var ckDesc = document.getElementById('ckDesc');
  var ckProduct = document.getElementById('ckProduct');
  var ckTotal = document.getElementById('ckTotal');
  var ckPay = document.getElementById('ckPay');
  var current = catalog.bundle;

  function closeCk() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-buy]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openCk(el.getAttribute('data-buy'));
    });
  });
  document.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeCk);
  });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCk();
  });

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function createLinkBtn(cls, href, text, isExternal, isDownload) {
    var a = document.createElement('a');
    a.className = cls;
    a.href = href;
    a.style.marginBottom = '0.6rem';
    a.style.textAlign = 'center';
    a.style.textDecoration = 'none';
    if (isExternal) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.fontSize = '0.85rem';
      a.style.marginBottom = '0.75rem';
    }
    if (isDownload) {
      a.setAttribute('download', '');
    }
    a.textContent = text;
    return a;
  }

  function renderDl(list) {
    var box = document.getElementById('ckDl');
    if (!box) return;
    clearNode(box);
    if (!list || !list.length) { box.hidden = true; return; }
    box.hidden = false;
    if (current && current.storeUri) {
      box.appendChild(createLinkBtn('btn btn-primary btn-block', current.storeUri, '🏪 Obtener en Microsoft Store', false, false));
      if (current.storeWeb) {
        box.appendChild(createLinkBtn('btn btn-ghost btn-block', current.storeWeb, '🌐 Abrir ficha web en Microsoft Store', true, false));
      }
    }
    list.forEach(function (d) {
      box.appendChild(createLinkBtn('btn btn-ghost btn-block', d.href, '↓ Descargar ' + d.label, false, true));
    });
  }

  function renderPaidNotice(paid) {
    var box = document.getElementById('ckDl');
    if (!box) return;
    clearNode(box);
    if (!paid) { box.hidden = true; return; }
    box.hidden = false;
    if (current.downloads && current.downloads.length) {
      current.downloads.forEach(function (d) {
        box.appendChild(createLinkBtn('btn btn-primary btn-block', d.href, '📱 Descargar ' + d.label, false, true));
      });
    }
    if (current.storeUri) {
      box.appendChild(createLinkBtn('btn btn-ghost btn-block', current.storeUri, '🏪 Ver en Microsoft Store', false, false));
      if (current.storeWeb) {
        box.appendChild(createLinkBtn('btn btn-ghost btn-block', current.storeWeb, '🌐 Abrir ficha web en Microsoft Store', true, false));
      }
    }
    var note = document.createElement('div');
    note.className = 'ck-note';
    note.style.margin = '0.75rem 0 0';
    var st = document.createElement('strong');
    st.textContent = 'Entrega directa o Microsoft Store. ';
    note.appendChild(st);
    note.appendChild(document.createTextNode('Los instaladores de Aura, Voice, Translate y Bridge pueden abrirse en Microsoft Store o entregarse tras pago con PayPal. Escríbenos a '));
    var mail = document.createElement('a');
    mail.href = 'mailto:dixstdgdl3@gmail.com?subject=Entrega%20ToolTip%20AI';
    mail.textContent = 'dixstdgdl3@gmail.com';
    note.appendChild(mail);
    note.appendChild(document.createTextNode(' con cualquier consulta.'));
    box.appendChild(note);
  }

  /* ---------- Analytics & Telemetry Engine (GA4 + Clarity + Azure) ---------- */
  var endpoint = 'https://mexicocentral-0.in.applicationinsights.azure.com/v2/track';
  var k = '680724c1-2840-4ce4-9780-e9ccd5062f9d';

  function sendTelemetry(name, props) {
    props = props || {};
    props.timestamp = new Date().toISOString();
    props.page_path = window.location.pathname;

    /* 1. Google Analytics 4 (gtag) */
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', name, props);
      } catch (_) {}
    }

    /* 2. Microsoft Clarity */
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      try {
        window.clarity("event", name);
        for (var pk in props) {
          if (Object.prototype.hasOwnProperty.call(props, pk) && typeof props[pk] === 'string') {
            window.clarity("set", pk, props[pk]);
          }
        }
      } catch (_) {}
    }

    /* 3. Azure Application Insights */
    try {
      var payload = {
        name: 'Microsoft.ApplicationInsights.Event',
        time: props.timestamp,
        iKey: k,
        data: {
          baseType: 'EventData',
          baseData: {
            ver: 2,
            name: name,
            properties: props
          }
        }
      };
      var json = JSON.stringify(payload);
      var sent = false;
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && typeof Blob !== 'undefined') {
        try {
          var blob = new Blob([json], { type: 'application/json' });
          sent = navigator.sendBeacon(endpoint, blob);
        } catch (_) {
          sent = false;
        }
      }
      if (!sent && typeof fetch === 'function') {
        fetch(endpoint, {
          method: 'POST',
          body: json,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(function(){});
      }
    } catch (_) {}
  }

  function setPayBtnLabel(payBtn, text, withShine) {
    clearNode(payBtn);
    if (withShine) {
      var shine = document.createElement('span');
      shine.className = 'btn-shine';
      payBtn.appendChild(shine);
    }
    payBtn.appendChild(document.createTextNode(text));
  }

  function openCk(key) {
    if (!modal) return;
    current = catalog[key] || catalog.bundle;
    ckTitle.textContent = current.title;
    ckDesc.textContent = current.desc;
    ckProduct.textContent = current.product;
    ckTotal.textContent = current.total;
    var payBtn = document.getElementById('ckPay');
    if (!current.url) {
      setPayBtnLabel(payBtn, 'Descargar prueba (3 días gratis)', false);
      payBtn.classList.remove('btn-primary');
      payBtn.classList.add('btn-ghost');
      renderDl(current.downloads);
    } else if (current.delivery === 'team') {
      setPayBtnLabel(payBtn, 'Escribir a ventas', true);
      payBtn.classList.add('btn-primary');
      payBtn.classList.remove('btn-ghost');
      renderPaidNotice(true);
    } else {
      setPayBtnLabel(payBtn, 'Pagar con PayPal', true);
      payBtn.classList.add('btn-primary');
      payBtn.classList.remove('btn-ghost');
      renderPaidNotice(true);
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    var priceNum = parseFloat((current.total || '0').replace(/[^0-9.]/g, '')) || 0;
    sendTelemetry('view_item', {
      item_id: key,
      item_name: current.product,
      value: priceNum,
      currency: 'USD'
    });
  }

  if (ckPay) {
    ckPay.addEventListener('click', function () {
      if (!current.url) {
        sendTelemetry('click_free_download_options', { product: current.product });
        renderDl(current.downloads);
        return;
      }
      if (current.delivery === 'team') {
        sendTelemetry('click_team_sales', { product: current.product });
        window.location.href = current.url;
        return;
      }

      var priceNum = parseFloat((current.total || '0').replace(/[^0-9.]/g, '')) || 0;
      sendTelemetry('begin_checkout', {
        currency: 'USD',
        value: priceNum,
        item_name: current.product,
        checkout_url: current.url
      });

      var w = 520, h = 720;
      window.open(
        current.url,
        'tooltip-paypal',
        'width=' + w + ',height=' + h +
        ',left=' + ((screen.width - w) / 2) +
        ',top=' + ((screen.height - h) / 2) +
        ',noopener,noreferrer'
      );
      renderPaidNotice(true);
    });
  }

  /* ---------- Interactive 5-Module Live Simulator (Assistant, Translate, Aura, Voice, Bridge) ---------- */
  var simModes = {
    assistant: {
      windowTitle: 'Windows 11 · System Installer & Error Inspector',
      pill: 'TOOLTIP ASSISTANT · INSPECTOR DE PANTALLA',
      tag: 'Ctrl + Shift + A',
      color: '#2DD4BF',
      ctaLink: '/assistant/',
      ctaLabel: 'Explorar Assistant →',
      items: [
        {
          title: 'Error 0x80070005 — Acceso denegado en Registro',
          sub: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies · Bloqueo de permisos',
          badge: 'CRÍTICO',
          hudTitle: 'Diagnóstico de Error 0x80070005',
          hudDesc: 'El proceso actual no tiene privilegios de Administrador para modificar la rama HKLM. Ejecuta el instalador con clic derecho → "Ejecutar como administrador" sin desactivar Defender.',
          m1: ['180 ms', 'Latencia OCR'],
          m2: ['DPAPI', 'Clave Local'],
          m3: ['Seguro', 'Veredicto IA']
        },
        {
          title: '☑ Instalar "SearchBar Optimizer Pro" (Recomendado)',
          sub: 'Casilla pre-marcada en asistente de instalación de terceros',
          badge: 'ADWARE DETECTADO',
          hudTitle: 'Alerta de Bundleware / Adware Oculto',
          hudDesc: 'Esta casilla instala una barra de navegador no solicitada que modifica tu motor de búsqueda. Desmárcala antes de pulsar "Siguiente".',
          m1: ['99.4%', 'Precisión UI'],
          m2: ['Riesgo Alto', 'Clasificación'],
          m3: ['Desmarcar', 'Acción Sugerida']
        },
        {
          title: ' Extensión Chrome / Edge — Inspector DOM Activo',
          sub: 'Analiza modales de permisos OAuth y scripts en tiempo real',
          badge: 'MV3 EXTENSION',
          hudTitle: 'Inspección Híbrida Web + Escritorio',
          hudDesc: 'Tanto en el navegador (Manifest V3) como en el escritorio (.NET 8 WPF), Assistant resume qué permisos pide una app antes de que aceptes.',
          m1: ['Zero-Cloud', 'Privacidad'],
          m2: ['BYOK', 'Gemini / OpenAI'],
          m3: ['3 Días', 'Prueba Gratis']
        }
      ]
    },
    translate: {
      windowTitle: 'Quantum Console v1.1.0 · OCR & Holographic Lens',
      pill: 'TOOLTIP TRANSLATE · LENTE HOLOGRÁFICO & OCR',
      tag: 'Ctrl + Shift + T',
      color: '#FBBF24',
      ctaLink: '/translate/',
      ctaLabel: 'Explorar Translate →',
      items: [
        {
          title: '「致命的なエラー：VRAMバッファが不足しています (Code: 4092)」',
          sub: 'Texto no seleccionable renderizado dentro de motor gráfico DirectX 12',
          badge: 'OCR JAPONÉS → ES',
          hudTitle: '«Error fatal: Búfer de VRAM insuficiente (Código: 4092)»',
          hudDesc: 'Extraído por OCR óptico directo desde fotograma DirectX sin salir del juego ni usar el portapapeles. Sugerencia: reduce las texturas a 4 GB.',
          m1: ['95 ms', 'Extracción OCR'],
          m2: ['DeepL / Gemini', 'Motor Activo'],
          m3: ['Sin Copiar', 'Hover Directo']
        },
        {
          title: '„Netzwerkauthentifizierung fehlgeschlagen: Zertifikat abgelaufen“',
          sub: 'Diálogo técnico de VPN corporativa en alemán sin opción de copia',
          badge: 'ALEMÁN → ES',
          hudTitle: '«Autenticación de red fallida: Certificado expirado»',
          hudDesc: 'Traducción técnica preservando la terminología de ingeniería de redes y seguridad TLS.',
          m1: ['42 Idiomas', 'Detección Auto'],
          m2: ['100% Local', 'Cifrado DPAPI'],
          m3: ['HUD Lens', 'Superposición']
        },
        {
          title: 'Extensión Translate Quantum Console (Chrome / Edge)',
          sub: 'Lentes holográficos HUD sobre PDFs, documentación y portales web',
          badge: 'MV3 v1.1.0',
          hudTitle: 'Traducción Contextual en Navegador y Escritorio',
          hudDesc: 'Pasa el cursor sobre cualquier párrafo técnico o imagen incrustada en la web para desplegar la traducción instantánea sin recargar la página.',
          m1: ['MV3', 'Extensión Web'],
          m2: ['WPF .NET 8', 'App Windows'],
          m3: ['9.99 USD', 'Licencia Vitalicia']
        }
      ]
    },
    aura: {
      windowTitle: 'ToolTip Aura v1.0.2 · Radar de Reposo (Dwell) & Escudo Cognitivo',
      pill: 'TOOLTIP AURA · RADAR DWELL & ESCUDO COGNITIVO',
      tag: 'Ctrl + Shift + D',
      color: '#38BDF8',
      ctaLink: '/aura/',
      ctaLabel: 'Explorar Aura →',
      items: [
        {
          title: 'Botón [ DESCARGAR AHORA (1.4 MB) ] en portal de drivers',
          sub: 'El cursor reposa 450ms sobre el botón sin hacer clic',
          badge: 'TRAMPA DETECTADA',
          hudTitle: 'Escudo Cognitivo: Enlace Publicitario Engañoso',
          hudDesc: 'El radar de reposo (450 ms) detectó que este botón redirige a un dominio externo de publicidad. El botón legítimo de descarga se encuentra 120px más abajo.',
          m1: ['450 ms', 'Tiempo Dwell'],
          m2: ['ACTIVO', 'Escudo Cognitivo'],
          m3: ['Bloqueado', 'Clic Accidente']
        },
        {
          title: 'Icono sin etiqueta en software de edición CAD / 3D',
          sub: 'Orientación proactiva para interfaces densas y accesibilidad',
          badge: 'RADAR UI',
          hudTitle: 'Herramienta: Extrusión Booleana con Biselado',
          hudDesc: 'Aura identifica iconos mudos y controles complejos al detener el cursor, explicando su función y su atajo nativo sin abrir manuales.',
          m1: ['Sonar Pulse', 'Feedback Visual'],
          m2: ['Accesibilidad', 'Asistencia Real'],
          m3: ['< 45 MB', 'Huella en RAM']
        },
        {
          title: 'Extensión Aura LinkShield en Correo y Navegador',
          sub: 'Inspección preventiva de URLs ofuscadas y ataques homográficos',
          badge: 'LINK SHIELD',
          hudTitle: 'Verificación Proactiva de Dominio en Reposo',
          hudDesc: 'Antes de que hagas clic en un enlace de correo o web, Aura emite un pulso sonar si el destino real no coincide con el texto visible.',
          m1: ['v1.0.2', 'Extensión MV3'],
          m2: ['Zero-Telemetry', '100% Privado'],
          m3: ['9.99 USD', 'Pago Único']
        }
      ]
    },
    voice: {
      windowTitle: 'ToolTip Voice · Canal Acústico Neural & WASAPI Audio Ducking',
      pill: 'TOOLTIP VOICE · LOCUCIÓN NEURAL & AUDIO DUCKING',
      tag: 'Ctrl + Shift + V',
      color: '#A78BFA',
      ctaLink: '/voice/',
      ctaLabel: 'Explorar Voice →',
      isVoice: true,
      items: [
        {
          title: 'Lectura de explicación técnica mientras suena Spotify',
          sub: 'Atenuación automática por hardware en Windows Core Audio (WASAPI)',
          badge: 'DUCKING ACTIVO',
          hudTitle: 'Locución Activa · Música atenuada al 20%',
          hudDesc: 'Voice detecta el canal multimedia activo (Spotify / YouTube), reduce suavemente su volumen mientras sintetiza la explicación con voz natural, y restaura el volumen al terminar.',
          m1: ['-14 dB', 'Audio Ducking'],
          m2: ['1.15x', 'Velocidad TTS'],
          m3: ['WASAPI', 'Core Audio']
        },
        {
          title: 'Selección de artículo largo o paper científico en navegador',
          sub: 'Extensión ToolTip Voice con botón flotante instantáneo',
          badge: 'EXTENSIÓN + APP',
          hudTitle: 'Lectura Continua sin Fatiga Visual',
          hudDesc: 'Selecciona cualquier bloque de texto en tu navegador o IDE y presiona Ctrl+Shift+V (o el botón flotante de la extensión) para escucharlo mientras sigues trabajando.',
          m1: ['0.5x – 1.8x', 'Rango Ritmo'],
          m2: ['Neural / OS', 'Voces Soportadas'],
          m3: ['Persistente', 'Perfil Audio']
        },
        {
          title: 'Accesibilidad auditiva combinada con Assistant y Translate',
          sub: 'Escucha traducciones y diagnósticos de errores automáticamente',
          badge: 'SINERGIA SUITE',
          hudTitle: 'Pipeline Visual-Auditivo Integrado',
          hudDesc: 'Combina Translate o Assistant con Voice para que cualquier texto traducido por OCR sea leído en voz alta al instante.',
          m1: ['< 15 ms', 'Inicio Síntesis'],
          m2: ['Sin Nube', 'Procesamiento'],
          m3: ['9.99 USD', 'Licencia Vitalicia']
        }
      ]
    },
    bridge: {
      windowTitle: 'ToolTip Bridge v2.0 · Wi-Fi Local P2P & Cockpit Deck Android',
      pill: 'TOOLTIP BRIDGE · PUENTE P2P LOCAL & HUD 4-BORDES',
      tag: 'Hover 4-Bordes',
      color: '#38BDF8',
      ctaLink: '/bridge/',
      ctaLabel: 'Explorar Bridge y APK →',
      items: [
        {
          title: 'HUD Cyber-Glass acoplado al borde derecho (80% translúcido)',
          sub: 'Se oculta en una pestaña de 32px y se despliega al acercar el cursor',
          badge: '4 BORDES HOVER',
          hudTitle: 'Invocación por Hover · Cero Fricción Visual',
          hudDesc: 'Acopla Bridge arriba, abajo, izquierda o derecha. Permanece con 80% de translucidez sobre tu código o juego y muestra al instante lo que envías desde tu móvil.',
          m1: ['80%', 'Translucidez HUD'],
          m2: ['4 Bordes', 'Auto-Docking'],
          m3: ['0 Clics', 'Hover Summon']
        },
        {
          title: 'Sincronización Android ↔ Windows por Wi-Fi Local (UDP/TCP)',
          sub: 'Comparte texto, enlaces o respuestas de IA desde cualquier app móvil',
          badge: '< 12 ms P2P',
          hudTitle: 'Transferencia Instantánea Zero-Cloud',
          hudDesc: 'Selecciona texto en WhatsApp, Chrome o PDF en tu Android y pulsa "Compartir con ToolTip Bridge": aparece al instante en el portapapeles de tu PC sin pasar por ningún servidor en internet.',
          m1: ['< 12 ms', 'Latencia LAN'],
          m2: ['UDP + TCP', 'Descubrimiento'],
          m3: ['0 Bytes', 'En la Nube']
        },
        {
          title: 'Modo Cockpit Deck para Tablets (Galaxy Tab) y Smartphones',
          sub: 'Monitor de telemetría en vivo, radar térmico y control táctil',
          badge: 'APK INCLUIDO',
          hudTitle: 'Segunda Pantalla de Telemetría y Control AI',
          hudDesc: 'Convierte tu tablet o teléfono Android en un Cockpit Deck con métricas en tiempo real, estado de los 5 módulos y disparadores táctiles.',
          m1: ['APK Gratis', 'Companion App'],
          m2: ['60 FPS', 'Slow-Mo UI'],
          m3: ['9.99 USD', 'Módulo PC']
        }
      ]
    }
  };

  var activeSimKey = 'assistant';
  var activeItemIdx = 0;

  function renderSimulator(modeKey, itemIdx) {
    var mode = simModes[modeKey] || simModes.assistant;
    activeSimKey = modeKey;
    activeItemIdx = itemIdx || 0;
    var item = mode.items[activeItemIdx] || mode.items[0];

    var winTitle = document.getElementById('simWinTitle');
    var targetList = document.getElementById('simTargetList');
    var hudPill = document.getElementById('simHudPill');
    var hudTag = document.getElementById('simHudTag');
    var hudTitle = document.getElementById('simHudTitle');
    var hudDesc = document.getElementById('simHudDesc');
    var hudWave = document.getElementById('simHudWave');
    var m1Val = document.getElementById('simM1Val');
    var m1Lbl = document.getElementById('simM1Lbl');
    var m2Val = document.getElementById('simM2Val');
    var m2Lbl = document.getElementById('simM2Lbl');
    var m3Val = document.getElementById('simM3Val');
    var m3Lbl = document.getElementById('simM3Lbl');
    var hudLink = document.getElementById('simHudLink');

    if (!winTitle || !targetList) return;

    document.querySelectorAll('.sim-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-sim') === modeKey);
    });

    winTitle.textContent = mode.windowTitle;
    hudPill.textContent = mode.pill;
    hudPill.style.color = mode.color;
    hudTag.textContent = mode.tag;
    hudTitle.textContent = item.hudTitle;
    hudDesc.textContent = item.hudDesc;
    if (hudWave) hudWave.hidden = !mode.isVoice;

    m1Val.textContent = item.m1[0];
    m1Val.style.color = mode.color;
    m1Lbl.textContent = item.m1[1];
    m2Val.textContent = item.m2[0];
    m2Val.style.color = mode.color;
    m2Lbl.textContent = item.m2[1];
    m3Val.textContent = item.m3[0];
    m3Val.style.color = mode.color;
    m3Lbl.textContent = item.m3[1];

    if (hudLink) {
      hudLink.href = mode.ctaLink;
      hudLink.textContent = mode.ctaLabel;
    }

    clearNode(targetList);
    mode.items.forEach(function (it, idx) {
      var row = document.createElement('div');
      row.className = 'sim-target-item' + (idx === activeItemIdx ? ' selected' : '');
      var left = document.createElement('div');
      var st = document.createElement('strong');
      st.textContent = it.title;
      var sp = document.createElement('span');
      sp.textContent = it.sub;
      left.appendChild(st);
      left.appendChild(sp);

      var b = document.createElement('span');
      b.className = 'sim-target-badge';
      b.style.color = mode.color;
      b.textContent = it.badge;

      row.appendChild(left);
      row.appendChild(b);
      row.addEventListener('click', function () {
        renderSimulator(modeKey, idx);
      });
      row.addEventListener('pointerenter', function () {
        renderSimulator(modeKey, idx);
      });
      targetList.appendChild(row);
    });
  }

  document.querySelectorAll('.sim-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = tab.getAttribute('data-sim');
      renderSimulator(key, 0);
      sendTelemetry('select_simulator_tab', { module: key });
    });
  });

  if (document.getElementById('simTargetList')) {
    renderSimulator('assistant', 0);
  }

  /* ---------- HUD parallax on pointer ---------- */
  var hud = document.getElementById('heroHud');
  if (hud && !reduce) {
    addEventListener('pointermove', function (e) {
      var x = (e.clientX / innerWidth - 0.5) * 12;
      var y = (e.clientY / innerHeight - 0.5) * 8;
      hud.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }, { passive: true });
  }

  /* ---------- Dynamic Event Delegation for Downloads, Store, and Clicks ---------- */
  sendTelemetry('page_view', { path: location.pathname, referrer: document.referrer });

  document.addEventListener('click', function(e) {
    var target = e.target;

    /* Detect file downloads (.msix, .exe, .apk or [download] attribute) */
    var dl = target.closest('a[download], a[href*=".msix"], a[href*=".exe"], a[href*=".apk"]');
    if (dl) {
      var href = dl.getAttribute('href') || '';
      var filename = href.split('/').pop().split('?')[0];
      var ext = filename.split('.').pop();
      sendTelemetry('file_download', {
        file_name: filename,
        file_extension: ext,
        link_url: dl.href,
        product: (current && current.product) ? current.product : 'Assistant'
      });
      return;
    }

    /* Detect Microsoft Store clicks */
    var st = target.closest('a[href*="apps.microsoft.com"], a[href*="ms-windows-store"]');
    if (st) {
      sendTelemetry('select_item', {
        item_list_name: 'Microsoft Store',
        link_url: st.href,
        product: (current && current.product) ? current.product : 'Assistant'
      });
      return;
    }

    /* Detect plan / buy button clicks */
    var buy = target.closest('[data-buy]');
    if (buy) {
      sendTelemetry('select_promotion', {
        plan: buy.getAttribute('data-buy') || 'unknown'
      });
    }
  });
})();

