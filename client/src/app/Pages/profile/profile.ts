import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { ChannelService } from '../../services/channel.service';
import { getErrorMessage } from '../../utils/http-error.util';

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

  myChannel: any = null;
  channelLoading = true;
  channelForm!: FormGroup;
  creatingChannel = false;
  channelError = '';

  constructor(private fb: FormBuilder, private auth: Auth, private channelService: ChannelService) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();

    this.profileForm = this.fb.group({
      username: [this.currentUser?.username || '', Validators.required],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(8)]],
      avatar: [null] // خليها نفس اسم الحقل في الباك
    });

    this.channelForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      category: ['Other'],
    });

    this.previewImage =
      this.currentUser?.avatar_url || this.currentUser?.avatar ||
      'assets/images/default-avatar.png';

    this.loadMyChannel();
  }

  loadMyChannel(): void {
    this.channelLoading = true;
    this.channelService.getMyChannel().subscribe({
      next: (res: any) => {
        this.myChannel = res?.data || null;
        this.channelLoading = false;
      },
      error: () => {
        this.myChannel = null;
        this.channelLoading = false;
      }
    });
  }

  createChannel(): void {
    if (this.channelForm.invalid) {
      this.channelForm.markAllAsTouched();
      return;
    }

    this.creatingChannel = true;
    this.channelError = '';

    this.channelService.createChannel(this.channelForm.value).subscribe({
      next: (res: any) => {
        this.myChannel = res?.data;
        this.creatingChannel = false;
      },
      error: (err) => {
        this.channelError = getErrorMessage(err, 'Could not create channel. Please try again.');
        this.creatingChannel = false;
      }
    });
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

          if (event.body?.user) {
            this.currentUser = event.body.user;
            this.auth.updateCurrentUser(event.body.user);
            if (event.body.user.avatar_url) {
              this.previewImage = event.body.user.avatar_url;
            }
          }
        }
      },
      error: (err) => {
        this.errorMessage = getErrorMessage(err, 'Could not update profile.');
        this.loading = false;
      }
    });
  }
}
