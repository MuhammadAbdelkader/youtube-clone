import { Component, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, FormControl, FormGroup,ReactiveFormsModule } from '@angular/forms';


interface MenuItem {
  label: string;
  icon: string;
  action?: () => void;
  route?: string;
  isDanger?: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule,FormsModule,ReactiveFormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  isDark = false;
  isMenuOpen = false;
  isLoggedIn = false;
  avatarUrl: string | null = null;
  menuItems: MenuItem[] = [];
  searchForm = new FormGroup({
    query: new FormControl('')
  });

  @Output() sidebarToggled = new EventEmitter<void>();

  constructor(private router: Router) {}

  ngOnInit()  {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDark = true;
      document.body.classList.add('dark-theme');
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.isLoggedIn = true;
      this.avatarUrl =
        localStorage.getItem('avatar_url') ||
        'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg';

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
    }
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('avatar');
    this.isLoggedIn = false;
    this.isMenuOpen = false;
    this.router.navigate(['/login']);
  }

  onSearch() {
    const searchQuery = this.searchForm.value.query?.trim();
    if (searchQuery) {
      // ينقل للصفحة search ويضيف query param
      this.router.navigate(['/search'], { queryParams: { q: searchQuery } });
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

