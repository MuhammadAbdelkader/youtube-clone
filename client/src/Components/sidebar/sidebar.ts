<<<<<<< HEAD
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
=======
import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  imports: [],
>>>>>>> c20b66e1b2de5a2406841d2eebd3245b76341ba3
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
<<<<<<< HEAD
  @Input() isOpen = false;

  activeItem: string = 'home';

  setActive(item: string) {
    this.activeItem = item;
  }
=======

>>>>>>> c20b66e1b2de5a2406841d2eebd3245b76341ba3
}
