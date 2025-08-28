import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './search.html',
  styleUrls: ['./search.css']
})
export class SearchComponent {
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);

  searchForm = new FormGroup({
    query: new FormControl('')
  });

  videos: any[] = [];
  query: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.searchForm.patchValue({ query: this.query });
        this.fetchVideos(this.query);
      }
    });
  }

 fetchVideos(query: string) {
  this.auth.searchVideos(query).subscribe({
    next: res => {
      console.log('Raw API response:', res);
      this.videos = Array.isArray(res.data) ? res.data : [];
      console.log('Videos array:', this.videos);
    },
    error: err => console.error('Search error:', err)
  });
}


  onSearch() {
    const q = this.searchForm.value.query?.trim();
    if (!q) return;
    this.query = q;
    this.fetchVideos(q);
  }

  trackById(index: number, item: any) {
    return item._id;
  }
}
