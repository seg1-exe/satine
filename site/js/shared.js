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
     RÉGIE PUBS — les rails de gauche et de droite.

     Règles du remplissage (fillRails, plus bas) :
     · les rails descendent JUSQU'EN BAS de la page, sans trou ;
     · dans une même colonne, une pub n'apparaît qu'UNE fois — la seule
       exception est l'énigme du code secret, qu'on veut voir passer
       souvent (REPEAT_TOTAL occurrences réparties sur les deux rails) ;
     · deux voisines ne sont jamais la même image.
     La même pub peut en revanche se retrouver une fois à gauche ET une
     fois à droite : les colonnes se tirent indépendamment.

     Livrer les visuels en ×3 (~660px de large), hauteur libre.
     ------------------------------------------------------------------ */
  /* les rails partent vides : leur contenu dépend de la hauteur de la
     page, qu'on ne connaît qu'une fois le DOM en place */
  var ADS_LEFT = [];
  var ADS_RIGHT = [];

  /* PRIORITÉS : `pin: 'bottom'` épingle en bas d'un rail — une pub épinglée
     ne sert QUE via son épingle, elle ne repasse pas dans le tirage. (Le
     pendant `pin: 'top'` existe toujours dans le moteur, il n'est
     simplement plus utilisé.) Le reste se répartit au hasard.
     Liens : `href` (ancre — depuis secret.html on repasse par index.html,
     comme la nav) ou `modal` (fiche produit). paintsatine2 est l'énigme du
     code secret (César +1, lisible en bas de la fenêtre Paint), elle ne
     mène nulle part : c'est le jeu. */
  (function () {
    var prefix = document.body.getAttribute('data-page') === 'secret' ? 'index.html' : '';
    var ADS = [
      { img: 'assets/img/pubs/rendu360.webp', w: 480, h: 640, alt: 'La barrette SATINE sous toutes les coutures', modal: 'barrettes' },
      { img: 'assets/img/pubs/pub-satine.mp4', poster: 'assets/img/pubs/posters/poster-pub-satine.webp', w: 380, h: 1658, pin: 'bottom', alt: 'Publicité SATINE' },
      { img: 'assets/img/pubs/pub-tour.mp4', poster: 'assets/img/pubs/posters/poster-pub-tour.webp', w: 660, h: 990, alt: 'European Tour — voir les dates', href: prefix + '#tournee', title: 'Toutes les dates de la tournée' },
      { img: 'assets/img/pubs/satine5.mp4', poster: 'assets/img/pubs/posters/poster-satine5.webp', w: 560, h: 752, alt: 'SHOP ! Les barrettes SATINE, édition limitée — 25€', modal: 'barrettes' },
      { img: 'assets/img/pubs/satine-9.mp4', poster: 'assets/img/pubs/posters/poster-satine-9.webp', w: 660, h: 880, alt: 'Poster SATINE à vendre — 10€', modal: 'poster' },
      { img: 'assets/img/pubs/pubschats.mp4', poster: 'assets/img/pubs/posters/poster-pubschats.webp', w: 660, h: 496, alt: 'Les barrettes SATINE, approuvées par les chats — 25€', modal: 'barrettes' },
      { img: 'assets/img/pubs/satine2.mp4', poster: 'assets/img/pubs/posters/poster-satine2.webp', w: 660, h: 1496, alt: 'CALL NOW — SATINE limited edition, explore all items', href: prefix + '#merch', title: 'Voir le merch' },
      { img: 'assets/img/pubs/satine-10.mp4', poster: 'assets/img/pubs/posters/poster-satine-10.webp', w: 660, h: 1174, alt: 'ANOMALISA — les barrettes SATINE', modal: 'barrettes' },
      { img: 'assets/img/pubs/satine-3-2.mp4', poster: 'assets/img/pubs/posters/poster-satine-3-2.webp', w: 660, h: 1174, alt: 'satine — press PLAY', href: prefix + '#clip', title: 'Voir le clip' },
      { img: 'assets/img/pubs/satine-windows.mp4', poster: 'assets/img/pubs/posters/poster-satine-windows.webp', w: 660, h: 772, alt: 'Poster SATINE — 10€', modal: 'poster' },
      { img: 'assets/img/pubs/paintsatine2.mp4', poster: 'assets/img/pubs/posters/poster-paintsatine2.webp', w: 660, h: 984, alt: 'MF NPU EF QBTTF FTU: EFLPOOFDUF' }
    ];

    /* l'énigme : seule pub autorisée à se répéter dans une colonne — et
       jamais à la même hauteur que sa jumelle d'en face (deux fenêtres Paint
       côte à côte, ça sent le copier-coller au lieu de la régie) */
    var REPEAT_SRC = 'paintsatine2';
    var REPEAT_TOTAL = 3;

    function isRepeat(a) { return a.img.indexOf(REPEAT_SRC) !== -1; }

    function adHtml(a) {
      /* les pubs animées sont des <video> h264 : les webp animés
         glitchaient sous le zoom fractionnaire de la page (rastérisation
         Chromium), la vidéo est composée par le GPU et reste nette */
      /* width/height : réserve la place AVANT chargement — sans elles la
         page se tasse, l'IntersectionObserver croit tout visible et charge
         les vidéos du bas pour rien */
      var dims = a.w ? ' width="' + a.w + '" height="' + a.h + '"' : '';
      /* poster : première image du clip, ~15 Ko. Sans lui l'emplacement
         reste VIDE le temps que la vidéo arrive (preload="none" ne
         télécharge rien avant que l'observateur ne lance la lecture) —
         c'est ce trou, pas le débit, qui donnait l'impression que les pubs
         mettaient une éternité à charger. */
      /* Le chemin est écrit en toutes lettres dans ADS : le build Shopify
         aplatit les assets et ne réécrit que les chaînes littérales, un
         chemin recomposé à l'exécution ne serait pas traduit vers le CDN. */
      var poster = a.poster ? ' poster="' + a.poster + '"' : '';
      var img = /\.mp4$/.test(a.img)
        ? '<video src="' + a.img + '"' + dims + poster + ' muted loop ' +
          'playsinline preload="none" aria-label="' + a.alt + '"></video>'
        : '<img src="' + a.img + '"' + dims + ' alt="' + a.alt + '" loading="lazy" decoding="async">';
      var pin = a.pin ? ' data-pin="' + a.pin + '"' : '';
      if (a.href) {
        return '<div class="ad ad-live"' + pin + '><a href="' + a.href + '" title="' + (a.title || a.alt) + '">' + img + '</a></div>';
      }
      if (a.modal) {
        return '<div class="ad ad-live"' + pin + '><a href="#" onclick="SatineModal.open(\'' + a.modal + '\');return false" title="Voir le produit">' + img + '</a></div>';
      }
      return '<div class="ad ad-live"' + pin + '>' + img + '</div>';
    }

    function shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = (Math.random() * (i + 1)) | 0;
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }

    /* hauteur qu'occupera la pub dans une colonne large de `w` px */
    function adH(a, w) { return a.w ? w * a.h / a.w : 200; }

    /* --- Remplissage d'UNE colonne. On empile jusqu'à couvrir toute la
       hauteur : le dernier visuel dépasse volontairement, et `.rail`
       (overflow: hidden) le rogne — c'est ce dépassement qui garantit
       qu'aucune bande de fond ne reste visible en bas. --- */
    /* [y0, y1] croise-t-il l'un des intervalles interdits ? */
    function overlaps(y0, y1, banned) {
      for (var i = 0; i < banned.length; i++) {
        if (y0 < banned[i][1] && y1 > banned[i][0]) return true;
      }
      return false;
    }

    /* --- Une colonne se REMPLIT, elle ne se refait jamais. Chaque appel
       ne fait qu'ajouter ce qui manque en bas : les pubs déjà posées ne
       bougent plus et leurs <video> ne sont pas recréées. C'est ce qui
       évite le clignotement du début — la hauteur de la page change
       plusieurs fois pendant le chargement (polices, photos du blog,
       déverrouillage), et reconstruire à chaque fois donnait un premier
       tirage aussitôt remplacé par un autre. --- */
    function extend(col, avail, banned) {
      var repeat = null;
      ADS.forEach(function (a) { if (isRepeat(a)) repeat = a; });

      var reserve = col.bottom ? adH(col.bottom, col.w) + col.gap : 0;
      var added = [];

      /* +12 : la hauteur prévue par adH() est un calcul flottant que le
         rendu arrondit, et quelques pixels de fond réapparaissaient */
      while (col.used + reserve < avail + 12) {
        var prev = col.seq.length ? col.seq[col.seq.length - 1] : null;
        var canRepeat = repeat && col.quota > 0 && !(prev && isRepeat(prev)) &&
          !overlaps(col.used, col.used + adH(repeat, col.w), banned);

        if (!col.pool.length) {
          /* Stock épuisé. Sur une page longue (la page secrète dépliée fait
             plus du double de l'accueil) les visuels disponibles ne couvrent
             pas la hauteur : une colonne sans répétition plafonne vers
             4100px. Plutôt que de laisser une bande de fond nu, on repart
             pour un tour — en écartant les trois dernières posées, pour
             qu'une pub ne réapparaisse jamais dans le même coup d'œil. */
          var recent = col.seq.slice(-3).map(function (a) { return a.img; });
          col.pool = shuffle(ADS.filter(function (a) {
            return !isRepeat(a) && a.pin !== 'bottom' && a !== col.top &&
                   recent.indexOf(a.img) === -1;
          }));
        }

        /* L'énigme revient une pub sur deux tant qu'il reste du quota. Si la
           place restante ne suffit plus à caser ce qu'il doit encore passer —
           la règle du face-à-face lui fait sauter des tours — on cesse
           d'attendre son rang et on la pose au premier créneau libre. */
        var presse = canRepeat &&
          (avail - col.used) < col.quota * (adH(repeat, col.w) + col.gap) * 3;
        var pick = (canRepeat && (col.seq.length % 2 === 1 || presse || !col.pool.length))
          ? repeat : col.pool.shift();
        if (!pick) {
          if (!canRepeat) break;
          pick = repeat;
        }
        if (isRepeat(pick)) col.quota--;
        col.seq.push(pick);
        col.used += adH(pick, col.w) + col.gap;
        added.push(pick);
      }
      return added;
    }

    /* hauteurs occupées par l'énigme dans une colonne */
    function spotsOf(col) {
      var y = 0, out = [];
      for (var i = 0; i < col.seq.length; i++) {
        var h = adH(col.seq[i], col.w);
        if (isRepeat(col.seq[i])) out.push([y, y + h]);
        y += h + col.gap;
      }
      return out;
    }

    function newColumn(rail, top, bottom, quota, seen) {
      var cs = getComputedStyle(rail);
      var col = {
        rail: rail,
        top: top,
        bottom: bottom,
        quota: quota,
        seq: [],
        used: 0,
        gap: parseFloat(cs.rowGap || cs.gap) || 0,
        w: rail.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        padding: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      };
      var fresh = [], again = [];
      ADS.forEach(function (a) {
        if (isRepeat(a)) return;
        /* une épinglée sert d'abord son épingle, mais rien n'interdit
           qu'elle repasse UNE fois dans l'autre colonne — sauf celle du bas,
           trop haute pour tenir ailleurs sans tout déséquilibrer */
        if (a.pin === 'bottom' || a === top) return;
        (seen.indexOf(a.img) === -1 ? fresh : again).push(a);
      });
      /* ce que l'autre colonne n'a pas encore montré passe devant : sur les
         deux rails réunis, chaque pub sort au moins une fois */
      col.pool = shuffle(fresh).concat(shuffle(again));
      if (top) { col.seq.push(top); col.used += adH(top, col.w) + col.gap; }
      return col;
    }

    /* les nouvelles pubs s'insèrent AVANT l'épinglée du bas, qui reste
       dernière — et sans toucher au HTML déjà en place */
    function render(col, added) {
      if (!added.length) return;
      var html = added.map(adHtml).join('');
      var anchor = col.rail.querySelector('.ad[data-pin="bottom"]');
      if (anchor) anchor.insertAdjacentHTML('beforebegin', html);
      else col.rail.insertAdjacentHTML('beforeend', html);
    }

    /* adH() prévoit les hauteurs en flottants, le rendu les arrondit :
       sur une quinzaine de blocs l'écart cumulé laissait quelques dizaines
       de pixels de fond en bas. On recale donc le compteur de la colonne sur
       ce que le DOM affiche vraiment avant de décider s'il reste à combler. */
    function recale(col) {
      var reel = 0, k = col.rail.children;
      for (var i = 0; i < k.length; i++) {
        var m = k[i].querySelector('img, video');
        reel += (m || k[i]).offsetHeight + col.gap;
      }
      if (col.bottom) reel -= adH(col.bottom, col.w) + col.gap;
      col.used = reel;
    }

    var cols = null;
    var lastTarget = 0;
    var watching = false;

    /* Se brancher sur la colonne centrale dès qu'elle existe. À poser ici et
       pas sur DOMContentLoaded : le chrome (#layout, #center-col) est injecté
       par un écouteur DOMContentLoaded enregistré APRÈS celui-ci, donc au
       premier passage la colonne n'existe pas encore. */
    function watchCenter(center) {
      if (watching || !('ResizeObserver' in window)) return;
      watching = true;
      var t = null;
      new ResizeObserver(function () {
        clearTimeout(t);
        t = setTimeout(fillRails, 250);
      }).observe(center);
    }

    function fillRails() {
      if (window.matchMedia('(max-width: 1100px)').matches) return;
      var rails = [document.getElementById('rail-left'), document.getElementById('rail-right')];
      var center = document.getElementById('center-col');
      if (!rails[0] || !rails[1] || !center) return;
      watchCenter(center);

      /* On mesure la COLONNE CENTRALE, jamais les rails : #layout est une
         grille `align-items: stretch`, donc un rail plein s'auto-allonge
         (son contenu pousse la grille, qui repousse le rail…) et la seconde
         colonne se retrouvait calibrée sur une page déjà agrandie par la
         première. Le `min-height: 100vh` de la grille fait le plancher. */
      var target = Math.max(center.offsetHeight, window.innerHeight);
      if (!(target > 0)) return;
      var neuf = false;
      rails.forEach(function (r) { r.style.height = target + 'px'; });
      /* la page a raccourci, ou n'a pas bougé : le trop-plein est rogné par
         l'overflow du rail, il n'y a rien à ajouter */
      if (cols && target <= lastTarget) return;
      lastTarget = target;

      if (!cols) {
        var top = null, bottom = null;
        ADS.forEach(function (a) {
          if (a.pin === 'top') top = a;
          if (a.pin === 'bottom') bottom = a;
        });
        /* l'épinglée du haut et celle du bas atterrissent chacune dans une
           colonne tirée au sort — pas forcément la même */
        var side = (Math.random() * 2) | 0;
        var seen = [];
        var half = Math.ceil(REPEAT_TOTAL / 2);
        cols = [];
        cols[side] = newColumn(rails[side], top, null, half, seen);
        cols[1 - side] = newColumn(rails[1 - side], null, bottom, REPEAT_TOTAL - half, seen);
        neuf = true;
        /* l'épinglée du bas est posée tout de suite : elle sert d'ancre, les
           ajouts suivants viendront s'insérer au-dessus d'elle */
        cols.forEach(function (c) {
          if (c.top) c.rail.insertAdjacentHTML('beforeend', adHtml(c.top));
          if (c.bottom) c.rail.insertAdjacentHTML('beforeend', adHtml(c.bottom));
        });
      }

      var first = cols[0], second = cols[1];
      /* chaque colonne évite les hauteurs où l'énigme est DÉJÀ posée en face.
         La contrainte joue dans les deux sens : les colonnes s'étendent tour
         à tour, et une pub posée ne peut plus reculer — si seule la seconde
         regardait la première, un ajout tardif à gauche pouvait retomber pile
         en face d'une énigme déjà à droite. */
      render(first, extend(first, target - first.padding, spotsOf(second)));

      /* Au tout premier passage, la seconde colonne apprend ce que la
         première vient de montrer et fait passer le reste devant : sur les
         deux rails réunis, chaque pub sort au moins une fois. Les deux pools
         étant tirés en même temps, sans cela ils s'ignoraient et une pub
         pouvait n'apparaître nulle part. */
      if (neuf) {
        var vues = first.seq.map(function (a) { return a.img; });
        var inedit = [], revu = [];
        second.pool.forEach(function (a) {
          (vues.indexOf(a.img) === -1 ? inedit : revu).push(a);
        });
        second.pool = shuffle(inedit).concat(shuffle(revu));
      }
      render(second, extend(second, target - second.padding, spotsOf(first)));

      /* Le quota d'énigmes qu'une colonne n'a pas pu placer — la règle du
         face-à-face lui a fait sauter des tours — bascule sur l'autre AVANT
         la seconde passe : après, il serait trop tard pour ce chargement. */
      if (first.quota > 0 && second.quota === 0) { second.quota = first.quota; first.quota = 0; }
      else if (second.quota > 0 && first.quota === 0) { first.quota = second.quota; second.quota = 0; }

      /* seconde passe, sur les hauteurs réellement rendues cette fois */
      [first, second].forEach(function (c) {
        recale(c);
        render(c, extend(c, target - c.padding, spotsOf(c === first ? second : first)));
      });

      if (window.SatineLazyVideos) window.SatineLazyVideos();
    }

    /* `satine:ready` est émis une fois le chrome construit — c'est le
       premier moment où les rails existent. Puis le load (polices et visuels
       chargés), et ensuite l'observateur suit la colonne centrale : elle
       grandit quand la page secrète se déverrouille, qu'un « voir plus » se
       déplie, ou simplement quand les photos du blog arrivent.
       Filet temporel en plus de l'observateur : un ResizeObserver est lié au
       cycle de rendu, donc il ne tire PAS dans un onglet resté en arrière-plan
       — la page secrète ouverte dans un second onglet gardait alors les rails
       calibrés sur la porte verrouillée. Ces rappels-là passent par des
       timers, qui tournent même sans peinture. Comme le remplissage ne fait
       qu'ajouter, ces passes sont invisibles quand il n'y a rien à ajouter. */
    document.addEventListener('satine:ready', function () {
      fillRails();
      [400, 1200, 3000, 6000].forEach(function (ms) { setTimeout(fillRails, ms); });
    });
    document.addEventListener('DOMContentLoaded', fillRails);
    window.addEventListener('load', fillRails);
    /* le déverrouillage de la page secrète double la hauteur d'un coup */
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#code-submit')) {
        [60, 300, 900, 2000].forEach(function (ms) { setTimeout(fillRails, ms); });
      }
    }, true);

    /* --- pubs intercalées (MOBILE : les rails n'existent pas, seuls ces
       emplacements du flux sont visibles — cachés en desktop). Moins de
       place, donc sélection dédiée : une éventuelle épinglée du haut ouvre
       le bal, paintsatine2 est TOUJOURS présente (elle porte l'énigme du
       code secret, c'est la clé du jeu), le reste complète au hasard.
       satine2 et pub-satine sont exclues : trop hautes. --- */
    function fillDuos() {
      var slots = document.querySelectorAll('.ad-slot.ad-inline');
      if (!slots.length) return;
      var eligible = ADS.filter(function (a) {
        /* le slash est indispensable : 'satine2.mp4' est aussi une
           sous-chaîne de 'paintsatine2.mp4', qui doit rester sur mobile */
        return a.img.indexOf('/satine2.mp4') === -1 && a.img.indexOf('pub-satine') === -1;
      });
      /* GARANTIES mobile — il n'y a que six places, un tirage malchanceux
         pouvait n'afficher que des ancres : on impose l'énigme (la clé du
         jeu), au moins une fiche poster et au moins une fiche barrettes.
         Le reste complète au hasard, les pubs en trop se reposent jusqu'à
         la prochaine visite. */
      function one(list) { return list.length ? shuffle(list.slice())[0] : null; }
      var must = [];
      [one(eligible.filter(isRepeat)),
       one(eligible.filter(function (a) { return a.modal === 'poster'; })),
       one(eligible.filter(function (a) { return a.modal === 'barrettes'; }))
      ].forEach(function (a) { if (a && must.indexOf(a) === -1) must.push(a); });

      var rest = shuffle(eligible.filter(function (a) { return must.indexOf(a) === -1; }));
      /* DEUX pubs par emplacement */
      var picks = shuffle(must).concat(rest).slice(0, slots.length * 2);
      slots.forEach(function (slot, i) {
        var pair = picks.slice(i * 2, i * 2 + 2);
        if (!pair.length) { slot.remove(); return; }
        var duo = document.createElement('div');
        duo.className = 'ad-duo ad-inline';
        duo.setAttribute('data-rv', '');
        /* pas de lazy ici : en attendant de charger, l'image ferait 0px de
           large (width:auto) et ne croiserait jamais le viewport */
        duo.innerHTML = pair.map(adHtml).join('').replace(/loading="lazy"/g, 'loading="eager"');
        slot.replaceWith(duo);
      });
      if (window.SatineLazyVideos) window.SatineLazyVideos();
    }

    /* on ne remplit les duos QUE si le viewport est mobile : en desktop ils
       sont cachés mais leurs images/vidéos se téléchargeraient quand même
       (display:none n'empêche pas le fetch) */
    document.addEventListener('DOMContentLoaded', function () {
      var mq = window.matchMedia('(max-width: 1100px)');
      if (mq.matches) { fillDuos(); return; }
      var onChange = function (e) {
        if (!e.matches) return;
        mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange);
        fillDuos();
      };
      mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
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

    /* pages rendues par Shopify sans notre gabarit (les /policies/… n'ont
       pas de template dans un thème vintage) : on emballe le contenu
       existant du <body> pour qu'il atterrisse dans la colonne centrale
       comme n'importe quelle page */
    if (!pageMain) {
      pageMain = document.createElement('div');
      pageMain.id = 'page-main';
      while (document.body.firstChild) pageMain.appendChild(document.body.firstChild);
      document.body.appendChild(pageMain);
    }

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

  /* ------------------------------------------- vidéos à démarrage paresseux
     Les vidéos décoratives (pubs, tuile fan-art) sont en preload="none" et
     sans autoplay : elles ne se téléchargent et ne se lancent qu'à
     l'approche du viewport, et se mettent en pause en le quittant.
     Exposée en global (SatineLazyVideos) pour être rappelée quand la régie
     ajoute des vidéos après coup (duos mobiles) ; observer deux fois le
     même élément est sans effet. */
  var lazyVidIO = null;
  function initLazyVideos() {
    var vids = document.querySelectorAll('.ad-live video, .art-piece video');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      /* pas d'animation : on montre juste la première image */
      vids.forEach(function (v) { v.preload = 'metadata'; });
      return;
    }
    if (!('IntersectionObserver' in window)) {
      vids.forEach(function (v) { v.play().catch(function () {}); });
      return;
    }
    if (!lazyVidIO) {
      lazyVidIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) en.target.play().catch(function () {});
          else en.target.pause();
        });
        /* large marge : à 300px (moins d'un demi-écran) la vidéo ne
           commençait à charger qu'une fois quasiment à l'écran */
      }, { rootMargin: '1200px' });
    }
    vids.forEach(function (v) { lazyVidIO.observe(v); });
  }
  window.SatineLazyVideos = initLazyVideos;

  /* ------------------------------------------------- fond ping-pong
     L'image de fond est posée UNE fois par tuile, et une tuile sur deux est
     retournée en CSS (scaleY(-1)) : le dégradé descend puis remonte, sans
     couture ni image retravaillée. Le nombre de tuiles suit la hauteur
     réelle de la colonne (ResizeObserver : contenu déplié, page secrète
     déverrouillée, resize…). */
  function initBgTiles() {
    var col = document.getElementById('main-col');
    if (!col) return;
    var host = document.createElement('div');
    host.id = 'bg-pp';
    host.setAttribute('aria-hidden', 'true');
    col.insertBefore(host, col.firstChild);

    var ratio = 0; /* hauteur/largeur, lu sur l'image elle-même */
    function layout() {
      if (!ratio) return;
      var w = col.clientWidth, h = col.offsetHeight;
      if (!w || !h) return;
      var tileH = w * ratio;
      var n = Math.max(1, Math.ceil(h / tileH));
      if (n === host.childElementCount &&
          Math.abs((parseFloat(host.dataset.th) || 0) - tileH) < 0.5) return;
      host.dataset.th = tileH;
      host.innerHTML = '';
      for (var i = 0; i < n; i++) {
        var t = document.createElement('div');
        t.className = 'bg-tile' + (i % 2 ? ' flip' : '');
        t.style.height = tileH + 'px';
        host.appendChild(t);
      }
    }
    var img = new Image();
    img.onload = function () {
      ratio = img.naturalHeight / img.naturalWidth;
      layout();
    };
    img.src = 'assets/img/backgrouds/mainBG.webp';
    if (window.ResizeObserver) new ResizeObserver(layout).observe(col);
    window.addEventListener('resize', layout);
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
    initBgTiles();
    initLazyVideos();
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
