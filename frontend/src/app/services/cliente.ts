import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Cliente {
  private apiUrl = 'http://localhost:3000/api/clientes';

  constructor(private http: HttpClient) { }

  // Función para obtener los headers con el token
  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getClientes(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }
  
  postCliente(cliente: any): Observable<any> {
    return this.http.post(this.apiUrl, cliente, { headers: this.getHeaders() });
  }
}
