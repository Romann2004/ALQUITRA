import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // Configuración global para las alertas tipo "Snackbar" (Toast)
  private toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  constructor() { }

  // Reemplaza al snackBar de éxito
  mostrarExito(mensaje: string) {
    this.toast.fire({
      icon: 'success',
      title: mensaje
    });
  }

  // Reemplaza al snackBar de error
  mostrarError(mensaje: string) {
    this.toast.fire({
      icon: 'error',
      title: mensaje
    });
  }

  // Reemplaza al window.confirm() nativo
  confirmarAccion(titulo: string, mensaje: string): Promise<boolean> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e91e63', // color rosa (accent)
      cancelButtonColor: '#64748b',  // Color gris oscuro
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn-rosa'
      }
    }).then((result) => {
      return result.isConfirmed;
    });
  }
}