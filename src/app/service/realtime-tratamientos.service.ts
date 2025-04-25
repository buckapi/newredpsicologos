import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Tratamientos {
  id: string;
  name: string;
  images?: string[]; // JSON array
  services?: Service[];
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeTratamientosService implements OnDestroy {
  private pb: PocketBase;
  private tratamientosSubject = new BehaviorSubject<Tratamientos[]>([]);

  // Observable for components to subscribe to
  public tratamientos$: Observable<Tratamientos[]> =
    this.tratamientosSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToTratamientos();
  }

  private async subscribeToTratamientos() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsTreatments').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateTratamientosList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }
  getTratamientos(): Observable<Tratamientos[]> {
    return this.tratamientos$;
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updateTratamientosList();
  }
  public async getAllTratamientos(): Promise<Tratamientos[]> {
    try {
        const records = await this.pb.collection('psychologistsTreatments').getFullList<Tratamientos>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });

        // Convertir RecordModel a Terapia de manera segura
        return records.map((record: any) => ({
            id: record.id,
            name: record['name'],
            images: Array.isArray(record['images']) ? record['images'] : [],
        })) as Tratamientos[];
    } catch (error) {
        console.error('Error retrieving all tratamientos:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
}
  private async updateTratamientosList() {
    try {
      const records = await this.pb.collection('psychologistsTreatments').getFullList<Tratamientos>(200, {
        sort: '-created', // Sort by creation date
      });

      const tratamientos = records.map((record: any) => ({
        ...record,
        images: Array.isArray(record.images) ? record.images : [],
        services: Array.isArray(record.services) ? record.services : [],
      })) as Tratamientos[];

      this.tratamientosSubject.next(tratamientos);
    } catch (error) {
      console.error('Error updating Tratamientos list:', error);
    }
  }

  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsTreatments').unsubscribe('*');
  }
}
