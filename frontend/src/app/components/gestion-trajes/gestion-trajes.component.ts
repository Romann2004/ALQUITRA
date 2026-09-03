import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatCalendarCellCssClasses } from '@angular/material/datepicker';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { TalleTraje, Traje } from '../../models/traje.model';
import { TrajeService } from '../../services/traje.service';
import { AlertService } from '../../services/alert.service';
import Swal from 'sweetalert2';

interface ColorOption {
  nombre: string;
  hex: string;
}

const COLORES_BASE: ColorOption[] = [
  { nombre: 'Negro', hex: '#000000' },
  { nombre: 'Blanco', hex: '#FFFFFF' },
  { nombre: 'Gris', hex: '#808080' },
  { nombre: 'Gris Oscuro', hex: '#404040' },
  { nombre: 'Gris Claro', hex: '#D3D3D3' },
  { nombre: 'Azul', hex: '#0000FF' },
  { nombre: 'Azul Marino', hex: '#000080' },
  { nombre: 'Celeste', hex: '#87CEEB' },
  { nombre: 'Rojo', hex: '#FF0000' },
  { nombre: 'Bordeaux', hex: '#800000' },
  { nombre: 'Vino', hex: '#880000' },
  { nombre: 'Chocolate', hex: '#d2b48c' },
  { nombre: 'Caqui', hex: '#c3b091' },
  { nombre: 'Beige', hex: '#f5f5dc' },
  { nombre: 'Crema', hex: '#fffdd0' },
  { nombre: 'Verde', hex: '#008000' },
  { nombre: 'Verde Oliva', hex: '#808000' },
  { nombre: 'Amarillo', hex: '#FFFF00' },
  { nombre: 'Naranja', hex: '#FFA500' },
  { nombre: 'Marrón', hex: '#8B4513' },
  { nombre: 'Beige', hex: '#F5F5DC' },
  { nombre: 'Rosa', hex: '#FFC0CB' },
  { nombre: 'Violeta', hex: '#EE82EE' },
  { nombre: 'Turquesa', hex: '#40E0D0' },
  { nombre: 'Fucsia', hex: '#FF00FF' },
  { nombre: 'Damasco', hex: '#FFD8B1' },
  { nombre: "Dorado", hex: "#FFD700" },
  { nombre: "Plateado", hex: "#C0C0C0" },
  { nombre: "Bronce", hex: "#CD7F32" },
]; interface MedidaTalle {
  talle: TalleTraje | string;
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
  @ViewChild('medidasDialog') medidasDialog!: TemplateRef<any>;
  @ViewChild('nuevaCategoriaDialog') nuevaCategoriaDialog!: TemplateRef<any>;
  @ViewChild('eliminarCategoriaDialog') eliminarCategoriaDialog!: TemplateRef<any>;
  @ViewChild(MatSort) sort!: MatSort;

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

  // Variables para inputs dinámicos
  nuevaCategoria = '';
  nuevoColor = '';

  // Arreglos de selección
  categoriasDisponibles: string[] = [];
  coloresDisponibles: ColorOption[] = [...COLORES_BASE];
  tallesDisponibles = Object.values(TalleTraje);

  filteredCategorias!: Observable<string[]>;
  filteredColores!: Observable<ColorOption[]>;

  tablaMedidas: MedidaTalle[] = [
    { talle: 'XS', pecho: '84-88', cintura: '68-72', cadera: '84-88', largo: '68-70' },
    { talle: 'S', pecho: '88-92', cintura: '72-76', cadera: '88-92', largo: '70-72' },
    { talle: 'M', pecho: '92-98', cintura: '76-82', cadera: '92-98', largo: '72-74' },
    { talle: 'L', pecho: '98-104', cintura: '82-88', cadera: '98-104', largo: '74-76' },
    { talle: 'XL', pecho: '104-110', cintura: '88-96', cadera: '104-110', largo: '76-78' },
    { talle: 'XXL', pecho: '110-118', cintura: '96-104', cadera: '110-118', largo: '78-80' },
  ];

  trajeSeleccionado: Traje | null = null;
  reservasDisponibilidad: Array<{
    fechaRetiro: string;
    fechaDevolucion: string;
    cantidad: number;
    cliente?: { nombre: string };
    Cliente?: { nombre: string };
  }> = [];

  fechaActual = new Date();

  constructor(
    private fb: FormBuilder,
    private trajeService: TrajeService,
    private alertService: AlertService,
    private dialog: MatDialog
  ) {
    this.trajeForm = this.fb.group({
      codigoEtiqueta: ['', Validators.required],
      categoria: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      talle: ['', Validators.required],
      color: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioAlquilerBase: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.inicializarListas();
    this.configurarFiltro();
    this.cargarTrajes();
    this.configurarAutocompletado();
    this.configurarGeneracionCodigo();
  }

  inicializarListas() {
    const catGuardadas = localStorage.getItem('categoriasTrajes');

    this.categoriasDisponibles = catGuardadas
      ? JSON.parse(catGuardadas)
      : ['De competencia', 'De entrenamiento', 'Gala'];

    this.coloresDisponibles = [...COLORES_BASE];
  }

  configurarAutocompletado() {
    this.filteredCategorias = this.trajeForm.get('categoria')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.categoriasDisponibles))
    );
    this.filteredColores = this.trajeForm.get('color')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const nombre = typeof value === 'string' ? value : '';
        return nombre ? this._filterColors(nombre) : this.coloresDisponibles.slice();
      })
    );
  }

  private _filter(value: string, list: string[]): string[] {
    const filterValue = value ? value.toLowerCase() : '';
    const esSeleccionValida = list.some(option => option.toLowerCase() === filterValue);
    if (esSeleccionValida) return list;
    return list.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterColors(value: string): ColorOption[] {
    const filterValue = value ? value.toLowerCase() : '';
    const esSeleccionValida = this.coloresDisponibles.some(option => option.nombre.toLowerCase() === filterValue);
    if (esSeleccionValida) return this.coloresDisponibles;
    return this.coloresDisponibles.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  configurarGeneracionCodigo() {
    this.trajeForm.get('categoria')?.valueChanges.subscribe(categoria => {
      // Solo autogenerar si no estamos en edición y el usuario eligió/escribió algo
      if (!this.modoEdicion && categoria && categoria.length >= 3) {
        const prefijo = categoria.substring(0, 4).toUpperCase();
        // Buscar el número más alto en trajes con este prefijo
        let maxNum = 0;
        this.trajes.forEach(t => {
          if (t.codigoEtiqueta && t.codigoEtiqueta.startsWith(prefijo + '-')) {
            const numPart = t.codigoEtiqueta.split('-')[1];
            if (numPart) {
              const num = parseInt(numPart, 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        });
        const nextNum = (maxNum + 1).toString().padStart(3, '0');
        const currentCode = this.trajeForm.get('codigoEtiqueta')?.value;
        if (!currentCode || currentCode.startsWith(prefijo)) {
          this.trajeForm.patchValue({ codigoEtiqueta: `${prefijo}-${nextNum}` }, { emitEvent: false });
        }
      }
    });
  }

  cargarTrajes() {
    this.trajeService.getTrajes().subscribe({
      next: (res) => {
        this.trajes = (res.trajes || []).map((traje: any) => ({
          ...traje,
          cantidad: Number(traje.cantidad ?? 1),
        }));
        this.dataSource.data = this.trajes;

        // ORDENAMIENTO
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: any, property: string) => {
          switch (property) {
            case 'talle':
              const talleOrden: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6 };
              return talleOrden[String(item.talle).toUpperCase()] || 99;
            case 'precio': return Number(item.precioAlquilerBase);
            case 'cantidad': return Number(item.cantidad);
            case 'codigo': return item.codigoEtiqueta?.toLowerCase() || '';
            case 'disponibilidad': return item.estado?.toLowerCase() || '';
            default: return item[property];
          }
        };
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
      maxHeight: '90vh',
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

    this.guardarValoresDinamicos();

    const datosTraje = {
      ...this.trajeForm.getRawValue(),
      cantidad: Number(this.trajeForm.get('cantidad')?.value ?? 1),
      precioAlquilerBase: Number(this.trajeForm.get('precioAlquilerBase')?.value ?? 0),
      estado: 'Disponible', // Lógica de estado inicial
    };

    if (this.trajeIdEnEdicion) {
      this.trajeService.actualizarTraje(this.trajeIdEnEdicion, datosTraje).subscribe({
        next: () => {
          this.finalizarOperacion('Traje actualizado con éxito');
        },
        error: (err) => {
          this.mostrarMensaje(err.error?.mensaje || err.error?.msg || 'Hubo un error al actualizar.', true);
        },
      });
    } else {
      this.trajeService.crearTraje(datosTraje).subscribe({
        next: () => {
          this.finalizarOperacion('Traje creado con éxito');
        },
        error: (err) => {
          this.mostrarMensaje(err.error?.mensaje || err.error?.msg || 'Hubo un error al guardar.', true);
        },
      });
    }
  }

  eliminarTraje(id: number) {
    this.alertService.confirmarAccion(
      '¿Eliminar traje?',
      'Esta acción no se puede deshacer.'
    ).then((confirmado) => {
      if (confirmado) {
        this.trajeService.eliminarTraje(id).subscribe({
          next: () => {
            this.mostrarMensaje('Traje eliminado con éxito');
            this.cargarTrajes();
          },
          error: (err) => {
            this.mostrarMensaje(err.error?.mensaje || err.error?.msg || 'Ocurrió un error al eliminar', true);
          }
        });
      }
    });
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
    this.fechaActual = new Date();
  }

  // ==========================================
  // CALENDARIO DATECLASS Y MEDIDAS
  // ==========================================

  dateClass() {
    return (date: Date): MatCalendarCellCssClasses => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);

      const isReserved = this.reservasDisponibilidad.some(r => {
        // Al agregar T00:00:00 forzamos a que se interprete en la zona horaria local
        const fInicio = new Date(r.fechaRetiro + 'T00:00:00');
        const fFin = new Date(r.fechaDevolucion + 'T00:00:00');
        fInicio.setHours(0, 0, 0, 0);
        fFin.setHours(0, 0, 0, 0);
        return d >= fInicio && d <= fFin;
      });

      return isReserved ? 'reserved-date' : '';
    };
  }

  guardarValoresDinamicos() {
    const cat = this.trajeForm.get('categoria')?.value;
    const col = this.trajeForm.get('color')?.value;

    if (cat && !this.categoriasDisponibles.some(c => c.toLowerCase() === cat.toLowerCase())) {
      this.categoriasDisponibles.push(cat);
      localStorage.setItem('categoriasTrajes', JSON.stringify(this.categoriasDisponibles.filter(c => !['Smokings', 'Gala', 'Casual'].includes(c))));
    }

    if (col && !this.coloresDisponibles.some(c => c.nombre.toLowerCase() === col.toLowerCase())) {
      const nuevoColor = { nombre: col, hex: '#cccccc' };
      this.coloresDisponibles.push(nuevoColor);
      const colsToSave = this.coloresDisponibles.filter(c => !COLORES_BASE.some(cb => cb.nombre === c.nombre));
      localStorage.setItem('coloresTrajesFull', JSON.stringify(colsToSave));
    }
  }

  dialogRefNuevaCat: any;
  dialogRefEliminarCat: any;

  abrirModalNuevaCategoria() {
    this.dialogRefNuevaCat = this.dialog.open(this.nuevaCategoriaDialog, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      autoFocus: false
    });
  }

  guardarNuevaCategoria(value: string) {
    const cat = value.trim();
    if (!cat) {
      this.mostrarMensaje('Debes escribir una categoría', true);
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(cat)) {
      this.mostrarMensaje('Solo se permiten letras y espacios', true);
      return;
    }
    if (this.categoriasDisponibles.some(c => c.toLowerCase() === cat.toLowerCase())) {
      this.mostrarMensaje('Esa categoría ya existe', true);
      return;
    }

    this.categoriasDisponibles.push(cat);
    localStorage.setItem('categoriasTrajes', JSON.stringify(this.categoriasDisponibles));

    this.trajeForm.patchValue({ categoria: cat });
    this.alertService.mostrarExito('Categoría añadida');
    this.trajeForm.get('categoria')?.updateValueAndValidity();

    if (this.dialogRefNuevaCat) {
      this.dialogRefNuevaCat.close();
    }
  }

  abrirModalEliminarCategoria() {
    this.dialogRefEliminarCat = this.dialog.open(this.eliminarCategoriaDialog, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      autoFocus: false
    });
  }

  eliminarCategoria(cat: string) {
    this.categoriasDisponibles = this.categoriasDisponibles.filter(c => c !== cat);
    localStorage.setItem('categoriasTrajes', JSON.stringify(this.categoriasDisponibles));

    if (this.trajeForm.get('categoria')?.value === cat) {
      this.trajeForm.patchValue({ categoria: '' });
    }

    this.trajeForm.get('categoria')?.updateValueAndValidity();
    this.alertService.mostrarExito('Categoría eliminada');
  }

  abrirTablaMedidas() {
    this.dialog.open(this.medidasDialog, {
      width: '600px',
      backdropClass: 'blur-backdrop',
      autoFocus: false,
    });
  }

  // ==========================================
  // DISPONIBILIDAD
  // ==========================================

  verDisponibilidad(traje: Traje) {
    if (!traje.id) return;

    this.trajeService.obtenerDisponibilidadTraje(traje.id).subscribe({
      next: (res) => {
        this.trajeSeleccionado = res.traje || traje;
        this.reservasDisponibilidad = res.reservas || [];

        this.dialog.open(this.disponibilidadDialog, {
          width: '800px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backdropClass: 'blur-backdrop',
          autoFocus: false,
        });
      },
      error: (err) => {
        this.mostrarMensaje(err.error?.msg || 'Error al cargar la disponibilidad del traje', true);
      },
    });
  }

  getReservasDelMes(activeDate: Date | null) {
    if (!activeDate || !this.reservasDisponibilidad) return [];

    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    return this.reservasDisponibilidad.filter(r => {
      const fInicio = new Date(r.fechaRetiro + 'T00:00:00');
      const fFin = new Date(r.fechaDevolucion + 'T00:00:00');

      // Chequear si la reserva toca el mes activo
      const inicioEnMes = fInicio.getFullYear() === year && fInicio.getMonth() === month;
      const finEnMes = fFin.getFullYear() === year && fFin.getMonth() === month;
      const cruzaMes = fInicio.getFullYear() <= year && fInicio.getMonth() < month &&
        fFin.getFullYear() >= year && fFin.getMonth() > month;

      return inicioEnMes || finEnMes || cruzaMes;
    });
  }

  mostrarMensaje(mensaje: string, esError: boolean = false) {
    if (esError) {
      this.alertService.mostrarError(mensaje);
    } else {
      this.alertService.mostrarExito(mensaje);
    }
  }
}