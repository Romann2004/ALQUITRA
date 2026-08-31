import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { FormReserva } from './form-reserva';
import { ReservaService } from '../../services/reserva.service';
import { Cliente } from '../../services/cliente';
import { TrajeService } from '../../services/traje.service';
import { AlertService } from '../../services/alert.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { EstadoReserva } from '../../models/reserva.model';

describe('FormReserva', () => {
  let component: FormReserva;
  let fixture: ComponentFixture<FormReserva>;
  let reservaServiceSpy: any;
  let clienteServiceSpy: any;
  let trajeServiceSpy: any;
  let alertServiceSpy: any;
  let dialogRefSpy: any;

  beforeEach(async () => {
    reservaServiceSpy = { addReserva: vi.fn() };
    clienteServiceSpy = { getClientes: vi.fn().mockReturnValue(of([])) };
    trajeServiceSpy = { getTrajes: vi.fn().mockReturnValue(of({ ok: true, trajes: [] } as any)) };
    alertServiceSpy = { mostrarExito: vi.fn(), mostrarError: vi.fn() };
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatSelectModule,
        MatInputModule,
        BrowserAnimationsModule,
        MatDatepickerModule,
        MatNativeDateModule
      ],
      declarations: [FormReserva],
      providers: [
        FormBuilder,
        ChangeDetectorRef,
        { provide: ReservaService, useValue: reservaServiceSpy },
        { provide: Cliente, useValue: clienteServiceSpy },
        { provide: TrajeService, useValue: trajeServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FormReserva);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear una reserva exitosamente llamando a addReserva', () => {
    reservaServiceSpy.addReserva.mockReturnValue(of({ msg: 'Éxito' }));
    
    component.form.patchValue({
      clienteId: 10,
      trajeId: 5,
      cantidad: 3,
      fechaRetiro: new Date('2026-09-01'),
      fechaDevolucion: new Date('2026-09-05'),
      senia: 1500
    });

    component.guardar();

    expect(reservaServiceSpy.addReserva).toHaveBeenCalledWith({
      clienteId: 10,
      trajeId: 5,
      cantidad: 3,
      fechaRetiro: new Date('2026-09-01'),
      fechaDevolucion: new Date('2026-09-05'),
      senia: 1500,
      estado: EstadoReserva.PENDIENTE
    });
    
    expect(alertServiceSpy.mostrarExito).toHaveBeenCalledWith('Reserva creada con éxito');
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
