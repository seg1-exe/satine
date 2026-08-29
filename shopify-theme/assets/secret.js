/* résolution des assets sur le CDN Shopify — __ASSET_BASE est posé
   par layout/theme.liquid (et intro.liquid). */
function ASSET(f) { return (window.__ASSET_BASE || 'assets/') + f; }

/* ==========================================================================
   SATINE — page secrète
   Le code est composé de 3 fragments cachés dans les pubs (placeholders
   actuels : coins des pubs ; version finale : dissimulés dans les visuels
   des graphistes). Légèrement obfusqué — le trouver dans la source fait
   partie du jeu pour les plus déters.
   ========================================================================== */

(function () {
  'use strict';

  var K = '=UURUNURO50TLVER'; /* indice : miroir */

  function isValid(raw) {
    /* insensible à la casse et aux accents (Dekonnectée / DEKONNECTEE / dekonnectee…) */
    var norm = (raw || '').trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s-]/g, '');
    try { return btoa(norm) === K.split('').reverse().join(''); }
    catch (e) { return false; }
  }

  function unlock() {
    localStorage.setItem('satine_secret', '1');
    show();
  }

  function show() {
    document.getElementById('secret-gate').hidden = true;
    document.getElementById('secret-content').hidden = false;
  }

  function init() {
    var gate = document.getElementById('secret-gate');
    var input = document.getElementById('code-input');
    var btn = document.getElementById('code-submit');
    var err = document.getElementById('gate-error');

    if (localStorage.getItem('satine_secret') === '1') { show(); return; }

    /* code éventuellement saisi dans la barre "Secret Page" du header */
    var param = new URLSearchParams(location.search).get('code');
    if (param) {
      if (isValid(param)) { unlock(); return; }
      input.value = param;
      err.textContent = 'Non… mais tu chauffes peut-être ?';
    }

    function attempt() {
      if (isValid(input.value)) {
        unlock();
      } else {
        err.textContent = ['Nope.', 'Toujours pas !', 'Cherche mieux dans les pubs…',
          'bzzzt. accès refusé.'][Math.floor(Math.random() * 4)];
        gate.classList.remove('shake');
        void gate.offsetWidth;
        gate.classList.add('shake');
        input.select();
      }
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
  }

  document.addEventListener('satine:ready', init);
})();
