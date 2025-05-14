import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

// Interface para tipado seguro (opcional pero recomendado)
export interface User {
  id?: string;
  name: string;
  email: string;
  document: string;
}

interface PaymentSessionResponse {
  processUrl: string;
  requestId: string;
}

interface PaymentStatusResponse {
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  amount?: number;
  planId?: string;
}

@Injectable({
  providedIn: 'root' // Disponible en toda la app
})
export class PaymentService {
  private apiUrl = 'https://db.redpsicologos.cl:3000/api/payments'; // URL completa
  constructor(private http: HttpClient) { }

  // Crear sesión de pago
   createSubscription(planId: string, user: User): Observable<PaymentSessionResponse> {
    return this.http.post<PaymentSessionResponse>(
      `${this.apiUrl}/create-session`,
      {
        planId,
        userData: {
          name: user.name,
          email: user.email,
          document: user.document
        }
      }
    );
  } 
/* // payment.service.ts
createSubscription(planId: string, user: User): Observable<PaymentSessionResponse> {
  // Validación frontend
  if (!user.document || !planId) {
    return throwError(() => new Error('Documento y plan son requeridos'));
  }

  return this.http.post<PaymentSessionResponse>(
    `${this.apiUrl}/create-session`,
    {
      planId,
      userData: {
        name: user.name,
        email: user.email,
        document: user.document
      }
    }
  ).pipe(
    catchError(error => {
      console.error('Error completo:', error);
      
      let userMessage = 'Error en el sistema de pagos';
      let technicalMessage = error.message;
      
      if (error.error) {
        technicalMessage = `${error.error.error} (Código ${error.error.code})`;
        switch (error.error.code) {
          case 401:
            userMessage = 'Error de autenticación con el procesador de pagos';
            break;
          case 400:
            userMessage = 'Datos de pago inválidos';
            break;
        }
      }
      
      return throwError(() => ({
        userMessage,
        technicalMessage,
        details: error.error?.details
      }));
    })
  );
} */
  // Consultar estado del pago
  checkPaymentStatus(requestId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(
      `${this.apiUrl}/check-status/${requestId}`
    );
  }
}