import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Planes {
  id: string;
  name: string;
  price: string;
  services?: Service[];
}

@Injectable({
  providedIn: 'root',
})
export class RealtimePlanesService implements OnDestroy {
  private pb: PocketBase;
  private planesSubject = new BehaviorSubject<Planes[]>([]);

  // Observable for components to subscribe to
  public planes$: Observable<Planes[]> =
    this.planesSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToPlanes();
  }
  public async getAllPlanes(): Promise<Planes[]> {
    try {
        const records = await this.pb.collection('psychologistsPlanes').getFullList<Planes>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });

        // Convertir RecordModel a Planes de manera segura
        return records.map((record: any) => ({
            id: record.id,
            name: record['name'],
            price: record['price'],
            services: Array.isArray(record['services']) ? record['services'] : [],
        })) as Planes[];
    } catch (error) {
        console.error('Error retrieving all planes:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
}
  private async subscribeToPlanes() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsCorrientes').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updatePlanesList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updatePlanesList();
  }

  private async updatePlanesList() {
    try {
      const records = await this.pb.collection('psychologistsPlanes').getFullList<Planes>(200, {
        sort: '-created', // Sort by creation date
      });

      const planes = records.map((record: any) => ({
        ...record,
        services: Array.isArray(record.services) ? record.services : [],
      })) as Planes[];

      this.planesSubject.next(planes);
    } catch (error) {
      console.error('Error updating Planes list:', error);
    }
  }

  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsPlanes').unsubscribe('*');
  }
}
