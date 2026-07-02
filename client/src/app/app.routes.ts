import { Routes } from '@angular/router';
import { Register } from './Pages/register/register';
import { Home } from './Pages/home/home';
import { Main } from './Pages/main/main';
import { Login } from './Pages/login/login';
import { ForgotPassword } from './Pages/forgot-password/forgot-password';
import { Guard } from './services/gurd';
import { Profile } from './Pages/profile/profile';
import { CreateVideo } from './Pages/create-video/create-video';
import { VideoDetails } from './Pages/video-details/video-details';
import { Explore } from './Pages/explore/explore';
import { Subscriptions } from './Pages/subscriptions/subscriptions';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'signup', component: Register },
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'main', component: Main, canActivate: [Guard] },
  { path: 'profile', component: Profile, canActivate: [Guard] },
  { path: 'createvideo', component: CreateVideo, canActivate: [Guard] },
  { path: 'video-details/:id', component: VideoDetails },
  { path: 'explore', component: Explore },
  { path: 'subscriptions', component: Subscriptions, canActivate: [Guard] }
];
