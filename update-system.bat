@echo off
echo ====================================
echo    تحديث نظام الحجوزات
echo ====================================
echo.

echo [1/3] تحديث قاعدة البيانات (notifications + policy)...
node src/database/update-bookings.js
node src/database/add-notifications-table.js

echo.
echo [2/4] تحديث التصميم (Tailwind CSS)...
call npm run build:css

echo.
echo [3/4] تحديث السيرفر...
echo سيتم اعادة تشغيل السيرفر لتفعيل التعديلات الجديدة.
echo.

echo [4/4] تشغيل السيرفر...
npm run dev

echo ====================================
echo    تم الانتهاء!
echo ====================================
pause
