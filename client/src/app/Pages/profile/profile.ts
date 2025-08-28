import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
      this.currentUser?.avatar ||
      'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg';
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

    // this.auth.updateProfile(formData).subscribe({
    //   next: (res: any) => {
    //     this.successMessage = 'Profile updated successfully!';
    //     this.loading = false;

        // تحديث بيانات اليوزر الحالية
    //     this.currentUser = res.user;
    //     localStorage.setItem('user', JSON.stringify(res.user));
    //   },
    //   error: (err) => {
    //     this.errorMessage = err?.message || 'Something went wrong';
    //     this.loading = false;
    //   }
    // });
  }
}
