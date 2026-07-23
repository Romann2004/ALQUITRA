import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap, BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // El BehaviorSubject guarda el estado inicial (¿hay token?)
    private loggedIn = new BehaviorSubject<boolean>(!!sessionStorage.getItem('token'));

    // Esto es lo que los componentes van a "escuchar"
    isLoggedIn$ = this.loggedIn.asObservable();

    private apiUrl = 'http://localhost:3000/api/auth';

    constructor(private http: HttpClient, private router: Router) { }

    login(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, user).pipe(
            tap((res: any) => {
                if (res.ok && res.token) {
                    // Guardamos los datos en silencio
                    // Guardamos el token en el almacenamiento de la sesión del navegador
                    sessionStorage.setItem('token', res.token);
                    sessionStorage.setItem('username', res.username); // Opcional, para mostrarlo en el menú
                    this.loggedIn.next(true); // Actualizamos el estado a "logueado"
                }
            })
        );
    }
    
    // Método p/ cerrar sesión
    logout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('username');
        this.loggedIn.next(false); // Actualizamos el estado a "no logueado"
        this.router.navigate(['/login']);
    }
}