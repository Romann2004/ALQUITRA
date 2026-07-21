// frontend/src/app/components/gestion-clientes/gestion-clientes.ts
import { Component, OnInit, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms'; 
import { Cliente } from '../../services/cliente';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog'; 

@Component({
  selector: 'app-gestion-clientes',
  standalone: false,
  templateUrl: './gestion-clientes.html',
  styleUrl: './gestion-clientes.css',
})
export class GestionClientes implements OnInit {
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
    private dialog: MatDialog 
  ) { 
    this.clienteForm = this.fb.group({
      // MODIFICADO: Obligatorio y sólo letras/espacios (mínimo 3 caracteres para ser un nombre real)
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$') 
      ]],
      dni: ['', [
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(9),
        Validators.pattern('^[0-9]+$') 
      ]],
      telefono: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(10),
        Validators.pattern('^[0-9]+$'),
        this.telefonoDuplicadoValidador.bind(this) 
      ]],
      // REFORZADO: Obligatorio y con formato de correo electrónico estricto
      email: ['', [
        Validators.required, 
        Validators.email
      ]]
    });
  }

  ngOnInit(): void {
    this.obtenerClientes();
  }

  filtrarTeclas(event: KeyboardEvent): boolean {
    const reg = /^[0-9]$/;
    return reg.test(event.key);
  }

  telefonoDuplicadoValidador(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const telefonoIngresado = control.value.toString().trim();

    const existe = this.listClientes.some(cliente => {
      if (this.modoEdicion && cliente.id === this.clienteIdActual) {
        return false;
      }
      return cliente.telefono?.toString().trim() === telefonoIngresado;
    });

    return existe ? { telefonoRepetido: true } : null;
  }

  obtenerClientes() {
    this._cliente.getClientes().subscribe({
      next: (data) => {
        this.listClientes = data;
        
        // CORRECCIÓN 1: Una vez que llegan los clientes del servidor, forzamos al campo
        // de teléfono a re-validarse para que detecte si hay duplicados existentes.
        this.clienteForm.get('telefono')?.updateValueAndValidity();
        
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
          this.obtenerClientes(); // Recargamos para actualizar la lista en memoria
        },
        error: (err) => {
          const msg = err.error?.msg || 'Error al guardar el cambio';
          this.mostrarMensaje(msg, true);
          this.obtenerClientes();
        }
      });
    }
  }

  agregarCliente() {
    this.modoEdicion = false;
    this.clienteIdActual = null;
    this.clienteForm.reset();
    
    // CORRECCIÓN 2: Al resetear el formulario para un nuevo cliente, nos aseguramos
    // de limpiar errores previos y recalcular su estado inicial de validez.
    this.clienteForm.get('telefono')?.updateValueAndValidity();

    this.dialog.open(this.clienteDialog, {
      width: '450px',
      backdropClass: 'blur-backdrop', 
      autoFocus: false
    });
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

    // CORRECCIÓN 3: Al cargar los datos viejos en modo edición, obligamos a Angular
    // a re-evaluar si este teléfono cargado pertenece o no al cliente actual.
    this.clienteForm.get('telefono')?.updateValueAndValidity();

    this.dialog.open(this.clienteDialog, {
      width: '450px',
      backdropClass: 'blur-backdrop', 
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
          this.dialog.closeAll(); 
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
          this.dialog.closeAll(); 
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