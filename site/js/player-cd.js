/* ==========================================================================
   SATINE — player façon "CD Player" Windows 9x : fenêtre grise, barre de
   titre bleue, pochette, champs Artist/Track, curseur et transport
   ◀◀ ▶▶ ▶ ■ ●. Tout est HTML/CSS (pas de skin bitmap), voir le bloc
   CD PLAYER de main.css.

   Un player est monté dans CHAQUE élément .cdp-slot de la page (les posts
   du blog secret en embarquent). Playlist par défaut : TRACKS ci-dessous ;
   un slot peut embarquer la sienne via data-tracks='[{"title":…,"src":…,
   "art":…}]'. Un seul player joue à la fois.
   ========================================================================== */

(function () {
  'use strict';

  var ARTIST = 'Satine';

  /* playlist par défaut — titres = noms des fichiers d'origine */
  var TRACKS = [
    { title: 'comment tu t\'appelles', src: 'assets/audio/maquettes/comment-tu-tappelles.mp3', art: 'assets/img/pfp.webp' },
    { title: '10 étages', src: 'assets/audio/maquettes/10-etages.mp3', art: 'assets/img/pfp.webp' },
    { title: 'pause V4', src: 'assets/audio/maquettes/pause-v4.mp3', art: 'assets/img/pfp.webp' },
    { title: 'JAMAIS 2', src: 'assets/audio/maquettes/jamais-2.mp3', art: 'assets/img/pfp.webp' },
    { title: 'dékonnecté MSTRD1', src: 'assets/audio/maquettes/dekonnecte-mstrd1.mp3', art: 'assets/img/pfp.webp' },
    { title: 'sur le banc V3', src: 'assets/audio/maquettes/sur-le-banc-v3.mp3', art: 'assets/img/pfp.webp' }
  ];

  /* le player en train de jouer (pour couper les autres) */
  var currentAudio = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function html() {
    return (
      '<div class="cdp-window">' +
        '<div class="cdp-title">' +
          '<span class="cdp-ico">💿</span><span class="cdp-name">CD Player</span>' +
          '<span class="cdp-caption"><i>─</i><i>❐</i><i>✕</i></span>' +
        '</div>' +
        '<div class="cdp-body">' +
          '<img class="cdp-art" src="" alt="Pochette">' +
          '<div class="cdp-right">' +
            '<div class="cdp-field">' +
              '<label>Artist:</label>' +
              '<div class="cdp-input">' + esc(ARTIST) + '</div>' +
              '<span class="cdp-drive">&lt;D:&gt;</span><span class="cdp-dd" aria-hidden="true">▼</span>' +
            '</div>' +
            '<div class="cdp-field">' +
              '<label>Track:</label>' +
              '<div class="cdp-input cdp-track"></div>' +
              '<span class="cdp-drive">&lt;D:&gt;</span>' +
              '<button class="cdp-dd cdp-dd-btn" title="Choisir une maquette">▼</button>' +
              '<div class="cdp-list" hidden></div>' +
            '</div>' +
            '<div class="cdp-slider" title="Avancer / reculer">' +
              '<div class="cdp-groove"></div>' +
              '<div class="cdp-thumb"></div>' +
            '</div>' +
            '<div class="cdp-controls">' +
              '<button class="cdp-prev" title="Maquette précédente">◀◀</button>' +
              '<button class="cdp-next" title="Maquette suivante">▶▶</button>' +
              '<button class="cdp-play" title="Lecture / pause">▶</button>' +
              '<button class="cdp-stop" title="Stop">■</button>' +
              '<button class="cdp-rec" title="Ça ne s\'enregistre pas ici 😏" disabled>●</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>');
  }

  function mount(slot) {
    var tracks = TRACKS;
    var raw = slot.getAttribute('data-tracks');
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed.length) tracks = parsed;
      } catch (e) { /* JSON invalide : playlist par défaut */ }
    }

    slot.insertAdjacentHTML('beforeend', html());
    var root = slot.querySelector('.cdp-window:last-child');
    function $(sel) { return root.querySelector(sel); }

    var artEl = $('.cdp-art');
    var trackEl = $('.cdp-track');
    var listEl = $('.cdp-list');
    var sliderEl = $('.cdp-slider');
    var thumbEl = $('.cdp-thumb');
    var playBtn = $('.cdp-play');

    var audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.9;
    var trackIdx = 0;

    function load(i, andPlay) {
      trackIdx = ((i % tracks.length) + tracks.length) % tracks.length;
      var t = tracks[trackIdx];
      audio.src = t.src;
      trackEl.textContent = t.title;
      artEl.src = t.art || 'assets/img/pfp.webp';
      renderList();
      if (andPlay) play();
    }

    function play() {
      if (currentAudio && currentAudio !== audio) currentAudio.pause();
      currentAudio = audio;
      audio.play().catch(function () { /* l'utilisateur re-cliquera */ });
    }

    /* --- liste déroulante --- */
    function renderList() {
      listEl.innerHTML = tracks.map(function (t, i) {
        return '<button class="cdp-item' + (i === trackIdx ? ' on' : '') + '" data-i="' + i + '">' +
          (i + 1) + '. ' + esc(t.title) + '</button>';
      }).join('');
    }
    $('.cdp-dd-btn').addEventListener('click', function () {
      listEl.hidden = !listEl.hidden;
    });
    listEl.addEventListener('click', function (e) {
      var b = e.target.closest('.cdp-item');
      if (!b) return;
      listEl.hidden = true;
      load(+b.getAttribute('data-i'), true);
    });
    document.addEventListener('click', function (e) {
      if (!listEl.hidden && !e.target.closest('.cdp-field')) listEl.hidden = true;
    });

    /* --- transport --- */
    playBtn.addEventListener('click', function () {
      if (audio.paused) play();
      else audio.pause();
    });
    $('.cdp-stop').addEventListener('click', function () {
      audio.pause();
      audio.currentTime = 0;
    });
    $('.cdp-prev').addEventListener('click', function () { load(trackIdx - 1, !audio.paused); });
    $('.cdp-next').addEventListener('click', function () { load(trackIdx + 1, !audio.paused); });
    audio.addEventListener('ended', function () { load(trackIdx + 1, true); });
    audio.addEventListener('play', function () {
      playBtn.classList.add('on');
      playBtn.textContent = '❚❚';
    });
    audio.addEventListener('pause', function () {
      playBtn.classList.remove('on');
      playBtn.textContent = '▶';
    });

    /* --- curseur de position --- */
    function updateSlider() {
      var frac = audio.duration ? audio.currentTime / audio.duration : 0;
      thumbEl.style.left = (frac * 100) + '%';
    }
    audio.addEventListener('timeupdate', updateSlider);
    audio.addEventListener('loadedmetadata', updateSlider);
    sliderEl.addEventListener('pointerdown', function (e) {
      try { sliderEl.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
      function seekAt(clientX) {
        var r = sliderEl.getBoundingClientRect();
        var frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        if (audio.duration) audio.currentTime = frac * audio.duration;
        else thumbEl.style.left = (frac * 100) + '%';
      }
      seekAt(e.clientX);
      function move(ev) { seekAt(ev.clientX); }
      function up() {
        sliderEl.removeEventListener('pointermove', move);
        sliderEl.removeEventListener('pointerup', up);
      }
      sliderEl.addEventListener('pointermove', move);
      sliderEl.addEventListener('pointerup', up);
    });

    load(0, false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.cdp-slot').forEach(mount);
  });
})();
