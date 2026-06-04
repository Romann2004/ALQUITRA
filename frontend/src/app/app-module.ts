import { BrowserModule } from '@angular/platform-browser';
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
import { MatSortModule } from '@angular/material/sort';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { NgModule, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { MAT_DATE_LOCALE } from '@angular/material/core';
registerLocaleData(localeEsAr, 'es-AR');
import { App } from './app';
import { GestionTrajesComponent } from './components/gestion-trajes/gestion-trajes.component';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { GestionClientes } from './components/gestion-clientes/gestion-clientes';
import { ListadoReservas } from './components/listado-reservas/listado-reservas';
import { authInterceptor } from './helpers/auth-interceptor';
import { FormReserva } from './components/form-reserva/form-reserva';
import { MatSortModule } from '@angular/material/sort';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
  declarations: [
    App,
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
    MatSortModule,
    MatToolbarModule,
    MatListModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgApexchartsModule
  ],
  providers: [
    provideAnimations(), 
    provideBrowserGlobalErrorListeners(), 
    { provide: HTTP_INTERCEPTORS, useClass: authInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'es-AR' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' }
  ],
  bootstrap: [App]
})
export class AppModule { }