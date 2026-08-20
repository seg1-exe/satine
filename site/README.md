# SATINE — MySAT'S BLOG (v1 placeholder)

Site one-pager vitrine/merch façon MySpace 2007 pour SATINE (hyperpop). Full
HTML/CSS/JS vanilla, zéro dépendance, zéro build — prêt pour un déploiement
Vercel puis une conversion en thème Shopify (même méthode que cultmember).

## Lancer en local

```bash
npx http-server site -p 8137 -c-1
```

(ou n'importe quel serveur statique pointé sur `site/`)

## Structure

- `index.html` — LE one-pager. Sections ancrées par la nav :
  `#top` (profil + fenêtre merch bento) · `#tournee` (4 dates + voir plus) ·
  `#clip` (embed YouTube dans cadre CRT) · `#chat` (faux chat, futur Chatango) ·
  `#art` (6 fan-arts + voir plus)
- `intro.html` — **porte d'entrée** : ciel étoilé, titre SATINE, flèche
  « Entrer ». Voir la section dédiée plus bas.
- `secret.html` — page verrouillée par mot de passe
- `js/shared.js` — chrome commun : layout centré (pubs = 1/3 de largeur), nav +
  scrollspy, rails de pubs, Clippy TV, panier, **modal produit** (quantité +
  add to cart), sparkles, **zoom grands écrans**. → deviendra `theme.liquid` +
  snippets côté Shopify
- `js/player.js` — player audio skin WMP « Kenwood KDC-X959 MP7 » (reconstruit
  depuis Kenwood_MP7.wmz), ouverture en slide, repliable (bouton 💿),
  persistant. Assets : `assets/img/kenwood/`
- `js/chat.js` — bots du faux chat
- `js/intro.js` — porte d'entrée : étoiles (canvas), avalanche d'erreurs,
  fermeture/ouverture des mâchoires. Sert les DEUX pages (voir plus bas)
- `css/main.css` — tout le style (variables en tête de fichier)
- `css/intro.css` — porte d'entrée + mâchoires (chargé aussi par `index.html`)

## Porte d'entrée

`intro.html` : fond étoilé, titre SATINE, flèche jaune « Entrer ». Au clic —
avalanche de ~34 pop-ups d'erreur Windows (cadence qui s'emballe de 170 à
35 ms) sur `assets/audio/error.mp3`, joué **une seule fois** au clic : ses
~2,6 s de signal couvrent toute l'avalanche. Puis les deux moitiés de gueule
(`assets/img/anim-intro-*.webp`) se referment sur l'écran ; **c'est pendant que la bouche est fermée que la
navigation vers `index.html` a lieu**, donc invisible, et la bouche se rouvre
sur le site.

**La porte se rejoue à chaque arrivée sur le site, refresh compris** : il n'y a
volontairement aucun drapeau « déjà entré ». Le script inline en tête du
`<head>` d'`index.html` renvoie sur `intro.html` sauf dans trois cas :

1. `satine-reveal` est présent dans `sessionStorage` — jeton à usage unique
   posé par `intro.html` juste avant de naviguer. Le script le consomme et pose
   la classe `.intro-reveal` sur `<html>` **avant le premier paint** (voile noir
   + bouche fermée), sinon on apercevrait le site une fraction de seconde avant
   l'ouverture ;
2. la navigation est **interne** — retour de `secret.html` par la nav, ou bouton
   Précédent. Ce n'est pas une arrivée sur le site, rejouer 3 s d'intro serait
   pénible. Détection via `performance.getEntriesByType('navigation')[0].type` :
   `back_forward` ou `navigate` avec un referer de même origine. Un `reload`
   (F5) est explicitement traité comme une arrivée, donc rejoue la porte ;
3. l'URL porte `?nointro=1` — saute la porte, et le paramètre survit au
   refresh, ce qui est pratique en développement. C'est la cible du lien
   « passer » en bas d'`intro.html`.

L'ancre est conservée dans l'aller-retour : `index.html#tournee` passe par
`intro.html#tournee` et revient au bon endroit.

Sans `sessionStorage` (navigation privée stricte) aucune redirection n'a lieu :
le site est servi directement, pas de boucle possible.

Les deux mâchoires sont les découpes alpha telles quelles, **sans fond** : on
voit la page au travers des dents pendant toute l'animation, et les deux images
se recouvrent librement au centre, donc les crocs s'entrecroisent. Chacune est
calée sur sa « ligne de dents » (fractions commentées dans `css/intro.css`), pas
sur la pointe du croc le plus long — sinon la bouche fermée reste grande
ouverte.

Le cadrage est serré sur la gueule, comme dans le clip : `--jaw-w` fait déborder
les dessins de l'écran (148 % de la largeur ou 152 % de la hauteur, le plus
grand des deux) pour qu'on ne voie jamais le vide autour de la tête. Valeurs
trouvées en composant la bouche fermée sur une dizaine de formats.

Le seul noir est le `.veil` de `#jaws`, derrière les mâchoires : il ne sert qu'à
masquer le saut `intro.html` → `index.html`, qu'on verrait sinon par les trous
entre les dents. Il n'apparaît que sur les 200 dernières ms de la fermeture et
repart sur les 200 premières de l'ouverture, bouche jointe dans les deux cas.

Les durées sont dupliquées entre `css/intro.css` (`.chomp` / `.gape`) et
`js/intro.js` (`CLOSE_MS` / `OPEN_MS`) : les modifier ensemble.

`prefers-reduced-motion` court-circuite tout : le clic entre directement sur le
site, sans avalanche ni mâchoires.

Sur mobile, la taille du titre suit la dimension la plus contraignante —
`clamp(44px, min(19vw, 22vh), 156px)` — pour remplir la largeur en portrait sans
manger tout l'écran en paysage. Les mâchoires se calent sur `--vh-half`, en
`dvh` quand le navigateur le gère : sinon, sur iOS, `100vh` ignore la barre
d'URL et la bouche se refermerait sous le centre réel de l'écran.

## Apparition au scroll

Les blocs marqués `data-rv` dans `index.html` arrivent en fondu + glissement
quand ils entrent dans le viewport. Le mécanisme tient en trois morceaux :

- le script inline du `<head>` pose `rv-ready` sur `<html>` **avant le premier
  paint** — sinon la page s'afficherait entière puis se cacherait ;
- `css/main.css` (bloc « APPARITION AU SCROLL ») cache les `[data-rv]` et les
  révèle sur `.rv-in` — grossissement (0.8 → 1, avec un léger dépassement) +
  fondu. On anime la propriété `scale`, **pas** `transform` : les `.art-piece`
  ont déjà un `transform: rotate(var(--tilt))` qu'il ne faut pas écraser ;
- `initReveal()` dans `js/shared.js` observe et pose `.rv-in`, avec une cascade
  entre voisins d'un même parent. Un filet à 1 s découvre à la main ce qui est
  déjà dans le viewport : un document masqué (onglet ouvert en arrière-plan) ne
  fait pas tourner l'IntersectionObserver, la page resterait invisible.

Au retour de la porte d'entrée, `initReveal()` **attend** l'événement
`satine:reveal-ready` (émis par `js/intro.js` 320 ms après le début de
l'ouverture des mâchoires) avant de démarrer : sinon l'apparition du haut de
page — photo, réseaux, fenêtre merch — se jouerait derrière les dents encore
jointes, donc pour rien. Filet à 3 s si l'événement n'arrive pas.

Sans JS, `rv-ready` n'est jamais posée et tout reste visible. Idem si
l'IntersectionObserver manque ou si `prefers-reduced-motion` est demandé :
`initReveal()` retire la classe.

### Portage Shopify de la porte

Oui, elle tient sur Shopify — mais pas comme un fichier HTML posé à la racine :
un thème n'accepte que sa propre arborescence. La correspondance :

| ici | thème Shopify |
| --- | --- |
| `intro.html` | une **Page** de handle `entrer` + son template `page.entrer`, qui appelle `{% layout 'intro' %}` — un layout dédié, sans header ni footer du thème |
| `css/intro.css`, `js/intro.js` | `assets/`, appelés avec `{{ 'intro.css' \| asset_url \| stylesheet_tag }}` |
| `assets/img/anim-intro-*.webp` | `assets/`, avec `{{ 'anim-intro-top.webp' \| asset_url }}` |
| script inline du `<head>` d'`index.html` | un snippet inclus dans le `<head>` de `layout/theme.liquid` |
| `GATE_URL` / `HOME_URL` | `/pages/entrer` et `/` — deux constantes, une dans `js/intro.js`, une dans le script inline |

Tout le reste fonctionne à l'identique : `sessionStorage`, la détection de
navigation interne, la classe `.intro-reveal` posée avant le premier paint. Le
chemin des images étant généré par Liquid, `js/intro.js` devra les recevoir en
`data-*` sur un élément plutôt qu'en dur — c'est la seule vraie retouche de
code.

Trois pièges à connaître :

1. **Éditeur de thème** : sans garde, Shopify redirigerait le marchand vers la
   porte à chaque aperçu. Envelopper l'inclusion du snippet dans
   `{% unless request.design_mode %}…{% endunless %}`.
2. **SEO** : la redirection est en JS, donc les robots qui n'exécutent pas de
   script voient la vraie home — pas de perte. Ceux qui l'exécutent suivent
   vers la porte : à surveiller dans la Search Console après mise en ligne.
3. `password.liquid` (la page mot de passe de Shopify) **n'est pas** le bon
   outil : elle verrouille toute la boutique et ne se comporte pas comme une
   porte d'entrée décorative.

## Grands écrans

Le design est calibré pour une fenêtre de **1400px** (`#layout { width }`).
Au-delà on ne l'étale pas — les rails garderaient 1/3 de la largeur mais en
beaucoup plus gros, et le contenu flotterait entre deux bandes noires. La page
entière est zoomée pour conserver les proportions du petit écran :
`applyZoom()` dans `js/shared.js` pose `--page-zoom` (= largeur / 1400, plafonné
à 1.85), que `css/main.css` applique en bas de fichier (bloc « ÉCRANS LARGES »).
Sous 1101px les rails disparaissent et le zoom repasse à 1.

## Merch

2 produits (prix maquette, à confirmer) : pack 3 barrettes « !! » **35€**,
poster **10€**. Clic sur visuel ou bouton → modal (infos, quantité, ajout
panier). Panier localStorage, checkout branché sur Shopify en phase 2.

## Réseaux sociaux

Badges **88x31** sous la photo de profil — le format des boutons de site des
années 2000 — en grille 2x2. Les logos sont les **vrais fichiers**, récupérés
sur Wikimedia Commons et servis en local depuis `assets/img/socials/` :

| fichier | logo | licence Commons |
| --- | --- | --- |
| `instagram-2010.svg` | Instagram 2010 | domaine public |
| `youtube-2006.svg` | YouTube 2006-2011 (le « You » + boîte rouge) | domaine public |
| `discord-2015.svg` | Discord 2015-2021, ancien blurple #7289DA | domaine public |
| `tiktok-text.svg` | TikTok — pas d'ancienne version, c'est l'actuel | domaine public |

Ce sont tous des logos-mots, d'où le format large plutôt que des pastilles
carrées, et le fond clair du badge : leurs couleurs (rouge, blurple, noir) sont
faites pour ça. Marques déposées de leurs propriétaires respectifs, usage
nominatif pour pointer vers les comptes de l'artiste.

## Page secrète

Mot de passe : **Dekonnectée** (accepté sans accents/casse). Fragments cachés
dans 3 pubs (`DEKO` / `NNECT` / `ÉE`, spans `.code-frag`) — les graphistes les
recacheront dans leurs visuels finaux. Saisie via la page Secret OU la barre
« Secret Page » du header. Obfusqué en base64 inversé dans `js/secret.js`.

## Placeholders à remplacer (assets graphistes)

- Visuels produits (fenêtre bento + modal — `CATALOG` dans `js/shared.js`)
- Les 8 pubs des rails (`ADS_LEFT` / `ADS_RIGHT` dans `js/shared.js`) — y
  recacher les 3 fragments du mot de passe
- Bio « About me », interests, friends, fan-arts
- **Liens des réseaux sociaux** : les 4 `href="#"` sous la photo de profil.
  Les logos, eux, sont en place (voir ci-dessous)
- Morceaux du player (`PLAYLIST` dans `js/player.js`) — mp3 placeholder générés
- Rushs BTS (`secret.html`), dates/salles de tournée (`index.html#tournee`)
- Messages des pop-ups d'erreur (`ERRORS` dans `js/intro.js`) — le son, lui,
  est en place : `assets/audio/error.mp3`

## Phase 2 — Shopify

1. Produits créés dans le back-office Shopify, assets hébergés Shopify
2. Conversion en thème : one-pager → template Liquid, `shared.js` → layout/snippets,
   panier démo → cart Shopify natif
3. Chatango : créer le groupe + embed iframe (`index.html#chat`) + fond custom
4. Billetterie : widget Seated ou liens directs
