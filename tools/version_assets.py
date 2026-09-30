"""
Versiona (cache busting) os arquivos referenciados pelo HTML: style.css -> style.css?v=<hash do conteúdo>.

Por quê: o GitHub Pages deixa CSS/JS/imagens em cache por ~10 min. Sem versão na URL, quem visitou há pouco
recebia HTML NOVO com CSS/JS ANTIGOS (menu com botão sem estilo, prévia sem foto...). Com o hash na URL, HTML novo
sempre pede arquivos novos, e arquivo que não mudou continua em cache.

Rodar depois de editar CSS/JS/imagens:   python tools/build_site.py   (já chama este script)
Ou só isto:                              python tools/version_assets.py
"""
import glob, hashlib, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = ('.css', '.js', '.webp', '.jpg', '.jpeg', '.png', '.svg')
PAGES = ['index.html', os.path.join('historia', 'index.html'), os.path.join('projetos', 'index.html')] + sorted(glob.glob(os.path.join('projetos', '*', 'index.html'))) + [os.path.join('links', 'index.html'), '404.html']

def file_hash(path):
    return hashlib.md5(open(path, 'rb').read()).hexdigest()[:8]

def versioned(url, base):
    if re.match(r'(https?:|data:|#|mailto:|tel:)', url): return url
    clean = url.split('?')[0]
    if not clean.lower().endswith(EXT): return url
    target = os.path.normpath(os.path.join(base, clean))
    if not os.path.isfile(target): return url
    return f'{clean}?v={file_hash(target)}'

def process(page):
    path = os.path.join(HERE, page)
    base = os.path.dirname(path)
    s = open(path, encoding='utf-8').read()
    orig = s
    s = re.sub(r'((?:src|href|data-src)=")([^"]+)(")', lambda m: m.group(1) + versioned(m.group(2), base) + m.group(3), s)
    def srcset(m):
        parts = []
        for p in m.group(2).split(','):
            u, *rest = p.strip().split(' ')
            parts.append(' '.join([versioned(u, base)] + rest))
        return m.group(1) + ', '.join(parts) + m.group(3)
    s = re.sub(r'((?:data-)?srcset=")([^"]+)(")', srcset, s)
    if s != orig: open(path, 'w', encoding='utf-8').write(s)
    return s != orig

def run():
    changed = sum(process(p) for p in PAGES if os.path.isfile(os.path.join(HERE, p)))
    print(f'versões de cache atualizadas em {changed} de {len(PAGES)} páginas.')

if __name__ == '__main__':
    run()
