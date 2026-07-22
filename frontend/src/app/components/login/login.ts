import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  LoginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.LoginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onLogin() {
    if (this.LoginForm.invalid) return;

    this.authService.login(this.LoginForm.value).subscribe({
      next: (res) => {
        console.log('Respuesta del servidor:', res);
        if (res.ok) {
          this.alertService.mostrarExito('¡Bienvenido!');
          sessionStorage.setItem('token', res.token); // Guarda el token en SessionStorage
          this.router.navigate(['/dashboard']); //Navega al panel inicial
        }
      },
      error: (err) => {
        this.alertService.mostrarError(err.error?.msg || 'Error al iniciar sesión');
      }
    });
  }
}

