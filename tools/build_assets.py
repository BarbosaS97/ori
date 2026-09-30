import cv2,glob,os
from PIL import Image
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); root=os.path.join(os.path.dirname(HERE),'_material-original'); out=os.path.join(HERE,'assets')   # vídeo de origem em ../_material-original/
f=glob.glob(os.path.join(root,'Camera_advancing*.mp4'))[0]
c=cv2.VideoCapture(f); N=201
tot=[0,0]
for i in range(N):
    ok,fr=c.read()
    im=Image.fromarray(cv2.cvtColor(fr,cv2.COLOR_BGR2RGB))
    d=os.path.join(out,'frames-d',f'{i:03d}.webp'); im.save(d,'WEBP',quality=66,method=6)
    w,h=im.size; cw=int(h*9/16); x0=int((w-cw)/2)
    m=im.crop((x0,0,x0+cw,h)); m.save(os.path.join(out,'frames-m',f'{i:03d}.webp'),'WEBP',quality=62,method=6)
    tot[0]+=os.path.getsize(d); tot[1]+=os.path.getsize(os.path.join(out,'frames-m',f'{i:03d}.webp'))
print('desktop MB',tot[0]/1e6,'mobile MB',tot[1]/1e6, 'mobile size',m.size)
h=Image.open(os.path.join(root,'fotos ensaio','Home.png')).convert('RGB'); print(h.size)
h.save(os.path.join(out,'hero-socias.webp'),'WEBP',quality=88,method=6)
h.save(os.path.join(out,'hero-socias.jpg'),quality=86)
print(os.path.getsize(os.path.join(out,'hero-socias.webp'))/1e3,'KB')
