import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <header class="bg-indigo-700 text-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 class="text-xl font-bold">قالب المؤسسات المطور (Clean Architecture + Angular 19)</h1>
        <span class="text-xs bg-indigo-800 px-3 py-1 rounded-full text-indigo-200">جاهز للتخصيص</span>
      </header>
      <main class="flex-1 container mx-auto px-4 py-6">
        <router-outlet></router-outlet>
      </main>
      <footer class="bg-slate-800 text-slate-400 py-3 text-center text-xs">
        &copy; 2026 Enterprise App Boilerplate. Clean Architecture & Angular 19 Standalone.
      </footer>
    </div>
  `
})
export class AppComponent {}
