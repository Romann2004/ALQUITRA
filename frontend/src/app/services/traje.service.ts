import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Traje } from "../models/traje.model";

@Injectable({
    providedIn: 'root'
})
export class TrajeService {
    private apiUrl = 'http://localhost:3000/api/trajes';

    constructor(private http: HttpClient) { }

    getTrajes(): Observable<Traje[]> {
        return this.http.get<Traje[]>(this.apiUrl);
    }

    crearTraje(nuevoTraje: Traje): Observable<Traje> {
        return this.http.post<Traje>(this.apiUrl, nuevoTraje)
    }

    actualizarTraje(id: number, traje: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, traje);
    }

    patchTraje(id:number, cambios: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}`, cambios);
    }

    eliminarTraje(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}