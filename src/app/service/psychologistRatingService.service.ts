// services/psychologist-rating.service.ts
import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PsychologistRatingService {
  private pb: PocketBase;
  private readonly recaptchaSecret = environment.recaptchaSecretKey;
  private readonly recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
  }

  async createRating(ratingData: any) {
    // Verificación del token reCAPTCHA primero
    if (!await this.verifyToken(ratingData.recaptchaToken)) {
      throw new Error('Verificación reCAPTCHA fallida');
    }

    try {
      const data = {
        idUser: ratingData.idUser,
        idSpecialist: ratingData.idSpecialist,
        score: ratingData.score,
        comment: ratingData.comment,
        status: 'pending', 
        title: ratingData.title,
        tags: ratingData.tags,
        verified: true // Añadimos un campo para marcar revisiones verificadas
      };

      const record = await this.pb.collection('psychologistsRatings').create(data);
      return record;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw new Error('No se pudo crear la valoración. Por favor intenta nuevamente.');
    }
  }

  async getRatingsBySpecialist(specialistId: string, approvedOnly: boolean = true) {
    try {
      const filter = approvedOnly 
        ? `idSpecialist = "${specialistId}" && status = "approved"`
        : `idSpecialist = "${specialistId}"`;
      
      const records = await this.pb.collection('psychologistsRatings').getFullList({
        filter,
        sort: '-created'
      });
      return records;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw new Error('No se pudieron cargar las valoraciones. Por favor intenta más tarde.');
    }
  }
  
 async verifyToken(token: string): Promise<boolean> {
    // Permitir desarrollo local sin verificación real
    if (!environment.production) {
      console.warn('Modo desarrollo: omitiendo verificación reCAPTCHA');
      return true;
    }

    // Validaciones iniciales más robustas
    if (!token || typeof token !== 'string' || token.length < 20) {
      console.error('Token reCAPTCHA no válido:', token);
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.recaptchaSecret);
      formData.append('response', token);

      // Añadir timeout para la petición
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(this.recaptchaVerifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Error en respuesta reCAPTCHA:', {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
      
      const data = await response.json();
      
      // Log detallado solo en desarrollo
      if (!environment.production) {
        console.log('Respuesta detallada reCAPTCHA:', {
          success: data.success,
          score: data.score,
          action: data.action,
          hostname: data.hostname,
          timestamp: new Date(data.challenge_ts),
          errorCodes: data['error-codes']
        });
      }
      
      // Verificación más estricta para producción
      const isHuman = data.success && 
                     data.score >= 0.5 && 
                     data.action === 'submit' && 
                     data.hostname === 'redpsicologos.cl';
      
      if (!isHuman) {
        console.warn('reCAPTCHA detectó posible actividad sospechosa:', {
          score: data.score,
          action: data.action,
          hostname: data.hostname,
          timestamp: data.challenge_ts,
          clientIP: data.hostname // Considera registrar la IP para análisis
        });
      }
      
      return isHuman;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Timeout al verificar reCAPTCHA: La petición tardó demasiado');
      } else {
        console.error('Error al verificar reCAPTCHA:', error);
      }
      
      return environment.production ? false : true;
    }
  }

  async updateReviewStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new Error('Estado de revisión no válido');
    }

    try {
      const updatedRecord = await this.pb.collection('psychologistsRatings').update(id, { status });
      return updatedRecord;
    } catch (error) {
      console.error('Error updating review status:', error);
      throw new Error('No se pudo actualizar el estado de la valoración.');
    }
  }
  async getAllApprovedRatings(): Promise<any[]> {
    try {
      // Ajusta esta línea según tu implementación de PocketBase
      const records = await this.pb.collection('ratings').getFullList({
        filter: 'status = "approved"'
      });
      return records;
    } catch (error) {
      console.error('Error fetching approved ratings:', error);
      return [];
    }
  }
  async getAllRatings(): Promise<any[]> {
    try {
      const records = await this.pb.collection('ratings').getFullList();
      return records;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }
  }
}