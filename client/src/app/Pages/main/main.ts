import { Component } from '@angular/core';

@Component({
  selector: 'app-main',
  imports: [],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {

<<<<<<< HEAD
=======
export class Main implements OnInit {
  videos: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const headers = new HttpHeaders({
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFjYTBkNzI1NWNlZGJkOWRlMDgxZGYiLCJpYXQiOjE3NTYyMzU1NjgsImV4cCI6MTc1NjIzNjQ2OH0.Ri9nPxaWjTFbNMnYHqR7M_lZN5c33u_eVANcv2go7Bc"
    });

    this.http.get<any>('http://localhost:3000/videos', { headers }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        this.videos = res.data || res;
      },
      error: (err) => console.error(err)
    });
  }
>>>>>>> a306ba7 (update the project)
}
