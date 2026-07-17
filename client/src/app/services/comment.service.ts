import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CommentAuthor {
  _id: string;
  username: string;
  avatar_url: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: CommentAuthor;
  video: string;
  parentComment: string | null;
  isEdited: boolean;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  replies?: Comment[];
  repliesCount?: number;
  liked?: boolean;
  disliked?: boolean;
  likeActionLoading?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  getVideoComments(videoId: string, page = 1, limit = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/video/${videoId}?page=${page}&limit=${limit}`);
  }

  getCommentReplies(commentId: string, page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/${commentId}/replies?page=${page}&limit=${limit}`);
  }

  addComment(videoId: string, content: string, parentCommentId?: string): Observable<any> {
    return this.http.post(
      this.apiUrl,
      { videoId, content, parentCommentId: parentCommentId || undefined },
      { withCredentials: true }
    );
  }

  updateComment(commentId: string, content: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${commentId}`,
      { content },
      { withCredentials: true }
    );
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${commentId}`, { withCredentials: true });
  }
}
