import { Component, Inject, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { TrajeService } from '../../services/traje.service';
import { Cliente } from '../../services/cliente';
import { AlertService } from '../../services/alert.service';

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
      estado: [{value: 'PENDIENTE', disabled: true}, Validators.required]
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

    if (!this.data) {
      this.form.get('estado')?.setValue('PENDIENTE');
      this.form.get('estado')?.disable();
    } else {
      this.form.get('estado')?.enable();
      this.form.patchValue({ estado: this.data.estado });
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
        estado: this.data.estado
      });

      this.cdr.detectChanges();
    }  
  }

  guardar() {
    this.errorMensaje = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mostrarMensaje('Revisá los campos, hay errores de validación.', true);
      return;
    }

    // USAMOS getRawValue para incluir el estado deshabilitado
    const reservaData = this.form.getRawValue();
    
    if (this.data) {
      // EDITAR: enviamos reservaData en lugar de this.form.value
      this._reservaService.updateReserva(this.data.id, reservaData).subscribe({
        next: (res) => {
          this.mostrarMensaje('Reserva actualizada con éxito');
          this.dialogRef.close(reservaData); // Devolvemos el objeto actualizado para la tabla
        },
        error: (err) => {
          // Capturamos el error del back
          const mensajeError = err.error?.msg || 'Error al actualizar la reserva';
          this.mostrarMensaje(mensajeError, true);
        }
      });
    } else {
      // CREAR: enviamos reservaData
      this._reservaService.addReserva(reservaData).subscribe({
        next: (res) => {
          this.mostrarMensaje('Reserva creada con éxito');
          this.dialogRef.close(true)
        },
        error: (err) => {
          // Si el traje está ocupado, acá va a llegar el mensaje del backend
          const mensajeError = err.error.msg || 'Error al crear la reserva';
          this.mostrarMensaje(mensajeError, true);
        }
      });
    }
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