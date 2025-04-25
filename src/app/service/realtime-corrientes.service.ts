import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Corrientes {
  id: string;
  name: string;
  images?: string[]; // JSON array
  services?: Service[];
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeCorrientesService implements OnDestroy {
  private pb: PocketBase;
  private corrientesSubject = new BehaviorSubject<Corrientes[]>([]);

  // Observable for components to subscribe to
  public corrientes$: Observable<Corrientes[]> =
    this.corrientesSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToCorrientes();
  }
  public async getAllCorrientes(): Promise<Corrientes[]> {
    try {
        const records = await this.pb.collection('psychologistsCorrientes').getFullList<Corrientes>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });

        // Convertir RecordModel a Corrientes de manera segura
        return records.map((record: any) => ({
            id: record.id,
            name: record['name'],
            images: Array.isArray(record['images']) ? record['images'] : [],
        })) as Corrientes[];
    } catch (error) {
        console.error('Error retrieving all corrientes:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
}
  private async subscribeToCorrientes() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsCorrientes').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateCorrientesList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updateCorrientesList();
  }

  private async updateCorrientesList() {
    try {
      const records = await this.pb.collection('psychologistsCorrientes').getFullList<Corrientes>(200, {
        sort: '-created', // Sort by creation date
      });

      const corrientes = records.map((record: any) => ({
        ...record,
        images: Array.isArray(record.images) ? record.images : [],
        services: Array.isArray(record.services) ? record.services : [],
      })) as Corrientes[];

      this.corrientesSubject.next(corrientes);
    } catch (error) {
      console.error('Error updating Corrientes list:', error);
    }
  }

  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsCorrientes').unsubscribe('*');
  }
}
