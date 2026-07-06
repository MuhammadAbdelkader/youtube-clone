import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ChannelService } from '../../services/channel.service';
import { SubscriptionService } from '../../services/subscription.service';
import { Auth } from '../../services/auth';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, RouterModule, CloudinaryPipe, ReactiveFormsModule],
  templateUrl: './channel.html',
  styleUrl: './channel.css',
})
export class ChannelPage implements OnInit {
  channel: any = null;
  videos: any[] = [];
  loading = true;
  notFound = false;
  isOwnChannel = false;
  isSubscribed = false;
  subscribeLoading = false;
  private currentUserId: string | null = null;

  isManaging = false;
  manageForm: FormGroup;
  updateLoading = false;
  avatarFile: File | null = null;
  coverFile: File | null = null;
  avatarPreview: string | null = null;
  coverPreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private channelService: ChannelService,
    private subscriptionService: SubscriptionService,
    private auth: Auth,
    private fb: FormBuilder
  ) {
    this.manageForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
    });
  }

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.currentUserId = user?.id || null;

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.loadChannel(id);
    });
  }

  private loadChannel(id: string): void {
    this.loading = true;
    this.notFound = false;

    this.channelService.getChannelById(id).subscribe({
      next: (res: any) => {
        this.channel = res?.data;

        const ownerId =
          typeof this.channel?.owner === 'object' ? this.channel.owner?._id : this.channel?.owner;
        this.isOwnChannel = !!this.currentUserId && String(ownerId) === String(this.currentUserId);

        this.videos = (this.channel?.videos || [])
          .filter((v: any) => v.isPublic !== false)
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        this.loading = false;

        if (this.auth.isLoggedIn() && !this.isOwnChannel) {
          this.checkSubscriptionStatus(id);
        }
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      },
    });
  }

  private checkSubscriptionStatus(channelId: string): void {
    this.subscriptionService.getSubscriptionStatus(channelId).subscribe({
      next: (res: any) => {
        this.isSubscribed = !!res?.data?.subscribed;
      },
      error: () => {},
    });
  }

  toggleSubscribe(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.channel?._id || this.subscribeLoading) return;

    this.subscribeLoading = true;
    this.subscriptionService.toggleSubscription(this.channel._id).subscribe({
      next: (res: any) => {
        const wasSubscribed = this.isSubscribed;
        this.isSubscribed = !!res?.data?.subscribed;
        if (this.isSubscribed && !wasSubscribed) this.channel.subscribersCount++;
        if (!this.isSubscribed && wasSubscribed) this.channel.subscribersCount--;
        this.subscribeLoading = false;
      },
      error: (err) => {
        console.error('Subscription error:', err);
        alert(err.error?.message || 'Failed to toggle subscription. Please try again.');
        this.subscribeLoading = false;
      },
    });
  }

  openManageModal(): void {
    this.isManaging = true;
    this.manageForm.patchValue({
      title: this.channel.title,
      description: this.channel.description,
    });
    this.avatarFile = null;
    this.coverFile = null;
    this.avatarPreview = null;
    this.coverPreview = null;
  }

  closeManageModal(): void {
    this.isManaging = false;
  }

  onAvatarChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.avatarFile = file;
      this.avatarPreview = URL.createObjectURL(file);
    }
  }

  onCoverChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.coverFile = file;
      this.coverPreview = URL.createObjectURL(file);
    }
  }

  onManageSubmit(): void {
    if (this.manageForm.invalid) return;

    this.updateLoading = true;
    const formData = new FormData();
    formData.append('title', this.manageForm.get('title')?.value);
    formData.append('description', this.manageForm.get('description')?.value);
    if (this.avatarFile) formData.append('avatar', this.avatarFile);
    if (this.coverFile) formData.append('coverImage', this.coverFile);

    this.channelService.updateChannel(this.channel._id, formData).subscribe({
      next: (res: any) => {
        this.channel = res.data;
        this.isManaging = false;
        this.updateLoading = false;
        if (this.avatarPreview) URL.revokeObjectURL(this.avatarPreview);
        if (this.coverPreview) URL.revokeObjectURL(this.coverPreview);
      },
      error: (err) => {
        console.error('Update channel error:', err);
        alert(err.error?.message || 'Failed to update channel.');
        this.updateLoading = false;
      },
    });
  }
}
