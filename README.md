# 📺 TUTO — Changer les pubs du site avec Claude

*Pour mettre à jour les publicités des rails (et du mobile) sans rien casser,
même pendant que le dev est en vacances 🏖️*

---

## L'essentiel en 30 secondes

- Les pubs finales vivent dans `site/assets/img/pubs/`.
- Deux formats sur le site : **image fixe → .webp**, **animée → .mp4** (h264).
  ⚠️ Jamais de GIF ni de webp animé directement : ça glitche à l'affichage
  (bug de rendu Chromium avec le zoom du site). Claude fait la conversion.
- La liste des pubs, leurs liens et leurs priorités : tableau `ADS` en tête de
  `site/js/shared.js`. **Tu n'as pas besoin d'y toucher** : Claude s'en occupe.
- Les fichiers source (lourds) sont rangés dans `masters/` — jamais commités.

## Étape par étape

### 1. Ouvre le projet dans Claude Code
Application Claude (onglet Code) → ouvrir le dossier `Documents/velar/satine`.

### 2. Dépose tes fichiers
Glisse les nouvelles pubs dans `site/assets/img/pubs/` — **n'importe quel
format d'origine** : mp4, mov, gif, png, jpg… même très lourds. C'est le rôle
de Claude de les optimiser.

### 3. Dis à Claude quoi en faire
Exemples de messages qui marchent bien (adapte les noms) :

> Je t'ai mis `pub-noel.mp4` dans pubs/, optimise-la et ajoute-la aux pubs.
> Au clic elle doit ouvrir la fiche produit des barrettes.

> Remplace `pub-tour` par cette nouvelle version (`tour-v2.mov` dans pubs/).

> Je t'ai mis 3 nouvelles pubs dans pubs/, optimise-les et ajoute-les.
> `pub-album.mp4` doit être épinglée tout en haut. Les autres en random.

> Supprime la pub `satine-cat` de la rotation.

**Le vocabulaire des priorités** (le système existe déjà, il suffit de le
demander) :
- « **épingle-la tout en haut** » → toujours 1er emplacement des rails
- « **épingle-la tout en bas** » → toujours dernier emplacement
- « **exclus-la du mobile** » → pour les formats trop hauts (comme full-barette)
- « **elle doit toujours apparaître sur mobile** » → comme pub-password
- liens possibles : fiche produit barrettes/poster, ancre `#tournee`/`#merch`,
  URL externe, ou **aucun lien** (comme l'énigme pub-password)

### 4. Vérifie ce que Claude a fait
Sa réponse doit cocher ces cases — sinon, demande-lui :
- [ ] fichier optimisé (webp pour du fixe, **mp4 pour de l'animé**) et poids
      raisonnable (< 2-3 Mo par pub)
- [ ] le master d'origine déplacé dans `masters/`
- [ ] test dans le navigateur (il montre une capture)
- [ ] **thème Shopify régénéré** (`python3 tools/build-shopify.py`) et zip
      sous 50 Mo

Pour regarder toi-même : le site local tourne sur **http://localhost:8137**
(s'il ne répond pas, demande à Claude de relancer le serveur, ou lance :
`npx http-server site -p 8137 -c-1`). Recharge plusieurs fois : les pubs
changent d'emplacement à chaque visite, c'est normal — c'est la régie.

### 5. Publie
- **Vercel (site actuel)** :
  ```bash
  git add . && git commit -m "nouvelles pubs" && git push
  ```
- **Shopify** : Boutique en ligne → Thèmes → Ajouter un thème → Importer
  `satine-theme.zip` (à la racine du projet), puis Publier le nouveau et supprimer l'ancien (bien vérifier les dates d'import pour éviter un soucis).

## Specs à donner aux graphistes

- Largeur affichée ~220 px dans les rails → livrer **≥ 660 px de large**
  (3×), hauteur libre.
- Animations : **quelques secondes, en boucle, sans son**. Format mp4 de
  préférence, mais un gif/mov lourd convient — Claude convertit.
- Éviter les formats très hauts si la pub doit vivre sur mobile (les
  gratte-ciels type full-barette sont exclus du mobile).

## Pièges connus

| symptôme | cause | remède |
|---|---|---|
| la pub animée « glitche » | webp/gif animé + zoom du site | toujours du **mp4** pour l'animé (Claude le sait) |
| la pub n'apparaît jamais sur mobile | seulement 6 places mobiles | normal pour certaines ; sinon demander « toujours sur mobile » |
| Shopify refuse le zip | > 50 Mo | demander à Claude d'alléger (il sait quoi couper) |
| la pub est là en local mais pas sur Shopify | thème pas régénéré ou zip pas ré-importé | « régénère le thème » + ré-import du zip |
| git refuse de pousser (fichier > 100 Mo) | un master commité par erreur | demander à Claude de le retirer de l'historique (il l'a déjà fait) |

## Prompt tout-en-un (à copier-coller)

> Je t'ai déposé de nouvelles pubs dans `site/assets/img/pubs/` : [noms des
> fichiers]. Optimise-les (webp pour le fixe, mp4 pour l'animé), range les
> masters, ajoute-les à la régie avec ces liens : [fiche barrettes / poster /
> tournée / rien]. Priorités : [tout en haut / tout en bas / random].
> Vérifie sur desktop et mobile, régénère le thème Shopify, et montre-moi
> des captures.
