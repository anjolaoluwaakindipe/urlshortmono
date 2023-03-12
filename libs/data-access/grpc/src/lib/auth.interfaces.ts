import { Observable } from 'rxjs';
export interface AuthService {
  isValid(data: {
    userId: string;
    roles: string[];
  }): Observable<{ isValid: boolean }>;
}
