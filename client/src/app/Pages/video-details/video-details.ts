import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { VideoService } from '../../services/video.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';
import { environment } from '../../../environments/environment';
import { LikeService } from '../../services/like.service';
import { SubscriptionService } from '../../services/subscription.service';
import { CommentService, Comment } from '../../services/comment.service';
import { Auth } from '../../services/auth';
import { AvatarComponent } from '../../components/avatar/avatar.component';

@Component({
  selector: 'app-video-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CloudinaryPipe, AvatarComponent],
  templateUrl: './video-details.html',
  styleUrl: './video-details.css'
})
export class VideoDetails implements OnInit {
  video: any = null;
  relatedVideos: any[] = [];
  loading = true;
  error = '';
  apiUrl = environment.apiUrl;

  // ── Likes ──────────────────────────────────────────────────────
  liked = false;
  disliked = false;
  likeActionLoading = false;

  // ── Subscribe ──────────────────────────────────────────────────
  isSubscribed = false;
  subscribeLoading = false;

  // ── Comments ───────────────────────────────────────────────────
  comments: Comment[] = [];
  commentsLoading = true;
  commentsTotal = 0;
  newCommentText = '';
  postingComment = false;
  replyBoxOpenFor: string | null = null;
  replyText = '';
  postingReply = false;
  editingCommentId: string | null = null;
  editText = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService,
    private likeService: LikeService,
    private subscriptionService: SubscriptionService,
    private commentService: CommentService,
    public auth: Auth
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        switchMap(queryParams => {
          const v = queryParams.get('v');
          const id = this.route.snapshot.paramMap.get('id');
          const finalId = v || id;
          return finalId ? this.videoService.getVideoById(finalId) : [];
        })
      )
      .subscribe({
        next: (res: any) => {
          this.video = res?.data || res;
          this.loading = false;

          if (this.video?._id) {
            this.videoService.streamVideo(this.video._id).subscribe();
            this.loadComments();

            // Like/subscribe status endpoints require auth on the backend --
            // guests can still SEE counts and comments, just not personalized
            // liked/subscribed state.
            if (this.auth.isLoggedIn()) {
              this.checkLikeStatus();
              this.checkSubscriptionStatus();
            }
          }
        },
        error: (err) => {
          this.error = 'Video not found.';
          this.loading = false;
          console.error(err);
        }
      });

    // Fetch related/trending videos for sidebar
    this.videoService.getTrendingVideos().subscribe({
      next: (res: any) => this.relatedVideos = res?.data || [],
      error: () => {}
    });
  }

  get channelId(): string | null {
    return this.video?.channel?._id || this.video?.channel || null;
  }

  get isOwnVideo(): boolean {
    const currentUserId = this.auth.getCurrentUser()?.id;
    const ownerId = this.video?.userId?._id || this.video?.userId;
    return !!currentUserId && currentUserId === ownerId;
  }

  // ── Likes / Dislikes ──────────────────────────────────────────

  private checkLikeStatus(): void {
    this.likeService.getLikeStatus('video', this.video._id).subscribe({
      next: (res: any) => {
        this.liked = !!res?.data?.liked;
        this.disliked = !!res?.data?.disliked;
      },
      error: () => {}
    });
  }

  toggleLike(type: 'like' | 'dislike'): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.likeActionLoading) return;

    this.likeActionLoading = true;
    this.likeService.toggleLike('video', this.video._id, type).subscribe({
      next: (res: any) => {
        const resultType = res?.data?.type; // 'like' | 'dislike' | null
        const wasLiked = this.liked, wasDisliked = this.disliked;

        this.liked = resultType === 'like';
        this.disliked = resultType === 'dislike';

        // Reflect the count delta locally instead of refetching the whole video.
        if (wasLiked && !this.liked) this.video.likesCount--;
        if (!wasLiked && this.liked) this.video.likesCount++;
        if (wasDisliked && !this.disliked) this.video.dislikesCount--;
        if (!wasDisliked && this.disliked) this.video.dislikesCount++;

        this.likeActionLoading = false;
      },
      error: () => { this.likeActionLoading = false; }
    });
  }

  // ── Subscribe ──────────────────────────────────────────────────

  private checkSubscriptionStatus(): void {
    if (!this.channelId) return;
    this.subscriptionService.getSubscriptionStatus(this.channelId).subscribe({
      next: (res: any) => { this.isSubscribed = !!res?.data?.subscribed; },
      error: () => {}
    });
  }

  toggleSubscribe(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.channelId || this.subscribeLoading) return;

    this.subscribeLoading = true;
    this.subscriptionService.toggleSubscription(this.channelId).subscribe({
      next: (res: any) => {
        const wasSubscribed = this.isSubscribed;
        this.isSubscribed = !!res?.data?.subscribed;

        if (this.video?.channel && typeof this.video.channel === 'object') {
          const current = this.video.channel.subscribersCount || 0;
          if (this.isSubscribed && !wasSubscribed) this.video.channel.subscribersCount = current + 1;
          if (!this.isSubscribed && wasSubscribed) this.video.channel.subscribersCount = Math.max(0, current - 1);
        }

        this.subscribeLoading = false;
      },
      error: () => { this.subscribeLoading = false; }
    });
  }

  // ── Comments ───────────────────────────────────────────────────

  loadComments(): void {
    this.commentsLoading = true;
    this.commentService.getVideoComments(this.video._id).subscribe({
      next: (res: any) => {
        this.comments = res?.data || [];
        this.commentsTotal = res?.pagination?.total ?? this.comments.length;
        this.commentsLoading = false;
      },
      error: () => { this.commentsLoading = false; }
    });
  }

  postComment(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const content = this.newCommentText.trim();
    if (!content || this.postingComment) return;

    this.postingComment = true;
    this.commentService.addComment(this.video._id, content).subscribe({
      next: (res: any) => {
        this.comments = [{ ...res?.data, replies: [], repliesCount: 0 }, ...this.comments];
        this.commentsTotal++;
        this.video.commentsCount = (this.video.commentsCount || 0) + 1;
        this.newCommentText = '';
        this.postingComment = false;
      },
      error: () => { this.postingComment = false; }
    });
  }

  toggleReplyBox(commentId: string): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.replyBoxOpenFor = this.replyBoxOpenFor === commentId ? null : commentId;
    this.replyText = '';
  }

  postReply(parentComment: Comment): void {
    const content = this.replyText.trim();
    if (!content || this.postingReply) return;

    this.postingReply = true;
    this.commentService.addComment(this.video._id, content, parentComment._id).subscribe({
      next: (res: any) => {
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies = [...parentComment.replies, res?.data];
        parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
        this.video.commentsCount = (this.video.commentsCount || 0) + 1;
        this.replyText = '';
        this.replyBoxOpenFor = null;
        this.postingReply = false;
      },
      error: () => { this.postingReply = false; }
    });
  }

  loadMoreReplies(comment: Comment): void {
    this.commentService.getCommentReplies(comment._id, 1, comment.repliesCount || 20).subscribe({
      next: (res: any) => { comment.replies = res?.data || []; },
      error: () => {}
    });
  }

  isCommentOwner(comment: Comment): boolean {
    const currentUserId = this.auth.getCurrentUser()?.id;
    return !!currentUserId && currentUserId === comment.author?._id;
  }

  startEdit(comment: Comment): void {
    this.editingCommentId = comment._id;
    this.editText = comment.content;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editText = '';
  }

  saveEdit(comment: Comment): void {
    const content = this.editText.trim();
    if (!content) return;

    this.commentService.updateComment(comment._id, content).subscribe({
      next: (res: any) => {
        comment.content = res?.data?.content || content;
        comment.isEdited = true;
        this.editingCommentId = null;
      },
      error: () => {}
    });
  }

  // ── Delete confirmation (styled modal, not a native confirm()) ─────────
  confirmingDelete: { comment: Comment; parent?: Comment } | null = null;
  deletingComment = false;

  // `parent` is passed when deleting a reply, so it can be spliced out of the
  // right array -- top-level comments and replies live in different places.
  requestDeleteComment(comment: Comment, parent?: Comment): void {
    this.confirmingDelete = { comment, parent };
  }

  cancelDeleteComment(): void {
    this.confirmingDelete = null;
  }

  confirmDeleteComment(): void {
    if (!this.confirmingDelete || this.deletingComment) return;
    const { comment, parent } = this.confirmingDelete;

    this.deletingComment = true;
    this.commentService.deleteComment(comment._id).subscribe({
      next: () => {
        if (parent && parent.replies) {
          parent.replies = parent.replies.filter(r => r._id !== comment._id);
          parent.repliesCount = Math.max(0, (parent.repliesCount || 1) - 1);
        } else {
          this.comments = this.comments.filter(c => c._id !== comment._id);
          this.commentsTotal = Math.max(0, this.commentsTotal - 1);
        }
        this.video.commentsCount = Math.max(0, (this.video.commentsCount || 1) - 1);
        this.deletingComment = false;
        this.confirmingDelete = null;
      },
      error: () => {
        this.deletingComment = false;
        this.confirmingDelete = null;
      }
    });
  }
}
