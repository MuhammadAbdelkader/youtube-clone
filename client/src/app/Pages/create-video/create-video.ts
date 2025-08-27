import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import {jwtDecode} from 'jwt-decode';

interface DecodedToken {
  userId: string;
  exp: number;
  iat: number;
}

@Component({
  selector: 'app-create-video',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-video.html',
  styleUrls: ['./create-video.css']
})
export class CreateVideo {
  videoForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  previewVideo: string | null = null;

  constructor(private fb: FormBuilder, private auth: Auth) {
    this.videoForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      thumbnailUrl: ['', Validators.required],
      duration: ['', Validators.required],
      video: [null, Validators.required]
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.videoForm.patchValue({ video: file });

      // حساب duration من الفيديو
      const videoEl = document.createElement('video');
      videoEl.src = URL.createObjectURL(file);
      videoEl.onloadedmetadata = () => {
        this.videoForm.patchValue({ duration: Math.floor(videoEl.duration) });
      };

      this.previewVideo = URL.createObjectURL(file);
    }
  }

  onSubmit() {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const token = localStorage.getItem('accessToken');
    let userId = '';
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        userId = decoded.userId;
      } catch {
        this.errorMessage = 'Invalid token';
        this.loading = false;
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', this.videoForm.get('title')?.value);
    formData.append('description', this.videoForm.get('description')?.value);
    formData.append('thumbnailUrl', this.videoForm.get('thumbnailUrl')?.value);
    formData.append('duration', this.videoForm.get('duration')?.value);
    formData.append('video', this.videoForm.get('video')?.value);

    // userId مش هيجيلك input من الفورم، لازم من التوكن
    formData.append('userId', userId);

    this.auth.uploadVideo(formData).subscribe({
      next: (res: any) => {
        this.successMessage = 'Video uploaded successfully!';
        this.loading = false;
        this.previewVideo = null;
        this.videoForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Something went wrong';
        this.loading = false;
      }
    });
  }
}
