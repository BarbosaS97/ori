"""
Fonte única de dados dos 9 projetos (letra, nome, tema, imagens escolhidas).
Usada por build_images.py (otimiza as fotos) e build_site.py (gera Home + páginas).

Para trocar/ordenar fotos: edite `picks` (índices na lista de arquivos da pasta de origem,
em ordem natural: 1.jpg, 2.jpg, 10.jpg...). A PRIMEIRA foto de `picks` é a capa (prévia da Home + topo da página).
Para editar textos: `lead` (rascunho baseado só no que se vê nas imagens — a cliente deve revisar).
"""

# pasta com as fotos originais (fora do repositório)
SOURCE_ROOT = r"C:\Users\df91103ps\Documents\Ori"

# Cores dos blocos da marca. `on` = cor do texto sobre o bloco (contraste)
TILE = {
    "terracota": {"hex": "#974315", "on": "#F3EFEC"},
    "salvia":    {"hex": "#8D957E", "on": "#1F1F1F"},
    "azul":      {"hex": "#313D65", "on": "#F3EFEC"},
    "grafite":   {"hex": "#1F1F1F", "on": "#F3EFEC"},
}

PROJECTS = [
    dict(slug="casa-aconchego", letter="S", name="Casa Aconchego", type="residencial", tile="terracota",
         tone=("#C9A98A", "#8A5A3A"), src="projetos residenciais/Casa Aconchego",
         picks=[63, 8, 9, 19, 28, 35, 36, 20, 47, 52], cover_pos="50% 55%",
         lead="Madeira aparente, tons quentes e um pátio ajardinado que traz luz e verde para dentro da casa."),
    dict(slug="apartamento-mar", letter="T", name="Apartamento Mar", type="residencial", tile="salvia",
         tone=("#B9C4C0", "#6F8480"), src="projetos residenciais/Apartamento Mar",
         picks=[4, 0, 3, 8, 5, 14, 16, 2, 9], cover_pos="50% 62%",
         lead="Sala integrada à varanda, com vista para o mar, madeira, pedra e verde-oliva em uma paleta suave."),
    dict(slug="rancho-oc", letter="U", name="Rancho OC", type="residencial", tile="azul",
         tone=("#B8B29A", "#6E6A4F"), src="projetos residenciais/Rancho OC",
         picks=[8, 1, 3, 5, 4, 6, 7, 12, 17, 15, 10], cover_pos="50% 50%",
         lead="Pedra, madeira e vidro em um refúgio à beira do lago, aberto para a paisagem."),
    dict(slug="rr", letter="D", name="Projeto R&R", type="residencial", tile="grafite",
         tone=("#D8C9B8", "#A98B72"), src="projetos residenciais/Projeto R&R",
         picks=[4, 3, 8, 1, 7, 13, 12, 15, 20, 19], cover_pos="50% 60%",
         lead="Uma área de lazer com piscina, deck e cobogós, pensada para receber ao ar livre."),
    dict(slug="jo", letter="I", name="Projeto JO", type="residencial", tile="terracota",
         tone=("#A9B39A", "#6F7B5E"), src="projetos residenciais/Projeto JO",
         picks=[3, 0, 1, 2, 4, 5, 7, 9, 11, 13], cover_pos="50% 55%",
         lead="Cozinha e jantar integrados a um jardim interno, com parede em verde-petróleo e marcenaria clara."),
    dict(slug="oliva", letter="O", name="Apartamento Oliva", type="residencial", tile="salvia", symbol=True,
         tone=("#C7B7A3", "#8B7B6A"), src="projetos residenciais/Apartamento Oliva",
         picks=[1, 2, 3, 4, 0, 5, 7, 8, 9], cover_pos="50% 60%",
         lead="Um apartamento compacto, com verdes suaves, madeira clara e marcenaria que faz o espaço render."),
    dict(slug="olie", letter="Ó", name="Ólie Beauty Clinic", type="comercial", tile="azul",
         tone=("#E2CFC1", "#BC9E8D"), src="projetos comerciais/ÓLIE BEAUTY CLINIC",
         picks=[2, 3, 4, 5, 6, 7, 8, 1, 0, 14], cover_pos="50% 55%",
         lead="Clínica de beleza de paleta clara, com madeira, vegetação e detalhes dourados que acolhem quem chega."),
    dict(slug="guarita-victoria", letter="R", name="Guarita Victória", type="institucional", tile="terracota",
         tone=("#7F8794", "#3F4652"), src="projetos institucionais/Guarita Residencial Victória",
         picks=[9, 4, 3, 5, 11, 12, 10, 16, 17, 15], cover_pos="50% 55%",
         lead="Guarita e portaria de condomínio com pórtico em concreto e pedra, paisagismo e iluminação integrada."),
    dict(slug="quarto-ambar", letter="I", name="Quarto Âmbar", type="residencial", tile="grafite",
         tone=("#C9905F", "#8E4F22"), src="projetos residenciais/Quarto Âmbar",
         picks=[4, 5, 6, 3, 0, 8, 10, 11, 1, 2, 7], cover_pos="50% 60%",
         lead="Suíte com closet, home office e cabeceira ripada, em tons de âmbar e madeira escura."),
]
