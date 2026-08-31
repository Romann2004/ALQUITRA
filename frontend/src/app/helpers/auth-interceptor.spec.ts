import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let interceptor: authInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [authInterceptor]
    });
    interceptor = TestBed.inject(authInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
