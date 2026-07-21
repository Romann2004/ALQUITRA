import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TalleTraje, Traje } from '../../models/traje.model';
import { TrajeService } from '../../services/traje.service';

interface MedidaTalle {
  talle: TalleTraje;
  pecho: string;
  cintura: string;
  cadera: string;
  largo: string;
}

@Component({
  selector: 'app-gestion-trajes',
  standalone: false,
  templateUrl: './gestion-trajes.component.html',
  styleUrls: ['./gestion-trajes.component.css']
})

export class GestionTrajesComponent implements OnInit {
  @ViewChild('trajeDialog') trajeDialog!: TemplateRef<any>;
  @ViewChild('disponibilidadDialog') disponibilidadDialog!: TemplateRef<any>;

  trajes: Traje[] = [];
  trajeForm: FormGroup;
  dataSource = new MatTableDataSource<Traje>([]);
  columnasVisibles: string[] = [
    'codigo',
    'categoria',
    'talle',
    'color',
    'cantidad',
    'precio',
    'disponibilidad',
    'acciones',
  ];
  modoEdicion = false;
  trajeIdEnEdicion: number | null = null;
  nuevaCategoria = '';
  nuevoColor = '';
  categoriasDisponibles = ['Smokings', 'Gala', 'Casual'];
  coloresDisponibles = ['Negro', 'Azul', 'Azul Marino', 'Gris', 'Blanco', 'Bordeaux'];
  tallesDisponibles = Object.values(TalleTraje);
  tablaMedidas: MedidaTalle[] = [
    { talle: TalleTraje.XS, pecho: '84-88', cintura: '68-72', cadera: '84-88', largo: '68-70' },
    { talle: TalleTraje.S, pecho: '88-92', cintura: '72-76', cadera: '88-92', largo: '70-72' },
    { talle: TalleTraje.M, pecho: '92-98', cintura: '76-82', cadera: '92-98', largo: '72-74' },
    { talle: TalleTraje.L, pecho: '98-104', cintura: '82-88', cadera: '98-104', largo: '74-76' },
    { talle: TalleTraje.XL, pecho: '104-110', cintura: '88-96', cadera: '104-110', largo: '76-78' },
    { talle: TalleTraje.XXL, pecho: '110-118', cintura: '96-104', cadera: '110-118', largo: '78-80' },
  ];
  trajeSeleccionado: Traje | null = null;
  reservasDisponibilidad: Array<{ fechaRetiro: string; fechaDevolucion: string; cantidad: number }> = [];

  constructor(
    private fb: FormBuilder,
    private trajeService: TrajeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.trajeForm = this.fb.group({
      codigoEtiqueta: ['', Validators.required],
      categoria: ['', Validators.required],
      talle: ['', Validators.required],
      color: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioAlquilerBase: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.configurarFiltro();
    this.cargarTrajes();
  }

  cargarTrajes() {
    this.trajeService.getTrajes().subscribe({
      next: (res) => {
        this.trajes = (res.trajes || []).map((traje) => ({
          ...traje,
          cantidad: Number(traje.cantidad ?? 1),
        }));
        this.dataSource.data = this.trajes;
      },
      error: (err) => console.error('Error al cargar trajes', err),
    });
  }

  configurarFiltro() {
    this.dataSource.filterPredicate = (data: Traje, filter: string): boolean => {
      const filtro = filter.trim().toLowerCase();

      return [
        data.codigoEtiqueta,
        data.categoria,
        data.talle,
        data.color,
        data.estado,
        data.cantidad?.toString(),
        data.precioAlquilerBase?.toString(),
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(filtro));
    };
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  abrirFormularioTraje(traje?: Traje) {
    this.resetearFormulario();

    if (traje) {
      this.modoEdicion = true;
      this.trajeIdEnEdicion = traje.id ?? null;
      this.agregarValorSiNoExiste('categoria', String(traje.categoria));
      this.agregarValorSiNoExiste('color', String(traje.color));
      this.trajeForm.patchValue({
        codigoEtiqueta: traje.codigoEtiqueta,
        categoria: traje.categoria,
        talle: traje.talle,
        color: traje.color,
        cantidad: Number(traje.cantidad ?? 1),
        precioAlquilerBase: Number(traje.precioAlquilerBase),
      });
    }

    this.dialog.open(this.trajeDialog, {
      width: '920px',
      maxWidth: '96vw',
      backdropClass: 'blur-backdrop',
      autoFocus: false,
    });
  }

  guardarTraje() {
    if (this.trajeForm.invalid) {
      this.trajeForm.markAllAsTouched();
      this.mostrarMensaje('Revisá los campos del formulario.', true);
      return;
    }

    const datosTraje = {
      ...this.trajeForm.getRawValue(),
      cantidad: Number(this.trajeForm.get('cantidad')?.value ?? 1),
      precioAlquilerBase: Number(this.trajeForm.get('precioAlquilerBase')?.value ?? 0),
    };

    if (this.trajeIdEnEdicion) {
      this.trajeService.actualizarTraje(this.trajeIdEnEdicion, datosTraje).subscribe({
        next: () => {
          this.mostrarMensaje('Traje actualizado con éxito');
          this.cerrarFormulario();
          this.cargarTrajes();
        },
        error: (err) => {
          console.error('Error al actualizar', err);
          this.mostrarMensaje(err.error?.mensaje || err.error?.msg || 'Hubo un error al guardar los cambios.', true);
        },
      });
    } else {
      this.trajeService.crearTraje(datosTraje).subscribe({
        next: () => {
          this.mostrarMensaje('Traje creado con éxito');
          this.cerrarFormulario();
          this.cargarTrajes();
        },
        error: (err) => {
          console.error('Error al crear', err);
          this.mostrarMensaje(err.error?.mensaje || err.error?.msg || 'Hubo un error al guardar los cambios.', true);
        },
      });
    }
  }

  eliminarTraje(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este traje?')) {
      this.trajeService.eliminarTraje(id).subscribe({
        next: () => {
          this.mostrarMensaje('Traje eliminado con éxito');
          this.cargarTrajes();
        },
        error: (err) => {
          const mensajeBackend = err.error?.mensaje || err.error?.msg || 'Ocurrió un error inesperado al eliminar';
          this.mostrarMensaje(mensajeBackend, true);
        },
      });
    }
  }

  finalizarOperacion(mensaje: string) {
    this.mostrarMensaje(mensaje);
    this.cargarTrajes();
    this.cerrarFormulario();
  }

  cerrarFormulario() {
    this.dialog.closeAll();
    this.resetearFormulario();
  }

  resetearFormulario() {
    this.trajeForm.reset({
      codigoEtiqueta: '',
      categoria: '',
      talle: '',
      color: '',
      cantidad: 1,
      precioAlquilerBase: '',
    });
    this.modoEdicion = false;
    this.trajeIdEnEdicion = null;
    this.nuevaCategoria = '';
    this.nuevoColor = '';
  }

  agregarCategoria() {
    const valor = this.nuevaCategoria.trim();
    if (!valor) return;
    this.agregarValorSiNoExiste('categoria', valor);
    this.trajeForm.get('categoria')?.setValue(valor);
    this.nuevaCategoria = '';
  }

  agregarColor() {
    const valor = this.nuevoColor.trim();
    if (!valor) return;
    this.agregarValorSiNoExiste('color', valor);
    this.trajeForm.get('color')?.setValue(valor);
    this.nuevoColor = '';
  }

  agregarValorSiNoExiste(tipo: 'categoria' | 'color', valor: string) {
    const lista = tipo === 'categoria' ? this.categoriasDisponibles : this.coloresDisponibles;
    const existe = lista.some((item) => item.toLowerCase() === valor.toLowerCase());
    if (existe) return;

    if (tipo === 'categoria') {
      this.categoriasDisponibles = [...this.categoriasDisponibles, valor];
    } else {
      this.coloresDisponibles = [...this.coloresDisponibles, valor];
    }
  }

  verDisponibilidad(traje: Traje) {
    if (!traje.id) return;

    this.trajeService.obtenerDisponibilidadTraje(traje.id).subscribe({
      next: (res) => {
        this.trajeSeleccionado = res.traje || traje;
        this.reservasDisponibilidad = res.reservas || [];

        this.dialog.open(this.disponibilidadDialog, {
          width: '760px',
          maxWidth: '96vw',
          backdropClass: 'blur-backdrop',
          autoFocus: false,
        });
      },
      error: (err) => {
        console.error('Error al cargar disponibilidad', err);
        this.mostrarMensaje(err.error?.msg || 'Error al cargar la disponibilidad del traje', true);
      },
    });
  }

  mostrarMensaje(mensaje: string, esError: boolean = false) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snack-centered', esError ? 'snack-error' : 'snack-exito'],
    });
  }
}
