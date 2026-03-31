import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  LoginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
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
          alert('¡Bienvenido!');
          this.router.navigate(['/dashboard']); //Navega al panel inicial
        }
      },
      error: (err) => {
        alert('Error: ' + err.error.msg); // Muestra el mensaje de error del backend  
      }
    });
  }
}

