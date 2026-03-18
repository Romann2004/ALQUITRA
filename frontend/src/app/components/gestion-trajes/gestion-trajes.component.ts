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
import { ChangeDetectorRef } from '@angular/core';


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
  columnasVisibles: string[] = ['codigo', 'categoria', 'talle', 'color', 'precio', 'estado', 'acciones'];

  constructor(private fb: FormBuilder, private trajeService: TrajeService, private cdr: ChangeDetectorRef) {
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
    next: (res) => {
      // 'res' es el objeto completo { ok: true, trajes: [...] }
      this.trajes = res.trajes; // Extraemos solo el array
      this.dataSource.data = this.trajes; // Actualizamos la tabla de Material
      this.cdr.detectChanges(); 
    },
    error: (err) => console.error('Error al cargar', err)
  });
}

 trajeIdEnEdicion: number | null = null;

  prepararEdicion(traje: Traje) {
    this.trajeIdEnEdicion = traje.id!; //Guardamos el id que estamos editando
    //Seteamos los valores en el formulario para que el usuario pueda editarlos
    this.trajeForm.patchValue(traje); // Rellena el formulario con los datos de la fila
  }
    guardarTraje() {
  if (this.trajeForm.invalid) return;
  const datosTraje = this.trajeForm.value;
  if (this.trajeIdEnEdicion) {
    this.trajeService.actualizarTraje(this.trajeIdEnEdicion, datosTraje).subscribe({
      next: () => {
        alert('Cambios guardados correctamente en el servidor. Por favor, recargue la página para visualizar los cambios en la tabla.');
        this.trajeIdEnEdicion = null;
        this.trajeForm.reset();
      },
      error: (err) => {
        console.error('Error al actualizar', err);
        alert('Hubo un error al guardar los cambios.');
      }
    });
  } else {
    this.trajeService.crearTraje(datosTraje).subscribe({
      next: () => this.finalizarOperacion('Traje creado con éxito'),
      error: (err) => console.error(err)
    });
  }
}
  eliminarTraje(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este traje?')) {
      this.trajeService.eliminarTraje(id).subscribe({
        next: () => {
          this.cargarTrajes(); // Acá refrescamos la tablas
          // Msje de éxito opcional 
        },
        error: (err) => alert('Eror al eliminar: ' + err.message)
      });
    }
  }
  finalizarOperacion(mensaje: string) {
    alert(mensaje);
    this.cargarTrajes();
    this.trajeForm.reset();
    this.trajeIdEnEdicion = null; // Limpia el modo edición
  }

}


