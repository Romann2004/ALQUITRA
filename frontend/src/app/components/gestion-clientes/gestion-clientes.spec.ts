import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionClientes } from './gestion-clientes';

describe('GestionClientes', () => {
  let component: GestionClientes;
  let fixture: ComponentFixture<GestionClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionClientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
