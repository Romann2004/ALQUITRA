import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Reserva } from '../../models/reserva.model';
import { ReservaService } from '../../services/reserva.service';
import { MatTableDataSource, MatTable } from '@angular/material/table';
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
  @ViewChild('miTabla') table!: MatTable<any>;

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
      if (result)  {
        // Accedemos al array real dentro del datasource
        const dataActual = [...this.dataSource.data];

        // Buscamos el índice
        const index = dataActual.findIndex(r => Number(r.id) === Number(reserva.id));
        console.log("Índice real encontrado:", index);

        if (index !== -1) {
          // Actualizamos el array local
          dataActual[index] = {
            ...reserva,
            ... result
          };

          // Asignamos el nuevo array al datasource para que la tabla se entere
          this.dataSource.data = dataActual;

          if (this.table) {
            this.table.renderRows(); // Esto fuerza a la tabla a refrescar su vista
          }

          console.log("Tabla actualizada localmente. No debería haberse movido.");
        } 

      }
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

