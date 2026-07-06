import { Component, Output, EventEmitter, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

import { ThemeService } from '../../app/services/theme.service';
import { Auth, UserData } from '../../app/services/auth';
import { NotificationService, AppNotification } from '../../app/services/notification.service';

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
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  isDark = false;
  isMenuOpen = false;
  isLoggedIn = false;
  currentUser: UserData | null = null;
  menuItems: MenuItem[] = [];
  searchQuery = '';

  // Notification state
  isNotifOpen = false;
  notifications: AppNotification[] = [];
  notifsLoading = false;

  @Output() sidebarToggled = new EventEmitter<void>();

  private pollSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private auth: Auth,
    public notifService: NotificationService
  ) {
    this.themeService.activeTheme$.subscribe((theme: 'light' | 'dark') => {
      this.isDark = theme === 'dark';
    });
  }

  ngOnInit() {
    this.authSub = this.auth.currentUser$.subscribe((user) => {
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

        // Initial fetch + poll every 60 seconds
        this.notifService.fetchUnreadCount();
        this.pollSub = interval(60_000).subscribe(() => {
          this.notifService.fetchUnreadCount();
        });
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.menuItems = [];
        this.pollSub?.unsubscribe();
        this.notifService.setUnreadCount(0);
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarToggled.emit();
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.isNotifOpen = false;
  }

  toggleNotifPanel(event: Event) {
    event.stopPropagation();
    this.isNotifOpen = !this.isNotifOpen;
    if (this.isMenuOpen) this.isMenuOpen = false;

    if (this.isNotifOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notifsLoading = true;
    this.notifService.getNotifications().subscribe({
      next: (res: any) => {
        this.notifications = res.data || [];
        this.notifsLoading = false;
      },
      error: () => { this.notifsLoading = false; }
    });
  }

  onNotifClick(notif: AppNotification) {
    if (!notif.isRead) {
      this.notifService.markAsRead(notif._id).subscribe(() => {
        notif.isRead = true;
      });
    }
    this.isNotifOpen = false;
    if (notif.video?._id) {
      this.router.navigate(['/video-details', notif.video._id]);
    } else if (notif.channel?._id) {
      this.router.navigate(['/channel', notif.channel._id]);
    }
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
    });
  }

  getNotifMessage(notif: AppNotification): string {
    const name = notif.sender?.username || 'Someone';
    switch (notif.type) {
      case 'like':         return `${name} liked your video`;
      case 'comment':      return `${name} commented on your video`;
      case 'reply':        return `${name} replied to your comment`;
      case 'subscription': return `${name} subscribed to your channel`;
      case 'new_video':    return `${name} uploaded a new video`;
      default:             return 'New notification';
    }
  }

  @HostListener('document:click')
  closeOnOutsideClick() {
    this.isMenuOpen = false;
    this.isNotifOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeOnEsc() {
    this.isMenuOpen = false;
    this.isNotifOpen = false;
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

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) return;
    this.router.navigate(['/explore'], { queryParams: { q: query } });
  }
}
