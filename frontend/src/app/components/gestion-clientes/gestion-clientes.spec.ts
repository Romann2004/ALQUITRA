import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { GestionClientes } from './gestion-clientes';
import { Cliente } from '../../services/cliente';
import { AlertService } from '../../services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';

describe('GestionClientes', () => {
  let component: GestionClientes;
  let fixture: ComponentFixture<GestionClientes>;
  let clienteServiceSpy: any;
  let alertServiceSpy: any;
  let dialogSpy: any;

  beforeEach(async () => {
    clienteServiceSpy = {
      getClientes: vi.fn().mockReturnValue(of([])),
      postCliente: vi.fn()
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
      declarations: [GestionClientes],
      providers: [
        FormBuilder,
        ChangeDetectorRef,
        { provide: Cliente, useValue: clienteServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionClientes);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  it('debería crear un cliente exitosamente llamando a postCliente', () => {
    clienteServiceSpy.postCliente.mockReturnValue(of({ msg: 'Éxito' }));

    component.modoEdicion = false;
    component.clienteForm.setValue({
      nombre: 'Juan Perez',
      dni: '35383229',
      telefono: '3462201816',
      email: 'juan@gmail.com'
    });

    component.guardarCliente();

    expect(clienteServiceSpy.postCliente).toHaveBeenCalledWith({
      nombre: 'Juan Perez',
      dni: '35383229',
      telefono: '3462201816',
      email: 'juan@gmail.com'
    });
    expect(alertServiceSpy.mostrarExito).toHaveBeenCalledWith('Cliente creado exitosamente');
    expect(dialogSpy.closeAll).toHaveBeenCalled();
  });
});
