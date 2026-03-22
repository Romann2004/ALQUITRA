import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { GestionTrajesComponent } from './components/gestion-trajes/gestion-trajes.component';
import { authGuard } from './guards/auth-guard';

const routes: Routes = [
  { path: 'login', component: Login },
  { 
    path: 'gestion-trajes',
    component: GestionTrajesComponent,
    canActivate: [authGuard]  
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
