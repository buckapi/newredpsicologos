import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}


  interface Profesionals {
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
      'niños y niñas': boolean;
      adultos: boolean;
      'jóvenes y adolecentes': boolean;
      'adultos mayores': boolean;
      todos: boolean;
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
    typeTherapy: [];
    typeTreatment: typeTreatment[];
    typeEspeciality: typeEspeciality[];
    corriente: corriente[];
    openingHours: string;
    registrationNumber: string;
    sessions: number;
    certificates: string;
    images: string[]
  }

  interface Comunas {
    id: string;
    name: string;
    idFather: string;
  }
  interface Region {
    id: string;
    name: string;
  }
  interface typeEspeciality {
    id: string;
    name: string;
  }
  interface typeTherapy {
    id: string;
    name: string;
  }
  interface typeTreatment {
    id: string;
    name: string;
  } 
  interface corriente {
    id: string;
    name: string;
  }

@Injectable({
  providedIn: 'root',
})
export class RealtimeProfessionalsService implements OnDestroy {
  private pb: PocketBase;
  private profesionalesSubject = new BehaviorSubject<Profesionals[]>([]);

  // Observable for components to subscribe to
  public profesionales$: Observable<Profesionals[]> =
    this.profesionalesSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToProfesionales();
  }
  public getProfesionalById(userId: string): Observable<Profesionals | undefined> {
    return this.profesionales$.pipe(
      map(profesionales => profesionales.find(profesional => profesional.id === userId ))
    );
  }
  private async subscribeToProfesionales() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsProfessionals').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateProfesionalesList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    // Update the list of Profesionales
    this.updateProfesionalesList();
  }

  private async updateProfesionalesList() {
    try {
      // Get the updated list of Profesionales
      const records = await this.pb.collection('psychologistsProfessionals').getFullList<Profesionals>(200, {
        sort: '-created', // Sort by creation date
      });

      // Ensures each record conforms to Profesionales structure
      const profesionales = records.map((record: any) => ({
        ...record,
        images: Array.isArray(record.images) ? record.images : [],
        services: Array.isArray(record.services) ? record.services : [],
      })) as Profesionals[];

      this.profesionalesSubject.next(profesionales);
    } catch (error) {
      console.error('Error updating Profesionales list:', error);
    }
  }


  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsProfessionals').unsubscribe('*');
  }
}
