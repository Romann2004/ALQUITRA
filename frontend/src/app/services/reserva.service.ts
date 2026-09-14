import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva } from '../models/reserva.model';
import { environment } from '../../environments/environment';

export interface ParametrosListadoReservas {
  categoria: 'en_proceso' | 'finalizadas';
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ReservasPaginadas {
  data: Reserva[];
  total: number;
}

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

  getReservas(params: ParametrosListadoReservas): Observable<ReservasPaginadas> {
    let httpParams = new HttpParams()
      .set('categoria', params.categoria)
      .set('page', params.page)
      .set('pageSize', params.pageSize);

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);

    return this.http.get<ReservasPaginadas>(`${this.myAppUrl}${this.myApiUrl}`, { params: httpParams });
  }

  addReserva(reserva: Reserva): Observable<any> {
    return this.http.post<Reserva>(`${this.myAppUrl}${this.myApiUrl}`, reserva);
  }

  updateReserva(id: number, reserva: any): Observable<any> {
    return this.http.put<any>(`${this.myAppUrl}${this.myApiUrl}/${id}`, reserva);
  }

  cambiarEstadoReserva(id: number, estado: string): Observable<any> {
    return this.http.patch<any>(`${this.myAppUrl}${this.myApiUrl}/${id}/estado`, { estado });
  }


  deleteReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.myAppUrl}${this.myApiUrl}/${id}`);
  }
}
