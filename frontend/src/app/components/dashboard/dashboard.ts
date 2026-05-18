import { Component, OnInit, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
import { DashboardService } from '../../services/dashboard';
import { MatDialog } from '@angular/material/dialog'; // 1. Importamos el gestor de modales

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  @ViewChild('monthDialog') monthDialog!: TemplateRef<any>; // Captura la plantilla del HTML

  stats: any = {};
  recentReservations: any[] = []; 
  topClients: any[] = []; 
  
  // PROPIEDADES NUEVAS PARA EL MODAL INTERACTIVO
  allRecentReservations: any[] = [];      // Almacena la bolsa completa de reservas de los 6 meses
  selectedMonthReservations: any[] = []; // Guarda solo las reservas filtradas del mes clickeado
  selectedMonthName: string = '';        // Nombre del mes seleccionado para el título del modal

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
    private dialog: MatDialog, // 2. Inyectamos el servicio en el constructor
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
          this.topClients = res.clientesFieles || [];
          
          // Guardamos la lista extendida para poder filtrarla localmente en el frontend
          this.allRecentReservations = res.historico?.rawReservas || []; 
          // Si el backend no la anidó directo, usamos las reservas crudas calculadas
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
    this.chartSeries = [{ name: 'Trajes Retirados', data: data }];

    this.chartDetails = {
      type: 'bar',
      height: 340,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
      
      // 3. NUEVO: Escuchamos el evento de click sobre las barras del gráfico
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const monthIndex = config.dataPointIndex;
          const monthName = config.w.config.xaxis.categories[monthIndex];
          if (monthName) {
            this.onMonthBarClick(monthName);
          }
        }
      }
    };

    this.chartColors = ['#4f46e5']; 
    this.chartPlotOptions = { bar: { borderRadius: 6, columnWidth: '35%' } };
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
        formatter: (val: number) => val.toFixed(0)
      }
    };

    this.chartTitle = {
      text: 'Tendencia Mensual de Alquileres',
      align: 'left',
      style: { fontSize: '16px', fontWeight: 600, color: '#1e293b' }
    };

    this.chartStates = { hover: { filter: { type: 'darken', value: 0.9 } } };
  }

  // 4. NUEVO MÉTODO: Filtra los alquileres del mes clickeado y despliega el modal emergente
  // Reemplazá este método completo en tu archivo dashboard.ts
  onMonthBarClick(monthName: string): void {
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    this.selectedMonthName = monthName;

    // Filtramos las reservas del mes de manera segura usando strings directos
    this.selectedMonthReservations = this.allRecentReservations.filter((reserva: any) => {
      if (!reserva.fechaRetiro) return false;
      
      // Como fechaRetiro viene en formato "YYYY-MM-DD", la picamos por el guion
      const partes = reserva.fechaRetiro.split('-'); // Ejemplo: ['2026', '05', '18']
      const mesIndex = parseInt(partes[1], 10) - 1;  // Convertimos '05' a número (5) y restamos 1 para el índice del array
      const etiquetaMes = nombresMeses[mesIndex];    // 'May'
      
      return etiquetaMes === monthName;
    });

    // Abrimos el modal con el fondo difuminado
    this.dialog.open(this.monthDialog, {
      width: '480px',
      backdropClass: 'blur-backdrop',
      autoFocus: false
    });
    
    this.cdr.detectChanges();
  }
}