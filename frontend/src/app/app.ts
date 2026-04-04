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
  protected readonly title = signal('frontend');
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Nos suscribimos una sola vez. La variable mostrarMenu se encarga de todo.
    this.authService.isLoggedIn$.subscribe(res => {
      this.mostrarMenu = res;

      if (!res) {
        this.router.navigate(['/login']);
      } else if (this.router.url === '/login' || this.router.url === '/') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // 2. Creamos la función para cerrar sesión
  logout() {
    this.authService.logout();
  }
}
