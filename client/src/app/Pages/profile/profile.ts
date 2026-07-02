import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  previewImage: string | ArrayBuffer | null = null;
  currentUser: any;

  constructor(private fb: FormBuilder, private auth: Auth) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();

    this.profileForm = this.fb.group({
      username: [this.currentUser?.username || '', Validators.required],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(8)]],
      avatar: [null] // خليها نفس اسم الحقل في الباك
    });

    this.previewImage =
      this.currentUser?.avatar_url || this.currentUser?.avatar ||
      'assets/images/default-avatar.png';
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/default-avatar.png';
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileForm.patchValue({ avatar: file });

      const reader = new FileReader();
      reader.onload = () => (this.previewImage = reader.result);
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('username', this.profileForm.get('username')?.value);
    formData.append('email', this.profileForm.get('email')?.value);
    if (this.profileForm.get('password')?.value) {
      formData.append('password', this.profileForm.get('password')?.value);
    }
    if (this.profileForm.get('avatar')?.value) {
      formData.append('avatar', this.profileForm.get('avatar')?.value);
    }

    this.auth.updateProfile(formData).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Could track progress here if needed
        } else if (event.type === HttpEventType.Response) {
          this.successMessage = 'Profile updated successfully!';
          this.loading = false;

          // Push updated user into the auth stream → navbar avatar refreshes reactively
          if (event.body?.user) {
            this.currentUser = event.body.user;
            this.auth.updateCurrentUser(event.body.user);
            // Refresh previewImage from Cloudinary's canonical URL if a new avatar was uploaded
            if (event.body.user.avatar_url) {
              this.previewImage = event.body.user.avatar_url;
            }
          }
        }
      },
      error: (err) => {
        let msg = 'Unable to connect to service. Please check your connection.';
        if (err?.status === 403) {
          msg = 'Authentication service configuration error. Please try again later.';
        } else if (err?.error?.message) {
          msg = err.error.message;
        }
        
        // Sanitize internal token errors from reaching the visual layer
        if (msg.toLowerCase().includes('token')) {
          msg = 'Session issue detected. Please check your login status.';
        }

        this.errorMessage = msg;
        this.loading = false;
      }
    });
  }
}
