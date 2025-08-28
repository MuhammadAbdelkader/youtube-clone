import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(public auth: Auth) {} // خليها public عشان تشتغل في template

  ngOnInit(): void {
    // إنشاء الفورم مع FormGroup
    this.profileForm = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required])
    });
  }

  onSubmit() {
  if (this.profileForm.invalid) return;

  const password = this.profileForm.value.password ?? '';
  const confirmPassword = this.profileForm.value.confirmPassword ?? '';

  if (password !== confirmPassword) {
    this.errorMessage = "Passwords do not match";
    return;
  }

  const token = localStorage.getItem('accessToken') ?? '';
  if (!token) {
    this.errorMessage = "No reset token found";
    return;
  }

  this.auth.resetPassword(token, password).subscribe({
    next: (res: any) => this.successMessage = res.message,
    error: (err: any) => this.errorMessage = err.error?.message || 'Something went wrong'
  });
}
}
