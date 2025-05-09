import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
/*   private apiUrl = 'https://db.redpsicologos.cl:5542/welcome';
 */
/* private apiUrl = '/email-api/welcome';  // Usa la ruta del proxy
  constructor(public http: HttpClient) {} */
  private apiUrl: string;
  constructor(public http: HttpClient) {
    // Si está en producción, usa la URL del entorno
    // Si está en desarrollo, usa la ruta del proxy
    this.apiUrl = environment.production 
      ? environment.emailServiceUrl 
      : '/email-api/welcome';
    console.log('Email Service URL:', this.apiUrl);
  }

  /* sendWelcomeEmail(toEmail: string, toName: string, templateId: number, params: any): Observable<any> {
    const body = {
      toEmail,
      toName,
      templateId,
      params
    };
    return this.http.post(this.apiUrl, body);
  } */
  /* sendWelcomeEmail(toEmail: string, toName: string, templateId: number, params: any): Observable<any> {
    const body = {
      toEmail,
      toName,
      templateId,
      params
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(this.apiUrl, body, { headers }).pipe(
      catchError(error => {
        console.error('Error en el servicio de email:', error);
        return throwError(() => new Error('Error al enviar el correo de bienvenida'));
      })
    );
  } */

    sendWelcomeEmail(toEmail: string, toName: string, templateId: number, params: any): Observable<any> {
      const body = {
        toEmail,
        toName,
        templateId,
        params: {
          name: params.name,
          email: toEmail,
          message: 'Bienvenido a RedPsicologos.cl',
          date: new Date().toLocaleDateString('es-CL')
        }
      };
    
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    
      return this.http.post(this.apiUrl, body, { headers }).pipe(
        catchError(error => {
          console.error('Error en el servicio de email:', error);
          return throwError(() => new Error('Error al enviar el correo de bienvenida'));
        })
      );
    }
}
