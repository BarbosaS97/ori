import os,re,glob,sys,collections
root='.'
pages=['index.html']+sorted(glob.glob('projetos/*/index.html'))+glob.glob('links/index.html')
def exists_cs(path):
    """existência com diferenciação de maiúsculas (como no GitHub Pages/Linux)"""
    parts=os.path.normpath(path).split(os.sep); cur='.' 
    for p in parts:
        if p in ('.',''): continue
        if p=='..': cur=os.path.normpath(os.path.join(cur,'..')); continue
        try: names=os.listdir(cur)
        except: return False
        if p not in names: return False
        cur=os.path.join(cur,p)
    return True
issues=collections.defaultdict(list); total_refs=0
for pg in pages:
    h=open(pg,encoding='utf-8').read(); base=os.path.dirname(pg)
    ids=re.findall(r'\sid="([^"]+)"',h)
    dup=[i for i,c in collections.Counter(ids).items() if c>1]
    if dup: issues[pg].append(f'ids duplicados: {dup}')
    # recursos locais (src/href/srcset/url)
    refs=re.findall(r'(?:src|href)="([^"#?][^"]*)"',h)
    for s in re.findall(r'srcset="([^"]+)"',h): refs+= [x.strip().split(' ')[0] for x in s.split(',')]
    for r in set(refs):
        if re.match(r'(https?:|data:|mailto:|tel:)',r): continue
        total_refs+=1
        target=os.path.join(base,r.split('?')[0])
        if r.endswith('/'): target=os.path.join(target,'index.html')
        if not exists_cs(target): issues[pg].append(f'recurso/link inexistente (ou caixa diferente): {r}')
    # âncoras internas #x -> precisam de id no mesmo doc (ou em index.html via ../../#x)
    anchors=set(re.findall(r'href="#([^"]+)"',h))
    for a in anchors:
        if a not in ids: issues[pg].append(f'âncora sem destino: #{a}')
    home_ids=set(re.findall(r'\sid="([^"]+)"',open('index.html',encoding='utf-8').read()))
    for m in set(re.findall(r'href="\.\./\.\./(?:\?[^"#]*)?#([^"]+)"',h)):
        if m not in home_ids: issues[pg].append(f'âncora da Home sem destino: #{m}')
    # imagens sem alt / sem dimensões
    for tag in re.findall(r'<img\b[^>]*>',h):
        if 'alt=' not in tag: issues[pg].append(f'img sem alt: {tag[:70]}')
        if 'width=' not in tag and 'class="lb__img"' not in tag: issues[pg].append(f'img sem width/height: {tag[:70]}')
    # versões de cache (?v=hash) em dia com o conteúdo do arquivo?
    import hashlib
    for r in set(re.findall(r'(?:src|href|data-src)="([^"]+\?v=[0-9a-f]{8})"',h)):
        clean,ver=r.split('?v=')
        t2=os.path.join(base,clean)
        if os.path.isfile(t2) and hashlib.md5(open(t2,'rb').read()).hexdigest()[:8]!=ver:
            issues[pg].append(f'versão de cache DESATUALIZADA (rode python tools/build_site.py): {clean}')
    # conversão: nenhum #contato sobrando e todo link de WhatsApp igual ao de site_config.py
    import sys as _s; _s.path.insert(0, os.path.dirname(__file__)) if False else None
    from importlib.machinery import SourceFileLoader
    WA = SourceFileLoader('site_config', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'site_config.py')).load_module().WHATSAPP_URL
    if re.search(r'href="[^"]*#contato"', h): issues[pg].append('ainda existe link para #contato')
    for w in set(re.findall(r'href="(https?://(?:wa\.me|api\.whatsapp\.com)[^"]*)"', h)):
        if w != WA: issues[pg].append(f'WhatsApp diferente do site_config.py: {w}')
    # cabeçalhos
    hs=[int(x) for x in re.findall(r'<h([1-6])\b',h)]
    if hs.count(1)!=1: issues[pg].append(f'h1 count={hs.count(1)}')
    for a,b in zip(hs,hs[1:]):
        if b-a>1: issues[pg].append(f'salto de heading h{a}->h{b}')
    if '<html lang=' not in h: issues[pg].append('sem lang')
    if 'name="viewport"' not in h: issues[pg].append('sem viewport')
print('páginas:',len(pages),'| referências locais checadas:',total_refs)
agg=collections.Counter()
for pg,l in issues.items():
    for x in l: agg[(x if pg=='index.html' else re.sub(r'\d+','N',x))]+=1
home=[x for x in issues.get('index.html',[])]
print('\nHOME:'); [print(' -',x) for x in home] or None
print('\nPÁGINAS DE PROJETO (agrupado):')
c=collections.Counter(x for pg,l in issues.items() if pg!='index.html' for x in l)
[print(f' - ({n}x) {x}') for x,n in c.items()]
if not issues: print('nenhum problema')
