import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Especialidades {
  id: string;
  name: string;
  images?: string[]; // JSON array
  services?: Service[];
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeEspecialidadesService implements OnDestroy {
  private pb: PocketBase;
  private especialidadesSubject = new BehaviorSubject<Especialidades[]>([]);

  // Observable for components to subscribe to
  public especialidades$: Observable<Especialidades[]> =
    this.especialidadesSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToEspecialidades();
  }
  public async getAllEspecialidades(): Promise<Especialidades[]> {
    try {
        const records = await this.pb.collection('psychologistsSpecialties').getFullList<Especialidades>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });

        // Convertir RecordModel a Especialidades de manera segura
        return records.map((record: any) => ({
            id: record.id,
            name: record['name'],
            images: Array.isArray(record['images']) ? record['images'] : [],
        })) as Especialidades[];
    } catch (error) {
        console.error('Error retrieving all especialidades:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
}
  private async subscribeToEspecialidades() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsSpecialties').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateEspecialidadesList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updateEspecialidadesList();
  }

  private async updateEspecialidadesList() {
    try {
      const records = await this.pb.collection('psychologistsSpecialties').getFullList<Especialidades>(200, {
        sort: '-created', // Sort by creation date
      });

      const especialidades = records.map((record: any) => ({
        ...record,
        images: Array.isArray(record.images) ? record.images : [],
        services: Array.isArray(record.services) ? record.services : [],
      })) as Especialidades[];

      this.especialidadesSubject.next(especialidades);
    } catch (error) {
      console.error('Error updating Especialidades list:', error);
    }
  }

  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsSpecialties').unsubscribe('*');
  }
}
