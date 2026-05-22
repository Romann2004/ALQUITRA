// frontend/src/app/app.ts
import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  mostrarMenu: boolean = false;
  isDarkMode: boolean = false; // Propiedad para controlar el estado del modo oscuro
  protected readonly title = signal('frontend');
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // 1. Verificar preferencia de tema guardada en el navegador
    const temaGuardado = localStorage.getItem('theme');
    if (temaGuardado === 'dark') {
      this.isDarkMode = true;
      this.aplicarClaseTema();
    }

    // 2. Suscripción al estado de autenticación existente
    this.authService.isLoggedIn$.subscribe(res => {
      this.mostrarMenu = res;

      if (!res) {
        this.router.navigate(['/login']);
      } else if (this.router.url === '/login' || this.router.url === '/') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // Alterna el estado del interruptor
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.aplicarClaseTema();
  }

  // Añade o remueve la clase en el elemento HTML raíz (:root)
  private aplicarClaseTema() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  logout() {
    this.authService.logout();
  }
}