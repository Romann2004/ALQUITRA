import { BrowserModule, } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { App } from './app';
import { Home } from './components/home/home';
import { GestionTrajesComponent } from './components/gestion-trajes/gestion-trajes.component';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { GestionClientes } from './components/gestion-clientes/gestion-clientes';
import { ListadoReservas } from './components/listado-reservas/listado-reservas';
import { authInterceptor } from './helpers/auth-interceptor';
import { FormReserva } from './components/form-reserva/form-reserva';


@NgModule({
  declarations: [
    App,
    Home,
    Dashboard,
    Login,
    GestionClientes,
    GestionTrajesComponent,
    ListadoReservas,
    FormReserva
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,  
    MatTableModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [provideAnimations(), provideBrowserGlobalErrorListeners(), { provide: HTTP_INTERCEPTORS, useClass: authInterceptor, multi: true } ],
  bootstrap: [App]
})
export class AppModule { }
