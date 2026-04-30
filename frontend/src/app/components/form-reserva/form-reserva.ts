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
      senia: [0, Validators.required],
      estado: ['PENDIENTE', Validators.required]
    });
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

    console.log("¿Es el form válido?:", this.form.valid);
    console.log("Errores del form:", this.form.errors);
    console.log("Valores:", this.form.value);

    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Esto hace que los campos inválidos se pongan rojos
      alert("Revisá los campos, hay errores de validación.");
      return;
    }
    
    if (this.form.invalid) return;

    // Si data existe, es EDITAR, sino es CREAR
    if (this.data) {
      this._reservaService.updateReserva(this.data.id, this.form.value).subscribe(() => this.dialogRef.close(true));
    } else {
      this._reservaService.addReserva(this.form.value).subscribe(() => this.dialogRef.close(true));
    }
  }

  compararObjetos(o1: any, o2: any): boolean {
    // Comparamos el valor del control con el ID de la opción
    return o1 == o2;
  }
}