import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Terapia {
  id: string;
  name: string;
  images?: string[]; 
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeTerapiaService implements OnDestroy {
  private pb: PocketBase;

  
  private terapiaSubject = new BehaviorSubject<Terapia[]>([]);

  // Observable for components to subscribe to
  public terapia$: Observable<Terapia[]> =
  
    this.terapiaSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToTerapia();
  }
  setOnLocal(terapias: Terapia[]){
    localStorage.setItem('terapias', JSON.stringify(terapias));
  }
  private async subscribeToTerapia() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsTerapy').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateTerapiaList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updateTerapiaList();
  }

  public async updateTerapiaList() {
    try {
      const records = await this.pb.collection('psychologistsTerapy').getFullList<Terapia>(200, {
        sort: '-created', // Sort by creation date
      });

      const terapias = records.map((record: any) => ({
        ...record,
        images: Array.isArray(record.images) ? record.images : [],
      })) as Terapia[];

      this.terapiaSubject.next(terapias);
    } catch (error) {
      console.error('Error updating Terapia list:', error);
    }
  }
  public async getAllTerapias(): Promise<Terapia[]> {
    try {
        const records = await this.pb.collection('psychologistsTerapy').getFullList<Terapia>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });

        // Convertir RecordModel a Terapia de manera segura
        return records.map((record: any) => ({
            id: record.id,
            name: record['name'],
            images: Array.isArray(record['images']) ? record['images'] : [],
        })) as Terapia[];
    } catch (error) {
        console.error('Error retrieving all terapias:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
}
  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsTerapy').unsubscribe('*');
  }
}
