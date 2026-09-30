"""
Configurações compartilhadas do site (uma única fonte para o que se repete em várias páginas).

WHATSAPP_URL  → destino de TODOS os botões de conversão ("Quero transformar o meu espaço", "Fale conosco"...)
                e do botão "Fale conosco" da página de links. É o mesmo link do Linktree delas.
LINKS_PAGE    → página de links; o item "Contato" do menu leva para ela.

Para mudar o WhatsApp (ou acrescentar uma mensagem inicial, ex.: ...5561982367700?text=Olá!), edite aqui e rode:
    python tools/build_site.py && python tools/build_links.py
Obs.: o menu, o topo e o hero ficam no index.html (feito à mão) — o audit_static.py avisa se algum
      link de WhatsApp estiver diferente deste.
"""
WHATSAPP_URL = "https://wa.me/5561982367700"
LINKS_PAGE = "links/"
