import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class Guard implements CanActivate {
  constructor(private router: Router, private auth: Auth) {}

  canActivate(): boolean {
    
    if (this.auth.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['/login']);       return false;
    }
  }
}
