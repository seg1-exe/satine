/* ==========================================================================
   SATINE — faux chat de démo (sera remplacé par l'embed Chatango en phase 2)
   ========================================================================== */

(function () {
  'use strict';

  var BOTS = [
    { who: 'xX_g00n3tte_Xx', cls: 'c1', lines: [
      'QUELQU’UN A LE CODE DE LA PAGE SECRÈTE ??',
      'les barrettes sont TROP belles jsuis pas prête',
      'satine si tu lis ça je t’aime' ] },
    { who: 'tombstone_fan', cls: 'c2', lines: [
      'la tournée avec TLT ça va être historique',
      'quelqu’un va à la date de Berlin ?',
      'le clip>>>>>>>' ] },
    { who: 'clippy_tv', cls: 'c3', lines: [
      'bzzzt. je vois tout. bzzzt.',
      'avez-vous regardé dans les pubs ? je dis ça comme ça.',
      '📺' ] },
    { who: 'mod_satine', cls: 'c4', lines: [
      'restez polis svp ou je coupe la télé',
      'nouveau merch dispo dans l’onglet Merch !!' ] }
  ];

  function addMsg(who, cls, text) {
    var log = document.getElementById('chat-log');
    var div = document.createElement('div');
    div.className = 'chat-msg';
    var b = document.createElement('span');
    b.className = 'who ' + cls;
    b.textContent = who + ' : ';
    div.appendChild(b);
    div.appendChild(document.createTextNode(text));
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function init() {
    if (!document.getElementById('chat-log')) return;

    addMsg('mod_satine', 'c4', 'bienvenue dans le salon !! 💖');

    setInterval(function () {
      var bot = BOTS[Math.floor(Math.random() * BOTS.length)];
      addMsg(bot.who, bot.cls, bot.lines[Math.floor(Math.random() * bot.lines.length)]);
    }, 4200);

    function send() {
      var input = document.getElementById('chat-input');
      var v = input.value.trim();
      if (!v) return;
      addMsg('toi', 'c2', v);
      input.value = '';
    }
    document.getElementById('chat-send').addEventListener('click', send);
    document.getElementById('chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') send();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
