<<<<<<< HEAD
import { Component, Output, EventEmitter } from '@angular/core';
=======
import { Component } from '@angular/core';
>>>>>>> c20b66e1b2de5a2406841d2eebd3245b76341ba3
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
<<<<<<< HEAD
  isDark = false;

  @Output() sidebarToggled = new EventEmitter<void>();
=======


  isDark = false;
>>>>>>> c20b66e1b2de5a2406841d2eebd3245b76341ba3

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

<<<<<<< HEAD
  toggleSidebar() {
    this.sidebarToggled.emit(); // ده اللي هنتلقطه في الـ Layout/Parent
  }
=======
>>>>>>> c20b66e1b2de5a2406841d2eebd3245b76341ba3
}
