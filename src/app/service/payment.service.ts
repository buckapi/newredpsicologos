import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  // Consultar estado del pago
  checkPaymentStatus(requestId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(
      `${this.apiUrl}/check-status/${requestId}`
    );
  }
}