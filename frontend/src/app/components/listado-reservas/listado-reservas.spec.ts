import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoReservas } from './listado-reservas';

describe('ListadoReservas', () => {
  let component: ListadoReservas;
  let fixture: ComponentFixture<ListadoReservas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListadoReservas]
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
