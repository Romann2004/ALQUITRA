import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Cliente } from '../../services/cliente';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private fb: FormBuilder ,
    private _snackBar: MatSnackBar
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
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  guardarCambio(cliente: any, campo: string) {
    // Identificamos el nombre de la variable que controla el input (ej: editNombre)
    const fieldName = 'edit' + campo.charAt(0).toUpperCase() + campo.slice(1);

    if (cliente[fieldName] === true) {
      cliente[fieldName] = false;
      const body = { [campo]: cliente[campo] };

      this._cliente.patchCliente(cliente.id, body).subscribe({
        next: () => {
          this.mostrarMensaje('¡Cambio Guardado!', false);
          },
        error: (err) => {
          // Capturamos el 400 del back si modificó el DNI/Email por uno duplicado
          const msg = err.error?.msg || 'Error al guardar el cambio';
          this.mostrarMensaje(msg, true);
          this.obtenerClientes(); // Si falla, volvemos al valor anterior
        }
      });
    }
  }

  // --- FUNCIONES DEL FORMULARIO ---

  guardarCliente() {
    if (this.clienteForm.invalid) {
      this.mostrarMensaje('Por favor, completa todos los campos correctamente.', true);
      return;
    }

    const clienteData = this.clienteForm.value;

    if (this.modoEdicion && this.clienteIdActual) {
      // --- MODO EDICIÓN (PUT) ---
      this._cliente.putCliente(this.clienteIdActual, clienteData).subscribe({
        next: () => {
          this.mostrarMensaje('Cliente actualizado exitosamente', false);
          this.resetearFormulario();
          this.obtenerClientes();
        },
        error: (err) => {
          // Capturamos el error por si duplicó DNI o Email de otro cliente
          const msg = err.error?.msg || 'Error al actualizar el cliente';
          this.mostrarMensaje(msg, true);
        }
      });
    } else {
      // --- MODO CREACIÓN (POST) ---
      this._cliente.postCliente(clienteData).subscribe({
        next: () => {
          this.mostrarMensaje('Cliente creado exitosamente', false);
          this.resetearFormulario();
          this.obtenerClientes();
        },
        error: (err) => {
          // Capturamos el error del backend si el DNI o Email ya existen
          const msg = err.error?.msg || 'Error al crear el cliente';
          this.mostrarMensaje(msg, true);
        }
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
          this.mostrarMensaje('Cliente eliminado exitosamente', false);
          this.obtenerClientes(); // Recarga la lista (ya no vendrá porque activo será false)
        },
        error: (err) => {
          const msg = err.error?.msg ||'Error al eliminar cliente';
          this.mostrarMensaje(msg, true);
        }
      });
    }
  }

  // FUNCIÓN AUXILIAR (Para no repetir código del SnackBar)
  mostrarMensaje(mensaje: string, esError: boolean = false) {
    this._snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: esError ? ['snackbar-error'] : ['snackbar-exito'] // Reutiliza nuestras clases CSS existentes
    })
  }
}