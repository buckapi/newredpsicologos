import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GlobalService } from '../../service/global.service';
import { RealtimeProfessionalsService } from '../../service/realtime-professionals';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  typeTherapy: typeTherapy[];
  typeTreatment: typeTreatment[];
  typeEspeciality: typeEspeciality[]; // Siempre es array (puede estar vacío)
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
interface Targets {
  niñosYNinas: boolean;
  adultos: boolean;
  jovenesYAdolescentes: boolean;
  adultosMayores: boolean;
  todos: boolean;
}
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  /* specialists: any[] = []; */
  specialists: profesional[] = [];
  searchTerm: string = '';

constructor(
  public global: GlobalService,
  public realtimeProfesionales: RealtimeProfessionalsService
){}

isMobile(): boolean {
  return window.innerWidth <= 768; // Cambia este valor según tus necesidades
}
// En el componente
getFormattedTargets(targets: any): string {
  const activeTargets = [];
  
  if (targets?.['niños y niñas']) activeTargets.push('Niños y niñas');
  if (targets?.adultos) activeTargets.push('Adultos');
  if (targets?.['jóvenes y adolecentes']) activeTargets.push('Jóvenes y adolescentes');
  if (targets?.['adultos mayores']) activeTargets.push('Adultos mayores');
  if (targets?.todos) activeTargets.push('Todos los públicos');
  
  return activeTargets.join(', ') || 'No especificado';
}


  searchProfessionals(term: string) {
    if (term.trim()) {
      // Navega al componente de profesionales con el término de búsqueda como parámetro
      this.global.activeRoute = 'professionals';
      this.searchTerm = term.trim().toLowerCase();
    }
  }
}
