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
      channel: ['', Validators.required],
      video: [null, Validators.required],
    });
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
    formData.append('channel', this.videoForm.get('channel')?.value);
    formData.append('video', this.videoForm.get('video')?.value);

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
        this.errorMessage = err.error?.message || 'Upload failed. Please try again.';
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
