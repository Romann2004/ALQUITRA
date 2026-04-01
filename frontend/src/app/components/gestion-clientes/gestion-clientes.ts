import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Cliente } from '../../services/cliente';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gestion-clientes',
  standalone: false,
  templateUrl: './gestion-clientes.html',
  styleUrl: './gestion-clientes.css',
})

export class GestionClientes implements OnInit{
  listClientes: any[] = [];
  displayedColumns: string[] = ['nombre', 'dni', 'telefono', 'email', 'acciones'];

  constructor(
    private _cliente: Cliente,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.obtenerClientes();
  }

  obtenerClientes() {
    this._cliente.getClientes().subscribe({
      next: (data) => {
        console.log('Clientes recibidos:', data);
        this.listClientes = data;
        this.cdr.detectChanges(); // Asegura que la vista se actualice con los nuevos datos
      },
      error: (e) => console.error('Error al cargar clientes', e)
    });
  }
}



