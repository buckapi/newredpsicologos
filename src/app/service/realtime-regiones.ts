import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Regiones {
  id: string;
  name: string;
  images?: string[]; 
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeRegionesService implements OnDestroy {
  private pb: PocketBase;

  
  private regionesSubject = new BehaviorSubject<Regiones[]>([]);

  // Observable for components to subscribe to
  public regiones$: Observable<Regiones[]> =
  
    this.regionesSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToRegiones();
  }
  setOnLocal(regiones: Regiones[]){
    localStorage.setItem('regiones', JSON.stringify(regiones));
  }
  private async subscribeToRegiones() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsRegiones').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateRegionesList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updateRegionesList();
  }

  public async updateRegionesList() {
    try {
      const records = await this.pb.collection('psychologistsRegiones').getFullList<Regiones>(200, {
        sort: '-created', // Sort by creation date
      });

      const regiones = records.map((record: any) => ({
        ...record,
        images: Array.isArray(record.images) ? record.images : [],
      })) as Regiones[];

      this.regionesSubject.next(regiones);
    } catch (error) {
      console.error('Error updating Regiones list:', error);
    }
  }
  public async getAllRegiones(): Promise<Regiones[]> {
    try {
        const records = await this.pb.collection('psychologistsRegiones').getFullList<Regiones>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });

        // Convertir RecordModel a Regiones de manera segura
        return records.map((record: any) => ({
            id: record.id,
            name: record['name'],
            images: Array.isArray(record['images']) ? record['images'] : [],
        })) as Regiones[];
    } catch (error) {
        console.error('Error retrieving all regiones:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
}
  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsRegiones').unsubscribe('*');
  }
}
