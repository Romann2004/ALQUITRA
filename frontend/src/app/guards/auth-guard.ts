import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';


export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = sessionStorage.getItem('token')

  if (token) {
    return true; // Puede pasar
  } else {
    router.navigate(['/login']) // Lo devuelve al login
    return false;
  }
};

