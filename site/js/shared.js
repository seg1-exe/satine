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

  var CLIPPY_MSGS = [
    'Salut !! On dirait que tu visites le site de SATINE. Besoin d’aide ?',
    'Psst… il paraît qu’un code est caché dans les pubs. Juste un bruit de couloir hein.',
    'Le pack de barrettes part super vite. Je dis ça, je dis rien.',
    'SATINE part en tournée avec The Living Tombstone !! US + EU !!',
    'Tu as vu le nouveau clip ? Onglet Vidéos. Fonce.',
    'Astuce : la barre de recherche en haut ne cherche qu’une seule chose…',
    'bzzzt… 📺… bzzzt… pardon, mauvaise réception.'
  ];

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

    var chrome =
      '<div id="layout">' +
        '<aside class="rail" id="rail-left">' + ADS_LEFT.join('') + '</aside>' +
        '<div id="center-col">' +
          '<header id="topbar">' +
            '<a class="logo" href="index.html">' +
              '<span class="my"><span>my</span><span>space</span></span>' +
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
          '<button class="btn-buy" id="cart-checkout">COMMANDER ♡</button>' +
          '<p class="note">checkout Shopify branché en phase 2 : pour l’instant c’est du décor !</p>' +
        '</div>' +
      '</div></div>' +
      '<div id="clippy">' +
        '<div class="bubble" id="clippy-bubble" hidden>' +
          '<span class="close-clippy" id="clippy-close">✕</span>' +
          '<span id="clippy-text"></span></div>' +
        '<img src="assets/img/clippy-tv.png" alt="Assistant TV de Satine" id="clippy-img">' +
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

    function say() {
      i = (i + 1) % CLIPPY_MSGS.length;
      text.textContent = CLIPPY_MSGS[i];
      bubble.hidden = false;
    }
    img.addEventListener('click', function () {
      say();
      /* petit pop de la télé à chaque clic */
      box.classList.remove('pop');
      void box.offsetWidth;
      box.classList.add('pop');
    });
    document.getElementById('clippy-close').addEventListener('click', function (e) {
      e.stopPropagation();
      bubble.hidden = true;
    });
    setTimeout(say, 2500);
  }

  /* ------------------------------------------------------------ panier */

  /* prix conformes à la maquette : 35€ côté barrettes, 10€ côté poster */
  var CATALOG = {
    barrettes: {
      name: 'Pack 3 barrettes “!!”',
      price: 35,
      desc: 'Trois barrettes point d’exclamation : une blanche, une noire, une rouge énervée. ' +
        'Comme celle que je porte, mais pour TES cheveux.',
      visual: '<div class="product-visual has-img"><img src="assets/img/barretes.webp" alt="Pack de 3 barrettes"></div>'
    },
    poster: {
      name: 'Poster du dernier clip',
      price: 10,
      desc: 'L’artwork du clip anomalisa en grand format, pour remplacer ce vieux poster que tu ' +
        'n’assumes plus. Impression de qualité, mur non fourni.',
      visual: '<div class="product-visual has-img"><img src="assets/img/poster.webp" alt="Poster anomalisa"></div>'
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
    document.addEventListener('mousemove', function (e) {
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

  document.addEventListener('DOMContentLoaded', function () {
    build();
    initClippy();
    initCart();
    initModal();
    initScrollspy();
    initBurger();
    initSparkles();
    document.dispatchEvent(new CustomEvent('satine:ready'));
  });
})();
