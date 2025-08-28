import { Auth } from './../../services/auth';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.html',
  styleUrls: ['./subscriptions.css']
})
export class subscriptions implements OnInit {
  channels: any[] = [];
  loading = true;
  defaultImage = '../../../assets/images/YChannel.jpeg';
  constructor(private auth: Auth) {}

  ngOnInit(): void {
    this.auth.getAllChannels().subscribe({
  next: (res: any) => {   // 👈 هنا خليتها any
    this.channels = res.data;
    this.loading = false;
  },
  error: (err) => {
    console.error(err);
    this.loading = false;
  }
});
  }
}
