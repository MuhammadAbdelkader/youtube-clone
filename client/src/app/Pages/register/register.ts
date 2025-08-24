import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private auth: Auth,private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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
        this.successMessage = 'Account created successfully!';
        this.loading = false;
        this.registerForm.reset();
        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Something went wrong';
        this.loading = false;
      }
    });
  }
}
