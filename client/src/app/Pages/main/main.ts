import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [CommonModule, RouterModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})

export class Main implements OnInit {
  videos: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const headers = new HttpHeaders({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFjYTBkNzI1NWNlZGJkOWRlMDgxZGYiLCJpYXQiOjE3NTYzMjA1MDEsImV4cCI6MTc1NjMyMTQwMX0.JIw3C3upnem6Q_7oG3NZqbtsU660CUNS8SWKyiDxRRo"
    });

    this.http.get<any>('http://localhost:3000/videos', { headers }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        this.videos = res.data || res;
      },
      error: (err) => console.error(err)
    });
  }
}
