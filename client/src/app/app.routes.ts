import { Routes } from '@angular/router';
import { Register } from './Pages/register/register';
import { Home } from './Pages/home/home';
import { Main } from './Pages/main/main';
import { Login } from './Pages/login/login';
import { Guard } from './services/gurd';
import { Profile } from './Pages/profile/profile';

import { CreateVideo } from './Pages/create-video/create-video';
import { VideoDetails } from './Pages/video-details/video-details';
import { SearchComponent } from './Pages/search/search';
import { subscriptions } from './Pages/subscriptions/subscriptions';
subscriptions
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'signup', component: Register },
  { path: 'login', component: Login },
  { path: 'main', component: Main, canActivate: [Guard] },
  { path: 'profile', component: Profile, canActivate: [Guard] },
  { path: 'createvideo', component: CreateVideo, canActivate: [Guard] },
  { path: 'video-details/:id', component: VideoDetails },
  { path: 'search', component: SearchComponent, canActivate: [Guard] },
  { path: 'subscriptions', component: subscriptions, canActivate: [Guard] }

];
