import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    const initialUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<any>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private getStoredUser(): any {
    if (!this.isBrowser) return null;
    
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(map(response => {
        const user = {
          id: response.userId,
          email: response.email,
          role: response.role,
          token: response.token
        };
        
        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('userEmail', response.email);
          localStorage.setItem('userRole', response.role);
         
        }
        
        this.currentUserSubject.next(user);
        return response;
      }));
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      
    }
    
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return this.isBrowser ? !!localStorage.getItem('token') : false;
  }

  getUserRole(): string | null {
    return this.isBrowser ? localStorage.getItem('userRole') : null;
  }

  redirectBasedOnRole(): void {
    const role = this.getUserRole();
    
    if (!role) {
      this.router.navigate(['/login']);
      return;
    }

    switch (role) {
      case 'admin':
        this.router.navigate(['/dashboard']);
        break;
      case 'user':
        const userId = this.isBrowser ? localStorage.getItem('userId') : null;
        if (userId) {
          this.router.navigate(['/user-dashboard', userId]);
        } else {
          this.router.navigate(['/login']);
        }
        break;
      case 'medecin':
        this.router.navigate(['/medecin-dashboard']);
        break;
      case 'coach':
        this.router.navigate(['/coach-dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  getcurrentUser(): any {
    if (!this.isBrowser) {
      return null;
    }
  
    const currentUser = this.currentUserSubject.value;
    return currentUser;
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

}