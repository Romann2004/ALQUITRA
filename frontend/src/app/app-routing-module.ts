import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { GestionTrajesComponent } from './components/gestion-trajes/gestion-trajes.component';
import { authGuard } from './guards/auth-guard';
import { Dashboard } from './components/dashboard/dashboard';
import { GestionClientes } from './components/gestion-clientes/gestion-clientes';
import { ListadoReservas } from './components/listado-reservas/listado-reservas';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { 
    path: 'gestion-trajes',
    component: GestionTrajesComponent,
    canActivate: [authGuard]  
  },
  { path: 'gestion-clientes', component: GestionClientes, canActivate: [authGuard] },
  { path: 'reservas', component: ListadoReservas },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
