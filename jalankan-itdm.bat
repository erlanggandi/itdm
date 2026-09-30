@echo off
title IT Data Platform (ITDP)
echo ======================================================================
echo                     IT DATA PLATFORM
echo   Sistem Manajemen & Backup Akun Email dan Hotspot Karyawan
echo ======================================================================
echo.

if not exist "node_modules\" (
    echo Menginstal dependensi awal...
    call npm install
)

if not exist "dist\" (
    echo Melakukan build aplikasi awal...
    call npm run build
)

echo Membuka browser di http://localhost:5000 ...
start "" http://localhost:5000

echo Menjalankan server IT Data Platform...
call npm start
pause
