#!/usr/bin/env python3
"""
Génère le thème Shopify (shopify-theme/ + satine-theme.zip) depuis site/.

À relancer après chaque évolution de site/ :  python3 tools/build-shopify.py

Ce que fait le script :
  1. collecte les assets RÉFÉRENCÉS par les pages/css/js (les autres sont
     listés comme inutilisés) ;
  2. les copie à plat dans shopify-theme/assets/ (l'arborescence n'existe pas
     sur le CDN Shopify) — collisions de noms résolues par préfixe de dossier,
     correspondances écrites dans asset-map.json ;
  3. transforme les CSS (url('../assets/x/y.png') → url('y.png'), même
     dossier sur le CDN) et les JS ('assets/x/y.png' → ASSET('y.png'), le
     helper étant injecté en tête — window.__ASSET_BASE est posé par les
     layouts) ; liens internes : index.html → /, secret.html → /pages/secret,
     intro.html → /pages/entrer ;
  4. génère layout/theme.liquid + layout/intro.liquid et les templates
     index / page.entrer / page.secret depuis les HTML (asset → asset_url).
     Le script de porte du <head> d'index.html est extrait tel quel puis
     adapté (GATE_URL, garde request.design_mode) ;
  5. laisse en place les gabarits de compatibilité déjà présents (404,
     product, …), config/ et locales/ ;
  6. zippe le tout dans satine-theme.zip à la racine.
"""

import json
import os
import re
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = os.path.join(ROOT, 'shopify-theme')
ZIP = os.path.join(ROOT, 'satine-theme.zip')

# fichiers scannés pour les références d'assets + embarqués dans le thème
HTML_PAGES = ['index.html', 'secret.html', 'intro.html']
CSS_FILES = ['css/main.css', 'css/intro.css']
JS_FILES = ['js/shared.js', 'js/intro.js', 'js/secret.js', 'js/player-cd.js']

ASSET_RE = re.compile(r"assets/[A-Za-z0-9_\-./]+?\.[A-Za-z0-9]+")

# liens internes site → Shopify (ordre important : *.html avant les ancres)
LINKS = [
    ('secret.html', '/pages/secret'),
    ('intro.html', '/pages/entrer'),
    ("'index.html'", "'/'"),
    ('"index.html"', '"/"'),
    ('href="index.html', 'href="/'),
]


def read(p):
    with open(os.path.join(SITE, p), encoding='utf-8') as f:
        return f.read()


def collect_refs():
    refs = set()
    for p in HTML_PAGES + CSS_FILES + JS_FILES:
        refs.update(ASSET_RE.findall(read(p)))
    missing = sorted(r for r in refs if not os.path.isfile(os.path.join(SITE, r)))
    if missing:
        sys.exit('ERREUR : références vers des assets absents :\n  ' + '\n  '.join(missing))
    return refs


def flat_map(refs):
    """chemin site → nom plat CDN, collisions résolues par préfixe de dossier"""
    by_base = {}
    for r in sorted(refs):
        by_base.setdefault(os.path.basename(r), []).append(r)
    mapping = {}
    for base, paths in by_base.items():
        if len(paths) == 1:
            mapping[paths[0]] = base
        else:
            for p in paths:
                parent = os.path.basename(os.path.dirname(p))
                mapping[p] = f'{parent}-{base}'
    return mapping


def rewrite_links(text):
    for a, b in LINKS:
        text = text.replace(a, b)
    return text


def build_assets(mapping):
    adir = os.path.join(OUT, 'assets')
    shutil.rmtree(adir, ignore_errors=True)
    os.makedirs(adir)

    for src, flat in mapping.items():
        shutil.copy2(os.path.join(SITE, src), os.path.join(adir, flat))

    # CSS : les urls deviennent relatives au dossier plat du CDN
    for p in CSS_FILES:
        css = read(p)
        css = ASSET_RE.sub(lambda m: mapping[m.group(0)], css.replace('../assets/', 'assets/'))
        with open(os.path.join(adir, os.path.basename(p)), 'w', encoding='utf-8') as f:
            f.write(css)

    # JS : chemins → ASSET('nom-plat') ; liens internes réécrits.
    # Les fichiers du site utilisent des apostrophes pour leurs littéraux :
    # la substitution « '…' + ASSET() + '…' » reste donc du JS valide.
    helper = ("/* résolution des assets sur le CDN Shopify — __ASSET_BASE est posé\n"
              "   par layout/theme.liquid (et intro.liquid). */\n"
              "function ASSET(f) { return (window.__ASSET_BASE || 'assets/') + f; }\n\n")
    for p in JS_FILES:
        js = rewrite_links(read(p))
        js = ASSET_RE.sub(lambda m: "' + ASSET('%s') + '" % mapping[m.group(0)], js)
        with open(os.path.join(adir, os.path.basename(p)), 'w', encoding='utf-8') as f:
            f.write(helper + js)

    with open(os.path.join(OUT, 'asset-map.json'), 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=1, sort_keys=True)


def body_of(html):
    m = re.search(r'<body[^>]*>(.*)</body>', html, re.S)
    return m.group(1).strip()


def liquidify(text, mapping):
    """assets → asset_url + liens internes, pour les templates"""
    text = rewrite_links(text)
    return ASSET_RE.sub(lambda m: "{{ '%s' | asset_url }}" % mapping[m.group(0)], text)


def head_gate_script():
    """extrait le <script> de tête d'index.html (rv-ready + porte) et
    le découpe : rv-ready toujours, porte gardée par template/design_mode"""
    head = read('index.html').split('</head>')[0]
    m = re.search(r'<script>\n(.*?)\n  </script>', head, re.S)
    script = m.group(1)
    gate_at = script.index('    (function () {')
    reveal, gate = script[:gate_at].rstrip(), script[gate_at:]
    gate = gate.replace("var GATE_URL = 'intro.html';", "var GATE_URL = '/pages/entrer';")
    return reveal, gate


def build_layouts(mapping):
    reveal, gate = head_gate_script()
    theme = f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{{{{ page_title | default: shop.name }}}} ★ MySAT'S BLOG</title>
  <meta name="description" content="Le blog officiel de SATINE : chanteuse, productrice. Merch, tournée, clip et secrets.">
  {{% if template == 'page.secret' %}}<meta name="robots" content="noindex">{{% endif %}}
  <link rel="icon" type="image/png" href="{{{{ 'favicon-64.png' | asset_url }}}}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=VT323&family=Comic+Relief:wght@400;700&family=Comic+Neue:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  {{{{ 'main.css' | asset_url | stylesheet_tag }}}}
  {{{{ 'intro.css' | asset_url | stylesheet_tag }}}}
  <script>
    /* base CDN des assets du thème, consommée par ASSET() dans les JS */
    window.__ASSET_BASE = "{{{{ 'main.css' | asset_url | split: 'main.css' | first }}}}";

{reveal}
  </script>
  {{% if template == 'index' %}}{{% unless request.design_mode %}}
  <script>
    /* PORTE D'ENTRÉE (voir templates/page.entrer.liquid). request.design_mode :
       jamais dans l'éditeur de thème, sinon le marchand serait redirigé à
       chaque aperçu. */
{gate}
  </script>
  {{% endunless %}}{{% endif %}}
  <script src="{{{{ 'shared.js' | asset_url }}}}" defer></script>
  <script src="{{{{ 'intro.js' | asset_url }}}}" defer></script>
  {{% if template == 'page.secret' %}}
  <script src="{{{{ 'player-cd.js' | asset_url }}}}" defer></script>
  <script src="{{{{ 'secret.js' | asset_url }}}}" defer></script>
  {{% endif %}}
  {{{{ content_for_header }}}}
</head>
<body data-page="{{% if template == 'page.secret' %}}secret{{% else %}}home{{% endif %}}">
{{{{ content_for_layout }}}}
</body>
</html>
'''
    with open(os.path.join(OUT, 'layout', 'theme.liquid'), 'w', encoding='utf-8') as f:
        f.write(theme)

    intro = f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{{{{ shop.name }}}} ★ entrer</title>
  <meta name="robots" content="noindex">
  <link rel="icon" type="image/png" href="{{{{ 'favicon-64.png' | asset_url }}}}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=VT323&family=Comic+Relief:wght@400;700&family=Comic+Neue:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  {{{{ 'main.css' | asset_url | stylesheet_tag }}}}
  {{{{ 'intro.css' | asset_url | stylesheet_tag }}}}
  <link rel="preload" as="image" href="{{{{ '{mapping['assets/img/anim-intro-top.webp']}' | asset_url }}}}">
  <link rel="preload" as="image" href="{{{{ '{mapping['assets/img/anim-intro-bottom.webp']}' | asset_url }}}}">
  <script>window.__ASSET_BASE = "{{{{ 'main.css' | asset_url | split: 'main.css' | first }}}}";</script>
  <script src="{{{{ 'intro.js' | asset_url }}}}" defer></script>
  {{{{ content_for_header }}}}
</head>
<body data-page="intro">
{{{{ content_for_layout }}}}
</body>
</html>
'''
    with open(os.path.join(OUT, 'layout', 'intro.liquid'), 'w', encoding='utf-8') as f:
        f.write(intro)

    # page mot de passe (boutique protégée) : mêmes étoiles que la porte
    password_layout = '''<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{{ shop.name }} ★ coming soon</title>
  <meta name="robots" content="noindex">
  <link rel="icon" type="image/png" href="{{{{ 'favicon-64.png' | asset_url }}}}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=VT323&family=Comic+Relief:wght@400;700&family=Comic+Neue:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  {{ 'main.css' | asset_url | stylesheet_tag }}
  {{ 'intro.css' | asset_url | stylesheet_tag }}
  <script>window.__ASSET_BASE = "{{ 'main.css' | asset_url | split: 'main.css' | first }}";</script>
  <script src="{{ 'intro.js' | asset_url }}" defer></script>
  {{ content_for_header }}
</head>
<body data-page="intro">
{{ content_for_layout }}
</body>
</html>
'''
    with open(os.path.join(OUT, 'layout', 'password.liquid'), 'w', encoding='utf-8') as f:
        f.write(password_layout)

    password_tpl = '''{% comment %} Page « boutique protégée » — même ciel étoilé que la porte
d'entrée, formulaire du mot de passe boutique à la place de la flèche.
Généré par tools/build-shopify.py {% endcomment %}
{% layout 'password' %}
<canvas id="stars"></canvas>
<div class="pw-gate">
  <h1 class="intro-title" data-text="SATINE">SATINE</h1>
  <p class="pw-sub">🚪 le site n'est pas encore ouvert… il te faut le mot de passe</p>
  {% if shop.password_message != blank %}<p class="pw-msg">{{ shop.password_message }}</p>{% endif %}
  {% form 'storefront_password' %}
    {{ form.errors | default_errors }}
    <div class="code-row">
      <input type="password" name="password" placeholder="······" autocomplete="off" aria-label="Mot de passe">
      <button class="btn-buy" type="submit">OUVRIR</button>
    </div>
  {% endform %}
</div>
'''
    with open(os.path.join(OUT, 'templates', 'password.liquid'), 'w', encoding='utf-8') as f:
        f.write(password_tpl)


def build_templates(mapping):
    tdir = os.path.join(OUT, 'templates')

    home = liquidify(body_of(read('index.html')), mapping)
    with open(os.path.join(tdir, 'index.liquid'), 'w', encoding='utf-8') as f:
        f.write("{% comment %} Home one-pager SATINE — généré depuis site/index.html "
                "par tools/build-shopify.py ; le chrome (header/nav/rails/clippy) est "
                "construit par shared.js {% endcomment %}\n" + home + '\n')

    secret = liquidify(body_of(read('secret.html')), mapping)
    with open(os.path.join(tdir, 'page.secret.liquid'), 'w', encoding='utf-8') as f:
        f.write("{% comment %} Page secrète (code : voir secret.js) — créer une Page "
                "de handle « secret » avec ce template. Généré depuis site/secret.html "
                "{% endcomment %}\n" + secret + '\n')

    entrer = liquidify(body_of(read('intro.html')), mapping)
    with open(os.path.join(tdir, 'page.entrer.liquid'), 'w', encoding='utf-8') as f:
        f.write("{% comment %} Porte d'entrée — créer une Page de handle « entrer » "
                "avec ce template. Layout dédié sans chrome. Généré depuis "
                "site/intro.html {% endcomment %}\n{% layout 'intro' %}\n" + entrer + '\n')


def list_unused():
    used = set(collect_refs())
    unused = []
    for dirpath, _, files in os.walk(os.path.join(SITE, 'assets')):
        for fn in files:
            if fn == '.DS_Store':
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), SITE)
            if rel not in used:
                unused.append(rel)
    return sorted(unused)


def make_zip():
    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for dirpath, _, files in os.walk(OUT):
            for fn in files:
                if fn == '.DS_Store':
                    continue
                full = os.path.join(dirpath, fn)
                z.write(full, os.path.relpath(full, OUT))


def main():
    refs = collect_refs()
    mapping = flat_map(refs)
    build_assets(mapping)
    build_layouts(mapping)
    build_templates(mapping)
    make_zip()
    print(f'assets embarqués : {len(mapping)}')
    dup = [v for v in mapping.values() if '-' in v and v not in (os.path.basename(k) for k in mapping)]
    print(f'zip : {ZIP} ({os.path.getsize(ZIP) // 1024} Ko)')
    unused = list_unused()
    print(f'\nassets NON référencés dans site/assets ({len(unused)}) :')
    for u in unused:
        size = os.path.getsize(os.path.join(SITE, u))
        print(f'  {u}  ({size // 1024} Ko)')


if __name__ == '__main__':
    main()
