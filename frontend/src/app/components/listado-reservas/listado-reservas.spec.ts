import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { ListadoReservas } from './listado-reservas';
import { ReservaService } from '../../services/reserva.service';

describe('ListadoReservas', () => {
  let component: ListadoReservas;
  let fixture: ComponentFixture<ListadoReservas>;
  let reservaServiceSpy: any;

  beforeEach(async () => {
    reservaServiceSpy = {
      getReservas: () => of([])
    };

    await TestBed.configureTestingModule({
      declarations: [ListadoReservas],
      providers: [
        { provide: ReservaService, useValue: reservaServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoReservas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
