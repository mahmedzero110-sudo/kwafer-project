@echo off
echo ====================================
echo    اصلاح قاعدة البيانات
echo ====================================
echo.

echo [1/2] تشغيل migration للـ CMS...
node src/database/cms-migration.js

echo.
echo [2/2] إعادة تشغيل السيرفر...
echo يمكنك الآن تشغيل: npm run dev
echo.
echo ====================================
echo    تم الانتهاء!
echo ====================================
pause
