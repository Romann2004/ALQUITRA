// frontend/src/app/components/gestion-clientes/gestion-clientes.ts
import { Component, OnInit, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Cliente } from '../../services/cliente';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog'; // NUEVO: Importamos MatDialog

@Component({
  selector: 'app-gestion-clientes',
  standalone: false,
  templateUrl: './gestion-clientes.html',
  styleUrl: './gestion-clientes.css',
})
export class GestionClientes implements OnInit {
  // NUEVO: Capturamos la referencia de la plantilla HTML del modal
  @ViewChild('clienteDialog') clienteDialog!: TemplateRef<any>;

  listClientes: any[] = [];
  displayedColumns: string[] = ['id', 'nombre', 'dni', 'telefono', 'email', 'acciones'];

  clienteForm: FormGroup;
  modoEdicion: boolean = false;
  clienteIdActual: number | null = null;
  cargando: boolean = false;

  constructor(
    private _cliente: Cliente,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog // NUEVO: Inyectamos el gestor de modales
  ) { 
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
    const fieldName = 'edit' + campo.charAt(0).toUpperCase() + campo.slice(1);

    if (cliente[fieldName] === true) {
      cliente[fieldName] = false;
      const body = { [campo]: cliente[campo] };

      this._cliente.patchCliente(cliente.id, body).subscribe({
        next: () => {
          this.mostrarMensaje('¡Cambio Guardado!', false);
        },
        error: (err) => {
          const msg = err.error?.msg || 'Error al guardar el cambio';
          this.mostrarMensaje(msg, true);
          this.obtenerClientes();
        }
      });
    }
  }

  // NUEVO MÉTODO: Abre el modal vacío para crear un cliente
  agregarCliente() {
    this.modoEdicion = false;
    this.clienteIdActual = null;
    this.clienteForm.reset();
    
    this.dialog.open(this.clienteDialog, {
      width: '450px',
      backdropClass: 'blur-backdrop', // <-- APLICAMOS EL DESENFOQUE REUTILIZABLE
      autoFocus: false
    });
  }

  // MODIFICADO: Ahora reutiliza la edición abriendo el modal con los datos cargados
  editarCliente(cliente: any) {
    this.modoEdicion = true;
    this.clienteIdActual = cliente.id;
    this.clienteForm.patchValue({
      nombre: cliente.nombre,
      dni: cliente.dni,
      telefono: cliente.telefono,
      email: cliente.email
    });

    this.dialog.open(this.clienteDialog, {
      width: '450px',
      backdropClass: 'blur-backdrop', // <-- APLICAMOS EL DESENFOQUE EN LA EDICIÓN TAMBIÉN
      autoFocus: false
    });
  }

  guardarCliente() {
    if (this.clienteForm.invalid) {
      this.mostrarMensaje('Por favor, completa todos los campos correctamente.', true);
      return;
    }

    const clienteData = this.clienteForm.value;

    if (this.modoEdicion && this.clienteIdActual) {
      this._cliente.putCliente(this.clienteIdActual, clienteData).subscribe({
        next: () => {
          this.mostrarMensaje('Cliente actualizado exitosamente', false);
          this.dialog.closeAll(); // Cierra el modal al finalizar con éxito
          this.resetearFormulario();
          this.obtenerClientes();
        },
        error: (err) => {
          const msg = err.error?.msg || 'Error al actualizar el cliente';
          this.mostrarMensaje(msg, true);
        }
      });
    } else {
      this._cliente.postCliente(clienteData).subscribe({
        next: () => {
          this.mostrarMensaje('Cliente creado exitosamente', false);
          this.dialog.closeAll(); // Cierra el modal al finalizar con éxito
          this.resetearFormulario();
          this.obtenerClientes();
        },
        error: (err) => {
          const msg = err.error?.msg || 'Error al crear el cliente';
          this.mostrarMensaje(msg, true);
        }
      });
    }
  }

  cancelarEdicion() {
    this.resetearFormulario();
    this.dialog.closeAll();
  }

  resetearFormulario() {
    this.clienteForm.reset();
    this.modoEdicion = false;
    this.clienteIdActual = null;
  }

  eliminarCliente(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      this._cliente.deleteCliente(id).subscribe({
        next: () => {
          this.mostrarMensaje('Cliente eliminado exitosamente', false);
          this.obtenerClientes();
        },
        error: (err) => {
          const msg = err.error?.msg || 'Error al eliminar cliente';
          this.mostrarMensaje(msg, true);
        }
      });
    }
  }

  mostrarMensaje(mensaje: string, esError: boolean = false) {
    this._snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: esError ? ['snackbar-error'] : ['snackbar-exito']
    });
  }
}