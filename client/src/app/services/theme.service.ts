import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private activeThemeSubject = new BehaviorSubject<'light' | 'dark'>(this.getInitialTheme());
  activeTheme$ = this.activeThemeSubject.asObservable();

  constructor() {
    this.applyTheme(this.activeThemeSubject.value);
  }

  private getInitialTheme(): 'light' | 'dark' {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggleTheme() {
    const newTheme = this.activeThemeSubject.value === 'light' ? 'dark' : 'light';
    this.activeThemeSubject.next(newTheme);
    this.applyTheme(newTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Legacy support for body classes if needed by other parts
    if (theme === 'dark') {
      document.body.classList.add('dark-theme', 'bg-dark', 'text-light');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme', 'bg-dark', 'text-light');
    }
    
    localStorage.setItem('theme', theme);
  }

  get activeTheme(): 'light' | 'dark' {
    return this.activeThemeSubject.value;
  }
}
