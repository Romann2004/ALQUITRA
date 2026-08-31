import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { DashboardService } from '../../services/dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let dashboardServiceSpy: any;

  beforeEach(async () => {
    dashboardServiceSpy = {
      getStats: () => of({ ok: true, stats: {}, ultimasReservas: [], clientesFieles: [] })
    };

    await TestBed.configureTestingModule({
      declarations: [Dashboard],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
