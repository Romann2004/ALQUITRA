import { Component, Inject, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ReservaService } from '../../services/reserva.service';
import { TrajeService } from '../../services/traje.service';
import { Cliente } from '../../services/cliente';
import { AlertService } from '../../services/alert.service';
import { EstadoReserva } from '../../models/reserva.model';
import { ESTADOS_TERMINALES, obtenerEstadosDisponibles, normalizarFechaSoloDia, sumarDias } from '../../models/estados-reserva.util';

@Component({
  selector: 'app-form-reserva',
  standalone: false,
  templateUrl: './form-reserva.html',
  styleUrl: './form-reserva.css',
})

export class FormReserva implements OnInit {
  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLElement>;

  form!: FormGroup;
  fechaMinima!: Date;
  listClientes: any[] = [];
  listTrajes: any[] = [];
  errorMensaje: string | null = null;

  // Ciclo de vida de la reserva (solo aplica cuando se está editando, this.data existe)
  soloLectura = false; // true si ya no se pueden tocar fecha/cantidad/cliente/traje (estado RETIRADO)
  esTerminal = false; // true si la reserva quedó totalmente congelada (estado final)
  estadosDisponibles: EstadoReserva[] = [];
  estadoSeleccionado: EstadoReserva | null = null;
  fechaRetiroBloqueada = false; // true si ya llegó/pasó el día de retiro pactado (solo aplica en PENDIENTE)
  fechaDevolucionMaxima: Date | null = null; // techo de +7 días, solo aplica en RETIRADO

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private _reservaService: ReservaService,
    private _clienteService: Cliente,
    private _trajeService: TrajeService,
    private alertService: AlertService,
    public dialogRef: MatDialogRef<FormReserva>,
    @Inject(MAT_DIALOG_DATA) public data: any // Aquí llega la reserva si es editar
  ) {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      trajeId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      fechaRetiro: ['', Validators.required],
      fechaDevolucion: ['', Validators.required],
      senia: [0, [Validators.required, Validators.min(0)]],
    }, { validators: this.fechasValidas }); // Es un validador de grupo
  }

  ngOnInit() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.fechaMinima = hoy;
    // Cargamos listas y al terminar intentamos parchear
    this._clienteService.getClientes().subscribe(res => {
      this.listClientes = Array.isArray(res) ? res : (res.clientes || []);
      this.verificarParcheo();
      this.cdr.detectChanges();
    });

    this._trajeService.getTrajes().subscribe(res => {
      this.listTrajes = Array.isArray(res) ? res : (res.trajes || []);
      this.verificarParcheo();
      this.cdr.detectChanges();
    });

    if (this.data) {
      this.esTerminal = ESTADOS_TERMINALES.includes(this.data.estado);
      this.soloLectura = this.esTerminal || this.data.estado !== EstadoReserva.PENDIENTE;
      this.estadosDisponibles = this.esTerminal
        ? []
        : obtenerEstadosDisponibles(this.data.estado, this.data.fechaRetiro, this.data.fechaDevolucion);
      this.estadoSeleccionado = this.data.estado;

      if (this.soloLectura) {
        this.form.disable();

        if (this.data.estado === EstadoReserva.RETIRADO) {
          // Única excepción a la congelación: se puede extender la fecha de devolución,
          // con techo fijo de 7 días desde lo pactado en el momento del retiro.
          this.form.get('fechaDevolucion')?.enable();
          const fechaPactada = this.data.fechaDevolucionPactada || this.data.fechaDevolucion;
          this.fechaDevolucionMaxima = sumarDias(normalizarFechaSoloDia(fechaPactada), 7);
        }
      } else {
        // PENDIENTE: la fecha de retiro se congela apenas llega (o pasa) el día pactado.
        // El resto de los campos sigue editable con las reglas de siempre.
        const hoy = normalizarFechaSoloDia(new Date());
        const retiro = normalizarFechaSoloDia(this.data.fechaRetiro);
        if (hoy >= retiro) {
          this.fechaRetiroBloqueada = true;
          this.form.get('fechaRetiro')?.disable();
        }
      }
    }
  }

  fechasValidas(group: FormGroup) {
    const retiro = group.get('fechaRetiro')?.value;
    const devolucion = group.get('fechaDevolucion')?.value;
    
    if (retiro && devolucion && devolucion < retiro) {
      return { fechaInvalida: true };
    }
    return null;
  }

  verificarParcheo() {
    if (this.data && this.listClientes.length > 0 && this.listTrajes.length > 0) {

      // Función auxiliar para arreglar el desfase de zona horaria
      const corregirFecha = (fechaInput: any) => {
        const d = new Date(fechaInput);
        // Sumamos el desafase de la zona horaria local en minutos
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        return d;
      };

      this.form.patchValue({
        clienteId: this.data.clienteId,
        trajeId: this.data.trajeId,
        cantidad: this.data.cantidad,
        fechaRetiro: corregirFecha(this.data.fechaRetiro),
        fechaDevolucion: corregirFecha(this.data.fechaDevolucion),
        senia: this.data.senia,
      });

      this.cdr.detectChanges();
    }  
  }

  guardar() {
    this.errorMensaje = null;

    if (!this.data) {
      // CREAR: sin cambios, el estado siempre arranca en PENDIENTE
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.mostrarMensaje('Revisá los campos, hay errores de validación.', true);
        return;
      }

      this._reservaService.addReserva(this.form.getRawValue()).subscribe({
        next: () => {
          this.mostrarMensaje('Reserva creada con éxito');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const mensajeError = err.error?.msg || 'Error al crear la reserva';
          this.mostrarMensaje(mensajeError, true);
        }
      });
      return;
    }

    // EDITAR: puede implicar hasta dos operaciones independientes:
    // 1) actualizar los datos (solo si la reserva sigue PENDIENTE)
    // 2) cambiar el estado (si se eligió uno distinto al actual)
    if (this.esTerminal) return; // no debería poder llegar acá, el botón queda oculto

    const operaciones: Observable<any>[] = [];
    const cambiaEstado = !!this.estadoSeleccionado && this.estadoSeleccionado !== this.data.estado;
    // PENDIENTE: se puede editar todo (con la fecha de retiro ya bloqueada si corresponde).
    // RETIRADO: solo se manda la extensión de fecha de devolución (el resto viaja
    // deshabilitado en el formulario, y el backend lo ignora de todos modos).
    const puedeEditarDatos = this.data.estado === EstadoReserva.PENDIENTE || this.data.estado === EstadoReserva.RETIRADO;

    if (puedeEditarDatos) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.mostrarMensaje('Revisá los campos, hay errores de validación.', true);
        return;
      }
      operaciones.push(this._reservaService.updateReserva(this.data.id, this.form.getRawValue()));
    }

    if (cambiaEstado) {
      operaciones.push(this._reservaService.cambiarEstadoReserva(this.data.id, this.estadoSeleccionado as string));
    }

    if (operaciones.length === 0) {
      this.dialogRef.close(); // no había nada para guardar
      return;
    }

    forkJoin(operaciones).subscribe({
      next: () => {
        this.mostrarMensaje('Reserva actualizada con éxito');
        this.dialogRef.close(true);
      },
      error: (err) => {
        const mensajeError = err.error?.msg || 'Error al actualizar la reserva';
        this.mostrarMensaje(mensajeError, true);
      }
    });
  }

  // Función auxiliar para no repetir código del SnackBar
  mostrarMensaje(mensaje: string, esError: boolean = false) {
    if (esError) {
      this.errorMensaje = mensaje;
      this.cdr.detectChanges();
      this.dialogContent?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.alertService.mostrarExito(mensaje);
  }

  cerrarError() {
    this.errorMensaje = null;
  }

  compararObjetos(o1: any, o2: any): boolean {
    // Comparamos el valor del control con el ID de la opción
    return o1 == o2;
  }
}