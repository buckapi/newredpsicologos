import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Ratings {
    id: string;
    idSpecialist: string;
    idUser: string;
    comment: string;
    score: number;
    status?: string;  // Agregamos esta propiedad como opcional
    created: string;
    title: string;
    tags: string[];
  }

@Injectable({
  providedIn: 'root',
})
export class RealtimeRatingsService implements OnDestroy {
  private pb: PocketBase;
  private ratingsSubject = new BehaviorSubject<Ratings[]>([]);

  // Observable for components to subscribe to
  public ratings$: Observable<Ratings[]> =
    this.ratingsSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToRatings();
  }

  private async subscribeToRatings() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsRatings').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateRatingsList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }
  getRatings(): Observable<Ratings[]> {
    return this.ratings$;
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updateRatingsList();
  }
  public async getAllRatings(): Promise<Ratings[]> {
    try {
        const records = await this.pb.collection('psychologistsRatings').getFullList<Ratings>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });

        // Convertir RecordModel a Terapia de manera segura
        return records.map((record: any) => ({
            id: record.id,
            idSpecialist: record['idSpecialist'],
            idUser: record['idUser'],
            comment: record['comment'],
            score: record['score'],
            status: record['status'],
            created: record['created'],
        })) as Ratings[];
    } catch (error) {
        console.error('Error retrieving all ratings:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
}
  public async updateRatingsList() {
    try {
      const records = await this.pb.collection('psychologistsRatings').getFullList<Ratings>(200, {
        sort: '-created', // Sort by creation date
      });

      const ratings = records.map((record: any) => ({
        ...record,
        status: record.status || 'pending',
      })) as Ratings[];

      this.ratingsSubject.next(ratings);
    } catch (error) {
      console.error('Error updating Ratings list:', error);
    }
  }

  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsRatings').unsubscribe('*');
  }
 
}
