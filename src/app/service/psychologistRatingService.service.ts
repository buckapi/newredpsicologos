// services/psychologist-rating.service.ts
import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PsychologistRatingService {
  private pb: PocketBase;
  private readonly secretKey = environment.recaptchaSecretKey;

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
  }

  async createRating(ratingData: any) {
    try {
      const data = {
        idUser: ratingData.idUser,
        idSpecialist: ratingData.idSpecialist,
        score: ratingData.score,
        comment: ratingData.comment,
        status: 'pending', // o 'approved' según tu flujo de trabajo
        title: ratingData.title,
        tags: ratingData.tags
      };

      const record = await this.pb.collection('psychologistsRatings').create(data);
      return record;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    }
  }

  async getRatingsBySpecialist(specialistId: string) {
    try {
      const records = await this.pb.collection('psychologistsRatings').getFullList({
        filter: `idSpecialist = "${specialistId}" && status = "approved"`,
        sort: '-created'
      });
      return records;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }
  }
  
    async verifyToken(token: string): Promise<boolean> {
      // Permitir desarrollo local sin verificación real
      if (!environment.production) {
        console.warn('Modo desarrollo: omitiendo verificación reCAPTCHA');
        return true;
      }
  
      try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${this.secretKey}&response=${token}`
        });
        
        const data = await response.json();
        
        // Verifica tanto el éxito como el puntaje (para reCAPTCHA v3)
        return data.success && (data.score >= 0.5); // Ajusta el threshold según necesites
      } catch (error) {
        console.error('Error al verificar reCAPTCHA:', error);
        return false;
      }
    }
    async updateReviewStatus(id: string, status: string) {
      try {
        await this.pb.collection('psychologistsRatings').update(id, { status });
      } catch (error) {
        console.error('Error updating review status:', error);
        throw error;
      }
    }
  }
