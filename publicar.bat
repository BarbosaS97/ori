@echo off
rem Gera o site, confere e envia ao GitHub. Uso: duplo clique, ou  publicar.bat "mensagem"
cd /d "%~dp0"
echo == Gerando o site ==
python tools\build_site.py || goto erro
python tools\build_links.py || goto erro
echo == Conferindo ==
python tools\audit_static.py || goto erro
set MSG=%~1
if "%MSG%"=="" set MSG=Atualiza o site
git add -A
git commit -m "%MSG%"
git push || goto erro
echo.
echo Pronto! Em 1 a 4 minutos o GitHub Pages atualiza.
pause
exit /b 0
:erro
echo.
echo Algo deu errado (veja acima). Nada foi publicado.
pause
exit /b 1
