import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../Components/navbar/navbar';
import { Sidebar } from "../Components/sidebar/sidebar";
import { ReactiveFormsModule } from '@angular/forms';
import { Auth } from './services/auth'; // Update the path as needed

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Sidebar, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('client');
  isSidebarOpen = false;
  isDark = false;
constructor(public auth: Auth) {}
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  ngOnInit() {
    // check localStorage for theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDark = true;
      document.body.classList.add('dark-theme');
    }
    const expiresAt = localStorage.getItem('expiresAt');
  if (expiresAt) {
    const remaining = +expiresAt - Date.now();
    if (remaining > 0) {
      this.auth.startAutoLogoutTimer(remaining); // لو لسه في وقت
    } else {
      this.auth.logout(); // خلص خلاص
    }
  }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }
}
