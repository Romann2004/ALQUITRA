import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva } from '../models/reserva.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private myAppUrl: string;
  private myApiUrl: string;

  constructor(private http: HttpClient) {
    this.myAppUrl = environment.endpoint;
    this.myApiUrl = 'api/reservas';
  }

  getReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.myAppUrl}${this.myApiUrl}`);
  }

  addReserva(reserva: Reserva): Observable<any> {
    return this.http.post<Reserva>(`${this.myAppUrl}${this.myApiUrl}`, reserva);
  }

  updateReserva(id: number, reserva: any): Observable<any> {
    return this.http.put<any>(`${this.myAppUrl}${this.myApiUrl}/${id}`, reserva);
  }
  
  deleteReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.myAppUrl}${this.myApiUrl}/${id}`);
  }
}
