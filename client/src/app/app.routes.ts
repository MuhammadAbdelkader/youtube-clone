import { Routes } from '@angular/router';
import { Register } from './Pages/register/register';
import { Home } from './Pages/home/home';
import { Main } from './Pages/main/main';
Main
export const routes: Routes = [
  {path : '' , component : Home},
  {path : 'signup' , component : Register},
  {path : 'main' , component : Main}
];
