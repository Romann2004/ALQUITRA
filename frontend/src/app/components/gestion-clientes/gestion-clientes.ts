import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Cliente } from '../../services/cliente';

@Component({
  selector: 'app-gestion-clientes',
  standalone: false,
  templateUrl: './gestion-clientes.html',
  styleUrl: './gestion-clientes.css',
})
export class GestionClientes implements OnInit {
  listClientes: any[] = [];
  displayedColumns: string[] = ['id', 'nombre', 'dni', 'telefono', 'email', 'acciones'];

  clienteForm: FormGroup;
  modoEdicion: boolean = false;
  clienteIdActual: number | null = null;

  constructor(
    private _cliente: Cliente,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder 
  ) { 
    // Inicializamos el formulario con validaciones
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      dni: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.obtenerClientes();
  }

  obtenerClientes() {
    this._cliente.getClientes().subscribe({
      next: (data) => {
        this.listClientes = data;
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error al cargar clientes', e)
    });
  }

  // --- FUNCIONES DEL FORMULARIO ---

  guardarCliente() {
    if (this.clienteForm.invalid) {
      alert('Por favor, completa todos los campos correctamente.');
      return;
    }

    const clienteData = this.clienteForm.value;

    if (this.modoEdicion && this.clienteIdActual) {
      this._cliente.putCliente(this.clienteIdActual, clienteData).subscribe({
        next: () => {
          alert('Cliente actualizado exitosamente');
          this.resetearFormulario();
          this.obtenerClientes();
        },
        error: (e) => console.error('Error al actualizar', e)
      });
    } else {
      this._cliente.postCliente(clienteData).subscribe({
        next: () => {
          alert('Cliente creado exitosamente');
          this.resetearFormulario();
          this.obtenerClientes();
        },
        error: (e) => console.error('Error al crear', e)
      });
    }
  }

  editarCliente(cliente: any) {
    this.modoEdicion = true;
    this.clienteIdActual = cliente.id;
    this.clienteForm.patchValue({
      nombre: cliente.nombre,
      dni: cliente.dni,
      telefono: cliente.telefono,
      email: cliente.email
    });
  }

  cancelarEdicion() {
    this.resetearFormulario();
  }

  resetearFormulario() {
    this.clienteForm.reset();
    this.modoEdicion = false;
    this.clienteIdActual = null;
  }

  // --- FUNCIÓN DE ELIMINAR ---

  eliminarCliente(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      this._cliente.deleteCliente(id).subscribe({
        next: () => {
          alert('Cliente eliminado exitosamente');
          this.obtenerClientes();
        },
        error: (e) => console.error('Error al eliminar cliente', e)
      });
    }
  }
}