import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { TrajeService } from '../../services/traje.service';
import { Cliente } from '../../services/cliente';
import { forkJoin } from 'rxjs';

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
    private cdr: ChangeDetectorRef,
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

    // 1. Cargamos las listas siempre
    this._clienteService.getClientes().subscribe(res => {
      this.listClientes = Array.isArray(res) ? res : (res.clientes || []);
      // Si ya tenemos datos de edición, intentamos parchear tras cargar la lista
      if (this.data) this.patchFormData();
    });
    
    this._trajeService.getTrajes().subscribe(res => {
      this.listTrajes = Array.isArray(res) ? res : (res.trajes || []);
      // Si ya tenemos datos de edición, intentamos parchear tras cargar la lista
      if (this.data) this.patchFormData();
    });
  }

  // 3. Método auxiliar para evitar repetición
  patchFormData() {
    this.form.patchValue({
      clienteId: this.data.Cliente?.id,
      trajeId: this.data.Traje?.id,
      fechaRetiro: this.data.fechaRetiro,
      fechaDevolucion: this.data.fechaDevolucion,
      senia: this.data.senia,
      estado: this.data.estado
    });

    this.cdr.detectChanges();
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

  compararObjetos(o1: any, o2: any) {
    // Comparamos el valor del control con el ID de la opción
    return o1 === o2;
  }
}