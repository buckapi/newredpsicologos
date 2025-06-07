import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.getnetApiUrl;
  private login = environment.getnetLogin;
  private secretKey = environment.getnetTranKey;
  
  
  constructor(private http: HttpClient) { }

  private generateAuth() {
    // 1. Generar nonce (16 bytes aleatorios en formato hexadecimal)
    const nonce = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    
    // 2. Generar seed (ISO 8601)
    const seed = new Date().toISOString();
    
    // 3. Calcular tranKey (SHA256 en formato raw)
    const tranKeyInput = nonce + seed + this.secretKey;
    const tranKey = CryptoJS.SHA256(tranKeyInput).toString(CryptoJS.enc.Base64);
    
    // 4. Codificar nonce en Base64
    const encodedNonce = CryptoJS.enc.Hex.parse(nonce).toString(CryptoJS.enc.Base64);
    
    return {
      login: this.login,
      tranKey: tranKey,
      nonce: encodedNonce,
      seed: seed
    };
  }

  private getAuthHeaders() {
    const auth = this.generateAuth();
    
    // Debug: Mostrar los datos generados
    console.log('Datos de autenticación generados:', {
      nonce: auth.nonce,
      seed: auth.seed,
      tranKey: auth.tranKey,
      login: auth.login
    });
    
    const authString = JSON.stringify(auth);
    const authBase64 = btoa(authString);
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authBase64}`
    });
  }


  private generateRandomNonce(): string {
    const wordArray = CryptoJS.lib.WordArray.random(16);
    return CryptoJS.enc.Hex.stringify(wordArray);
  }

  private calculateTranKey(nonce: string, seed: string): string {
    const concatenated = nonce + seed + this.secretKey;
    const sha256 = CryptoJS.SHA256(concatenated);
    return sha256.toString(CryptoJS.enc.Base64);
  }

  private base64Encode(data: string): string {
    const wordArray = CryptoJS.enc.Hex.parse(data);
    return CryptoJS.enc.Base64.stringify(wordArray);
  }



    createPaymentSession(paymentData: any) {
      // No usar encabezados personalizados
      return this.http.post('http://localhost:3000/api/getnet/create-payment-session', paymentData);
    }

  getPaymentStatus(requestId: string) {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/session/${requestId}`, {}, { headers });
  }

  reversePayment(internalReference: string) {
    return this.http.post(`${this.apiUrl}/reverse`, {
      internalReference
    }, {
      headers: this.getAuthHeaders()
    });
  }
  debugAuthGeneration() {
    const nonce = this.generateRandomNonce();
    const seed = new Date().toISOString();
    const tranKey = this.calculateTranKey(nonce, seed);
    
    console.log('Debug Autenticación:', {
      nonce,
      seed,
      secretKey: this.secretKey,
      concatenated: nonce + seed + this.secretKey,
      sha256: CryptoJS.SHA256(nonce + seed + this.secretKey).toString(),
      tranKeyResult: tranKey,
      base64Nonce: this.base64Encode(nonce),
      fullAuth: {
        login: this.login,
        tranKey,
        nonce: this.base64Encode(nonce),
        seed
      }
    });
  }
}