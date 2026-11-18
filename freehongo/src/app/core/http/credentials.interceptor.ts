import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environments';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  req.url.startsWith(environment.apiUrl) ? next(req.clone({ withCredentials: true })) : next(req);
