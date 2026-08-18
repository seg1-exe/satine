/* ==========================================================================
   SATINE — player audio persistant, skin WMP "Kenwood KDC-X959 MP7" (2002)
   reconstruit en HTML/CSS depuis le .wmz d'origine (autoradio Kenwood).
   Repère fixe 515×160 tiré du kenwood.wms. Les zones des boutons viennent
   des bitmaps de mapping. L'écran central affiche les animations GIF
   d'origine du skin, cyclables avec les boutons ▲/▼ de droite.
   Repliable via le bouton 💿 ; position sauvegardée en localStorage.
   ========================================================================== */

(function () {
  'use strict';

  var TRACK = {
    artist: 'Satine',
    title: 'anomalisa',
    src: 'assets/audio/anomalisa.mp3'
  };

  /* modes de l'écran : visualizer maison + animations GIF du skin
     ('viz' = canvas WebAudio, null = fond statique) */
  var SCREENS = ['viz', null, 'intro-logo-loop.gif', 'forest-anim.gif', 'gecko-anim.gif', 'fish-anim.gif'];
  var screenIdx = 0;

  /* zones des boutons UTILISABLES uniquement — les zones décoratives du skin
     (info, full mode, EQ, open, playlist, logo) n'ont pas de bouton du tout,
     leur visuel reste dans les bandeaux. (x, y, l, h) relatifs au bandeau. */
  var LEFT = {  /* bandeau gauche à (23,22), 76×101 */
    close:   [13, 1, 63, 27],
    repeat:  [0, 47, 35, 35]
  };
  var RIGHT = { /* bandeau droit à (418,22), 80×101 */
    minimize: [1, 1, 60, 30],
    visprev:  [3, 15, 30, 30],
    visnext:  [1, 44, 32, 34],
    volup:    [49, 11, 24, 19],
    mute:     [47, 30, 29, 24],
    voldown:  [51, 54, 22, 24]
  };
  var SET1 = {  /* transport 1 à (76,111), 147×33 */
    play:  [33, 1, 45, 30],
    pause: [69, 1, 45, 30],
    stop:  [103, 1, 44, 30]
  };
  var SET2 = {  /* transport 2 à (293,111), 147×33 */
    prev:     [33, 2, 45, 30],
    next:     [69, 2, 45, 30]
  };

  var audio;
  var state = { time: 0 };

  try { state = JSON.parse(localStorage.getItem('satine_player')) || state; }
  catch (e) { /* état par défaut */ }

  function save() {
    localStorage.setItem('satine_player', JSON.stringify({
      time: audio ? audio.currentTime : 0
    }));
  }

  function fmt(t) {
    if (!isFinite(t)) return '0:00';
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function btnHtml(sprite, id, zone, x0, y0, title) {
    var z = zone;
    /* chaque bouton est masqué à sa forme exacte (bitmaps de mapping du
       skin) : les zones se chevauchent en diagonale, sans masque l'état
       enfoncé d'un bouton déborderait sur ses voisins */
    var mask = 'assets/img/kenwood/mask-' + id + '.png';
    return '<button class="kw-btn kw-' + sprite + '" id="' + id + '" title="' + title + '" style="' +
      'left:' + (x0 + z[0]) + 'px;top:' + (y0 + z[1]) + 'px;' +
      'width:' + z[2] + 'px;height:' + z[3] + 'px;' +
      'background-position:' + (-z[0]) + 'px ' + (-z[1]) + 'px;' +
      '-webkit-mask-image:url(' + mask + ');-webkit-mask-size:100% 100%;' +
      'mask-image:url(' + mask + ');mask-size:100% 100%"></button>';
  }

  function buildBar() {
    var open = localStorage.getItem('satine_player_open') === '1';
    var html =
      '<div id="player-dock" class="' + (open ? '' : 'collapsed') + '">' +
        '<div id="player-bar">' +
          '<div class="kw-screen">' +
            '<canvas class="kw-viz" id="kw-viz" width="244" height="50"></canvas>' +
            '<img class="kw-anim" id="kw-anim" src="" alt="" hidden>' +
            '<div class="kw-meta"><span id="kw-meta-text"></span></div>' +
            '<div class="kw-time" id="kw-time">0:00 / 0:00</div>' +
            '<div id="kw-progress" title="Avancer / reculer dans le morceau">' +
              '<div class="kw-progress-fill" id="kw-progress-fill"></div>' +
              '<img class="kw-thumb" id="kw-thumb" src="assets/img/kenwood/seek-thumb.gif" alt="">' +
            '</div>' +
          '</div>' +
          '<img class="kw-body" src="assets/img/kenwood/body.png" alt="Player Kenwood MP7">' +
          '<img class="kw-strip" src="assets/img/kenwood/left-set-default.jpg" style="left:23px;top:22px" alt="">' +
          '<img class="kw-strip" src="assets/img/kenwood/right-set-default.jpg" style="left:418px;top:22px" alt="">' +
          '<img class="kw-strip" src="assets/img/kenwood/main-set1-default.jpg" style="left:76px;top:111px" alt="">' +
          '<img class="kw-strip" src="assets/img/kenwood/main-set2-default.jpg" style="left:293px;top:111px" alt="">' +
          btnHtml('left', 'kw-close', LEFT.close, 23, 22, 'Replier le player') +
          btnHtml('left', 'kw-repeat', LEFT.repeat, 23, 22, 'Repeat') +
          btnHtml('right', 'kw-min', RIGHT.minimize, 418, 22, 'Replier le player') +
          btnHtml('right', 'kw-visprev', RIGHT.visprev, 418, 22, 'Écran précédent') +
          btnHtml('right', 'kw-visnext', RIGHT.visnext, 418, 22, 'Écran suivant') +
          btnHtml('right', 'kw-volup', RIGHT.volup, 418, 22, 'Volume +') +
          btnHtml('right', 'kw-mute', RIGHT.mute, 418, 22, 'Muet') +
          btnHtml('right', 'kw-voldown', RIGHT.voldown, 418, 22, 'Volume −') +
          btnHtml('set1', 'p-play', SET1.play, 76, 111, 'Lecture') +
          btnHtml('set1', 'kw-pause', SET1.pause, 76, 111, 'Pause') +
          btnHtml('set1', 'p-stop', SET1.stop, 76, 111, 'Stop') +
          btnHtml('set2', 'p-prev', SET2.prev, 293, 111, 'Reculer de 10s') +
          btnHtml('set2', 'p-next', SET2.next, 293, 111, 'Avancer de 10s') +
        '</div>' +
        '<button id="p-toggle" title="Ouvrir / fermer le player"></button>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);

    var dock = document.getElementById('player-dock');
    var toggleBtn = document.getElementById('p-toggle');
    function syncToggleTitle() {
      toggleBtn.title = dock.classList.contains('collapsed')
        ? 'Insérer le CD (ouvrir le player)'
        : 'Éjecter le CD (replier le player)';
    }
    function toggle() {
      dock.classList.toggle('collapsed');
      localStorage.setItem('satine_player_open', dock.classList.contains('collapsed') ? '0' : '1');
      syncToggleTitle();
    }
    syncToggleTitle();
    toggleBtn.addEventListener('click', toggle);
    document.getElementById('kw-min').addEventListener('click', toggle);
    document.getElementById('kw-close').addEventListener('click', toggle);
  }

  function init() {
    buildBar();
    audio = new Audio(TRACK.src);
    audio.preload = 'metadata';
    audio.volume = 0.8;

    var pauseAvail = document.getElementById('kw-pause');
    var progressEl = document.getElementById('kw-progress');
    var fillEl = document.getElementById('kw-progress-fill');
    var thumbEl = document.getElementById('kw-thumb');
    var timeEl = document.getElementById('kw-time');
    var metaEl = document.getElementById('kw-meta-text');
    var animEl = document.getElementById('kw-anim');

    metaEl.textContent = TRACK.artist + ' - ' + TRACK.title + '   ✦   ';

    audio.addEventListener('loadedmetadata', function () {
      metaEl.textContent = TRACK.artist + ' - ' + TRACK.title + ' (' + fmt(audio.duration) + ')   ✦   ';
      if (state.time > 0 && state.time < audio.duration) audio.currentTime = state.time;
    });

    /* --- écran : visualizer + cycle des animations du skin --- */
    var vizCanvas = document.getElementById('kw-viz');
    function setScreen(i) {
      screenIdx = ((i % SCREENS.length) + SCREENS.length) % SCREENS.length;
      var g = SCREENS[screenIdx];
      vizCanvas.hidden = g !== 'viz';
      animEl.hidden = !g || g === 'viz';
      if (g && g !== 'viz') animEl.src = 'assets/img/kenwood/' + g;
    }
    document.getElementById('kw-visprev').addEventListener('click', function () { setScreen(screenIdx - 1); });
    document.getElementById('kw-visnext').addEventListener('click', function () { setScreen(screenIdx + 1); });
    setScreen(screenIdx);

    /* --- visualizer WebAudio (le mp3 est servi par le site : analyse OK) --- */
    var actx = null, analyser = null, vizData = null;
    function ensureGraph() {
      if (actx) { actx.resume(); return; }
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      actx = new C();
      var src = actx.createMediaElementSource(audio);
      analyser = actx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      vizData = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      analyser.connect(actx.destination);
    }

    /* visualizer façon égaliseur LED hi-fi : segments empilés bleu→violet,
       halo lumineux, crête violette avec retombée, reflet fantôme dessous */
    var VIZ = { bars: 18, segH: 3, segGap: 1, maxSegs: 8, baseY: 37 };
    var vizZeroFrames = 0;
    var vizPeaks = [];
    for (var pi = 0; pi < VIZ.bars; pi++) vizPeaks.push(0);

    function segColor(s) {
      /* s = 0 (bas, bleu) → 1 (haut, violet) */
      var r = Math.round(80 + s * 95);
      var g = Math.round(125 - s * 35);
      var b = 255;
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    (function vizLoop() {
      requestAnimationFrame(vizLoop);
      if (vizCanvas.hidden) return;
      var ctx = vizCanvas.getContext('2d');
      var W = vizCanvas.width, H = vizCanvas.height;
      /* fond noir opaque : masque la voiture du fond d'écran du skin
         (c'est un autoradio) pendant le mode visualizer */
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      var gap = 4;
      var bw = (W - gap * (VIZ.bars + 1)) / VIZ.bars;
      var step = VIZ.segH + VIZ.segGap;
      var hasData = analyser && !audio.paused;
      if (hasData) {
        analyser.getByteFrequencyData(vizData);
        /* certains navigateurs (Brave avec anti-fingerprinting) neutralisent
           l'analyseur : s'il ne renvoie que du silence en lecture, on bascule
           sur des barres en pseudo-rythme plutôt que de rester plat */
        var total = 0;
        for (var d = 0; d < vizData.length; d++) total += vizData[d];
        vizZeroFrames = total === 0 ? vizZeroFrames + 1 : 0;
      }
      var synth = hasData && vizZeroFrames > 90;
      var now = performance.now();

      for (var i = 0; i < VIZ.bars; i++) {
        var v = 0.06;
        if (synth) {
          v = 0.12 + 0.8 *
            Math.abs(Math.sin(now / 175 + i * 0.9)) *
            (0.45 + 0.55 * Math.abs(Math.sin(now / 460 + i * 0.3)));
        } else if (hasData) {
          v = Math.max(0.06, vizData[Math.floor(i * vizData.length / VIZ.bars * 0.8)] / 255);
        }
        var nseg = Math.max(1, Math.round(v * VIZ.maxSegs));
        vizPeaks[i] = Math.max(nseg, vizPeaks[i] - 0.12);
        var x = gap + i * (bw + gap);

        for (var s = 0; s < nseg; s++) {
          var t = s / (VIZ.maxSegs - 1);
          var y = VIZ.baseY - (s + 1) * step;
          var col = segColor(t);
          ctx.shadowColor = col;
          ctx.shadowBlur = 6;
          ctx.fillStyle = col;
          ctx.fillRect(x, y, bw, VIZ.segH);
          /* reflet fantôme sous la ligne de base */
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.16 * (1 - t);
          ctx.fillRect(x, VIZ.baseY + 3 + s * step * 0.7, bw, VIZ.segH * 0.7);
          ctx.globalAlpha = 1;
        }

        /* crête violette détachée (peak hold) */
        var pk = Math.ceil(vizPeaks[i]);
        if (pk > nseg) {
          var py = VIZ.baseY - (pk + 1) * step;
          ctx.shadowColor = '#c07cff';
          ctx.shadowBlur = 7;
          ctx.fillStyle = '#c07cff';
          ctx.fillRect(x, py, bw, VIZ.segH);
          ctx.shadowBlur = 0;
        }
      }
    })();

    /* --- transport --- */
    document.getElementById('p-play').addEventListener('click', function () {
      ensureGraph(); /* créé dans le clic : contexte audio jamais bloqué */
      audio.play().catch(function () { /* l'utilisateur re-cliquera */ });
    });
    pauseAvail.addEventListener('click', function () { audio.pause(); });
    document.getElementById('p-stop').addEventListener('click', function () {
      audio.pause();
      audio.currentTime = 0;
      save();
    });
    document.getElementById('p-prev').addEventListener('click', function () {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    document.getElementById('p-next').addEventListener('click', function () {
      if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    });
    audio.addEventListener('ended', function () {
      if (!audio.loop) audio.currentTime = 0;
    });

    /* état lecture : bouton play "enfoncé" + le CD toggle tourne */
    var playBtn = document.getElementById('p-play');
    var dockEl = document.getElementById('player-dock');
    audio.addEventListener('play', function () {
      playBtn.classList.add('on');
      dockEl.classList.add('playing');
    });
    audio.addEventListener('pause', function () {
      playBtn.classList.remove('on');
      dockEl.classList.remove('playing');
    });

    /* --- boutons sticky (comportement du skin) --- */
    document.getElementById('kw-repeat').addEventListener('click', function () {
      audio.loop = !audio.loop;
      this.classList.toggle('on', audio.loop);
    });
    document.getElementById('kw-mute').addEventListener('click', function () {
      audio.muted = !audio.muted;
      this.classList.toggle('on', audio.muted);
    });

    /* --- volume ± --- */
    document.getElementById('kw-volup').addEventListener('click', function () {
      audio.volume = Math.min(1, audio.volume + 0.1);
      audio.muted = false;
    });
    document.getElementById('kw-voldown').addEventListener('click', function () {
      audio.volume = Math.max(0, audio.volume - 0.1);
    });

    /* --- barre de progression (seek_back + seek_thumb du skin) --- */
    function updateProgress() {
      var frac = audio.duration ? audio.currentTime / audio.duration : 0;
      fillEl.style.width = (frac * 100) + '%';
      thumbEl.style.left = 'calc(' + (frac * 100) + '% - 3px)';
      timeEl.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    }
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);

    progressEl.addEventListener('pointerdown', function (e) {
      progressEl.setPointerCapture(e.pointerId);
      function seekAt(clientX) {
        var r = progressEl.getBoundingClientRect();
        var frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        if (audio.duration) audio.currentTime = frac * audio.duration;
      }
      seekAt(e.clientX);
      function move(ev) { seekAt(ev.clientX); }
      function up() {
        progressEl.removeEventListener('pointermove', move);
        progressEl.removeEventListener('pointerup', up);
      }
      progressEl.addEventListener('pointermove', move);
      progressEl.addEventListener('pointerup', up);
    });

    window.addEventListener('beforeunload', save);
    setInterval(save, 3000);

    /* point de debug / intégrations : état du graphe audio */
    window.SatinePlayer = {
      audio: audio,
      sampleBass: function () {
        if (!analyser) return null;
        analyser.getByteFrequencyData(vizData);
        var s = 0;
        for (var i = 0; i < vizData.length; i++) s += vizData[i];
        return { sum: s, ctxState: actx ? actx.state : null };
      }
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
