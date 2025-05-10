import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';  
import { tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { RealtimeRegionesService } from './realtime-regiones';
import { RealtimeProfessionalsService } from './realtime-professionals';
interface Profesionals {
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
  academicTitles: {
    institution: string;
    specialization: string;
    year: string;
  }[],
    languages: {
    es: boolean;
    en: boolean;
    fr: boolean;
    de: boolean;
  };
  targets: {
    'niños y niñas': boolean;
    adultos: boolean;
    'jóvenes y adolecentes': boolean;
    'adultos mayores': boolean;
    todos: boolean;
  };
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
  typeEspeciality: typeEspeciality[];
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
@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  public professionalInfoSubject = new BehaviorSubject<any>({});
  professionalInfo$ = this.professionalInfoSubject.asObservable(); 
  storedRegiones: any[] = [];
  imageUrl: string = '';
  isLoading = false;
  loading = false;
  professionalToEdit: any={};
  professionalInfo: any = {};
  professionalInfoLanguages: { [key: string]: boolean } = {}; // Inicializar como objeto vacío
  professionalInfoPayments: { [key: string]: boolean } = {};
  professionalInfoDay: { [key: string]: boolean } = {};
  professionalInfoTargets: { [key: string]: boolean } = {};
  profileComplete=false;
   activeRoute = 'home';
  menuSelected = '';
  islogged=false;
  private pb: PocketBase;
  profesionals: any[] = [];
  previewProfesionals: Profesionals = {
    id: '',
    name: '',
    rut: '',
    biography: '',
    biography2: '',
    phone: '',
    email: '',
    website: '',
    birthday: '',
    consultationAddress: '',
    region: '',
    comuna: '',
    gender: '',
    languages: {
      es: false,
      en: false,
      fr: false,
      de: false
    },
    targets: {
      'niños y niñas': false,
      adultos: false,
      'jóvenes y adolecentes': false,
      'adultos mayores': false,
      todos: false
    },
    payments: {
      efectivo: false,
      transferencia: false,
      tarjetas: false,
      webpay: false
    },
    days: {
      Lunes: false,
      Martes: false,
      Miercoles: false,
      Jueves: false,
      Viernes: false,
      Sabado: false,
      Domingo: false
    },
    typeAttention: {
      Online: false,
      Presencial: false,
      'A domicilio': false
    },
    priceSession: '',
    titleUniversity: '',
    typeTherapy: [],
    typeTreatment: [],
    typeEspeciality: [],
    corriente: [],
    openingHours: '',
    registrationNumber: '',
    sessions: 0,
    certificates: '',
    images: [],
    academicTitles: []
    
  };
  searchTerm: string = '';
  constructor(
    private realtimeRegiones: RealtimeRegionesService,
    public realtimeProfesionales: RealtimeProfessionalsService  ) 
  { 
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    this.loadProfessionalInfo();
    const storedInfo = localStorage.getItem('professionalInfo');
    if (storedInfo) {
      this.professionalInfo = JSON.parse(storedInfo);
      this.professionalInfoSubject.next(this.professionalInfo);
    }
  }
  setRoute(route: string) {
    this.activeRoute = route;
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
  setMenuOption(option: string) {
    let regions = this.getRegiones();
    regions.subscribe((regions) => {
      // Map to retain only id and name
      const simplifiedRegions = regions.map((region: { id: string; name: string }) => ({
        id: region.id,
        name: region.name
      }));
      this.storedRegiones = simplifiedRegions;
      localStorage.setItem('regions', JSON.stringify(simplifiedRegions));
    });
    this.professionalInfo = JSON.parse(localStorage.getItem('professionalInfo') || '{}');
    this.menuSelected = option;
  }
  setProfesional(route: string,profesional  : Profesionals) {
    this.activeRoute = route;
    this.previewProfesionals = profesional;
  }

  setPreviewProfesional(data: any) {
    // Verificar si data y su propiedad images existen
    if (data && data['images']) {
        this.imageUrl = data['images'][0] || 'assets/images/user.png'; // Asignar la imagen
    } else {
        this.imageUrl = 'assets/images/user.png'; // Valor por defecto si no hay imagen
    }
  }
getPreviewProfesional(): Profesionals {
  return this.previewProfesionals;
}
   loadProfessionalInfo(): any {
    const info = localStorage.getItem('professionalInfo');
    if (info) {
      this.professionalInfo = JSON.parse(info)
    }
    return this.professionalInfo; // Assuming professionalInfo contains the data you need

  } 
 
  
  getProfesionals() {
    this.realtimeProfesionales.profesionales$.subscribe(profesionales => {
      this.profesionals = profesionales;
    });
    return this.profesionals;
  }
  getRegiones(){
    this.storedRegiones=JSON.parse(localStorage.getItem('regions') || '[]');
    return this.realtimeRegiones.regiones$.pipe(
      tap(data => console.log(data)) // Agrega esto para verificar la estructura de los datos
    );
  }
  goToDetail(profesional: any) {
    let regions = this.getRegiones();
    regions.subscribe((regions) => {
      // Map to retain only id and name
      const simplifiedRegions = regions.map((region: { id: string; name: string }) => ({
        id: region.id,
        name: region.name
      }));
      this.storedRegiones = simplifiedRegions;
      localStorage.setItem('regions', JSON.stringify(simplifiedRegions));
    });
    
    this.previewProfesionals = profesional; // Asigna el profesional seleccionado
    this.setRoute('professional-detail'); // Navega al componente detail-doctor
  }
  clearProfessionalData() {
    this.professionalInfo = null;
    // Agrega aquí cualquier otra propiedad que necesites limpiar
  }
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  /* updateProfessionalInfo(info: any) {
    this.professionalInfo = info;
    this.professionalInfoSubject.next(info);
  } */
  
   // Method to fetch and update professional info
  async fetchProfessionalInfo() {
    try {
      const info = await this.getProfessionalInfo();
      if (info) {
        this.setProfessionalInfo(info);
      }
    } catch (error) {
      console.error('Error fetching professional info:', error);
    }
  }

  // Method to set professional info
  setProfessionalInfo(info: any) {
    this.professionalInfo = info;
    this.professionalInfoSubject.next(info);
    localStorage.setItem('professionalInfo', JSON.stringify(info));
  }

  // Method to get current professional info
  getProfessionalInfo() {
    return this.professionalInfo;
  }

  // Method to update specific fields
  updateProfessionalInfo(fields: Partial<any>) {
    if (!this.professionalInfo) {
      this.professionalInfo = {};
    }
    this.professionalInfo = { ...this.professionalInfo, ...fields };
    this.professionalInfoSubject.next(this.professionalInfo);
    localStorage.setItem('professionalInfo', JSON.stringify(this.professionalInfo));
  }

  // Clear professional info
  clearProfessionalInfo() {
    this.professionalInfo = null;
    this.professionalInfoSubject.next(null);
    localStorage.removeItem('professionalInfo');
  }
  
}

