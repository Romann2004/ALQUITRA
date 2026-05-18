import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { TrajeService } from '../../services/traje.service';
import { Cliente } from '../../services/cliente';

@Component({
  selector: 'app-form-reserva',
  standalone: false,
  templateUrl: './form-reserva.html',
  styleUrl: './form-reserva.css',
})

export class FormReserva implements OnInit {
  form: FormGroup;
  listClientes: any[] = [];
  listTrajes: any[] = [];

  fechaMinima = new Date(); // Esto hace referencia al día y hora actual
  
  constructor(
    private fb: FormBuilder,
    private _reservaService: ReservaService,
    private _clienteService: Cliente,
    private _trajeService: TrajeService,
    public dialogRef: MatDialogRef<FormReserva>,
    @Inject(MAT_DIALOG_DATA) public data: any // Aquí llega la reserva si es editar
  ) {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      trajeId: ['', Validators.required],
      fechaRetiro: ['', Validators.required],
      fechaDevolucion: ['', Validators.required],
      senia: [0, [Validators.required, Validators.min(0)]],
      estado: [{value: 'PENDIENTE', disabled: true}, Validators.required]
    }, { validators: this.fechasValidas }); // Es un validador de grupo
  }

  ngOnInit() {
    // Cargamos listas y al terminar intentamos parchear
    this._clienteService.getClientes().subscribe(res => {
      this.listClientes = Array.isArray(res) ? res : (res.clientes || []);
      this.verificarParcheo();
    });

    this._trajeService.getTrajes().subscribe(res => {
      this.listTrajes = Array.isArray(res) ? res : (res.trajes || []);
      this.verificarParcheo();
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

    if (retiro && devolucion && new Date(devolucion) <= new Date(retiro)) {
      return { fechaInvalida: true };
    }
    return null;
  }

  verificarParcheo() {
    if (this.data && this.listClientes.length > 0 && this.listTrajes.length > 0) {
      this.form.patchValue({
        clienteId: this.data.clienteId,
        trajeId: this.data.trajeId,
        fechaRetiro: this.data.fechaRetiro.split('T')[0],
        fechaDevolucion: this.data.fechaDevolucion.split('T')[0],
        senia: this.data.senia,
        estado: this.data.estado
      });
    }  
  }

  guardar() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert("Revisá los campos, hay errores de validación.");
      return;
    }

    // USAMOS getRawValue para incluir el estado deshabilitado
    const reservaData = this.form.getRawValue();
    
    if (this.data) {
      // EDITAR: enviamos reservaData en lugar de this.form.value
      this._reservaService.updateReserva(this.data.id, reservaData).subscribe(() => {
        this.dialogRef.close(reservaData); // Devolvemos el objeto actualizado para la tabla       
      });
    } else {
      // CREAR: enviamos reservaData
      this._reservaService.addReserva(reservaData).subscribe(() => {
        this.dialogRef.close(true)
      });
    }
  }

  compararObjetos(o1: any, o2: any): boolean {
    // Comparamos el valor del control con el ID de la opción
    return o1 == o2;
  }
}