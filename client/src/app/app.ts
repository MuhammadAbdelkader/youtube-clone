import { Component, signal,OnInit  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../Components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App  implements OnInit{
  protected readonly title = signal('client');
  isDark = false;
  ngOnInit() {
    // check localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDark = true;
      document.body.classList.add('dark-theme');
    }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }
}
