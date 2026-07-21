// frontend/src/app/app.ts
import { Component, OnInit, signal, ViewChild, TemplateRef } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog'; // 1. Importamos el servicio de modales

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  // 2. Capturamos la referencia del modal de confirmación
  @ViewChild('logoutDialog') logoutDialog!: TemplateRef<any>;

  mostrarMenu: boolean = false;
  isDarkMode: boolean = false; 
  protected readonly title = signal('frontend');
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog // 3. Inyectamos el servicio en el constructor
  ) {}

  ngOnInit() {
    const temaGuardado = localStorage.getItem('theme');
    if (temaGuardado === 'dark') {
      this.isDarkMode = true;
      this.aplicarClaseTema();
    }

    this.authService.isLoggedIn$.subscribe(res => {
      this.mostrarMenu = res;

      if (!res) {
        this.router.navigate(['/login']);
      } else if (this.router.url === '/login' || this.router.url === '/') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.aplicarClaseTema();
  }

  private aplicarClaseTema() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  // 4. MODIFICADO: Ahora el botón del menú abre primero el diálogo de confirmación
  logout() {
    this.dialog.open(this.logoutDialog, {
      width: '400px',
      backdropClass: 'blur-backdrop', // <-- Reutilizamos el desenfoque global robusto
      autoFocus: false
    });
  }

  // 5. NUEVO MÉTODO: Se ejecuta solo si el usuario presiona "Salir" en el modal
  confirmarLogout() {
    this.dialog.closeAll(); // Cerramos el modal flotante
    this.authService.logout(); // Limpiamos la sesión definitivamente a través del servicio
  }
}