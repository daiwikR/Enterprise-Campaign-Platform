import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token is present in localStorage', () => {
    localStorage.setItem('auth_token', 'test.jwt.token');

    http.get('/api/campaigns').subscribe();

    const req = httpMock.expectOne('/api/campaigns');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test.jwt.token');
    req.flush([]);
  });

  it('should not add Authorization header when no token is in localStorage', () => {
    localStorage.removeItem('auth_token');

    http.get('/api/campaigns').subscribe();

    const req = httpMock.expectOne('/api/campaigns');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should pass the request through unchanged except for the Authorization header', () => {
    localStorage.setItem('auth_token', 'my.token.here');

    http.get('/api/test', { headers: { 'X-Custom': 'yes' } }).subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my.token.here');
    expect(req.request.headers.get('X-Custom')).toBe('yes');
    req.flush({});
  });
});
