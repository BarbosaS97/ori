"""
Tags de SEO e de pré-visualização de compartilhamento, iguais para todas as páginas.
Usado por build_site.py (páginas de projeto), build_links.py e build_seo.py (Home e 404).
"""
import html, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from site_config import INDEXAR, SITE_URL, SITE_NAME

esc = lambda s: html.escape(s, quote=True)

def head_tags(path, title, description, image, indent="  "):
    """path: caminho da página a partir da raiz do site ('' = Home, 'links/', 'projetos/rr/').
       image: caminho da imagem 1200x630 a partir da raiz (ex.: 'assets/og/home.jpg')."""
    url = SITE_URL + path
    robots = "index, follow" if INDEXAR else "noindex, nofollow"
    tags = [
        f'<meta name="robots" content="{robots}">',
        f'<link rel="canonical" href="{esc(url)}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{esc(SITE_NAME)}">',
        '<meta property="og:locale" content="pt_BR">',
        f'<meta property="og:title" content="{esc(title)}">',
        f'<meta property="og:description" content="{esc(description)}">',
        f'<meta property="og:url" content="{esc(url)}">',
        f'<meta property="og:image" content="{esc(SITE_URL + image)}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    return ("\n" + indent).join(tags)
