import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCard, MatCardModule, MatCardHeader, MatCardTitle, MatCardContent } from "@angular/material/card";
import { MatFormField, MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatSelect, MatOption } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Traje } from '../../models/traje.model';
import { TrajeService } from '../../services/traje.service';


@Component({
  selector: 'app-gestion-trajes',
  standalone: true,
  templateUrl: './gestion-trajes.component.html',
  styleUrls: ['./gestion-trajes.component.css'],
  imports: [
    MatCard, MatCardModule,MatCardHeader, MatCardTitle, MatCardContent, MatFormFieldModule, MatLabel, MatSelect, 
    MatOption, MatIconModule, CommonModule, ReactiveFormsModule, MatTableModule, MatInputModule, MatSelectModule,
    MatButtonModule
  ]
})
export class GestionTrajesComponent implements OnInit {
  trajes: Traje[] = [];
  trajeForm: FormGroup;
  dataSource = new MatTableDataSource<any>();
  columnasVisibles: string[] = ['codigo', 'categoria', 'talle', 'color', 'precio', 'estado'];

  constructor(private fb: FormBuilder, private trajeService: TrajeService) {
    this.trajeForm = this.fb.group({
      codigoEtiqueta: ['', Validators.required],
      categoria: ['', Validators.required],
      talle: ['', Validators.required],
      color: ['', Validators.required],
      precioAlquilerBase: ['', [Validators.required, Validators.min(1)]],
      estado: ['Disponible']
    });
  }

  ngOnInit(): void {
    // Cargar trajes del backend cuando se cargue el componente
    this.cargarTrajes();
  }

  cargarTrajes() {
  this.trajeService.getTrajes().subscribe({
    next: (res: any) => {
      // Como tu API devuelve { ok: true, trajes: [...] }, 
      // debemos asignar res.trajes a nuestra variable local.
      this.trajes = res.trajes; 
    },
    error: (err) => console.error('Error al cargar', err)
  });
}

  guardarTraje() {
    if (this.trajeForm.valid) {
      this.trajeService.crearTraje(this.trajeForm.value).subscribe({
        next: () => {
          this.cargarTrajes();
          this.trajeForm.reset({ estado: 'Disponible' });
        },
        error: (err) => alert('Error: ' + err.message) 
      });
    }
    
  }
}
