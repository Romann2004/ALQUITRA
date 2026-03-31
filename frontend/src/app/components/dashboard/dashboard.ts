import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../services/dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  stats: any = {};

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef  
  ) {}

  ngOnInit(): void {
    console.log('Cargando Dashnoard...');
    this.dashboardService.getStats().subscribe({
      next: (res) => {
        console.log('Datos recibidos del server:', res);
        if (res && res.ok) {
          // Asignamos directamente el objeto stats
          this.stats = res.stats;

          this.cdr.detectChanges();

          console.log('Datos asignados y vista refrescada:', this.stats);
        }
      },
      error: (err) => console.error('Error al cargar las estadísticas' , err)
    });
  }

}
