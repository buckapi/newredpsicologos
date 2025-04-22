import { Injectable, OnDestroy } from '@angular/core';
import PocketBase, { RecordModel } from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Service {
  name: string;
  images?: string[]; // JSON array
  status?: string;
}

export interface Comunas {
  id: string;
  name: string;
  idFather: string;
  images?: string[]; 
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeComunasService implements OnDestroy {
  private pb: PocketBase;
  private comunasSubject = new BehaviorSubject<Comunas[]>([]);

  // Observable for components to subscribe to
  public comunas$: Observable<Comunas[]> = this.comunasSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.subscribeToComunas();
  }

  private async subscribeToComunas() {
    try {
      // (Optional) Authentication
      await this.pb
        .collection('users')
        .authWithPassword('admin@email.com', 'admin1234');

      this.pb.collection('psychologistsComunas').subscribe('*', (e) => {
        this.handleRealtimeEvent(e);
      });

      this.updateComunasList();
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  private handleRealtimeEvent(event: any) {
    console.log(`Event Action: ${event.action}`);
    console.log(`Event Record:`, event.record);

    this.updateComunasList();
  }
  private async updateComunasList() {
    try {
      const records = await this.pb.collection('psychologistsComunas').getFullList<RecordModel>(200, {
        sort: '-created', // Ordenar por fecha de creación
      });
  
      // Convertir RecordModel a Comunas de manera segura
      const comunas = records.map((record: RecordModel) => ({
        id: record.id,
        name: record['name'], // Asegúrate de que esta propiedad existe en RecordModel
        idFather: record['idFather'], // Asegúrate de que esta propiedad existe en RecordModel
        images: Array.isArray(record['images']) ? record['images'] : [], // Asegúrate de que images sea un arreglo
      })) as Comunas[];
  
      this.comunasSubject.next(comunas);
    } catch (error) {
      console.error('Error actualizando la lista de comunas:', error);
    }
  }
  
  private async createComuna(comuna: Comunas): Promise<Comunas> {
    const record = await this.pb.collection('psychologistsComunas').create({
      id: comuna.id,
      name: comuna.name,
      idFather: comuna.idFather,
      images: comuna.images || [] // Asegúrate de que images sea un arreglo
    });
  
    // Convertir RecordModel a Comunas de manera segura
    return record as unknown as Comunas;
  }
  
  private async updateComuna(comuna: Comunas): Promise<Comunas> {
    const record = await this.pb.collection('psychologistsComunas').update(comuna.id, {
      id: comuna.id,
      name: comuna.name,
      idFather: comuna.idFather,
      images: comuna.images || [] // Asegúrate de que images sea un arreglo
    });
  
    // Convertir RecordModel a Comunas de manera segura
    return record as unknown as Comunas;
  }

  private async deleteComuna(id: string): Promise<void> {
    await this.pb.collection('psychologistsComunas').delete(id);
  }
  public async getAllComunas(): Promise<Comunas[]> {
    try {
        const records = await this.pb.collection('psychologistsComunas').getFullList<Comunas>(200, {
            sort: '-created', // Ordenar por fecha de creación
        });
  
        // Convertir RecordModel a Comunas de manera segura
        return records.map((record: any) => ({
            id: record.id,
            name: record['name'],
            idFather: record['idFather'],
            images: Array.isArray(record['images']) ? record['images'] : [], // Asegúrate de que images sea un arreglo
        })) as Comunas[];
    } catch (error) {
        console.error('Error retrieving all comunas:', error);
        return []; // Retorna un arreglo vacío en caso de error
    }
  }
  ngOnDestroy() {
    // Unsubscribe when the service is destroyed
    this.pb.collection('psychologistsComunas').unsubscribe('*');
  }
}