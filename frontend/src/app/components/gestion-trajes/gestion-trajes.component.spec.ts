import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { GestionTrajesComponent } from './gestion-trajes.component';
import { TrajeService } from '../../services/traje.service';
import { AlertService } from '../../services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';

describe('GestionTrajesComponent', () => {
  let component: GestionTrajesComponent;
  let fixture: ComponentFixture<GestionTrajesComponent>;
  let trajeServiceSpy: any;
  let alertServiceSpy: any;
  let dialogSpy: any;

  beforeEach(async () => {
    trajeServiceSpy = {
      getTrajes: vi.fn().mockReturnValue(of({ ok: true, trajes: [] } as any)),
      crearTraje: vi.fn()
    };
    alertServiceSpy = {
      mostrarExito: vi.fn(),
      mostrarError: vi.fn()
    };
    dialogSpy = {
      open: vi.fn(),
      closeAll: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [GestionTrajesComponent],
      providers: [
        FormBuilder,
        ChangeDetectorRef,
        { provide: TrajeService, useValue: trajeServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(GestionTrajesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear un traje exitosamente llamando a crearTraje', () => {
    trajeServiceSpy.crearTraje.mockReturnValue(of({ ok: true, traje: {} } as any));

    component.modoEdicion = false;
    component.trajeForm.setValue({
      codigoEtiqueta: 'CMP-1234',
      categoria: 'De competencia',
      talle: 'L',
      color: 'NEGRO',
      cantidad: 2,
      precioAlquilerBase: 50000
    });

    component.guardarTraje();

    expect(trajeServiceSpy.crearTraje).toHaveBeenCalledWith({
      codigoEtiqueta: 'CMP-1234',
      categoria: 'De competencia',
      talle: 'L',
      estado: 'Disponible',
      color: 'NEGRO',
      cantidad: 2,
      precioAlquilerBase: 50000
    });
    expect(alertServiceSpy.mostrarExito).toHaveBeenCalledWith('Traje creado con éxito');
    expect(dialogSpy.closeAll).toHaveBeenCalled();
  });
});
