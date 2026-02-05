@echo off
echo GitHub Guncelleme Baslatiliyor...
git add .
set msg=Auto update: %date% %time%
git commit -m "%msg%"
git push origin main
echo.
echo Islem tamamlandi!
pause
