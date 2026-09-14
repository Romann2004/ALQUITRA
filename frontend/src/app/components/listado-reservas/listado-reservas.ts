import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Reserva } from '../../models/reserva.model';
import { ReservaService } from '../../services/reserva.service';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { FormReserva } from '../form-reserva/form-reserva';
import { AlertService } from '../../services/alert.service';

type Categoria = 'en_proceso' | 'finalizadas';

interface EstadoTabla {
  data: Reserva[];
  total: number;
  pageIndex: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

@Component({
  selector: 'app-listado-reservas',
  standalone: false,
  templateUrl: './listado-reservas.html',
  styleUrl: './listado-reservas.css',
})
export class ListadoReservas implements OnInit {
  @ViewChild('buscadorInput') buscadorInput?: ElementRef<HTMLInputElement>;

  displayedColumnsEnProceso: string[] = ['id', 'cliente', 'traje', 'cantidad', 'fechaRetiro', 'estado', 'fechaDevolucion', 'senia', 'acciones'];
  displayedColumnsFinalizadas: string[] = ['id', 'cliente', 'traje', 'cantidad', 'fechaRetiro', 'estado', 'fechaDevolucion', 'senia', 'acciones'];

  pageSizeOptions = [10, 25, 50, 100];
  pageSize = 25;
  searchTerm = '';
  pestañaActiva: Categoria = 'en_proceso';

  tablas: Record<Categoria, EstadoTabla> = {
    en_proceso: { data: [], total: 0, pageIndex: 0, sortField: 'fechaRetiro', sortDirection: 'asc' },
    finalizadas: { data: [], total: 0, pageIndex: 0, sortField: 'fechaRetiro', sortDirection: 'desc' },
  };

  private busqueda$ = new Subject<string>();

  constructor(private _reservaService: ReservaService, public dialog: MatDialog, private alertService: AlertService) {}

  ngOnInit(): void {
    this.busqueda$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((valor) => {
      this.searchTerm = valor;
      this.tablas[this.pestañaActiva].pageIndex = 0;
      this.cargarReservas(this.pestañaActiva);
    });

    this.cargarReservas('en_proceso');
    this.cargarReservas('finalizadas');
  }

  cargarReservas(categoria: Categoria): void {
    const t = this.tablas[categoria];
    this._reservaService.getReservas({
      categoria,
      page: t.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchTerm,
      sortField: t.sortField,
      sortDirection: t.sortDirection,
    }).subscribe({
      next: (res) => {
        // Si borraste el único registro de una página que no sea la primera,
        // esa página queda vacía: retrocedemos una y volvemos a pedir.
        if (res.data.length === 0 && t.pageIndex > 0 && res.total > 0) {
          t.pageIndex -= 1;
          this.cargarReservas(categoria);
          return;
        }
        t.data = res.data;
        t.total = res.total;
      },
      error: (err) => console.log(err),
    });
  }

  private recargarTodo(): void {
    this.cargarReservas('en_proceso');
    this.cargarReservas('finalizadas');
  }

  cambiarPestana(index: number): void {
    this.pestañaActiva = index === 0 ? 'en_proceso' : 'finalizadas';
    // La búsqueda se reinicia al cambiar de pestaña para no arrastrar un filtro de la otra tabla.
    this.searchTerm = '';
    if (this.buscadorInput) this.buscadorInput.nativeElement.value = '';
    this.tablas[this.pestañaActiva].pageIndex = 0;
    this.cargarReservas(this.pestañaActiva);
  }

  aplicarFiltro(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.busqueda$.next(valor);
  }

  cambiarPagina(categoria: Categoria, event: PageEvent): void {
    const t = this.tablas[categoria];
    t.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarReservas(categoria);
  }

  ordenar(categoria: Categoria, sort: Sort): void {
    const t = this.tablas[categoria];
    t.sortField = sort.direction ? sort.active : 'fechaRetiro';
    t.sortDirection = sort.direction ? (sort.direction as 'asc' | 'desc') : 'asc';
    t.pageIndex = 0;
    this.cargarReservas(categoria);
  }

  agregarReserva(): void {
    this.dialog.open(FormReserva, {
      width: '880px',
      maxWidth: '96vw',
      backdropClass: 'blur-backdrop',
      data: null,
    }).afterClosed().subscribe((result) => {
      if (result) this.recargarTodo();
    });
  }

  editarReserva(reserva: any): void {
    this.dialog.open(FormReserva, {
      width: '880px',
      maxWidth: '96vw',
      backdropClass: 'blur-backdrop',
      data: reserva,
    }).afterClosed().subscribe((result) => {
      // Puede haber cambiado de categoría (ej. de "en proceso" a "finalizada"),
      // así que siempre refrescamos las dos tablas, no solo la que se editó.
      if (result) this.recargarTodo();
    });
  }

  eliminarReserva(id: number): void {
    this.alertService.confirmarAccion(
      'Eliminar reserva',
      '¿Estás seguro que queres eliminar esta reserva?'
    ).then((confirmado) => {
      if (!confirmado) return;

      this._reservaService.deleteReserva(id).subscribe(() => {
        this.alertService.mostrarExito('Reserva eliminada exitosamente');
        this.recargarTodo();
      }, error => {
        console.log('Error al eliminar:', error);
        this.alertService.mostrarError(error?.error?.msg || 'Error al eliminar la reserva');
      });
    });
  }
}
