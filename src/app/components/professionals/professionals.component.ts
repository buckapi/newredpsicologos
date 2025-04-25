import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GlobalService } from '../../service/global.service';
import { RealtimeProfessionalsService } from '../../service/realtime-professionals';
import { RealtimeRegionesService } from '../../service/realtime-regiones';
interface profesional {
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
  targets: Targets;

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
  typeTherapy: any[] | string;
  typeTreatment: any[] | string;
  typeEspeciality: any[] | string; // Actualizado para reflejar la realidad
  corriente: any[] | string;
  openingHours: string;
  registrationNumber: string;
  sessions: number;
  certificates: string;
  images: string[]
}
interface Targets {
  niñosYNinas: boolean;
  adultos: boolean;
  jovenesYAdolescentes: boolean;
  adultosMayores: boolean;
  todos: boolean;
}

@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './professionals.component.html',
  styleUrl: './professionals.component.css'
})
export class ProfessionalsComponent {
  view: 'list' | 'grid' = 'list';
  specialists: any[] = [];
  constructor(
    public global: GlobalService,
    public realtimeProfesionales: RealtimeProfessionalsService,
    public regi: RealtimeRegionesService,
  ){
    this.realtimeProfesionales.profesionales$.subscribe((profesionales) => {
      this.specialists = profesionales;
    });
  }
  getFormattedTargets(targets: any): string {
    const activeTargets = [];
    
    if (targets?.['niños y niñas']) activeTargets.push('Niños y niñas');
    if (targets?.adultos) activeTargets.push('Adultos');
    if (targets?.['jóvenes y adolecentes']) activeTargets.push('Jóvenes y adolescentes');
    if (targets?.['adultos mayores']) activeTargets.push('Adultos mayores');
    if (targets?.todos) activeTargets.push('Todos los públicos');
    
    return activeTargets.join(', ') || 'No especificado';
  }
}
