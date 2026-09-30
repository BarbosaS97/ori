"""
Configurações compartilhadas do site (uma única fonte para o que se repete em várias páginas).

WHATSAPP_URL  → destino de TODOS os botões de conversão ("Quero transformar o meu espaço", "Fale conosco"...)
                e do botão "Fale conosco" da página de links. É o mesmo link do Linktree delas.
LINKS_PAGE    → página de links; o item "Contato" do menu leva para ela.
SITE_URL      → endereço público do site (termina com "/"). Vai nos links canônicos, na pré-visualização de
                compartilhamento (WhatsApp, Instagram...), no sitemap e na página 404.
                >>> Quando o domínio próprio existir, TROQUE AQUI e rode  python tools/build_site.py  <<<
INDEXAR       → False = o site pede aos buscadores (Google...) para NÃO listar as páginas (fase de testes).
                True  = libera a indexação, gera robots.txt "liberado" e sitemap.xml. Mude só no lançamento.

Para mudar o WhatsApp (ou acrescentar uma mensagem inicial, ex.: ...5561982367700?text=Olá!), edite aqui e rode:
    python tools/build_site.py && python tools/build_links.py
Obs.: o menu, o topo e o hero ficam no index.html (feito à mão) — o audit_static.py avisa se algum
      link de WhatsApp estiver diferente deste.
"""
import os

WHATSAPP_URL = "https://wa.me/5561982367700"
LINKS_PAGE = "links/"

SITE_URL = "https://barbosas97.github.io/ori/"
INDEXAR = False

SITE_NAME = "Studio Óri"
SITE_TITLE = "Studio Óri — Arquitetura e Interiores"
SITE_DESC = "Studio Óri Arquitetura e Interiores. Valorizamos história e originalidade."

# Endereços curtos (redirecionam): pasta -> destino. Ex.: .../link/ leva à página de links.
ALIASES = {
    "link": LINKS_PAGE,
    "contato": LINKS_PAGE,
    "wpp": WHATSAPP_URL,
}

# Pastas (independem do nome da pasta do site: tudo é relativo a este arquivo)
SITE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # …/site
MATERIAL_DIR = os.path.join(os.path.dirname(SITE_DIR), "_material-original")    # fotos e arquivos de origem (não sobem)
COVERS_DIR = os.path.join(MATERIAL_DIR, "instagram")                            # capas dos Reels (reel-01.png …)
