import { Component, Inject, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<FormReserva>,
    @Inject(MAT_DIALOG_DATA) public data: any // Aquí llega la reserva si es editar
  ) {
    this.form = this.fb.group({
      clienteId: [data?.Cliente?.id || '', Validators.required],
      trajeId: [data?.Traje?.id || '', Validators.required],
      fechaRetiro: [data?.fechaRetiro || '', Validators.required],
      fechaDevolución: [data?.fechaRetiro || '2026-05-02', Validators.required],
      senia: [data?.senia || 0, Validators.required],
      estado: [data?.estado || 'PENDIENTE', Validators.required]
    });
  }

  ngOnInit() {
    // Cargamos los datos para los select
    this._clienteService.getClientes().subscribe((res: any) => {
      this.listClientes = Array.isArray(res) ? res : (res.clientes || []);
    });
    this._trajeService.getTrajes().subscribe((res: any) => {
      this.listTrajes = Array.isArray(res) ? res : (res.trajes || []);
    });      
  }

  ngAfterViewInit() {
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
}