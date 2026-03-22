import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';

    constructor(private http: HttpClient) { }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => {
                if (res.ok && res.token) {
                    // Guardamos el token en el almacenamiento local del navegador
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('username', res.username); // Opcional, para mostrarlo en el menú
                }
            })
        );
    }

    // Método p/ saber si el usuario está logueado
    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }
    
    // Método p/ cerrar sesión
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    }
}