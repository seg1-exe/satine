/* ==========================================================================
   SATINE — porte d'entrée + révélation « bouche »
   Un seul fichier pour les deux moitiés de l'effet :
     · intro.html : ciel étoilé, avalanche d'erreurs Windows, la bouche se
       ferme, puis on part sur index.html PENDANT que l'écran est couvert ;
     · index.html : la page se charge bouche fermée (classe .intro-reveal
       posée par le script inline du <head>), puis la bouche s'ouvre sur le
       site. La navigation est invisible : elle a lieu écran noir.
   ========================================================================== */

(function () {
  'use strict';

  /* Pas de drapeau « déjà entré » : la porte se rejoue à chaque arrivée sur
     le site, refresh compris (c'est index.html qui décide, voir son <head>).
     Ce jeton-ci ne sert qu'à dire à index.html de s'ouvrir en fondu de bouche
     plutôt que de renvoyer sur la porte. */
  var KEY_REVEAL = 'satine-reveal';

  /* URL du site, à changer d'un seul endroit lors du passage en thème Shopify
     (la home devient '/' et cette page devient '/pages/entrer'). */
  var HOME_URL = 'index.html';

  var CLOSE_MS = 780;  /* doit rester synchro avec #jaws.chomp dans intro.css */
  var OPEN_MS = 1050;  /* idem avec #jaws.gape */

  function store() {
    try { return window.sessionStorage; } catch (e) { return null; }
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------------------------------------------------------- mâchoires */

  function buildJaws(shut) {
    var el = document.createElement('div');
    el.id = 'jaws';
    /* shut-veil : index.html démarre bouche fermée ET voile opaque, pour
       prendre le relais du noir posé par le <head> sans découvrir l'écran */
    if (shut) el.className = 'shut shut-veil';
    el.innerHTML =
      '<div class="veil"></div>' +
      '<img class="jaw jaw-top" src="assets/img/anim-intro-top.webp" alt="">' +
      '<img class="jaw jaw-bot" src="assets/img/anim-intro-bottom.webp" alt="">';
    document.body.appendChild(el);
    return el;
  }

  /* attend que les deux PNG soient décodés, sans jamais bloquer plus de ms */
  function whenJawsReady(jaws, ms, done) {
    var imgs = jaws.querySelectorAll('img');
    var left = imgs.length;
    var fired = false;
    function fire() { if (!fired) { fired = true; done(); } }
    function tick() { if (--left <= 0) fire(); }
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.complete) { tick(); return; }
      img.addEventListener('load', tick);
      img.addEventListener('error', tick);
    });
    setTimeout(fire, ms);
  }

  /* ------------------------------------------------------- ciel étoilé */

  function initStars(canvas) {
    var ctx = canvas.getContext('2d');
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* palette relevée sur la référence : blanc, cyan, violet, bleu */
    var COLORS = ['255,255,255', '130,240,235', '170,150,255', '120,180,255', '255,190,235'];

    function seed() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.round(w * h / 5200);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() < .08 ? 2.2 + Math.random() * 2.6 : .6 + Math.random() * 1.3,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          ph: Math.random() * Math.PI * 2,
          sp: .6 + Math.random() * 1.9
        });
      }
    }

    /* les grosses étoiles sont dessinées en croix à 4 branches, comme la réf */
    function sparkle(s, a) {
      var arm = s.r * 3.4;
      var g = ctx.createLinearGradient(s.x - arm, s.y, s.x + arm, s.y);
      g.addColorStop(0, 'rgba(' + s.c + ',0)');
      g.addColorStop(.5, 'rgba(' + s.c + ',' + a + ')');
      g.addColorStop(1, 'rgba(' + s.c + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(s.x - arm, s.y - s.r * .28, arm * 2, s.r * .56);
      g = ctx.createLinearGradient(s.x, s.y - arm, s.x, s.y + arm);
      g.addColorStop(0, 'rgba(' + s.c + ',0)');
      g.addColorStop(.5, 'rgba(' + s.c + ',' + a + ')');
      g.addColorStop(1, 'rgba(' + s.c + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(s.x - s.r * .28, s.y - arm, s.r * .56, arm * 2);
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = .32 + .68 * Math.abs(Math.sin(t / 1000 * s.sp + s.ph));
        ctx.fillStyle = 'rgba(' + s.c + ',' + a + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 2) sparkle(s, a * .8);
      }
    }

    seed();
    if (reducedMotion()) { draw(0); }
    else {
      (function loop(t) { draw(t); requestAnimationFrame(loop); })(0);
    }
    window.addEventListener('resize', function () { seed(); if (reducedMotion()) draw(0); });
  }

  /* --------------------------------------------------- pop-ups d'erreur */

  /* Placeholders : à remplacer par de vrais visuels/sons d'erreur si les
     graphistes en fournissent. Le son réutilise le blip de Clippy. */
  var ERRORS = [
    ['satine.exe', 'satine.exe a cessé de fonctionner.'],
    ['Erreur système', 'Mémoire insuffisante pour contenir autant de « !! ».'],
    ['C:\\SATINE', 'Impossible de localiser MSVCR71.dll'],
    ['Erreur 0x000SAT1NE', 'Une opération non conforme va être effectuée.'],
    ['Avertissement', 'Ce site n’est pas compatible avec votre réalité.'],
    ['barrettes.sys', 'Trop de barrettes détectées dans le système.'],
    ['Lecteur C:', 'Le lecteur C: fait un bruit vraiment bizarre.'],
    ['???', 'Quelque chose vous regarde depuis le haut de l’écran.'],
    ['Windows', 'Fermeture du programme en cours… ou pas.'],
    ['hyperpop.dll', 'Fréquence trop élevée pour ce périphérique.'],
    ['Sécurité', 'Un fichier « bouche.exe » demande l’accès à vos dents.'],
    ['Erreur fatale', 'Il est trop tard pour revenir en arrière.'],
    ['MSN Messenger', 'SATINE vient de se connecter.'],
    ['Disque', 'Espace disque insuffisant pour tant de paillettes.'],
    ['Erreur', 'Erreur.']
  ];
  var ICONS = ['⛔', '⚠️', '❌', '💾', '📀'];

  function makePopup(host, i) {
    var e = ERRORS[i % ERRORS.length];
    var w = window.innerWidth, h = window.innerHeight;
    var pw = Math.min(300, w * .88), ph = 150;
    var pop = document.createElement('div');
    pop.className = 'err-pop xp-window';
    pop.style.left = Math.round(Math.random() * Math.max(0, w - pw)) + 'px';
    pop.style.top = Math.round(Math.random() * Math.max(0, h - ph)) + 'px';
    pop.innerHTML =
      '<div class="xp-titlebar"><span class="xp-ico">' + ICONS[i % ICONS.length] + '</span>' +
        '<span class="xp-title">' + e[0] + '</span>' +
        '<span class="xp-btns"><span class="xp-close">✕</span></span></div>' +
      '<div class="xp-body">' +
        '<span class="err-ico">' + ICONS[(i + 2) % ICONS.length] + '</span>' +
        '<p>' + e[1] + '</p>' +
        '<button class="btn-buy err-ok">OK</button>' +
      '</div>';
    /* on peut cliquer OK / ✕ : ça n'arrête rien, il en revient toujours plus */
    pop.addEventListener('click', function (ev) {
      if (ev.target.classList.contains('err-ok') || ev.target.classList.contains('xp-close')) pop.remove();
    });
    host.appendChild(pop);
  }

  /* ------------------------------------------------------- page PORTE */

  function initGate() {
    var gate = document.getElementById('gate');
    var host = document.getElementById('popups');
    var jaws = buildJaws(false);
    var started = false;

    /* error.mp3 dure 5,25 s dont ~2,6 s de signal : il couvre toute
       l'avalanche d'un coup. On le joue donc UNE fois au clic plutôt qu'un
       blip par pop-up. Construit ici pour qu'il soit bufferisé avant le clic. */
    var alarm = null;
    try {
      alarm = new Audio('assets/audio/error.mp3');
      alarm.volume = .75;
      alarm.preload = 'auto';
    } catch (e) { alarm = null; }

    function goToSite() {
      var s = store();
      if (s) {
        try { s.setItem(KEY_REVEAL, '1'); }
        catch (e) { /* stockage refusé : on entre sans la révélation */ }
      }
      /* volontairement SANS l'ancre d'origine : franchir la porte doit
         toujours faire atterrir en haut de la home, pas sur #tournee */
      window.location.href = HOME_URL;
    }

    function enter() {
      if (started) return;
      started = true;

      /* respect de prefers-reduced-motion : ni avalanche ni mâchoires */
      if (reducedMotion()) {
        /* index.html ne renverra pas ici : le referer est interne */
        window.location.href = HOME_URL;
        return;
      }

      gate.classList.add('gone');
      /* le clic est un geste utilisateur : la lecture est autorisée */
      if (alarm) { try { alarm.play().catch(function () {}); } catch (e) {} }

      /* cadence qui s'emballe : 170ms au début, 35ms à la fin */
      var n = 34, i = 0;
      (function next() {
        makePopup(host, i);
        if (++i < n) setTimeout(next, 170 - (135 * i / n));
      })();

      /* la bouche se referme sur le carnage */
      setTimeout(function () {
        jaws.classList.add('chomp', 'shut');
        setTimeout(function () {
          document.body.classList.add('chomp-shake');
          goToSite();
        }, CLOSE_MS);
      }, 2250);
    }

    document.getElementById('enter-btn').addEventListener('click', enter);
    initStars(document.getElementById('stars'));
  }

  /* --------------------------------------------- index.html : ouverture */

  function initReveal() {
    /* double garde anti-« j'arrive sur la tournée » : le hash éventuel est
       retiré avant que le navigateur saute à l'ancre, et la restauration de
       scroll (F5, back) est neutralisée le temps de la révélation */
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    var jaws = buildJaws(true);
    whenJawsReady(jaws, 1500, function () {
      setTimeout(function () {
        /* le voile noir du <head> saute pile quand les mâchoires, encore
           jointes, couvrent seules la totalité de l'écran */
        document.documentElement.classList.remove('intro-reveal');
        jaws.classList.add('gape');
        jaws.classList.remove('shut', 'shut-veil');
        /* la gueule s'écarte : shared.js peut lancer l'apparition des blocs.
           Court délai pour que le haut de page ne se joue pas derrière les
           dents encore jointes. */
        setTimeout(function () {
          document.dispatchEvent(new CustomEvent('satine:reveal-ready'));
        }, 320);
        setTimeout(function () { jaws.remove(); }, OPEN_MS + 60);
      }, 260);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('gate')) initGate();
    else if (document.documentElement.classList.contains('intro-reveal')) initReveal();
  });
})();
