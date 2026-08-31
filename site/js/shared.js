/* ==========================================================================
   SATINE — chrome partagé (header, nav, rails pubs, clippy, panier, sparkles)
   Lors du passage en thème Shopify, ce fichier deviendra le layout Liquid
   (theme.liquid) + snippets. Chaque page fournit un <div id="page-main">.
   ========================================================================== */

(function () {
  'use strict';

  /* one-pager : la nav pointe vers les sections de index.html */
  var NAV = [
    { id: 'top',     label: 'Home',    anchor: '#top' },
    { id: 'merch',   label: 'Merch',   anchor: '#merch' },
    { id: 'tournee', label: 'Tournée', anchor: '#tournee' },
    { id: 'clip',    label: 'Clip',    anchor: '#clip' },
    { id: 'chat',    label: 'Chat',    anchor: '#chat' },
    { id: 'art',     label: 'Art',     anchor: '#art' },
    { id: 'secret',  label: 'Secret',  anchor: 'secret.html' }
  ];

  /* pages légales du footer : les /policies/… sont générées par Shopify
     (Paramètres → Politiques) — en local Vercel ces liens n'existent pas
     encore, c'est attendu */
  var FOOTER_LINKS = [
    { label: 'Mentions légales', href: '/policies/legal-notice' },
    { label: 'CGV', href: '/policies/terms-of-service' },
    { label: 'Confidentialité', href: '/policies/privacy-policy' },
    { label: 'Retours', href: '/policies/refund-policy' },
    { label: 'Livraison', href: '/policies/shipping-policy' }
  ];

  /* ------------------------------------------------------------------
     PUBS placeholders. data-frag = fragment du code secret caché dedans.
     Les visuels finaux des graphistes remplaceront le HTML de chaque slot.
     ------------------------------------------------------------------ */
  /* Emplacements de pubs vides en attendant les visuels des graphistes.
     Affichage : pleine largeur du rail (~217px au layout max de 1400px).
     Livrer les assets en ×2 (~440px de large), hauteur libre.
     NOTE : les 3 fragments du code secret (DEKO / NNECT / ÉE) devront être
     re-cachés dans les visuels finaux. */
  function adSlot(n) {
    return '<div class="ad-slot"><span>PUB ' + n + '<br>~440px de large<br>hauteur libre</span></div>';
  }
  var ADS_LEFT = [adSlot('G1'), adSlot('G2'), adSlot('G3'), adSlot('G4')];
  var ADS_RIGHT = [adSlot('D1'), adSlot('D2'), adSlot('D3'), adSlot('D4')];

  /* Les vraies pubs prennent des emplacements AU HASARD (et distincts) à
     chaque chargement, comme une régie qui tourne :
     - PUB_SATINE, webp animé (le gif source de 30 Mo reste dans pubs/)
     - l'affiche de tournée, cliquable → tableau des dates (#tournee ; depuis
       secret.html on repasse par index.html, comme la nav) */
  (function () {
    var tourHref = (document.body.getAttribute('data-page') === 'secret' ? 'index.html' : '') + '#tournee';
    var ads = [
      '<div class="ad ad-live"><img src="assets/img/pubs/pub-satine.webp" ' +
        'alt="Publicité SATINE" loading="lazy" decoding="async"></div>',
      '<div class="ad ad-live"><a href="' + tourHref + '" title="Toutes les dates de la tournée">' +
        '<img src="assets/img/pubs/pub-tour.webp" alt="European Tour — voir les dates" ' +
        'loading="lazy" decoding="async"></a></div>'
    ];
    var total = ADS_LEFT.length + ADS_RIGHT.length;
    var slots = [];
    while (slots.length < ads.length) {
      var n = (Math.random() * total) | 0;
      if (slots.indexOf(n) === -1) slots.push(n);
    }
    ads.forEach(function (ad, i) {
      var n = slots[i];
      if (n < ADS_LEFT.length) ADS_LEFT[n] = ad;
      else ADS_RIGHT[n - ADS_LEFT.length] = ad;
    });
  })();

  /* `goto` : pendant que ce message est affiché, la bulle est cliquable et
     emmène à l'ancre indiquée. */
  var CLIPPY_MSGS = [
    { t: 'Salut !! On dirait que tu visites le site de SATINE. Besoin d’aide ?' },
    { t: 'Psst… il paraît qu’un code est caché dans les pubs. Juste un bruit de couloir hein.' },
    { t: 'Le pack de barrettes part super vite. Je dis ça, je dis rien.', goto: '#merch' },
    { t: 'SATINE part en tournée avec The Living Tombstone !! Partout en Europe !!', goto: '#tournee' },
    { t: 'Tu as vu le nouveau clip ? Clique ici, je t’emmène.', goto: '#clip' }
  ];

  /* -------------------------------------------------------------- zoom
     Le design est calibré pour une fenêtre de ~1400px (= la largeur max de
     #layout). Sur un écran plus large, l'étaler ne servirait à rien : les
     rails de pubs occuperaient toujours 1/3 de la largeur, mais en beaucoup
     plus gros, et le contenu se retrouverait noyé entre deux bandes noires.
     On zoome donc toute la page pour conserver EXACTEMENT les proportions
     du petit écran. Le CSS lit ce facteur via --page-zoom.
     ------------------------------------------------------------------ */
  var DESIGN_W = 1400;   /* doit rester synchro avec #layout { width } */
  var ZOOM_MAX = 1.85;   /* garde-fou ultra-wide : au-delà le texte devient absurde */
  var MOBILE_BP = 1101;  /* sous ce seuil les rails disparaissent : pas de zoom */

  function applyZoom() {
    /* clientWidth = largeur hors scrollbar, sinon on déclenche un scroll
       horizontal d'une quinzaine de pixels */
    var w = document.documentElement.clientWidth;
    var z = w < MOBILE_BP ? 1 : w / DESIGN_W;
    if (z < 1) z = 1;
    if (z > ZOOM_MAX) z = ZOOM_MAX;
    document.documentElement.style.setProperty('--page-zoom', z.toFixed(4));
  }

  /* ------------------------------------------------------------ chrome */

  function build() {
    var page = document.body.getAttribute('data-page') || 'home';
    var pageMain = document.getElementById('page-main');

    /* sur secret.html, les ancres doivent repasser par index.html */
    var prefix = page === 'secret' ? 'index.html' : '';
    var nav = NAV.map(function (p) {
      var href = p.anchor.charAt(0) === '#' ? prefix + p.anchor : p.anchor;
      var active = (page === 'secret' && p.id === 'secret') || (page !== 'secret' && p.id === 'top');
      return '<a href="' + href + '" data-section="' + p.id + '"' + (active ? ' class="active"' : '') + '>' + p.label + '</a>';
    }).join('<span class="sep">|</span>');

    /* mêmes liens pour le burger menu mobile */
    var burgerLinks = NAV.map(function (p) {
      var href = p.anchor.charAt(0) === '#' ? prefix + p.anchor : p.anchor;
      return '<a class="burger-link" href="' + href + '">' + p.label + '</a>';
    }).join('');

    /* lien Panier : ouvre le tiroir, sur toutes les pages */
    nav += '<span class="sep">|</span><a href="#" id="nav-cart">Panier</a>';
    burgerLinks += '<a class="burger-link" href="#" id="burger-cart">Panier</a>';

    var chrome =
      '<div id="layout">' +
        '<aside class="rail" id="rail-left">' + ADS_LEFT.join('') + '</aside>' +
        '<div id="center-col">' +
          '<header id="topbar">' +
            '<a class="logo" href="index.html">' +
              '<span><span class="blogname">SAT’S BLOG</span>' +
              '<span class="tagline">A space for US</span></span>' +
            '</a>' +
            '<form class="secret-search" action="secret.html" method="get">' +
              '<input id="secret-input" name="code" placeholder="Secret Page…" autocomplete="off" spellcheck="false" aria-label="Secret Page">' +
              '<button type="submit">Unlock</button>' +
            '</form>' +
            '<button id="burger" aria-label="Ouvrir le menu">☰</button>' +
          '</header>' +
          '<nav id="navbar">' + nav + '</nav>' +
          '<div id="burger-menu" hidden>' +
            '<button id="burger-close" aria-label="Fermer le menu">✕</button>' +
            burgerLinks +
          '</div>' +
          '<main id="main-col"></main>' +
          /* footer DANS la colonne centrale : même largeur que le site,
             les rails de pubs continuent de chaque côté */
          '<footer id="site-footer">' +
            '<nav class="foot-links" aria-label="Pages légales">' +
              FOOTER_LINKS.map(function (l) {
                return '<a href="' + l.href + '">' + l.label + '</a>';
              }).join('<span class="foot-star">★</span>') +
            '</nav>' +
            '<p class="foot-credit">© SAT’S BLOG — website by ' +
              '<a href="https://whitemonkey.tech/" target="_blank" rel="noopener">whitemonkey*</a></p>' +
          '</footer>' +
        '</div>' +
        '<aside class="rail" id="rail-right">' + ADS_RIGHT.join('') + '</aside>' +
      '</div>' +
      '<button id="cart-fab" title="Panier">🛒<span class="count">0</span></button>' +
      '<div id="cart-drawer"><div class="xp-window">' +
        '<div class="xp-titlebar"><span class="xp-ico">🛒</span>' +
          '<span class="xp-title">Mon panier - satine_shop.exe</span>' +
          '<span class="xp-btns"><span class="xp-close" id="cart-close">✕</span></span></div>' +
        '<div class="xp-body" id="cart-body"></div>' +
        '<div class="cart-actions">' +
          '<div class="cart-total" id="cart-total"></div>' +
          '<button class="btn-red" id="cart-checkout">COMMANDER ♡</button>' +
          '<p class="note">checkout Shopify branché en phase 2 : pour l’instant c’est du décor !</p>' +
        '</div>' +
      '</div></div>' +
      '<div id="clippy">' +
        '<div class="bubble" id="clippy-bubble" hidden>' +
          '<span class="close-clippy" id="clippy-close">✕</span>' +
          '<span id="clippy-text"></span></div>' +
        '<img src="assets/img/clippy-tv.webp" alt="Assistant TV de Satine" id="clippy-img">' +
      '</div>' +
      '<div id="modal-overlay" hidden><div class="xp-window product-modal">' +
        '<div class="xp-titlebar"><span class="xp-ico">🛍️</span>' +
          '<span class="xp-title" id="modal-title"></span>' +
          '<span class="xp-btns"><span class="xp-close" id="modal-close">✕</span></span></div>' +
        '<div class="xp-body">' +
          '<div id="modal-visual"></div>' +
          '<h3 id="modal-name"></h3>' +
          '<p id="modal-desc"></p>' +
          '<div class="modal-buy-row">' +
            '<div class="qty-row">' +
              '<button id="qty-minus" title="Moins">−</button>' +
              '<input id="modal-qty" type="number" min="1" value="1">' +
              '<button id="qty-plus" title="Plus">+</button>' +
            '</div>' +
            '<span class="price-burst modal-burst"><b id="modal-price"></b></span>' +
            '<button class="btn-red" id="modal-add">AJOUTER AU PANIER ♡</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';

    document.body.insertAdjacentHTML('afterbegin', chrome);
    document.getElementById('main-col').appendChild(pageMain);
  }

  /* ------------------------------------------------------------ clippy */

  function initClippy() {
    var bubble = document.getElementById('clippy-bubble');
    var text = document.getElementById('clippy-text');
    var img = document.getElementById('clippy-img');
    var i = -1;

    var box = document.getElementById('clippy');
    var typer = null;
    var blip = null;

    function stopTyping() {
      if (typer) { clearInterval(typer); typer = null; }
      if (blip) blip.pause();
    }

    /* écriture façon Undertale : lettre par lettre + son de frappe */
    function say() {
      i = (i + 1) % CLIPPY_MSGS.length;
      var msg = '* ' + CLIPPY_MSGS[i].t;
      /* message cliquable : la bulle devient un lien le temps de l'afficher */
      bubble.classList.toggle('linky', !!CLIPPY_MSGS[i].goto);
      bubble.hidden = false;
      stopTyping();

      if (!blip) {
        blip = new Audio('assets/audio/text_sound_effect.mp3');
        blip.volume = 0.55;
      }
      blip.currentTime = 0;
      blip.play().catch(function () { /* avant le 1er geste : frappe muette */ });

      var pos = 0;
      text.textContent = '';
      typer = setInterval(function () {
        pos++;
        text.textContent = msg.slice(0, pos);
        if (pos >= msg.length) stopTyping();
      }, 34);
    }

    img.addEventListener('click', function () {
      say();
      /* petit pop de la télé à chaque clic */
      box.classList.remove('pop');
      void box.offsetWidth;
      box.classList.add('pop');
    });
    /* clic sur le texte d'un message `goto` : on suit l'ancre */
    bubble.addEventListener('click', function (e) {
      if (e.target.id === 'clippy-close') return;
      var dest = CLIPPY_MSGS[i] && CLIPPY_MSGS[i].goto;
      if (!dest) return;
      var el = document.querySelector(dest);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('clippy-close').addEventListener('click', function (e) {
      e.stopPropagation();
      stopTyping();
      bubble.hidden = true;
    });
    setTimeout(say, 2500);
  }

  /* ------------------------------------------------------------ panier */

  /* prix conformes à la maquette : 35€ côté barrettes, 10€ côté poster */
  var CATALOG = {
    barrettes: {
      name: 'Pack 3 barrettes',
      price: 35,
      desc: 'Trois barrettes éclair « >< » : une blanche au tracé rose, une bleue, une noire. ' +
        'Comme celle que je porte, mais pour TES cheveux.',
      visual: '<div class="product-visual has-img"><img src="assets/img/products/barretes.webp" alt="Pack de 3 barrettes"></div>'
    },
    poster: {
      name: 'Poster du dernier clip',
      price: 10,
      desc: 'L’artwork du clip anomalisa en grand format, pour remplacer ce vieux poster que tu ' +
        'n’assumes plus. Impression de qualité, mur non fourni.',
      visual: '<div class="product-visual has-img"><img src="assets/img/products/poster.webp" alt="Poster anomalisa"></div>'
    }
  };

  function getCart() {
    try { return JSON.parse(localStorage.getItem('satine_cart')) || {}; }
    catch (e) { return {}; }
  }
  function setCart(c) {
    localStorage.setItem('satine_cart', JSON.stringify(c));
    renderCart();
  }

  function renderCart() {
    var cart = getCart();
    var body = document.getElementById('cart-body');
    var totalEl = document.getElementById('cart-total');
    var count = 0, total = 0, html = '';

    Object.keys(cart).forEach(function (id) {
      var qty = cart[id];
      var p = CATALOG[id];
      if (!p || qty < 1) return;
      count += qty;
      total += qty * p.price;
      html += '<div class="cart-line"><span>' + p.name + '</span>' +
        '<span><button data-dec="' + id + '">−</button> ' + qty +
        ' <button data-inc="' + id + '">+</button> · ' + (qty * p.price) + '€</span></div>';
    });

    body.innerHTML = html || '<p style="text-align:center;color:#777;margin-top:30px">panier vide… 💔<br>va vite voir le merch !</p>';
    totalEl.textContent = 'Total : ' + total + '€';
    document.querySelector('#cart-fab .count').textContent = count;
  }

  window.SatineCart = {
    add: function (id, qty) {
      var cart = getCart();
      cart[id] = (cart[id] || 0) + (qty || 1);
      setCart(cart);
      document.getElementById('cart-drawer').classList.add('open');
    }
  };

  /* ------------------------------------------------------ modal produit */

  var modalProduct = null;

  window.SatineModal = {
    open: function (id) {
      var p = CATALOG[id];
      if (!p) return;
      modalProduct = id;
      document.getElementById('modal-title').textContent = p.name + ' - satine_shop.exe';
      document.getElementById('modal-visual').innerHTML = p.visual;
      document.getElementById('modal-name').textContent = p.name;
      document.getElementById('modal-desc').textContent = p.desc;
      document.getElementById('modal-qty').value = 1;
      updateModalPrice();
      document.getElementById('modal-overlay').hidden = false;
      document.body.style.overflow = 'hidden';
    },
    close: function () {
      document.getElementById('modal-overlay').hidden = true;
      document.body.style.overflow = '';
      modalProduct = null;
    }
  };

  function updateModalPrice() {
    var p = CATALOG[modalProduct];
    var qty = Math.max(1, parseInt(document.getElementById('modal-qty').value, 10) || 1);
    document.getElementById('modal-qty').value = qty;
    document.getElementById('modal-price').textContent = (p.price * qty) + '€';
  }

  function initModal() {
    document.getElementById('modal-close').addEventListener('click', SatineModal.close);
    document.getElementById('modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) SatineModal.close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') SatineModal.close();
    });
    document.getElementById('modal-qty').addEventListener('input', updateModalPrice);
    document.getElementById('qty-minus').addEventListener('click', function () {
      document.getElementById('modal-qty').value = Math.max(1, (parseInt(document.getElementById('modal-qty').value, 10) || 1) - 1);
      updateModalPrice();
    });
    document.getElementById('qty-plus').addEventListener('click', function () {
      document.getElementById('modal-qty').value = (parseInt(document.getElementById('modal-qty').value, 10) || 1) + 1;
      updateModalPrice();
    });
    document.getElementById('modal-add').addEventListener('click', function () {
      if (!modalProduct) return;
      SatineCart.add(modalProduct, parseInt(document.getElementById('modal-qty').value, 10) || 1);
      SatineModal.close();
    });
  }

  function initCart() {
    renderCart();
    document.getElementById('cart-fab').addEventListener('click', function () {
      document.getElementById('cart-drawer').classList.toggle('open');
    });
    document.getElementById('cart-close').addEventListener('click', function () {
      document.getElementById('cart-drawer').classList.remove('open');
    });
    /* liens Panier de la nav et du burger : même tiroir */
    document.getElementById('nav-cart').addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('cart-drawer').classList.toggle('open');
    });
    document.getElementById('burger-cart').addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('cart-drawer').classList.add('open');
      /* la fermeture du burger est gérée par initBurger (clic sur .burger-link) */
    });
    document.getElementById('cart-body').addEventListener('click', function (e) {
      var inc = e.target.getAttribute('data-inc');
      var dec = e.target.getAttribute('data-dec');
      if (!inc && !dec) return;
      var cart = getCart();
      var id = inc || dec;
      cart[id] = (cart[id] || 0) + (inc ? 1 : -1);
      if (cart[id] < 1) delete cart[id];
      setCart(cart);
    });
    document.getElementById('cart-checkout').addEventListener('click', function () {
      alert('Le paiement arrive avec l’intégration Shopify (phase 2), patience ♡');
    });
  }

  /* ---------------------------------------------------------- sparkles */

  function initSparkles() {
    var glyphs = ['✦', '✧', '⭐', '·', '♥'];
    var colors = ['#ff2ea6', '#ffe600', '#49ff6a', '#7ff', '#fff'];
    var last = 0;
    /* pointermove filtré sur la souris : au doigt, un glissement sème des
       étoiles figées sous le pouce (les setTimeout de nettoyage sont gelés
       pendant le scroll iOS) — et une traînée de curseur n'a pas de sens
       sans curseur. */
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var now = Date.now();
      if (now - last < 70) return;
      last = now;
      var s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      s.style.color = colors[Math.floor(Math.random() * colors.length)];
      s.style.left = (e.clientX + (Math.random() * 14 - 7)) + 'px';
      s.style.top = (e.clientY + (Math.random() * 14 - 7)) + 'px';
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 850);
    });
  }

  /* ---------------------------------------------------------- scrollspy */

  function initScrollspy() {
    if (document.body.getAttribute('data-page') === 'secret') return;
    var links = document.querySelectorAll('#navbar a[data-section]');
    var sections = [];
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('data-section'));
      if (el) sections.push({ el: el, link: a });
    });
    if (!('IntersectionObserver' in window) || !sections.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('active'); });
        var hit = sections.find(function (s) { return s.el === entry.target; });
        if (hit) hit.link.classList.add('active');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sections.forEach(function (s) { obs.observe(s.el); });
  }

  /* ------------------------------------------------ apparition au scroll */

  /* Les blocs concernés portent `data-rv` dans index.html ; la classe
     `rv-ready` sur <html> (posée par le script inline du <head>) les cache
     avant le premier paint. Ici on se contente de poser .rv-in au passage
     dans le viewport. Si l'observer n'existe pas ou si l'utilisateur a demandé
     moins d'animations, on retire `rv-ready` : tout redevient visible. */
  function initReveal() {
    var root = document.documentElement;
    var items = document.querySelectorAll('[data-rv]');
    if (!items.length) { root.classList.remove('rv-ready'); return; }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduce) {
      root.classList.remove('rv-ready');
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    function show(el) {
      el.classList.add('rv-in');
      obs.unobserve(el); /* une seule fois : pas de disparition au retour */
    }

    function start() {
      /* décalage en cascade entre voisins d'un même parent (identité du profil,
         grilles de fan-arts, de pubs…) : les blocs isolés démarrent tous à 0 */
      var lastParent = null, rank = 0;
      Array.prototype.forEach.call(items, function (el) {
        if (el.parentNode !== lastParent) { lastParent = el.parentNode; rank = 0; }
        var step = Math.min(rank, 8) * 45;
        rank++;
        if (step) el.style.transitionDelay = step + 'ms';
        obs.observe(el);
      });

      /* cascade INTERNE : un conteneur [data-rv-each="sel"] déroule ses
         éléments un à un quand il entre dans le viewport (réseaux sociaux,
         lignes des tableaux tournée/interests, friends). Les éléments sont
         marqués .rv-it et reçoivent chacun leur délai ; le CSS les révèle
         quand le conteneur gagne .rv-in. */
      Array.prototype.forEach.call(document.querySelectorAll('[data-rv-each]'), function (c) {
        var kids = c.querySelectorAll(c.getAttribute('data-rv-each'));
        Array.prototype.forEach.call(kids, function (it, j) {
          it.classList.add('rv-it');
          it.style.transitionDelay = (120 + j * 90) + 'ms';
        });
        if (!c.hasAttribute('data-rv')) obs.observe(c); /* sinon déjà observé */
      });

      /* Filet de sécurité. Un document masqué (onglet ouvert en arrière-plan)
         ne fait pas tourner l'IntersectionObserver : sans ça la page resterait
         entièrement invisible jusqu'au premier rendu. Au bout d'une seconde on
         découvre donc à la main tout ce qui est déjà dans le viewport. */
      setTimeout(function () {
        Array.prototype.forEach.call(items, function (el) {
          if (el.classList.contains('rv-in')) return;
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) show(el);
        });
      }, 1000);
    }

    /* Au retour de la porte d'entrée, la bouche couvre encore tout l'écran :
       démarrer maintenant jouerait l'apparition du haut de page (pfp, réseaux,
       fenêtre merch) derrière les dents, pour rien. js/intro.js émet
       `satine:reveal-ready` quand la gueule s'ouvre. */
    if (root.classList.contains('intro-reveal')) {
      var fired = false;
      var go = function () { if (!fired) { fired = true; start(); } };
      document.addEventListener('satine:reveal-ready', go);
      setTimeout(go, 3000); /* filet si l'événement n'arrive jamais */
    } else {
      start();
    }
  }

  /* -------------------------------------------- easter egg : boss kappa */

  /* Deux clics d'affilée (moins de 600 ms d'écart) sur la vignette KAPPA du
     friends space : la vidéo kappa-boss (fond transparent, alpha natif)
     surgit du haut de l'écran, se joue en entier, puis repart en slide-out.
     Deux encodages du même kappa.mov (ProRes 4444) : HEVC+alpha (hvc1) que
     seul WebKit lit, WebM VP9+alpha pour Chrome/Firefox. Le choix se fait
     par sniff UA : canPlayType ne dit jamais si l'alpha sera rendu (Chrome
     décode le HEVC mais l'affiche sur fond noir). iOS Chrome/Firefox sont
     du WebKit déguisé (CriOS/FxiOS, pas « chrome ») → mp4, correct. */
  function initKappaBoss() {
    var card = null;
    document.querySelectorAll('.friend').forEach(function (f) {
      var img = f.querySelector('img');
      if (img && /kappa/i.test(img.getAttribute('src') || '')) card = f;
    });
    if (!card) return;

    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var src = isSafari ? 'assets/img/friends/kappa-boss.mp4'
                       : 'assets/img/friends/kappa-boss.webm';

    var lastClick = 0;
    var active = false;

    card.addEventListener('click', function () {
      var now = Date.now();
      var dbl = now - lastClick < 600;
      lastClick = now;
      if (!dbl || active) return;
      active = true;

      var boss = document.createElement('video');
      boss.id = 'kappa-boss';
      boss.muted = true;
      boss.setAttribute('playsinline', '');
      boss.preload = 'auto';
      boss.src = src;

      function done() {
        boss.classList.add('out');
        setTimeout(function () { boss.remove(); active = false; }, 500);
      }

      function show() {
        if (boss.parentNode) return; /* les événements peuvent refirer */
        document.body.appendChild(boss); /* le slide-in CSS part d'ici */
        /* slide-out à la fin de la vidéo (filet : durée + 2 s) */
        var ms = (isFinite(boss.duration) && boss.duration ? boss.duration + 2 : 12) * 1000;
        var fallback = setTimeout(done, ms);
        boss.addEventListener('ended', function () {
          clearTimeout(fallback);
          done();
        }, { once: true });
      }

      /* on n'attache qu'une fois que des frames sortent vraiment : le
         slide-in ne démarre jamais sur une vidéo encore vide */
      boss.addEventListener('playing', show);
      boss.addEventListener('error', function () { active = false; });
      /* play() DANS la pile du geste utilisateur : iOS (surtout en mode
         économie d'énergie) peut refuser un play() différé, et ne charge
         rien avant — c'est aussi ce qui remplace l'attente de canplay,
         qu'iOS n'émet pas toujours pour une vidéo détachée */
      boss.load();
      boss.play().catch(function () {
        /* lecture refusée (très vieux iOS ?) : on montre quand même la
           vidéo dès qu'elle a des données, image fixe plutôt que rien */
        boss.addEventListener('loadeddata', show, { once: true });
      });
    });
  }

  /* ---------------------------- easter eggs vidéo : chroma-key sur canvas */

  /* Double clic sur une vignette du friends space : la vidéo au fond vert est
     incrustée en direct sur un canvas plein écran (chroma-key pixel par
     pixel) — seule approche de transparence vidéo qui marche partout, Safari
     ne lisant pas l'alpha des WebM. Muet, plein viewport, retrait à la fin de
     la vidéo. crossOrigin pour que getImageData reste licite derrière le CDN
     Shopify (il envoie les en-têtes CORS). */
  function initChromaEgg(matcher, src, id) {
    var card = null;
    document.querySelectorAll('.friend').forEach(function (f) {
      var img = f.querySelector('img');
      if (img && matcher.test(img.getAttribute('src') || '')) card = f;
    });
    if (!card) return;

    var lastClick = 0;
    var active = false;

    card.addEventListener('click', function () {
      var now = Date.now();
      var dbl = now - lastClick < 600;
      lastClick = now;
      if (!dbl || active) return;
      active = true;

      var video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = src;
      video.playsInline = true;
      video.muted = true;
      video.preload = 'auto';
      video.load(); /* certains navigateurs ne chargent pas un <video> détaché sans ça */

      var canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.className = 'chroma-egg';
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      var raf = 0;

      function cleanup() {
        cancelAnimationFrame(raf);
        video.pause();
        canvas.remove();
        active = false;
      }

      function draw() {
        if (video.ended) { cleanup(); return; }
        if (video.readyState >= 2) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx.drawImage(video, 0, 0);
          var fr = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var d = fr.data;
          /* Chroma-key en trois zones, sur le ratio vert/max(r,b) :
             > 1.38 : fond franc → transparent ;
             1.10-1.38 : frange de bord → alpha progressif + despill (le vert
                         est ramené à max(r,b), ce qui tue le liseré) ;
             < 1.10 : pixel gardé tel quel — les cheveux TURQUOISE de Miku
                      (vert ≈ bleu, ratio ~1.0-1.08) restent sous ce seuil,
                      ne pas le baisser davantage. */
          /* Critère d'entrée en DIFFÉRENCE absolue (g − max(r,b) > 8) et non
             en luminosité : un plancher `g > 60` laissait passer le spill
             SOMBRE (vert foncé des bords de bras, ratio fort mais g faible).
             La différence de 8 protège quand même le bruit des pixels quasi
             noirs, donc les contours sombres de Freddy. */
          for (var i = 0; i < d.length; i += 4) {
            var r = d[i], g = d[i + 1], b = d[i + 2];
            var mx = r > b ? r : b;
            var diff = g - mx;
            if (diff > 8 && g * 10 > mx * 11) { /* ratio > 1.10 */
              if (diff > 15 && g * 50 > mx * 69) { /* ratio > 1.38 : fond */
                d[i + 3] = 0;
              } else {
                var t = (g / (mx || 1) - 1.10) / 0.28;
                d[i + 3] = (255 * (1 - (t > 1 ? 1 : t))) | 0;
                d[i + 1] = mx;
              }
            }
          }
          ctx.putImageData(fr, 0, 0);
        }
        raf = requestAnimationFrame(draw);
      }

      video.addEventListener('canplay', function () {
        if (!active) return;
        document.body.appendChild(canvas);
        video.play().catch(cleanup);
        draw();
      }, { once: true });
      video.addEventListener('error', cleanup);
      /* filet calé sur la durée réelle de la vidéo (30 s si inconnue) */
      video.addEventListener('loadedmetadata', function () {
        var ms = (isFinite(video.duration) ? video.duration + 2 : 30) * 1000;
        setTimeout(function () { if (active) cleanup(); }, ms);
      }, { once: true });
    });
  }

  function initVideoEggs() {
    initChromaEgg(/freddy/i, 'assets/img/friends/freddy-scream.mp4', 'freddy-scream');
    initChromaEgg(/miku/i, 'assets/img/friends/miku-dance.mp4', 'miku-dance');
  }

  /* ------------------------------------------------------- lightbox fan-arts */

  /* Clic sur une tuile de #art-grid → grand format en overlay. Pour une
     vidéo, on recrée un <video> NON muet : le clic utilisateur autorise la
     lecture audible (la vignette de la grille, elle, reste muted). */
  function initArtLightbox() {
    var grid = document.getElementById('art-grid');
    if (!grid) return;

    function close() {
      var lb = document.getElementById('art-lightbox');
      if (!lb) return;
      var v = lb.querySelector('video');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      lb.remove();
      document.body.style.overflow = '';
    }

    function open(piece) {
      close();
      var lb = document.createElement('div');
      lb.id = 'art-lightbox';
      var box = document.createElement('div');
      box.className = 'lb-box';

      var srcVideo = piece.querySelector('video');
      var srcImg = piece.querySelector('.ph img');
      if (srcVideo) {
        var v = document.createElement('video');
        v.src = srcVideo.currentSrc || srcVideo.src;
        if (srcVideo.poster) v.poster = srcVideo.poster;
        v.autoplay = true;
        v.loop = true;
        v.controls = true;
        v.setAttribute('playsinline', '');
        v.muted = false;
        v.volume = 1;
        box.appendChild(v);
      } else if (srcImg) {
        var im = document.createElement('img');
        im.src = srcImg.src;
        im.alt = srcImg.alt || '';
        im.className = srcImg.className; /* garde .px (pixel-art) */
        box.appendChild(im);
      } else {
        var phSrc = piece.querySelector('.ph');
        var ph = document.createElement('div');
        ph.className = 'lb-ph';
        ph.textContent = phSrc ? phSrc.textContent.trim() : '';
        box.appendChild(ph);
      }

      var cap = piece.querySelector('.cap');
      if (cap) {
        var c = document.createElement('p');
        c.className = 'lb-cap';
        c.innerHTML = cap.innerHTML;
        box.appendChild(c);
      }

      var x = document.createElement('button');
      x.className = 'lb-close';
      x.type = 'button';
      x.setAttribute('aria-label', 'Fermer');
      x.textContent = '✕';
      x.addEventListener('click', close);
      box.appendChild(x);

      lb.appendChild(box);
      lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
      document.body.appendChild(lb);
      document.body.style.overflow = 'hidden';
    }

    grid.addEventListener('click', function (e) {
      if (e.target.closest('a')) return; /* liens (crédits) intacts */
      var piece = e.target.closest('.art-piece');
      if (piece) open(piece);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ------------------------------------------------------- burger menu */

  function initBurger() {
    var menu = document.getElementById('burger-menu');
    function close() { menu.hidden = true; document.body.style.overflow = ''; }
    document.getElementById('burger').addEventListener('click', function () {
      menu.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    document.getElementById('burger-close').addEventListener('click', close);
    menu.addEventListener('click', function (e) {
      /* clic sur le fond ou sur un lien : on referme */
      if (e.target === menu || e.target.classList.contains('burger-link')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* appliqué avant le DOMContentLoaded pour éviter un flash à 1400px */
  applyZoom();
  window.addEventListener('resize', applyZoom);

  document.addEventListener('DOMContentLoaded', function () {
    build();
    initClippy();
    initCart();
    initModal();
    initScrollspy();
    initBurger();
    initReveal();
    initKappaBoss();
    initVideoEggs();
    initArtLightbox();
    /* prefers-reduced-motion : les vidéos décoratives ne tournent pas */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('video[autoplay]').forEach(function (v) {
        v.removeAttribute('autoplay');
        v.pause();
      });
    }
    initSparkles();
    document.dispatchEvent(new CustomEvent('satine:ready'));
  });
})();
