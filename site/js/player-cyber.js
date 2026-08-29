/* ==========================================================================
   SATINE — player des maquettes, skin WMP "Cyberchannel" (sign definé, 2000)
   reconstruit en HTML/CSS depuis le .wmz d'origine. Repère fixe 524×430 tiré
   du cyberchannel.wms ; les zones des boutons viennent de map.bmp, leurs
   états allumés de hover.bmp (crops détourés dans assets/img/cyber/).
   Le volume est l'arc rose en haut à droite : 11 frames de volslide.bmp,
   la position cliquée est lue dans volslidemap.png (niveaux de gris).
   S'injecte dans #cyber-slot (page secrète) et se met à l'échelle du
   conteneur. Les maquettes vont dans TRACKS ci-dessous.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------- playlist maquettes */
  /* à compléter au fil des maquettes (titre affiché sur l'écran LCD) */
  var TRACKS = [
    { title: 'maquette_01', src: 'assets/audio/anomalisa.mp3' },
    { title: 'maquette_02', src: 'assets/audio/anomalisa.mp3' }
  ];

  /* zones des boutons UTILISABLES (x, y, l, h) dans le repère 524×430 —
     mesurées dans map.bmp. Les zones décoratives du skin (close, minimize,
     open file, logos/liens) n'ont pas de bouton du tout. */
  var ZONES = {
    play:     [315, 223, 35, 35],
    pause:    [283, 232, 32, 28],
    stop:     [350, 232, 33, 27],
    rew:      [258, 242, 30, 31],
    ffwd:     [377, 242, 31, 30],
    prev:     [241, 260, 25, 29],
    next:     [400, 258, 26, 32],
    playlist: [357, 167, 27, 27],
    visprev:  [247, 164, 6, 9],
    visnext:  [258, 164, 6, 9]
  };
  var TITLES = {
    play: 'Lecture', pause: 'Pause', stop: 'Stop',
    rew: 'Reculer de 10s', ffwd: 'Avancer de 10s',
    prev: 'Maquette précédente', next: 'Maquette suivante',
    playlist: 'Playlist des maquettes',
    visprev: 'Écran précédent', visnext: 'Écran suivant'
  };

  /* écran 180×135 : visualizer maison ou éteint */
  var SCREENS = ['viz', null];
  var screenIdx = 0;

  var audio, trackIdx = 0;

  function fmt(t) {
    if (!isFinite(t)) return '0:00';
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function btnHtml(id) {
    var z = ZONES[id];
    return '<button class="cy-btn" id="cy-' + id + '" title="' + TITLES[id] + '" style="' +
      'left:' + z[0] + 'px;top:' + z[1] + 'px;width:' + z[2] + 'px;height:' + z[3] + 'px;' +
      'background-image:url(assets/img/cyber/hover-' + id + '.png)"></button>';
  }

  function build(slot) {
    var html =
      '<div class="cyber-wrap">' +
        '<div class="cyber-player" id="cyber-player">' +
          '<img class="cy-body" src="assets/img/cyber/body.webp" alt="Player Cyberchannel">' +
          /* écran (59,39) 180×135 */
          '<canvas class="cy-viz" id="cy-viz" width="180" height="135"></canvas>' +
          /* nom + position (texte du skin, #3a4179) */
          '<div class="cy-name" id="cy-name"></div>' +
          '<div class="cy-pos" id="cy-pos">0:00</div>' +
          /* progression (67,179) 164×13 */
          '<div class="cy-progress" id="cy-progress" title="Avancer / reculer">' +
            '<img class="cy-thumb" id="cy-thumb" src="assets/img/cyber/progress-thumb.png" alt="">' +
          '</div>' +
          /* volume : arc (406,25) 104×83, 11 frames */
          '<div class="cy-vol" id="cy-vol" title="Volume"></div>' +
          Object.keys(ZONES).map(btnHtml).join('') +
          /* playlist déroulante (le bouton du skin porte l'id cy-playlist) */
          '<div class="cy-list" id="cy-list" hidden></div>' +
        '</div>' +
      '</div>';
    slot.insertAdjacentHTML('beforeend', html);
  }

  /* échelle : le repère 524×430 est réduit pour tenir dans le conteneur.
     Largeur nulle = conteneur caché (page pas encore déverrouillée) : on ne
     touche à rien, le ResizeObserver refera le calcul à l'apparition. */
  function fitScale() {
    var wrap = document.querySelector('.cyber-wrap');
    var player = document.getElementById('cyber-player');
    if (!wrap || !player || !wrap.clientWidth) return;
    var s = Math.min(1, wrap.clientWidth / 524);
    player.style.transform = 'scale(' + s + ')';
    wrap.style.height = Math.round(430 * s) + 'px';
  }

  function init() {
    var slot = document.getElementById('cyber-slot');
    if (!slot) return;
    build(slot);
    fitScale();
    window.addEventListener('resize', fitScale);
    if (window.ResizeObserver) {
      new ResizeObserver(fitScale).observe(document.querySelector('.cyber-wrap'));
    }

    var nameEl = document.getElementById('cy-name');
    var posEl = document.getElementById('cy-pos');
    var progressEl = document.getElementById('cy-progress');
    var thumbEl = document.getElementById('cy-thumb');
    var volEl = document.getElementById('cy-vol');
    var listEl = document.getElementById('cy-list');
    var playBtn = document.getElementById('cy-play');

    audio = new Audio();
    audio.preload = 'metadata';
    try { audio.volume = +localStorage.getItem('satine_cyber_vol') || 0.8; }
    catch (e) { audio.volume = 0.8; }

    function load(i, andPlay) {
      trackIdx = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
      audio.src = TRACKS[trackIdx].src;
      nameEl.textContent = TRACKS[trackIdx].title;
      renderList();
      if (andPlay) { ensureGraph(); audio.play().catch(function () {}); }
    }

    /* --- playlist --- */
    function renderList() {
      listEl.innerHTML = TRACKS.map(function (t, i) {
        return '<button class="cy-track' + (i === trackIdx ? ' on' : '') + '" data-i="' + i + '">' +
          (i + 1) + '. ' + t.title + '</button>';
      }).join('');
    }
    listEl.addEventListener('click', function (e) {
      var b = e.target.closest('.cy-track');
      if (b) load(+b.getAttribute('data-i'), true);
    });
    document.getElementById('cy-playlist').addEventListener('click', function () {
      listEl.hidden = !listEl.hidden;
    });

    /* --- visualizer LED (adapté du player Kenwood) --- */
    var vizCanvas = document.getElementById('cy-viz');
    function setScreen(i) {
      screenIdx = ((i % SCREENS.length) + SCREENS.length) % SCREENS.length;
      vizCanvas.hidden = SCREENS[screenIdx] !== 'viz';
    }
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
    var VIZ = { bars: 14, segH: 6, segGap: 2, maxSegs: 12, baseY: 116 };
    var vizZeroFrames = 0;
    var vizPeaks = [];
    for (var pi = 0; pi < VIZ.bars; pi++) vizPeaks.push(0);
    function segColor(s) {
      /* bas lavande → haut rose, dans la palette du skin */
      var r = Math.round(150 + s * 105);
      var g = Math.round(150 - s * 90);
      var b = Math.round(230 - s * 40);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    (function vizLoop() {
      requestAnimationFrame(vizLoop);
      if (vizCanvas.hidden) return;
      var ctx = vizCanvas.getContext('2d');
      var W = vizCanvas.width, H = vizCanvas.height;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      var gap = 4;
      var bw = (W - gap * (VIZ.bars + 1)) / VIZ.bars;
      var step = VIZ.segH + VIZ.segGap;
      var hasData = analyser && !audio.paused;
      if (hasData) {
        analyser.getByteFrequencyData(vizData);
        var total = 0;
        for (var d = 0; d < vizData.length; d++) total += vizData[d];
        vizZeroFrames = total === 0 ? vizZeroFrames + 1 : 0;
      }
      var synth = hasData && vizZeroFrames > 90;
      var now = performance.now();
      for (var i = 0; i < VIZ.bars; i++) {
        var v = 0.06;
        if (synth) {
          v = 0.12 + 0.8 * Math.abs(Math.sin(now / 175 + i * 0.9)) *
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
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.16 * (1 - t);
          ctx.fillRect(x, VIZ.baseY + 4 + s * step * 0.6, bw, VIZ.segH * 0.6);
          ctx.globalAlpha = 1;
        }
        var pk = Math.ceil(vizPeaks[i]);
        if (pk > nseg) {
          ctx.shadowColor = '#ff9ad5';
          ctx.shadowBlur = 7;
          ctx.fillStyle = '#ff9ad5';
          ctx.fillRect(x, VIZ.baseY - (pk + 1) * step, bw, VIZ.segH);
          ctx.shadowBlur = 0;
        }
      }
    })();

    /* --- transport --- */
    playBtn.addEventListener('click', function () {
      ensureGraph();
      audio.play().catch(function () {});
    });
    document.getElementById('cy-pause').addEventListener('click', function () { audio.pause(); });
    document.getElementById('cy-stop').addEventListener('click', function () {
      audio.pause();
      audio.currentTime = 0;
    });
    document.getElementById('cy-rew').addEventListener('click', function () {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    document.getElementById('cy-ffwd').addEventListener('click', function () {
      if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    });
    document.getElementById('cy-prev').addEventListener('click', function () { load(trackIdx - 1, !audio.paused); });
    document.getElementById('cy-next').addEventListener('click', function () { load(trackIdx + 1, !audio.paused); });
    audio.addEventListener('ended', function () { load(trackIdx + 1, true); });
    audio.addEventListener('play', function () { playBtn.classList.add('on'); });
    audio.addEventListener('pause', function () { playBtn.classList.remove('on'); });

    document.getElementById('cy-visprev').addEventListener('click', function () { setScreen(screenIdx - 1); });
    document.getElementById('cy-visnext').addEventListener('click', function () { setScreen(screenIdx + 1); });

    /* --- progression --- */
    function updateProgress() {
      var frac = audio.duration ? audio.currentTime / audio.duration : 0;
      thumbEl.style.left = Math.round(frac * (164 - 14)) + 'px';
      posEl.textContent = fmt(audio.currentTime);
    }
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    progressEl.addEventListener('pointerdown', function (e) {
      try { progressEl.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
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

    /* --- volume : l'arc du skin. La frame affichée suit le volume, la
       valeur cliquée est lue dans volslidemap (niveaux de gris 0→255). --- */
    function renderVol() {
      var idx = Math.round(audio.volume * 10);
      volEl.style.backgroundPosition = (-idx * 104) + 'px 0';
    }
    renderVol();
    var volMap = null;
    var volImg = new Image();
    volImg.onload = function () {
      var c = document.createElement('canvas');
      c.width = 104; c.height = 83;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(volImg, 0, 0);
      volMap = x;
    };
    volImg.src = 'assets/img/cyber/volslidemap.png';
    volEl.addEventListener('pointerdown', function (e) {
      try { volEl.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
      function volAt(ev) {
        if (!volMap) return;
        var r = volEl.getBoundingClientRect();
        var x = Math.min(103, Math.max(0, Math.round((ev.clientX - r.left) / r.width * 104)));
        var y = Math.min(82, Math.max(0, Math.round((ev.clientY - r.top) / r.height * 83)));
        var p = volMap.getImageData(x, y, 1, 1).data;
        /* hors de l'arc, la carte est à la couleur de clipping (23,0,0) */
        if (p[0] === 23 && p[1] === 0 && p[2] === 0) return;
        audio.volume = Math.min(1, Math.max(0, p[0] / 255));
        try { localStorage.setItem('satine_cyber_vol', audio.volume); } catch (err) { /* privé */ }
        renderVol();
      }
      volAt(e);
      function move(ev) { volAt(ev); }
      function up() {
        volEl.removeEventListener('pointermove', move);
        volEl.removeEventListener('pointerup', up);
      }
      volEl.addEventListener('pointermove', move);
      volEl.addEventListener('pointerup', up);
    });

    load(0, false);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
