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
  cargando: boolean = false;

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

  guardarCambio(cliente: any, campo: string) {
    // 1. Identificamos el nombre de la variable que controla el input (ej: editNombre)
    const fieldName = 'edit' + campo.charAt(0).toUpperCase() + campo.slice(1);

    // 2. Si por alguna razón el campo ya está en false, salimos para evitar el doble disparo
    if (cliente[fieldName] === true) {
          
      cliente[fieldName] = false;

      const body = { [campo]: cliente[campo] };

      this._cliente.patchCliente(cliente.id, body).subscribe({
        next: () => {
          console.log('Actualizado con éxito');
          //alert(`${campo} actualizado con éxito`);
        },
        error: () => {
          console.log('Error al actualizar');
          //alert('Error al actualizar');
          this.obtenerClientes(); // Si falla, volvemos al valor anterior
        }
      });
    }
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