import { Component, signal } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // 1. Creamos el puente para el HTML
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // 2. Creamos la función para cerrar sesión
  logout(): void {
    this.authService.logout();
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
