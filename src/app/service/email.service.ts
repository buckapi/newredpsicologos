import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface EmailParams {
  name: string;
  email: string;
  message?: string;
  date?: string;
  [key: string]: any;
  status?: string;
}

export interface EmailRequest {
  toEmail: string;
  toName: string;
  templateId: number;
  params: EmailParams;
  type: 'welcome' | 'status' | 'subscribe' | 'adminNewRegister';
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private baseUrl = window.location.hostname === 'localhost' 
    ? '/email-api' 
    : 'https://db.redpsicologos.cl:5542';

  constructor(private http: HttpClient) {}

  sendEmail(request: EmailRequest): Observable<any> {
    const body = {
      toEmail: request.toEmail,
      toName: request.toName,
      templateId: request.templateId,
      params: request.params
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const endpoint = `/${request.type}`;

    return this.http.post(`${this.baseUrl}${endpoint}`, body, { headers }).pipe(
      catchError(error => {
        console.error('Error en el servicio de email:', error);
        return throwError(() => new Error(`Error al enviar el correo de tipo ${request.type}`));
      })
    );
  }

  // Convenience methods for specific email types
  sendWelcomeEmail(toEmail: string, toName: string, templateId: number, params: EmailParams): Observable<any> {
    return this.sendEmail({
      toEmail,
      toName,
      templateId,
      params: {
        ...params,
        message: 'Bienvenido a RedPsicologos.cl',
        date: new Date().toLocaleDateString('es-CL')
      },
      type: 'welcome'
    });
  }

  sendStatusEmail(toEmail: string, toName: string, templateId: number, params: EmailParams): Observable<any> {
    return this.sendEmail({
      toEmail,
      toName,
      templateId,
      params,
      type: 'status'
    });
  }

  sendSubscribeEmail(toEmail: string, toName: string, templateId: number, params: EmailParams): Observable<any> {
    return this.sendEmail({
      toEmail,
      toName,
      templateId,
      params,
      type: 'subscribe'
    });
  }

  sendAdminNewRegisterEmail(toEmail: string, toName: string, templateId: number, params: EmailParams): Observable<any> {
    return this.sendEmail({
      toEmail,
      toName,
      templateId,
      params,
      type: 'adminNewRegister'
    });
  }
}
