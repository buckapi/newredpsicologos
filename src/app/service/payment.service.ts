// getnet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.getnetApiUrl; // Debería estar en environment.ts
  private login = environment.getnetLogin; // clientId
  private secretKey = environment.getnetTranKey; // clientSecret
  
  constructor(private http: HttpClient) { }

  private generateAuthHeaders() {
    // 1. Generar nonce (valor aleatorio)
    const nonce = CryptoJS.lib.WordArray.random(16).toString();
    
    // 2. Generar seed (fecha actual en ISO 8601)
    const seed = new Date().toISOString();
    
    // 3. Calcular tranKey (SHA-256 de nonce + seed + secretKey, luego Base64)
    const tranKey = CryptoJS.SHA256(nonce + seed + this.secretKey).toString(CryptoJS.enc.Base64);
    
    // 4. Codificar nonce en Base64 para enviarlo
    const encodedNonce = CryptoJS.enc.Utf8.parse(nonce).toString(CryptoJS.enc.Base64);
    
    // 5. Crear objeto de autenticación
    const auth = {
      login: this.login,
      tranKey,
      nonce: encodedNonce,
      seed
    };
    
    // 6. Crear headers
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(JSON.stringify(auth))}`
    });
  }

  createPaymentSession(paymentData: any, isSubscription: boolean = false) {
    const endpoint = isSubscription ? '/subscription' : '/session';
    return this.http.post(`${this.apiUrl}${endpoint}`, paymentData, {
      headers: this.generateAuthHeaders()
    });
  }

  getPaymentStatus(requestId: string) {
    return this.http.post(`${this.apiUrl}/session/${requestId}`, {}, {
      headers: this.generateAuthHeaders()
    });
  }
}