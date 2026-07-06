import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

type UploadState = 'idle' | 'uploading' | 'ai-processing' | 'done';

@Component({
  selector: 'app-create-video',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-video.html',
  styleUrls: ['./create-video.css'],
})
export class CreateVideo {
  videoForm: FormGroup;
  uploadState: UploadState = 'idle';
  successMessage = '';
  errorMessage = '';
  previewVideo: string | null = null;
  selectedFileName = '';
  dragOver = false;
  channelId = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.videoForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(5000)]],
      category: ['Other'],
      tags: [''],
      video: [null, Validators.required],
    });

    // Auto-populate channelId from authenticated user session
    const user = this.auth.getCurrentUser();
    if (user?.channelId) {
      this.channelId = user.channelId;
    }
  }

  // ─── File Handling ───────────────────────────────────────────────────────

  onFileChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) this.setFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('video/')) {
      this.setFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  private setFile(file: File): void {
    this.videoForm.patchValue({ video: file });
    this.selectedFileName = file.name;

    // Generate local preview URL
    if (this.previewVideo) URL.revokeObjectURL(this.previewVideo);
    this.previewVideo = URL.createObjectURL(file);
  }

  removeFile(): void {
    this.videoForm.patchValue({ video: null });
    this.selectedFileName = '';
    if (this.previewVideo) {
      URL.revokeObjectURL(this.previewVideo);
      this.previewVideo = null;
    }
  }

  // ─── Upload ──────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }

    this.uploadState = 'uploading';
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('title', this.videoForm.get('title')?.value);
    formData.append('description', this.videoForm.get('description')?.value);
    formData.append('category', this.videoForm.get('category')?.value);
    formData.append('tags', this.videoForm.get('tags')?.value || '');
    // channelId is resolved automatically on the backend if not provided
    if (this.channelId) {
      formData.append('channel', this.channelId);
    }
    const videoFile: File | null = this.videoForm.get('video')?.value ?? null;
    if (!videoFile) {
      this.errorMessage = 'No video file selected. Please choose a file before uploading.';
      this.uploadState = 'idle';
      return;
    }
    formData.append('video', videoFile, videoFile.name);

    this.auth.uploadVideo(formData).subscribe({
      next: (res: any) => {
        // Upload complete — Gemini AI processing starts asynchronously on server
        this.uploadState = 'ai-processing';

        // Simulate AI processing feedback (server fires and forgets — we show status for UX)
        setTimeout(() => {
          this.uploadState = 'done';
          this.successMessage = 'Video uploaded successfully!';
        }, 3000);
      },
      error: (err) => {
        let rawMsg = err.error?.message || 'Upload failed. Please try again.';
        
        if (err.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
          rawMsg = err.error.errors[0];
        }

        // Handle specific payload limitations
        if (err.status === 413) {
          rawMsg = 'Video file is too large (max 100MB).';
        } else if (rawMsg.toLowerCase().includes('validation')) {
           rawMsg = 'Please verify your inputs.';
        }

        // Sanitize internal token errors from reaching the visual layer
        if (rawMsg.toLowerCase().includes('token')) {
          this.errorMessage = 'Session issue detected. Please check your login status.';
        } else {
          this.errorMessage = rawMsg;
        }
        this.uploadState = 'idle';
      },
    });
  }

  // ─── Reset ───────────────────────────────────────────────────────────────

  uploadAnother(): void {
    this.uploadState = 'idle';
    this.successMessage = '';
    this.errorMessage = '';
    this.removeFile();
    this.videoForm.reset({ category: 'Other' });
  }
}
