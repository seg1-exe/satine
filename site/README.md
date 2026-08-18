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
- `secret.html` — page verrouillée par mot de passe (seule autre page)
- `js/shared.js` — chrome commun : layout centré (pubs = 1/3 de largeur), nav +
  scrollspy, rails de pubs, Clippy TV, panier, **modal produit** (quantité +
  add to cart), sparkles. → deviendra `theme.liquid` + snippets côté Shopify
- `js/player.js` — player audio skin WMP « Kenwood KDC-X959 MP7 » (reconstruit
  depuis Kenwood_MP7.wmz), ouverture en slide, repliable (bouton 💿),
  persistant. Assets : `assets/img/kenwood/`
- `js/chat.js` — bots du faux chat
- `css/main.css` — tout le style (variables en tête de fichier)

## Merch

2 produits (prix maquette, à confirmer) : pack 3 barrettes « !! » **35€**,
poster **10€**. Clic sur visuel ou bouton → modal (infos, quantité, ajout
panier). Panier localStorage, checkout branché sur Shopify en phase 2.

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
- Morceaux du player (`PLAYLIST` dans `js/player.js`) — mp3 placeholder générés
- Rushs BTS (`secret.html`), dates/salles de tournée (`index.html#tournee`)

## Phase 2 — Shopify

1. Produits créés dans le back-office Shopify, assets hébergés Shopify
2. Conversion en thème : one-pager → template Liquid, `shared.js` → layout/snippets,
   panier démo → cart Shopify natif
3. Chatango : créer le groupe + embed iframe (`index.html#chat`) + fond custom
4. Billetterie : widget Seated ou liens directs
