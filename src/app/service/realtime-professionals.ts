import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface Profesionals {
  id: string;
  name: string;
  rut: string;
  biography: string;
  biography2: string;
  phone: string;
  email: string;
  website: string;
  birthday: string;
  consultationAddress: string;
  region: string;
  comuna: string;
  gender: string;
  languages: {
    es: boolean;
    en: boolean;
    fr: boolean;
    de: boolean;
  };
  targets: {
    'niños y niñas'?: boolean;
    adultos?: boolean;
    'jóvenes y adolecentes'?: boolean;
    'adultos mayores'?: boolean;
    todos?: boolean;
  };
  payments: {
    efectivo: boolean;
    transferencia: boolean;
    tarjetas: boolean;
    webpay: boolean;
  };
  days: {
    Lunes: boolean;
    Martes: boolean;
    Miercoles: boolean;
    Jueves: boolean;
    Viernes: boolean;
    Sabado: boolean;
    Domingo: boolean;
  };
  typeAttention: {
    Online: boolean;
    Presencial: boolean;
    'A domicilio': boolean;
  };
  priceSession: string;
  titleUniversity: string;
  typeTherapy: any[];
  typeTreatment: any[];
  typeEspeciality: any[];
  corriente: any[];
  openingHours: string;
  registrationNumber: string;
  sessions: number;
  certificates: string[];
  images: string[];
  regions?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeProfessionalsService implements OnDestroy {
  private pb: PocketBase;
  private profesionalesSubject = new BehaviorSubject<Profesionals[]>([]);
  public profesionales$: Observable<Profesionals[]> = this.profesionalesSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToProfesionales();
  }

  public getProfesionalById(userId: string): Observable<Profesionals | undefined> {
    return this.profesionales$.pipe(
      map(profesionales => profesionales.find(profesional => profesional.id === userId))
    );
  }

  private async subscribeToProfesionales() {
    try {
      await this.pb.collection('users').authWithPassword('admin@email.com', 'admin1234');
      this.pb.collection('psychologistsProfessionals').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });
      this.updateProfesionalesList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    this.updateProfesionalesList();
  }

  private async updateProfesionalesList() {
    try {
      const records = await this.pb.collection('psychologistsProfessionals').getFullList<Profesionals>(200, {
        sort: '-created',
      });

      const profesionales = records.map((record: any) => ({
        ...record,
        images: Array.isArray(record.images) ? record.images : [],
        certificates: Array.isArray(record.certificates) ? record.certificates : [],
        regions: Array.isArray(record.regions) ? record.regions : [],
        typeTherapy: Array.isArray(record.typeTherapy) ? record.typeTherapy : [],
        typeTreatment: Array.isArray(record.typeTreatment) ? record.typeTreatment : [],
        typeEspeciality: Array.isArray(record.typeEspeciality) ? record.typeEspeciality : [],
        corriente: Array.isArray(record.corriente) ? record.corriente : [],
      })) as Profesionals[];

      this.profesionalesSubject.next(profesionales);
    } catch (error) {
      console.error('Error updating Profesionales list:', error);
    }
  }

  ngOnDestroy() {
    this.pb.collection('psychologistsProfessionals').unsubscribe('*');
  }
}