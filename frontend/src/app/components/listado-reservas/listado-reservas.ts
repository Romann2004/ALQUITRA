import { Component, OnInit } from '@angular/core';
import { Reserva } from '../../models/reserva.model';
import { ReservaService } from '../../services/reserva.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-listado-reservas',
  standalone: false,
  templateUrl: './listado-reservas.html',
  styleUrl: './listado-reservas.css',
})
export class ListadoReservas implements OnInit {
  displayedColumns: string[] = ['id', 'cliente', 'traje', 'fechaRetiro', 'estado', 'acciones'];

  dataSource!: MatTableDataSource<Reserva>;

  constructor(private _reservaService: ReservaService) {
    this.dataSource = new MatTableDataSource<Reserva>();
  }

  ngOnInit(): void {
    this.obtenerReservas();
  }

  obtenerReservas() {
    this._reservaService.getReservas().subscribe(data => {
      console.log("DATOS DEL BACKEND:", data);
      this.dataSource.data = data;
    }, error => {
      console.log("ERROR AL TRAER DATOS", error);
    })
  }
}

