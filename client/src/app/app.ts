import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../Components/navbar/navbar';
import { Sidebar } from "../Components/sidebar/sidebar";
import { ReactiveFormsModule } from '@angular/forms';
import { ToastComponent } from '../Components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Sidebar, ReactiveFormsModule, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('YouCube');
  isSidebarOpen = false;
  isDark = true; // Dark mode is default

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  ngOnInit() {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isDark = false;
      document.body.classList.add('light-theme');
    }
    
    // Set initial sidebar state based on screen width
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      this.isSidebarOpen = true;
    }
    // Dark is default (no class needed — CSS vars default to dark)
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  }
}
