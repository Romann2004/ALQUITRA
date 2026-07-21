import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Traje } from "../models/traje.model";

// CAPA TÉCNICA: Definimos la forma de la respuesta del Backend
interface RespuestaApiTrajes {
    ok: boolean;
    trajes: Traje[]; // Aquí está la lista real
}

interface RespuestaApiIndividual {
    ok: boolean;
    msg?: string;
    traje: Traje;
}

interface RespuestaDisponibilidadTraje {
    ok: boolean;
    msg?: string;
    traje: Traje;
    reservas: Array<{
        fechaRetiro: string;
        fechaDevolucion: string;
        cantidad: number;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class TrajeService {
    private apiUrl = 'http://localhost:3000/api/trajes';

    constructor(private http: HttpClient) { }

    //El GET espera el objeto con la propiedad 'trajes'
    getTrajes(filtros?: any): Observable<RespuestaApiTrajes> {
        let params = new HttpParams();

        if (filtros) {
            Object.keys(filtros).forEach(key => {
                if (filtros[key]) {
                    params = params.append(key, filtros[key]);
                }
            });
        }

        return this.http.get<RespuestaApiTrajes>(this.apiUrl, { params });
    }

    obtenerDisponibilidadTraje(id: number): Observable<RespuestaDisponibilidadTraje> {
        return this.http.get<RespuestaDisponibilidadTraje>(`${this.apiUrl}/${id}/disponibilidad`);
    }

    //El POST también devuelve un objeto envuelto { ok, msg, traje }
    crearTraje(nuevoTraje: Traje): Observable<RespuestaApiIndividual> {
        return this.http.post<RespuestaApiIndividual>(this.apiUrl, nuevoTraje);
    }

    actualizarTraje(id: number, traje: any): Observable<RespuestaApiIndividual> {
        return this.http.put<RespuestaApiIndividual>(`${this.apiUrl}/${id}`, traje);
    }

    // ... los demás métodos pueden quedarse con <any> si no necesitas el retorno exacto
    eliminarTraje(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}