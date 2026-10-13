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
      desc: 'Inspector de pantalla · Disponible en Microsoft Store · Incluido de por vida en la Suite',
      product: 'Assistant',
      total: 'Disponible en Microsoft Store · Gratis con la Suite (48.88 USD)',
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
      url: 'mailto:DixStdGdl@hotmail.com?subject=Tooltip%20AI%20Team',
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

  function renderDl(list) {
    var box = document.getElementById('ckDl');
    if (!box) return;
    if (!list || !list.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    var storeBtn = '';
    if (current && current.storeUri) {
      storeBtn = '<a class="btn btn-primary btn-block" style="margin-bottom:0.6rem; text-align:center; text-decoration:none;" href="' + current.storeUri + '">' +
        '🏪 Obtener en Microsoft Store</a>' +
        (current.storeWeb ? '<a class="btn btn-ghost btn-block" style="margin-bottom:0.75rem; text-align:center; text-decoration:none; font-size:0.85rem;" target="_blank" rel="noopener" href="' + current.storeWeb + '">' +
        '🌐 Abrir ficha web en Microsoft Store</a>' : '');
    }
    box.innerHTML = storeBtn + list.map(function (d) {
      return '<a class="btn btn-ghost btn-block" href="' + d.href + '" download>' +
        '<span>↓</span> Descargar ' + d.label + '</a>';
    }).join('');
  }

  function renderPaidNotice(paid) {
    var box = document.getElementById('ckDl');
    if (!box) return;
    box.hidden = false;
    if (!paid) { box.innerHTML = ''; box.hidden = true; return; }
    var storeBtn = '';
    if (current.storeUri) {
      storeBtn = '<a class="btn btn-ghost btn-block" style="margin-bottom:0.6rem; text-align:center; text-decoration:none;" href="' + current.storeUri + '">' +
        '🏪 Ver en Microsoft Store</a>' +
        (current.storeWeb ? '<a class="btn btn-ghost btn-block" style="margin-bottom:0.75rem; text-align:center; text-decoration:none; font-size:0.85rem;" target="_blank" rel="noopener" href="' + current.storeWeb + '">' +
        '🌐 Abrir ficha web en Microsoft Store</a>' : '');
    }
    var dlBtns = '';
    if (current.downloads && current.downloads.length) {
      dlBtns = current.downloads.map(function (d) {
        return '<a class="btn btn-primary btn-block" style="margin-bottom:0.6rem; text-align:center; text-decoration:none;" href="' + d.href + '" download>' +
          '<span>📱</span> Descargar ' + d.label + '</a>';
      }).join('');
    }
    box.innerHTML =
      dlBtns +
      storeBtn +
      '<div class="ck-note" style="margin:0.75rem 0 0">' +
      '<strong>Entrega directa o Microsoft Store.</strong> Los instaladores de Aura, Voice, Translate y Bridge ' +
      'pueden abrirse en Microsoft Store o entregarse tras pago con PayPal. ' +
      'Escríbenos a <a href="mailto:dixstdgdl3@gmail.com?subject=Entrega%20ToolTip%20AI">dixstdgdl3@gmail.com</a> ' +
      'con cualquier consulta.' +
      '</div>';
  }

  function openCk(key) {
    current = catalog[key] || catalog.bundle;
    ckTitle.textContent = current.title;
    ckDesc.textContent = current.desc;
    ckProduct.textContent = current.product;
    ckTotal.textContent = current.total;
    var payBtn = document.getElementById('ckPay');
    if (!current.url) {
      payBtn.textContent = 'Descargar prueba (24 horas gratis)';
      payBtn.classList.remove('btn-primary');
      payBtn.classList.add('btn-ghost');
      renderDl(current.downloads);
    } else if (current.delivery === 'team') {
      payBtn.innerHTML = '<span class="btn-shine"></span>Escribir a ventas';
      payBtn.classList.add('btn-primary');
      payBtn.classList.remove('btn-ghost');
      renderPaidNotice(true);
    } else {
      payBtn.innerHTML = '<span class="btn-shine"></span>Pagar con PayPal';
      payBtn.classList.add('btn-primary');
      payBtn.classList.remove('btn-ghost');
      /* Nunca mostrar instaladores de pago antes de cobrar */
      renderPaidNotice(true);
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  ckPay.addEventListener('click', function () {
    if (!current.url) {
      renderDl(current.downloads);
      return;
    }
    if (current.delivery === 'team') {
      window.location.href = current.url;
      return;
    }
    var w = 520, h = 720;
    window.open(
      current.url,
      'tooltip-paypal',
      'width=' + w + ',height=' + h +
      ',left=' + ((screen.width - w) / 2) +
      ',top=' + ((screen.height - h) / 2) +
      ',noopener,noreferrer'
    );
    /* Pago abierto en otra ventana: sin instaladores aquí */
    renderPaidNotice(true);
  });
  /* ---------- HUD parallax on pointer ---------- */
  var hud = document.getElementById('heroHud');
  if (hud && !reduce) {
    addEventListener('pointermove', function (e) {
      var x = (e.clientX / innerWidth - 0.5) * 12;
      var y = (e.clientY / innerHeight - 0.5) * 8;
      hud.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }, { passive: true });
  }
  /* ---------- Analytics & Telemetry (Google Analytics + Clarity + Azure) ---------- */
  (function initTelemetry() {
    /* Initialize Google Analytics if not already loaded in <head> */
    try {
      if (typeof window !== 'undefined' && !window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){ window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', 'G-WSGPY3DK4Z');

        var gs = document.createElement('script');
        gs.async = true;
        gs.src = 'https://www.googletagmanager.com/gtag/js?id=G-WSGPY3DK4Z';
        var firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(gs, firstScript);
        } else if (document.head) {
          document.head.appendChild(gs);
        }
      }
    } catch (_) {}

    /* Initialize Clarity if not already loaded in <head> */
    try {
      if (typeof window !== 'undefined' && !window.clarity) {
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "yx9lgph0yh");
      }
    } catch (_) {}

    var endpoint = 'https://mexicocentral-0.in.applicationinsights.azure.com/v2/track';
    var k = '680724c1-2840-4ce4-9780-e9ccd5062f9d';
    function sendTelemetry(name, props) {
      /* Send event to Google Analytics */
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        try {
          window.gtag('event', name, props || {});
        } catch (_) {}
      }

      /* Send event to Microsoft Clarity */
      if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
        try {
          window.clarity("event", name);
          if (props && typeof props === 'object') {
            for (var pk in props) {
              if (Object.prototype.hasOwnProperty.call(props, pk) && typeof props[pk] === 'string') {
                window.clarity("set", pk, props[pk]);
              }
            }
          }
        } catch (_) {}
      }

      /* Azure Application Insights fallback */
      try {
        var payload = {
          name: 'Microsoft.ApplicationInsights.Event',
          time: new Date().toISOString(),
          iKey: k,
          data: {
            baseType: 'EventData',
            baseData: {
              ver: 2,
              name: name,
              properties: props || {}
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
      } catch (e) {}
    }

    sendTelemetry('Web_PageView', { path: location.pathname, referrer: document.referrer });

    document.querySelectorAll('a[href*="apps.microsoft.com"], a[href*="ms-windows-store"]').forEach(function(el) {
      el.addEventListener('click', function() {
        sendTelemetry('Click_StoreListing', { target: el.href });
      });
    });

    document.querySelectorAll('a[href*=".msix"], a[href*=".exe"]').forEach(function(el) {
      el.addEventListener('click', function() {
        sendTelemetry('Click_DownloadInstaller', { file: el.href });
      });
    });

    document.querySelectorAll('[data-buy]').forEach(function(el) {
      el.addEventListener('click', function() {
        sendTelemetry('Click_BuyButton', { plan: el.getAttribute('data-buy') || 'unknown' });
      });
    });
  })();
})();
