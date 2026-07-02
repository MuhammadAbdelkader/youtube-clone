import { Component, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { ThemeService } from '../../app/services/theme.service';
import { Auth, UserData } from '../../app/services/auth';

interface MenuItem {
  label: string;
  icon: string;
  action?: () => void;
  route?: string;
  isDanger?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  isDark = false;
  isMenuOpen = false;
  isLoggedIn = false;
  currentUser: UserData | null = null;
  menuItems: MenuItem[] = [];

  @Output() sidebarToggled = new EventEmitter<void>();

  constructor(private router: Router, private themeService: ThemeService, private auth: Auth) {
    this.themeService.activeTheme$.subscribe((theme: 'light' | 'dark') => {
      this.isDark = theme === 'dark';
    });
  }

  ngOnInit() {
    this.auth.currentUser$.subscribe((user) => {
      if (user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        this.menuItems = [
          { label: 'Profile', icon: 'fa-user', route: '/profile' },
          { label: 'Create Video', icon: 'fa-video', route: '/createvideo' },
          {
            label: 'Logout',
            icon: 'fa-right-from-bracket',
            action: () => this.logout(),
            isDanger: true
          }
        ];
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.menuItems = [];
      }
    });
  }

  toggleSidebar() {
    this.sidebarToggled.emit(); // ده اللي هنتلقطه في الـ Layout/Parent
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation(); // مايقفلش بسبب كليك الوثيقة
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click')
  closeOnOutsideClick() {
    this.isMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeOnEsc() {
    this.isMenuOpen = false;
  }

  logout() {
    this.auth.logout();
    this.isMenuOpen = false;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/default-avatar.png';
  }
}
