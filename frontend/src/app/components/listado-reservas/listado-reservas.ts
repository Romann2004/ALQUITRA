import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Reserva } from '../../models/reserva.model';
import { ReservaService } from '../../services/reserva.service';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
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
  @ViewChild(MatSort) sort!: MatSort;

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
    this._reservaService.getReservas().subscribe({
      next: (data: any) => {
        this.dataSource.data = data;

        // 1. Asignamos el sort
        this.dataSource.sort = this.sort;

        // Personalización del ordenamiento para objetos relacionales
        this.dataSource.sortingDataAccessor = (item: any, property: string) => {
          switch (property) {
            case 'cliente': return item.Cliente?.nombre?.toLowerCase() || '';
            case 'traje':
              // Obtenemos la categoría y el talle
              const categoria = item.Traje?.categoria?.toLowerCase() || '';
              const talleNum = Number(item.Traje?.talle) || 0;
              const talleStr = String(talleNum).padStart(3, '0');

              // Retornamos la combinación. Ej: "smoking-048" o "smoking-052"
              return `${categoria}-${talleStr}`;
            case 'id': return Number(item.id);
            case 'senia': return Number(item.senia);
            case 'estado': return item.estado?.toLowerCase() || '';
            default: return item[property]; 
          }
        };

        // 2. CREAMOS EL PREDICADO DE FILTRADO PERSONALIZADO
        this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
          const transformFilter = filter.trim().toLowerCase();

          // Campos básicos planos
          const id = data.id?.toString() || '';
          const estado = data.estado?.toLowerCase() || '';
          const senia = data.senia?.toString() || '';

          // Datos del Cliente
          const clienteNombre = data.Cliente?.nombre?.toLowerCase() || '';
          const clienteApellido = data.Cliente?.apellido?.toLowerCase() || '';

          // Datos del Traje
          const trajeTalle = data.Traje?.talle?.toString() || ''; // Filtra por ej: "48", "50", "L"
          const trajeCategoria = data.Traje?.categoria?.toLowerCase() || ''; // Filtra por ej: "Saco", "Pantalon", "Smoking"

          // Procesamiento de Fechas (Convertimos las fechas a texto legible tipo "DD/MM/YYYY")
          const formatearFecha = (fechaInput: any): string => {
            if (!fechaInput) return '';
            const d = new Date(fechaInput);
            // Sumamos el desfasaje de zona horaria para que no se corra un día al formatear
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            const dia = String(d.getDate()).padStart(2, '0');
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const anio = d.getFullYear();
            return `${dia}/${mes}/${anio}`; // Devuelve "25/05/2026"
          };

          const fechaRetiroStr = formatearFecha(data.fechaRetiro);
          const fechaDevolucionStr = formatearFecha(data.fechaDevolucion);

          // Si el buscador coincide con CUALQUIERA de estas cosas, la fila se muestra
          return id.includes(transformFilter) ||
                 estado.includes(transformFilter) ||
                 senia.includes(transformFilter) ||
                 clienteNombre.includes(transformFilter) ||
                 clienteApellido.includes(transformFilter)  ||
                 trajeTalle.includes(transformFilter) ||
                 trajeCategoria.includes(transformFilter) ||
                 fechaRetiroStr.includes(transformFilter) ||
                 fechaDevolucionStr.includes(transformFilter);
        };
      },
      error: (err) => {
        console.log(err);
      }      
    });
  }

  agregarReserva() {
    this.dialog.open(FormReserva, { 
      width: '500px', 
      backdropClass: 'blur-backdrop',
      data: null // Esto le dice al formulario que NO estamos editando
    }).afterClosed().subscribe(() => this.obtenerReservas());
  }

  editarReserva(reserva: any) {
    const dialogRef = this.dialog.open(FormReserva, {width: '500px', backdropClass: 'blur-backdrop', data: reserva });

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

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}



