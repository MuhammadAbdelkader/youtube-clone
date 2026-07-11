import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * AvatarComponent
 *
 * A smart, self-contained avatar that handles every possible state:
 *
 *  1. Custom uploaded photo  ➜  renders <img> with Cloudinary/S3 URL
 *  2. ui-avatars.com fallback ➜  renders <img> (the API already generates
 *                                a coloured initial letter server-side)
 *  3. No URL at all (legacy)  ➜  renders a pure CSS initial-letter circle
 *                                so the UI never shows a broken image icon
 *
 * Usage:
 *  <app-avatar [src]="channel.avatar" [name]="channel.title" size="48" />
 *  <app-avatar [src]="user.avatar_url" [name]="user.username" size="36" shape="square" />
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showImage) {
      <img
        [src]="resolvedSrc"
        [alt]="name"
        [style.width.px]="size"
        [style.height.px]="size"
        [class]="'avatar-img ' + shape"
        (error)="onImgError()"
        loading="lazy"
      />
    } @else {
      <!-- CSS-only fallback: coloured circle / square with first letter -->
      <div
        class="avatar-fallback"
        [class]="shape"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.background]="bgColour"
        [style.font-size.px]="fontSize"
        [attr.aria-label]="name + ' avatar'"
        role="img"
      >
        {{ initial }}
      </div>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
    }

    .avatar-img,
    .avatar-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      object-fit: cover;
      flex-shrink: 0;
      user-select: none;
      /* DO NOT use width/height 100% — size is controlled by [style.width.px]
         and [style.height.px] bindings directly on each element */
    }

    /* Shape variants */
    .avatar-img.circle,
    .avatar-fallback.circle {
      border-radius: 50%;
    }

    .avatar-img.square,
    .avatar-fallback.square {
      border-radius: 8px;
    }

    /* Fallback-specific styles */
    .avatar-fallback {
      color: #fff;
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1;
      font-family: 'Inter', 'Outfit', system-ui, sans-serif;
      /* Subtle inner shadow for depth */
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
    }
  `],
})
export class AvatarComponent implements OnChanges {
  /** Avatar image URL (Cloudinary, ui-avatars.com, or null/undefined) */
  @Input() src: string | null | undefined = null;

  /** Display name used for the initial letter and colour derivation */
  @Input() name: string = 'User';

  /** Pixel size (applies to both width and height) */
  @Input() size: number = 40;

  /** 'circle' (default, YouTube-style) or 'square' (channel banners etc.) */
  @Input() shape: 'circle' | 'square' = 'circle';

  // ─── Computed state ──────────────────────────────────────────────────────

  showImage = false;
  resolvedSrc = '';
  initial = '';
  bgColour = '';
  fontSize = 16;

  /**
   * Curated dark-mode palette.
   * Same algorithm as server-side avatar.utils.js so colours always match,
   * even if the server-generated URL hasn't loaded yet.
   */
  private readonly PALETTE: [string, string][] = [
    ['#7c3aed', '#ede9fe'], // violet
    ['#2563eb', '#dbeafe'], // blue
    ['#0891b2', '#cffafe'], // cyan
    ['#059669', '#d1fae5'], // emerald
    ['#d97706', '#fef3c7'], // amber
    ['#dc2626', '#fee2e2'], // red
    ['#db2777', '#fce7f3'], // pink
    ['#7c3aed', '#ede9fe'], // violet (repeat)
    ['#4f46e5', '#e0e7ff'], // indigo
    ['#0284c7', '#e0f2fe'], // sky
  ];

  ngOnChanges(changes: SimpleChanges): void {
    this.compute();
  }

  /** Called by the img (error) binding when the URL fails to load */
  onImgError(): void {
    this.showImage = false;
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private compute(): void {
    const seed = (this.name || 'User').trim();
    this.initial = (seed[0] || 'U').toUpperCase();
    this.bgColour = this.deriveBackground(seed);
    this.fontSize = Math.round(this.size * 0.42);

    if (this.src) {
      this.resolvedSrc = this.src;
      this.showImage = true;
    } else {
      // No URL → fall back to the pure-CSS circle immediately
      this.showImage = false;
    }
  }

  /** Deterministic: uses a static solid purple background for all fallbacks */
  private deriveBackground(name: string): string {
    return '#7c3aed'; // Solid purple
  }
}
