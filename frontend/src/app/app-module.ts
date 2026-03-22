import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Home } from './components/home/home';
import { GestionTrajesComponent } from './components/gestion-trajes/gestion-trajes.component';
import { Login } from './components/login/login';

@NgModule({
  declarations: [
    App,
    Home
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    GestionTrajesComponent,
    Login
  ],
  providers: [provideAnimations(), provideBrowserGlobalErrorListeners() ],
  bootstrap: [App]
})
export class AppModule { }
