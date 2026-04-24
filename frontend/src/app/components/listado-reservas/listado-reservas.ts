import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Reserva } from '../../models/reserva.model';
import { ReservaService } from '../../services/reserva.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { FormReserva } from '../form-reserva/form-reserva';

@Component({
  selector: 'app-listado-reservas',
  standalone: false,
  templateUrl: './listado-reservas.html',
  styleUrl: './listado-reservas.css',
})
export class ListadoReservas implements OnInit {
  displayedColumns: string[] = ['id', 'cliente', 'traje', 'fechaRetiro', 'estado', 'fechaDevolucion', 'senia', 'acciones'];

  dataSource!: MatTableDataSource<Reserva>;

  constructor(private _reservaService: ReservaService, public dialog: MatDialog, private cdr: ChangeDetectorRef) {
    this.dataSource = new MatTableDataSource<Reserva>();
  }

  ngOnInit(): void {
    this.obtenerReservas();
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  obtenerReservas() {
    this._reservaService.getReservas().subscribe(data => {
      console.log("DATOS DEL BACKEND:", data);
      this.dataSource.data = data;
    }, error => {
      console.log("ERROR AL TRAER DATOS", error);
    })
  }

  agregarReserva() {
    this.dialog.open(FormReserva, { 
      width: '500px', 
      data: null // Esto le dice al formulario que NO estamos editando
    }).afterClosed().subscribe(() => this.obtenerReservas());
  }

  editarReserva(reserva: any) {
    const dialogRef = this.dialog.open(FormReserva, {width: '500px', data: reserva });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.obtenerReservas();
    });
  }

  eliminarReserva(id: number) {
    // Confirmación simple para evitar errores
    if (confirm('¿Estás seguro que queres eliminar esta reserva?')) {
      this._reservaService.deleteReserva(id).subscribe(() => {
        // Si todo sale bien, recargamos la lista
        this.obtenerReservas();
      }, error => {
        console.log('Error al eliminar:', error);
      });
    }
  }
}

