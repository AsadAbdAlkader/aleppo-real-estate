import { Component, signal } from '@angular/core';

interface SystemModule {
  id: string;
  name: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">لوحة التحكّم والقالب الأساسي</h2>
        <p class="text-slate-600 text-sm">
          هيكل البرمجية جاهز بالكامل وفق معمارية Clean Architecture مع Angular 19 Standalone و Tailwind CSS وترقيم RTL.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div class="text-slate-500 text-xs mb-1">النمط المعماري</div>
          <div class="text-lg font-bold text-indigo-600">Clean Architecture</div>
          <div class="text-xs text-slate-400 mt-2">Domain, Application, Infrastructure, Web</div>
        </div>
        <div class="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div class="text-slate-500 text-xs mb-1">إدارة البناء الموحد</div>
          <div class="text-lg font-bold text-emerald-600">SPA Single Package</div>
          <div class="text-xs text-slate-400 mt-2">dotnet publish auto-builds Angular into wwwroot</div>
        </div>
        <div class="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div class="text-slate-500 text-xs mb-1">تقنيات الواجهة الأمامية</div>
          <div class="text-lg font-bold text-sky-600">Angular 19 Signals</div>
          <div class="text-xs text-slate-400 mt-2">Modern Control Flow (@if, @for, @switch)</div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">وحدات التطبيق الجاهزة للتخصيص</h3>

        @if (modules().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (mod of modules(); track mod.id) {
              <div class="p-4 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <div class="font-bold text-slate-800">{{ mod.name }}</div>
                  <div class="text-xs text-slate-500">{{ mod.description }}</div>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                  {{ mod.status }}
                </span>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-8 text-slate-400 text-sm">لا توجد وحدات مفعلة حالياً</div>
        }
      </div>
    </div>
  `
})
export class DashboardComponent {
  modules = signal<SystemModule[]>([
    { id: '1', name: 'وحدة الهوية والأمان (JWT Auth)', description: 'تسجيل الدخول، التسجيل، صلاحيات JWT Bearer', status: 'نشط' },
    { id: '2', name: 'معالجات CQRS & MediatR', description: 'فصل الأوامر والاستعلامات عبر الأنظمة الفرعية', status: 'نشط' },
    { id: '3', name: 'بيانات SQL Server & EF Core 9', description: 'السجلات والجداول الأساسية مع Migration جاهز', status: 'نشط' },
    { id: '4', name: 'البناء والنشر الجاهز (SPA Publish)', description: 'حزمة موحدة جاهزة للتثبيت والتشغيل الفوري', status: 'نشط' }
  ]);
}
