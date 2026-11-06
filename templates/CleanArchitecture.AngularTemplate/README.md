# 🏛️ Senior Engineers Guide — Clean Architecture & Angular 19 Template

قالب أساسي برمجي متكامل لتطبيقات المؤسسات والأنظمة المتقدمة مبني وفق معمارية **Clean Architecture + CQRS + MediatR + EF Core 9** مع واجهة **Angular 19 Standalone + Tailwind CSS + RTL**.

---

## 📐 معمارية النظام (Solution Architecture)

```text
CleanArchitecture.AngularTemplate/
├── CleanArchitecture.AngularTemplate.sln
├── src/
│   ├── Domain/                 # الكيانات الأساسية والقواعد الجوهرية (Entities, BaseEntity)
│   ├── Application/            # منطق التطبيق وحالات الاستخدام (CQRS, MediatR, Interfaces)
│   ├── Infrastructure/         # قواعد البيانات والأمان (EF Core 9, SQL Server, PasswordHasher, JWT)
│   └── Web/                    # نقاط النهاية والفرونت إند (Minimal APIs, ClientApp)
│       └── ClientApp/          # تطبيق أنجولار الحديث (Angular 19 Standalone, Tailwind CSS, RTL)
├── scripts/                    # سكربتات البناء والنشر التلقائي
│   ├── publish.ps1             # حزمة البناء الموحدة للمحتوى والداشبورد
│   └── run-dev.ps1             # تشغيل بيئة التطوير
└── README.md
```

---

## 🚀 كيفية استخدام ونقل القالب لمشروع جديد (Migration Guide)

### 1. الاستنساخ وتخصيص الأسماء:
- انسخ مجلد `CleanArchitecture.AngularTemplate` واستبدل اسم الحزمة أو المجال بمشروعك الجديد (مثلاً `ClinicManagement` أو `EcommerceCore`).

### 2. إعداد قاعدة البيانات (SQL Server):
- قم بضبط نص الاتصال `ConnectionStrings:DefaultConnection` في `src/Web/appsettings.json`.
- قم بتحديث وتطبيق قاعدة البيانات:
```bash
dotnet ef database update --project src/Infrastructure --startup-project src/Web
```

### 3. تثبيت اعتماديات الواجهة الأمامية (Angular 19):
```bash
cd src/Web/ClientApp
npm install
```

---

## 📦 البناء والنشر الموحد (Single Production Package)

المشروع مجهز تلقائياً داخل `src/Web/Web.csproj` لجمع وبناء واجهة Angular ووضعها داخل مجلد `wwwroot` الخاص بالـ API عند تنفيذ أمر النشر:

### أمر النشر الموحد:
```bash
dotnet publish src/Web/Web.csproj -c Release -o ./publish
```

### تشغيل الحزمة الناتجة في خادم الإنتاج:
```bash
cd publish
dotnet Web.dll
```
عند فتح العنوان في المتصفح، تعمل واجهة التطبيق والـ API معاً من منفذ واحد بدون الحاجة لإعداد سيرفرين منفصلين!

---

## ⚡ التشغيل السريع في بيئة التطوير (Development Setup)

يمكنك تشغيل المخدم والفرونت إند معاً بواسطة أمر واحد:
```powershell
.\scripts\run-dev.ps1
```

- **رابط الـ API:** `http://localhost:5000` أو `http://localhost:5215`
- **رابط الـ Client App:** `http://localhost:4200`
