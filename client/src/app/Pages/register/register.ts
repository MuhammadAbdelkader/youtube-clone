import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private auth: Auth, private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      avatar: [null]
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.patchValue({ avatar: file });
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.auth.register(this.registerForm.value).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.successMessage = 'Account created successfully!';

        // خزن التوكن واليوزر
        localStorage.setItem('accessToken', res.accessToken);
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }

        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Something went wrong';
        this.loading = false;
      }
    });
  }
}
