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
  recentReservations: any[] = []; 
  topClients: any[] = []; // <-- NUEVA PROPIEDAD PARA ALMACENAR CLIENTES FIELES

  public chartSeries: any[] = [];
  public chartDetails: any = {};
  public chartXAxis: any = {};
  public chartYAxis: any = {}; 
  public chartTitle: any = {};
  public chartColors: string[] = [];
  public chartPlotOptions: any = {};
  public chartDataLabels: any = {};
  public chartGrid: any = {};
  public chartStates: any = {};

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef  
  ) {
    this.initChartConfig([], []);
  }

  ngOnInit(): void {
    console.log('Cargando Dashboard...');
    this.dashboardService.getStats().subscribe({
      next: (res) => {
        console.log('Datos recibidos del server:', res);
        if (res && res.ok) {
          this.stats = res.stats;
          this.recentReservations = res.ultimasReservas || [];
          this.topClients = res.clientesFieles || []; // <-- Capturamos la lista del backend

          if (res.historico) {
            this.initChartConfig(res.historico.categorias, res.historico.datos);
          }

          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar las estadísticas', err)
    });
  }

  initChartConfig(categories: string[], data: number[]): void {
    this.chartSeries = [
      {
        name: 'Trajes Retirados',
        data: data
      }
    ];

    this.chartDetails = {
      type: 'bar',
      height: 340,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 }
    };

    this.chartColors = ['#4f46e5']; 

    this.chartPlotOptions = {
      bar: { borderRadius: 6, columnWidth: '35%' }
    };

    this.chartDataLabels = { enabled: false };

    this.chartGrid = {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    };

    this.chartXAxis = {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b', fontSize: '13px', fontWeight: 500 } }
    };

    const maxVal = data.length ? Math.max(...data) : 0;
    this.chartYAxis = {
      min: 0,
      tickAmount: maxVal > 0 && maxVal < 5 ? maxVal : undefined,
      labels: {
        style: { colors: '#64748b', fontSize: '13px' },
        formatter: (val: number) => val.toFixed(0) // Mantiene números enteros estrictos
      }
    };

    this.chartTitle = {
      text: 'Tendencia Mensual de Alquileres',
      align: 'left',
      style: { fontSize: '16px', fontWeight: 600, color: '#1e293b' }
    };

    this.chartStates = {
      hover: { filter: { type: 'darken', value: 0.9 } }
    };
  }
}