import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormReserva } from './form-reserva';

describe('FormReserva', () => {
  let component: FormReserva;
  let fixture: ComponentFixture<FormReserva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormReserva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormReserva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
