import { Component, ViewChild, ElementRef,EventEmitter, NO_ERRORS_SCHEMA, AfterViewInit} from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject } from 'rxjs';
import { FormGroup,FormBuilder, ReactiveFormsModule, FormsModule, Validators, FormArray } from '@angular/forms';
import Swal from 'sweetalert2';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import Cleave from 'cleave.js';
import { RealtimeRegionesService } from '../../../service/realtime-regiones';
import { RealtimeComunasService } from '../../../service/realtime-comunas.service';
import { GlobalService } from '../../../service/global.service';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { RealtimeTerapiaService } from '../../../service/realtime-terapia.service';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { RealtimeTratamientosService } from '../../../service/realtime-tratamientos.service';
import { RealtimeEspecialidadesService } from '../../../service/realtime-especialidades.service';
import { Corrientes, RealtimeCorrientesService } from '../../../service/realtime-corrientes.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input'; // si usas matInput en otros campos
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Agrega este módulo

interface Comunas {
  id: string;
  name: string;
  idFather: string;
}
interface Region {
  id: string;
  name: string;
}


type LanguagesArray = string[]; 
type TargetsArray = string[];
type DaysArray = string[];
type AttentionTypeArray = string[];
type PaymentsArray = string[];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,NgMultiSelectDropDownModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements AfterViewInit {
  @ViewChild('certificateInput', { static: false }) certificateInput!: ElementRef<HTMLInputElement>;
  selectedCertificateFile: File | null = null;

  rutError: boolean = false;
  selectedRegion: Region | null = null;
  regionesList: Region[] = [];
  comunasList: Comunas[] = [];
  corrientesList: Corrientes[] = [];
  dropdownSettings = {
    singleSelection: true,
    text: "Seleccione",
    textField: 'name',
    idField: 'id',
    itemsShowLimit: 3,
    selectAllText: "Seleccionar Todos",
    unSelectAllText: "Deseleccionar Todos",
    enableSearchFilter: true,
    classes: "myclass custom-class",
  };



  private regionesSubject = new BehaviorSubject<Region[]>([]);
  regiones$ = this.regionesSubject.asObservable();
  private comunasSubject = new BehaviorSubject<Region[]>([]);
  comunas$ = this.comunasSubject.asObservable();
  regionSelected: Region | null = null;
  comunaSelected: Comunas | null = null;
  languages: LanguagesArray = []; 
  payments: PaymentsArray = [];
  target: TargetsArray = [];
  days: DaysArray = [];
  attentionTypes: AttentionTypeArray = [];
  profileForm: FormGroup;
  storedRegiones: any[] = []; 
  storedTerapias: any[] = []; 
  storedTratamientos: any[] = []; 
  storedEspecialidades: any[] = []; 
  selectedFile: File | null = null;
  imageUrl: string = 'assets/images/resource/profile-3.png'; 
  private pb = new PocketBase('https://db.redpsicologos.cl:8090');
  isLoading: boolean = false;
  isDataLoaded: boolean = false;
  private loadingTimeout: any;
  regiones: any[] = []; 
  comunas: Comunas[] = []; 
  terapias:any [] = [];
  tratamientos: any[] = [];
  especialidades: any[] = [];
  corrientes: any[] = [];
  filteredComunas: any[] = []; 
  comunasFiltered: any[] = []; 
  terapiaSelected: any[] = [];
  tratamientoSelected: any[] = [];
  especialidadSelected: any[] = [];
  typeAttentionSelected: any[] = [];
  corrienteSelected: any[] = [];
  private baseUrl: string = 'https://db.redpsicologos.cl:8090';
  dropdownTherapySettings = {
    ...this.dropdownSettings,
    singleSelection: false
  };
  dropdownCorrientesSettings = {
    ...this.dropdownSettings,
    singleSelection: false
  };
  dropdownAttentionTypesSettings = {
    singleSelection: false,
    text: "Seleccione",
    textField: 'name',  // Campo que muestra el texto
    idField: 'id',      // Campo que identifica el valor
    itemsShowLimit: 3,
    selectAllText: "Seleccionar Todos",
    unSelectAllText: "Deseleccionar Todos",
    enableSearchFilter: true,
    classes: "myclass custom-class"
  };
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
constructor(  
  public regionesService: RealtimeRegionesService, 
  public comunasService: RealtimeComunasService, 
  public global: GlobalService,
  public authService: AuthPocketbaseService,
  public fb: FormBuilder,
  public TerapiaService: RealtimeTerapiaService,
  public realtimeProfesionales: RealtimeProfessionalsService,
  public realtimeRegiones: RealtimeRegionesService,
  public realtimeComunas: RealtimeComunasService,
  public realtimeTerapia: RealtimeTerapiaService,
  public TratamientoService: RealtimeTratamientosService,
  public EspecialidadService: RealtimeEspecialidadesService,
  public realtimeTratamientos: RealtimeTratamientosService,
  public realtimeEspecialidades: RealtimeEspecialidadesService,
  public realtimeCorrientes: RealtimeCorrientesService,
  
)
{
this.initializeData();
this.typeAttentionSelected = [];
  // Initialize form with default values
  this.profileForm = this.fb.group({
    name: ['', Validators.required],
    rut: ['', Validators.required],
    biography: ['', [Validators.required]],
    biography2: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    website: [''],
    birthday: ['', [Validators.required]],
    consultationAddress: ['', [Validators.required]],
    region: ['', null],
    comuna: ['', null],
    gender: ['', null],
    languages: this.fb.group({
      es: [false],
      en: [false],
      fr: [false],
      de: [false]
    }),
    targets: this.fb.group({
      'niños y niñas': [false],
      adultos: [false],
      'jóvenes y adolecentes': [false],
      'adultos mayores': [false],
      todos: [false]
    }),
    payments: this.fb.group({
      efectivo: [false],
      transferencia: [false],
      tarjetas: [false],
      webpay: [false]
    }),
    days: this.fb.group({
      Lunes: [false],
      Martes: [false],
      Miercoles: [false],
      Jueves: [false],
      Viernes: [false],
      Sabado: [false],
      Domingo: [false]
    }),
    typeAttention: this.fb.group({
      Online: [false],
      Presencial: [false],
      'A domicilio': [false]
    }),    
    priceSession: ['', [Validators.required]],
    titleUniversity: ['', null],
    typeTherapy: ['', [Validators.required]],
    typeTreatment: ['', [Validators.required]],
    typeEspeciality: ['', [Validators.required]],
    corriente: ['', [Validators.required]],
    openingHours: ['', null],
    registrationNumber: ['', null],
    academicTitles: this.fb.array([]),
    certificates: this.fb.array([]),
   
  });

  // Update form when professionalInfo is available
  if (this.global.professionalInfo) {
    this.updateFormWithProfessionalInfo();
  }
  this.initializeFormWithDefaults();

 }
 private initializeFormWithDefaults() {
  this.profileForm = this.fb.group({
    name: ['', [Validators.required]],
    rut: ['', [Validators.required]],
    biography: ['', null],
    biography2: ['', null],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required]],
    website: ['', null],
    birthday: ['', null],
    consultationAddress: ['', null],
    region: ['', [Validators.required]],
    comuna: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    priceSession: ['', [Validators.required]],
    titleUniversity: ['', null],
    typeTherapy: ['', [Validators.required]],
    typeTreatment: ['', [Validators.required]],
    typeEspeciality: ['', [Validators.required]],
    corriente: ['', [Validators.required]],
    openingHours: ['', null],
    registrationNumber: ['', null],
    academicTitles: this.fb.array([]),
    certificates: this.fb.array([]),
    targets: this.fb.group({
      'niños y niñas': [false],
      adultos: [false],
      'jóvenes y adolecentes': [false],
      'adultos mayores': [false],
      todos: [false]
    }),
    payments: this.fb.group({
      efectivo: [false],
      transferencia: [false],
      tarjetas: [false],
      webpay: [false]
    }),
    days: this.fb.group({
      Lunes: [false],
      Martes: [false],
      Miercoles: [false],
      Jueves: [false],
      Viernes: [false],
      Sabado: [false],
      Domingo: [false]
    }),
    typeAttention: this.fb.group({
      Online: [false],
      Presencial: [false],
      'A domicilio': [false]
    }),
    languages: this.fb.group({
      es: [false],
      en: [false],
      fr: [false],
      de: [false]
    })
  });
}
 async initializeData() {
  this.regionesList = await this.regionesService.getAllRegiones();
  this.comunasList = await this.comunasService.getAllComunas();
  this.loadTerapias();
  this.loadTratamientos();
  this.loadEspecialidades();
  this.loadCorrientes();
}

ngAfterViewInit() {
  
  this.initForms();
  if (this.global.professionalInfo) {
    // Inicializar valores para checkboxes y grupos
    const languages = this.global.professionalInfo.languages || {};
    const targets = this.global.professionalInfo.targets || {};
    const payments = this.global.professionalInfo.payments || {};
    const days = this.global.professionalInfo.days || {};
    const typeAttention = this.global.professionalInfo.typeAttention || {};

    // Patch values para el formulario
    this.profileForm.patchValue({
      name: this.global.professionalInfo.name,
      rut: this.global.professionalInfo.rut,
      biography: this.global.professionalInfo.biography,
      biography2: this.global.professionalInfo.biography2,
      phone: this.global.professionalInfo.phone,
      email: this.global.professionalInfo.email,
      website: this.global.professionalInfo.website,
      birthday: this.global.professionalInfo.birthday,
      consultationAddress: this.global.professionalInfo.consultationAddress,
      region: this.global.professionalInfo.region,
      comuna: this.global.professionalInfo.comuna,
      gender: this.global.professionalInfo.gender || '',
      priceSession: this.global.professionalInfo.priceSession,
      titleUniversity: this.global.professionalInfo.titleUniversity,
      typeTherapy: this.global.professionalInfo.typeTherapy,
      typeTreatment: this.global.professionalInfo.typeTreatment,
      typeEspeciality: this.global.professionalInfo.typeEspeciality,
      corriente: this.global.professionalInfo.corriente,
      openingHours: this.global.professionalInfo.openingHours,
      registrationNumber: this.global.professionalInfo.registrationNumber,
      certificates: this.global.professionalInfo.certificates,
      
      // Grupos de checkboxes
      languages: {
        es: !!languages.es,
        en: !!languages.en,
        fr: !!languages.fr,
        de: !!languages.de
      },
      targets: {
        'niños y niñas': !!targets['niños y niñas'],
        adultos: !!targets.adultos,
        'jóvenes y adolecentes': !!targets['jóvenes y adolecentes'],
        'adultos mayores': !!targets['adultos mayores'],
        todos: !!targets.todos
      },
      payments: {
        efectivo: !!payments.efectivo,
        transferencia: !!payments.transferencia,
        tarjetas: !!payments.tarjetas,
        webpay: !!payments.webpay
      },
      days: {
        Lunes: !!days.Lunes,
        Martes: !!days.Martes,
        Miercoles: !!days.Miercoles, // Asegurar coincidencia de nombres
        Jueves: !!days.Jueves,
        Viernes: !!days.Viernes,
        Sabado: !!days.Sabado, // Asegurar coincidencia de nombres
        Domingo: !!days.Domingo
      },
      
      typeAttention: {
        Online: !!typeAttention.Online,
        Presencial: !!typeAttention.Presencial,
        'A domicilio': !!typeAttention['A domicilio']
      }
    });
    if (this.global.professionalInfo) {
    // Cargar formación académica si existe
    if (this.global.professionalInfo.academicTitles && this.global.professionalInfo.academicTitles.length > 0) {
      // Limpiar el FormArray antes de agregar nuevos grupos
      while (this.academicTitles.length !== 0) {
        this.academicTitles.removeAt(0);
      }

      // Agregar cada título académico al FormArray
      this.global.professionalInfo.academicTitles.forEach((title: { institution: string; specialization: string; year: string }) => {
        this.academicTitles.push(this.fb.group({
          institution: [title.institution, Validators.required],
          specialization: [title.specialization, Validators.required],
          year: [title.year, Validators.required]
        }));
      });
    } else {
      // Si no hay datos, agregar un grupo vacío
      this.addTitle();
    }
  }

    if (this.global.professionalInfo.gender) {
      this.profileForm.get('gender')?.setValidators(null);
      this.profileForm.get('gender')?.updateValueAndValidity();
    }
  
    // Filtrar comunas basadas en la región seleccionada
    if (this.global.professionalInfo.region) {
      this.comunasFiltered = this.comunasList.filter(
        comuna => comuna.idFather === this.global.professionalInfo.region.id
      );
    }

    // Establecer imagen si existe
    if (this.global.professionalInfo.images && this.global.professionalInfo.images.length > 0) {
      this.imageUrl = this.global.professionalInfo.images[0];
    }
  }
}


// Método para subir el certificado (actualizado)
uploadCertificate() {
  // Simular click en el input file
  this.certificateInput.nativeElement.click();
}

async onCertificateSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;
 

  try {
    Swal.fire({
      title: 'Subiendo certificado...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'certificate');
    formData.append('user', this.authService.getUserId());

    const record = await this.pb.collection('images').create(formData);
    const fileUrl = `${this.pb.baseUrl}/api/files/${record.collectionId}/${record.id}/${record['file']}`;

    // Actualizar lista de certificados
    const currentCertificates = this.global.professionalInfo.certificates || [];
    const updatedCertificates = [...currentCertificates, fileUrl];

    await this.pb.collection('psychologistsProfessionals').update(
      this.authService.getUserId(),
      { certificates: updatedCertificates }
    );

    // Actualizar estado local
    this.global.professionalInfo.certificates = updatedCertificates;
    localStorage.setItem('professionalInfo', JSON.stringify(this.global.professionalInfo));

    Swal.fire({
      title: '¡Éxito!',
      text: 'Certificado cargado correctamente',
      icon: 'success',
      timer: 2000
    });

  } catch (error) {
    console.error('Error al cargar certificado:', error);
    Swal.fire('Error', 'No se pudo cargar el certificado', 'error');
  } finally {
    // Resetear input
    event.target.value = '';
  }
}

// Método para eliminar un certificado (actualizado)
async removeCertificate(certificateUrl: string) {
  const confirm = await Swal.fire({
    title: '¿Eliminar certificado?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar'
  });

  if (!confirm.isConfirmed) return;

  try {
    // Extraer el ID del certificado de la URL
    const parts = certificateUrl.split('/');
    const fileId = parts[parts.length - 2];
    
    // 1. Eliminar el archivo de la colección certificates
    await this.pb.collection('psychologistsProfessionals').delete(fileId);

    // 2. Actualizar la lista de certificados del profesional
    const updatedCertificates = this.global.professionalInfo.certificates
      .filter((cert: string) => cert !== certificateUrl);

    await this.pb.collection('psychologistsProfessionals').update(
      this.authService.getUserId(),
      { certificates: updatedCertificates }
    );

    // 3. Actualizar estado local
    this.global.professionalInfo.certificates = updatedCertificates;
    localStorage.setItem('professionalInfo', JSON.stringify(this.global.professionalInfo));

    Swal.fire('Eliminado!', 'El certificado ha sido eliminado.', 'success');

  } catch (error) {
    console.error('Error al eliminar certificado:', error);
    Swal.fire('Error', 'No se pudo eliminar el certificado', 'error');
  }
}
regionSelect(region: Region) {
    this.regionSelected = region;
    console.log('Región seleccionada:', region);
}
initForms() {
  const phoneInputs = document.querySelectorAll('.mil-phone-input');

  phoneInputs.forEach((phoneInput) => {
      const inputElement = phoneInput as HTMLInputElement; // Especificar el tipo

      const cleave = new Cleave(inputElement, {
          delimiters: ['(', ')', '-', '-'],
          blocks: [3, 3, 3, 2, 2],
          prefix: '+56',  // Código de país de Chile
          numericOnly: true,
          noImmediatePrefix: true,
      });

      inputElement.addEventListener('focus', function () {
          if (inputElement.value === '') {
              inputElement.value = '+56';
          }
      });

      inputElement.addEventListener('blur', function () {
          if (inputElement.value === '+56' || inputElement.value === '+56(') {
              inputElement.value = '';
          }
      });
  });
}
formatRutInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/[^0-9kK]/g, ''); // Solo números y 'k' o 'K'
  console.log('Valor ingresado (sin formato):', value); // Mostrar valor ingresado

  // Limitar la entrada a 9 caracteres (8 dígitos + 1 dígito verificador)
  if (value.length > 9) {
      value = value.slice(0, 9);
  }

  // Formatear el RUT con puntos y guion
  let formattedRut = '';
  if (value.length > 1) {
      const body = value.slice(0, -1);
      const checkDigit = value.slice(-1);
      console.log('Cuerpo:', body, 'Dígito verificador:', checkDigit); // Mostrar cuerpo y dígito verificador

      // Agregar puntos como separadores de miles
      formattedRut = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      formattedRut += `-${checkDigit}`; // Agregar el dígito verificador
  } else {
      formattedRut = value; // Si es un solo dígito
  }

  // Actualizar el modelo y el valor del input
  this.rutError = !this.validateRut(formattedRut); // Validar el RUT
  console.log('RUT formateado:', formattedRut); // Mostrar RUT formateado
  input.value = formattedRut; // Actualizar el valor del input
}

private validateRut(rut: string): boolean {
  rut = rut.replace(/[.-]/g, '').toUpperCase(); // Eliminar puntos y guiones
  console.log('RUT procesado para validación:', rut); // Mostrar RUT procesado

  if (rut.length < 2) {
      console.log('RUT inválido: menos de 2 caracteres'); // Mensaje si el RUT es demasiado corto
      return false; // Asegurarse de que tenga al menos 2 caracteres
  }

  const body = rut.slice(0, -1); // Cuerpo del RUT
  const checkDigit = rut.slice(-1); // Dígito verificador

  if (!/^\d+$/.test(body)) {
      console.log('RUT inválido: el cuerpo no es un número'); // Mensaje si el cuerpo no es un número
      return false; // Verificar que el cuerpo sea un número
  }

  let sum = 0;
  let multiplier = 2;

  // Calcular el dígito verificador
  for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1; // Ciclar el multiplicador
  }

  const remainder = 11 - (sum % 11); // Calcular el resto
  let finalCheckDigit: string;
  switch (remainder) {
      case 10:
          finalCheckDigit = 'K';
          break;
      case 11:
          finalCheckDigit = '0';
          break;
      default:
          finalCheckDigit = remainder.toString();
  }

  console.log('Dígito verificador calculado:', finalCheckDigit); // Mostrar dígito verificador calculado
  const isValid = finalCheckDigit === checkDigit; // Comparar el dígito verificador calculado con el proporcionado
  console.log('RUT válido:', isValid); // Mostrar resultado de la validación
  return isValid;
}
onRegionChange(region: any): void {
  this.comunasFiltered = [];
  if (region && region.length > 0) {
      const selectedRegion = region[0]; 
      this.regionSelected = selectedRegion;
      let id=selectedRegion.id;
      for (let comuna of this.comunas) {
          if (id === comuna.idFather) {
              this.comunasFiltered.push(comuna);
          }
      }
  } 
}
onComunaChange(comuna: any): void {
  this.comunaSelected = comuna;
  console.log(JSON.stringify(comuna));
}

 loadStoredRegiones() {
  const regiones = localStorage.getItem('regions');
  if (regiones) {
    const parsedRegiones = JSON.parse(regiones);
    this.storedRegiones = parsedRegiones.map((region: { id: string; name: string }) => ({
      id: region.id,
      name: region.name
    }));
  }
}
loadStoredTerapias() {
  const terapias = localStorage.getItem('terapias');
  if (terapias) {
    const parsedTerapias = JSON.parse(terapias);
    this.storedTerapias = parsedTerapias.map((terapia: { id: string; name: string }) => ({
      id: terapia.id,
      name: terapia.name
    }));
  }
}
loadStoredTratamientos() {
  const tratamientos = localStorage.getItem('tratamientos');
  if (tratamientos) {
    const parsedTratamientos = JSON.parse(tratamientos);
    this.storedTratamientos = parsedTratamientos.map((tratamiento: { id: string; name: string }) => ({
      id: tratamiento.id,
      name: tratamiento.name
    }));
  }
}
loadStoredEspecialidades() {
  const especialidades = localStorage.getItem('especialidades');
  if (especialidades) {
    const parsedEspecialidades = JSON.parse(especialidades);
    this.storedEspecialidades = parsedEspecialidades.map((especialidad: { id: string; name: string }) => ({
      id: especialidad.id,
      name: especialidad.name
    }));
  }
}

onTypeTherapyChange(selectedItems: any[]) {
  this.terapiaSelected = selectedItems; // Asigna las terapias seleccionadas
  // Si necesitas realizar alguna acción adicional con las terapias seleccionadas, hazlo aquí
  console.log(this.terapiaSelected);
}


onTypeTreatmentChange(selectedItems: any[]) {
  this.tratamientoSelected = selectedItems; // Asigna los tratamientos seleccionados
  console.log(this.tratamientoSelected);
}

onTypeEspecialityChange(selectedItems: any[]) {
  this.especialidadSelected = selectedItems; // Asigna las especialidades seleccionadas
  console.log(this.especialidadSelected);
}

onTratamientoChange(tratamiento: any): void {
  this.tratamientoSelected = tratamiento;
}

onEspecialidadChange(especialidad: any): void {
  this.especialidadSelected = especialidad;
}

onCorrienteChange(corriente: any): void {
  this.corrienteSelected = corriente;
}
onLanguageChange(idioma: string, event: Event) {
  const isChecked = (event.target as HTMLInputElement).checked;

  if (!this.global.professionalInfoLanguages) {
    this.global.professionalInfoLanguages = {};
  }
  if (!this.global.professionalInfo.languages) {
    this.global.professionalInfo.languages = {};
  }

  if (isChecked) {
    this.global.professionalInfoLanguages[idioma] = true;
    this.global.professionalInfo.languages[idioma] = true;
  } else {
    this.global.professionalInfoLanguages[idioma] = false;
    delete this.global.professionalInfo.languages[idioma];
  }

  localStorage.setItem('languages', JSON.stringify(this.global.professionalInfoLanguages));
  localStorage.setItem('professionalInfo', JSON.stringify(this.global.professionalInfo));
}

onTargetChange(dirigido: string, event: Event) {
  const isChecked = (event.target as HTMLInputElement).checked;

  if (!this.global.professionalInfo.targets) {
    this.global.professionalInfo.targets = {};
  }

  if (isChecked) {
    this.global.professionalInfo.targets[dirigido] = true;
  } else {
    delete this.global.professionalInfo.targets[dirigido];
  }

  // Actualizar el formulario
  this.profileForm.patchValue({
    target: this.global.professionalInfo.targets
  });

  localStorage.setItem('professionalInfo', JSON.stringify(this.global.professionalInfo));
}

onPaymentChange(pago: string, event: Event) {
  const isChecked = (event.target as HTMLInputElement).checked;
  
  // Actualiza el objeto payments
  this.global.professionalInfo.payments[pago] = isChecked;
  
  // Guarda en localStorage
  localStorage.setItem('professionalInfo', JSON.stringify(this.global.professionalInfo));
}

onDaysofcareChange(day: string, event: Event) {
  const isChecked = (event.target as HTMLInputElement).checked;
  
  // Actualiza el objeto days
  this.global.professionalInfo.days[day] = isChecked;
  
  // Guarda en localStorage
  localStorage.setItem('professionalInfo', JSON.stringify(this.global.professionalInfo));
}
onGenderChange() {
  const genderControl = this.profileForm.get('gender');
  if (genderControl?.value) {
    genderControl.setValidators(null);
  } else {
    genderControl?.setValidators(Validators.required);
  }
  genderControl?.updateValueAndValidity();
}

onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
  if (this.selectedFile) {
    this.uploadImage(); // Llama a la función para cargar la imagen inmediatamente después de seleccionar
  }
}
 async sendToUpdate() {
      // 1. Validación general del formulario (sin validar género)
      if (this.profileForm.valid) {
        try {
          this.isLoading = true;
          this.global.isLoading = true;
          const formValue = this.profileForm.value;
          
          // Preparar datos para enviar
          const updatedData = {
            ...formValue,
            id: this.global.professionalInfo.id,
            // Formación académica (convertir FormArray a array de objetos)
            academicTitles: this.academicTitles.value,
/*             certificates: this.global.professionalInfo.certificates || [],
 */            // Convertir los grupos de checkboxes
            languages: this.prepareLanguagesData(formValue.languages),
            targets: this.prepareTargetData(formValue.targets),
            payments: this.preparePaymentsData(formValue.payments),
            days: this.prepareDaysData(formValue.days),
            typeAttention: this.prepareTypeAttentionData(formValue.typeAttention),
            // Mantener datos existentes si no hay nuevos
            region: this.regionSelected || this.global.professionalInfo.region,
            comuna: this.comunaSelected || this.global.professionalInfo.comuna,
            gender: formValue.gender || this.global.professionalInfo.gender || null, // Asegurar género (puede ser null)
            typeTherapy: this.terapiaSelected || this.global.professionalInfo.typeTherapy,
            typeTreatment: this.tratamientoSelected || this.global.professionalInfo.typeTreatment,
            typeEspeciality: this.especialidadSelected || this.global.professionalInfo.typeEspeciality,
            corriente: this.corrienteSelected || this.global.professionalInfo.corriente,
            images: this.imageUrl ? [this.imageUrl] : this.global.professionalInfo.images,
            // Otros campos importantes
            biography: formValue.biography,
            biography2: formValue.biography2,
            priceSession: formValue.priceSession,
            registrationNumber: formValue.registrationNumber
          };
    
          // Limpiar datos nulos/undefined (excepto gender que puede ser null)
          const cleanData = this.removeEmptyFields(updatedData);    
          // Actualizar localStorage
          localStorage.setItem('professionalInfo', JSON.stringify(cleanData));
    
          // Enviar datos al backend
          const response = await this.authService.updateProfessionalInfo(cleanData);
    
          // Actualizar la vista con los nuevos datos
          this.global.setPreviewProfesional(response);
          
          // Mostrar confirmación
          await Swal.fire({
            title: '¡Éxito!',
            text: 'Datos actualizados correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            allowOutsideClick: true
          });
    
          // Recargar datos del profesional
          await this.getProfessionlINfo(); 
    
        } catch (error: unknown) {
          console.error('Error al actualizar:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          await Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar la información: ' + errorMessage,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        } finally {
          this.isLoading = false;
          this.global.isLoading = false;
          this.isDataLoaded = true;
          clearTimeout(this.loadingTimeout);
        }
      } else {
        // Mostrar errores de validación detallados (excluyendo género)
        const invalidFields = this.getInvalidFields().filter(field => field !== 'Género');
        
        if (invalidFields.length > 0) {
          await Swal.fire({
            title: 'Formulario incompleto',
            html: `Por favor completa correctamente los siguientes campos:<br><br>${invalidFields.join('<br>')}`,
            icon: 'warning',
            confirmButtonText: 'Entendido'
          });
        } else {
          // Si el único campo inválido es el género, permitir guardar igual
          await this.sendToUpdate();
        }
      }
    }
    
    public isDataReady(): boolean {
      return this.isDataLoaded && 
             this.regiones.length > 0 &&
             this.terapias.length > 0 &&
             this.tratamientos.length > 0 &&
             this.especialidades.length > 0 &&
             this.corrientes.length > 0;
    }
  
  // Métodos auxiliares
  private prepareLanguagesData(languages: any): any {
    const result: any = {};
    if (languages) {
      for (const [key, value] of Object.entries(languages)) {
        if (value) result[key] = true;
      }
    }
    return result;
  }
  
  private prepareTargetData(target: any): any {
    const result: any = {};
    if (target) {
      for (const [key, value] of Object.entries(target)) {
        if (value) result[key] = true;
      }
    }
    return result;
  }
  
  
  private preparePaymentsData(payments: any): any {
    const result: any = {};
    if (payments) {
      for (const [key, value] of Object.entries(payments)) {
        if (value) result[key] = true;
      }
    }
    return result;
  }
  
  private prepareDaysData(days: any): any {
    const result: any = {};
    if (days) {
      for (const [key, value] of Object.entries(days)) {
        if (value) result[key] = true;
      }
    }
    return result;
  }
  
  private prepareTypeAttentionData(typeAttention: any): any {
    const result: any = {};
    if (typeAttention) {
      for (const [key, value] of Object.entries(typeAttention)) {
        if (value) result[key] = true;
      }
    }
    return result;
  }
  
  private removeEmptyFields(obj: any): any {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    );
  }
  
  private getInvalidFields(): string[] {
    const fieldNames: {[key: string]: string} = {
      gender: 'Género',
      name: 'Nombre',
      lastname: 'Apellido',
      phone: 'Teléfono/WhatsApp',
      email: 'Correo electrónico',
      birthday: 'Fecha de nacimiento',
      consultationAddress: 'Dirección de consultorio',
      region: 'Región',
      comuna: 'Comuna',
      priceSession: 'Valor por sesión',
      typeTherapy: 'Tipo de terapia',
      typeTreatment: 'Tipo de tratamientos',
      typeEspeciality: 'Tipo de especialidades',
      corriente: 'Corriente',
      registrationNumber: 'Número de registro',
      website: 'Sitio web',
      languages: 'Idiomas',
      target: 'Objetivo',
      payments: 'Pagos',
      days: 'Días',
      typeAttention: 'Tipo de atención',
      biography: 'Descripción breve',
      biography2: 'Descripción extendida',
      academicTitles: 'Formación académica',

    };
    
    return Object.keys(this.profileForm.controls)
      .filter(key => this.profileForm.get(key)?.invalid)
      .map(key => fieldNames[key] || key);
  }
  
  private getFieldName(key: string): string {
    const fieldNames: {[key: string]: string} = {
      name: 'Nombre y apellido',
      rut: 'RUT',
      biography: 'Descripción breve',
      biography2: 'Descripción extendida',
      phone: 'Teléfono/WhatsApp',
      email: 'Correo electrónico',
      birthday: 'Fecha de nacimiento',
      consultationAddress: 'Dirección de consultorio',
      region: 'Región',
      comuna: 'Comuna',
      gender: 'Género',
      priceSession: 'Valor por sesión',
      typeTherapy: 'Tipo de terapia',
      typeTreatment: 'Tipo de tratamientos',
      typeEspeciality: 'Tipo de especialidades',
      corriente: 'Corriente',
      registrationNumber: 'Número de registro',
      website: 'Sitio web',
      academicTitles: 'Formación académica'
    };
  
    return fieldNames[key] || key;
  }
  
  
openFileSelector() {
  this.fileInput.nativeElement.click(); 
}

async updateProfessionalRecord(imageUrl: string,) {
  const professionalId = this.global.professionalInfo.id; 

  try {
    const data = {
      images: [imageUrl], 
     
    };
    
    const record = await this.pb.collection('psychologistsProfessionals').update(professionalId, data);
    console.log('Registro del profesional actualizado con éxito:', record);
    const professionalInfo = JSON.parse(localStorage.getItem('professionalInfo') || '{}');
    professionalInfo.images = [imageUrl]; 
    professionalInfo.languages = JSON.parse(localStorage.getItem('languages') || '[]'); 
    professionalInfo.certificates = JSON.parse(localStorage.getItem('certificates') || '[]'); 
    localStorage.setItem('professionalInfo', JSON.stringify(professionalInfo));

    Swal.fire({
      title: '¡Éxito!',
      text: 'La imagen ha sido actualizada.',
      icon: 'success',
      timer: 2000, 
      showConfirmButton: false 
    });
  } catch (error) {
    console.error('Error al actualizar el registro del profesional:', error);
    
    Swal.fire({
      title: 'Error',
      text: 'No se pudo actualizar la imagen.',
      icon: 'error',
      timer: 2000, 
      showConfirmButton: false 
    });
  }
}

async uploadImage() {
  if (this.selectedFile) {
    const formData = new FormData();
    formData.append('image', this.selectedFile, this.selectedFile.name);

    try {
      const response = await this.pb.collection('images').create(formData);
      const collectionId = response.collectionId; 
      const fileId = response.id; 
      const fileName = this.selectedFile.name; 
      const token = ''; 
      const image = response['image'];
      const constructedUrl = `${this.baseUrl}/api/files/${collectionId}/${fileId}/${image}?token=${token}`;
      this.imageUrl = constructedUrl; 
      console.log('Imagen cargada con éxito', response);
      console.log('URL de la imagen:', constructedUrl);
      await this.updateProfessionalRecord(constructedUrl);
    } catch (error) {
      console.error('Error al cargar la imagen', error);
    }
  }
}
async updateCertificate(certificateUrl: string) {
  if (this.selectedFile) {
    const formData = new FormData();
    formData.append('image', this.selectedFile, this.selectedFile.name);

    try {
      const response = await this.pb.collection('images').create(formData);
      const collectionId = response.collectionId; 
      const fileId = response.id; 
      const fileName = this.selectedFile.name; 
      const token = ''; 
      const image = response['image'];
      const constructedUrl = `${this.baseUrl}/api/files/${collectionId}/${fileId}/${image}?token=${token}`;
      this.imageUrl = constructedUrl; 
      console.log('Imagen cargada con éxito', response);
      console.log('URL de la imagen:', constructedUrl);
      await this.updateProfessionalRecord(constructedUrl);
    } catch (error) {
      console.error('Error al cargar la imagen', error);
    }
  }
}
  async ngOnInit() {
    this.initializeFormWithDefaults();
    
    // Cargar datos adicionales
    this.loadRegiones();
    this.loadTerapias();
    this.loadTratamientos();
    this.loadEspecialidades();
    this.loadCorrientes();
    this.loadComunas();

    // Esperar a que las regiones se carguen antes de filtrar comunas
    this.regionesService.regiones$.subscribe(() => {
      this.filterComunas();
    });

    // Intentar cargar datos desde localStorage primero
    const storedInfo = localStorage.getItem('professionalInfo');
    if (storedInfo) {
      try {
        const professionalInfo = JSON.parse(storedInfo);
        this.global.professionalInfo = professionalInfo;
        this.updateFormWithProfessionalInfo();
        this.isDataLoaded = true;
      } catch (error) {
        console.error('Error parsing stored info:', error);
      }
    }

    // Si no hay datos en localStorage, cargar desde el servidor
    if (!this.isDataLoaded) {
      await this.getProfessionlINfo();
    }
  }

  

  async fetchDataFromServer() {
    try {
      this.isLoading = true;
      const profesional = await this.realtimeProfesionales.getProfesionalById(this.authService.getUserId()).toPromise();
      
      if (profesional) {
        this.global.setPreviewProfesional(profesional);
        localStorage.setItem('professionalInfo', JSON.stringify(profesional));
        this.updateFormWithProfessionalInfo();
        this.isDataLoaded = true;
      } else {
        // Inicializar nuevo profesional
        this.initializeNewProfessional();
      }
    } catch (error) {
      console.error('Error fetching professional info:', error);
      this.isDataLoaded = false;
    } finally {
      this.isLoading = false;
      clearTimeout(this.loadingTimeout);
    }
  }

  private initializeNewProfessional() {
    const newProfessional = {
      name: '',
      gender: '',
      languages: [],
      phone: '',
      email: '',
      website: '',
      registrationNumber: '',
      biography: '',
      biography2: '',
      region: null,
      comuna: null,
      consultationAddress: '',
      priceSession: '',
      openingHours: '',
      corriente: [],
      typeTherapy: [],
      typeTreatment: [],
      typeEspeciality: [],
      typeAttention: [],
      days: [],
      payments: []
    };
    
    this.global.professionalInfo = newProfessional;
    this.updateFormWithProfessionalInfo();
    this.isDataLoaded = true;
  }
  createTitleGroup(): FormGroup {
    return this.fb.group({
      institution: ['', Validators.required],
      specialization: ['', Validators.required],
      year: ['', Validators.required]
    });
  }

  get academicTitles(): FormArray {
    return this.profileForm.get('academicTitles') as FormArray;
  }

  addTitle() {
    this.academicTitles.push(this.createTitleGroup());
  }
  
  removeTitle(index: number) {
    if (this.academicTitles.length > 1) {
      this.academicTitles.removeAt(index);
    } else {
      // Opcional: Mostrar un mensaje si intentan eliminar el último título
      Swal.fire({
        title: 'Atención',
        text: 'Debe haber al menos una formación académica',
        icon: 'warning',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }
  loadRegiones() {
    this.regionesService.regiones$.subscribe(data => {
      this.regiones = data;   
    });
  }

  async loadTerapias() {
    try {
      this.terapias = await this.TerapiaService.getAllTerapias();
      // Si hay datos guardados, seleccionar los que corresponden
      if (this.global.professionalInfo?.typeTherapy) {
        this.terapiaSelected = this.terapias.filter(t => 
          this.global.professionalInfo.typeTherapy.includes(t.id)
        );
      }
    } catch (error) {
      console.error('Error al cargar terapias:', error);
    }
  }
  async loadTratamientos() {
    try {
      this.tratamientos = await this.TratamientoService.getAllTratamientos();
      // Si hay datos guardados, seleccionar los que corresponden
      if (this.global.professionalInfo?.typeTreatment) {
        this.tratamientoSelected = this.tratamientos.filter(t => 
          this.global.professionalInfo.typeTreatment.includes(t.id)
        );
      }
    } catch (error) {
      console.error('Error al cargar tratamientos:', error);
    }
  }
  async loadEspecialidades() {
    try {
      this.especialidades = await this.EspecialidadService.getAllEspecialidades();
      // Si hay datos guardados, seleccionar los que corresponden
      if (this.global.professionalInfo?.typeEspeciality) {
        this.especialidadSelected = this.especialidades.filter(e => 
          this.global.professionalInfo.typeEspeciality.includes(e.id)
        );
      }
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
    }
  }
  async loadCorrientes() {
    try {
      this.corrientes = await this.realtimeCorrientes.getAllCorrientes();
      // Si hay datos guardados, seleccionar los que corresponden
      if (this.global.professionalInfo?.corriente) {
        this.corrienteSelected = this.corrientes.filter(c => 
          this.global.professionalInfo.corriente.includes(c.id)
        );
      }
    } catch (error) {
      console.error('Error al cargar corrientes:', error);
    }
  }

  loadComunas() {
    this.comunasService.comunas$.subscribe(data => {
      this.comunas = data;
      this.filterComunas(); 
    });
  }

  filterComunas() {
    if (!this.global.professionalInfo?.region) {
      this.filteredComunas = [];
      return;
    }
    this.filteredComunas = this.comunas.filter(comuna => comuna.idFather === this.global.professionalInfo.region);
  }
  setImage() {
    const professionalInfo = JSON.parse(localStorage.getItem('professionalInfo') || '{}');  
    this.imageUrl = professionalInfo.images?.[0] || 'assets/images/user.png'; 
  } 
  async getProfessionlINfo() {
        this.isLoading = true;
        try {
          // Limpiar datos existentes primero
          this.clearUserData();
          
          const profesional = await this.realtimeProfesionales.getProfesionalById(this.authService.getUserId()).toPromise();
          
          if (profesional) {
            // Inicializar objetos vacíos si no existen
            profesional.languages = profesional.languages || {};
            profesional.targets = profesional.targets || {};
            profesional.payments = profesional.payments || {};
            profesional.days = profesional.days || {};
            profesional.typeAttention = profesional.typeAttention || {};
            
            // Guardar en el servicio global
            this.global.setPreviewProfesional(profesional);
            
            // Guardar en localStorage solo los datos necesarios
            localStorage.setItem('professionalInfo', JSON.stringify(profesional));
            
            this.setImage();
            
            // Actualizar el formulario
            if (this.profileForm) {
              this.updateFormWithProfessionalInfo();
            }
            
            this.isDataLoaded = true;
          }
        } catch (error) {
          console.error('Error al cargar info profesional:', error);
          // Limpiar datos si hay error
          this.clearUserData();
        } finally {
          this.isLoading = false;
        }
      }
  async fetchPsychologistData(profesionalId: string) {
    try {
      const record = await this.pb.collection('psychologistsProfessionals').getOne(this.authService.getUserId());
      this.global.setPreviewProfesional(record); 
      this.imageUrl = record['images']?.[0] || 'assets/images/user.png'; 
      this.setImage();
   
    } catch (error) {
      console.error('Error fetching record:', error);
    }
  }
confirmLogout() {
        Swal.fire({
          title: '¿Quieres cerrar sesión?',
          text: "",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, cerrar sesión',
          cancelButtonText: 'Mantenerme aquí'
        }).then((result) => {
          if (result.isConfirmed) {
            // Limpiar los datos específicos del usuario antes de cerrar sesión
            this.clearUserData();
            
            this.authService.logoutUser(); 
            Swal.fire(
              '¡Cerrado!',
              'Has cerrado sesión con éxito.',
              'success'
            );
          }
        });
      }
      hasSelectedItems(obj: any): boolean {
        if (!obj) return false;
        return Object.values(obj).some(val => val === true);
      }
      
      getSelectedItems(obj: any): string[] {
        if (!obj) return [];
        return Object.keys(obj).filter(key => obj[key]);
      }
      private clearUserData() {
        // Limpiar todos los datos relacionados con el usuario
        localStorage.removeItem('professionalInfo');
        localStorage.removeItem('languages');
        // Agrega aquí cualquier otro dato que guardes en localStorage
        
        // También limpia los datos en el servicio global
        this.global.clearProfessionalData();
        
        // Resetea el formulario
        this.profileForm.reset();
      }
     
 // Add this method to update the form when professionalInfo is available
 updateFormWithProfessionalInfo() {
  if (this.global.professionalInfo) {
    this.profileForm.patchValue({
      name: this.global.professionalInfo.name,
      rut: this.global.professionalInfo.rut,
      biography: this.global.professionalInfo.biography,
      biography2: this.global.professionalInfo.biography2,
      phone: this.global.professionalInfo.phone,
      email: this.global.professionalInfo.email,
      website: this.global.professionalInfo.website,
      birthday: this.global.professionalInfo.birthday,
      consultationAddress: this.global.professionalInfo.consultationAddress,
      region: this.global.professionalInfo.region,
      comuna: this.global.professionalInfo.comuna,
      gender: this.global.professionalInfo.gender,
      priceSession: this.global.professionalInfo.priceSession,
      titleUniversity: this.global.professionalInfo.titleUniversity,
      openingHours: this.global.professionalInfo.openingHours,
      registrationNumber: this.global.professionalInfo.registrationNumber
    });

    // Update nested form groups
    Object.keys(this.global.professionalInfo.languages || {}).forEach(lang => {
      this.profileForm.get(`languages.${lang}`)?.setValue(this.global.professionalInfo.languages[lang]);
    });

    Object.keys(this.global.professionalInfo.targets || {}).forEach(target => {
      this.profileForm.get(`targets.${target}`)?.setValue(this.global.professionalInfo.targets[target]);
    });

    Object.keys(this.global.professionalInfo.payments || {}).forEach(payment => {
      this.profileForm.get(`payments.${payment}`)?.setValue(this.global.professionalInfo.payments[payment]);
    });

    Object.keys(this.global.professionalInfo.days || {}).forEach(day => {
      this.profileForm.get(`days.${day}`)?.setValue(this.global.professionalInfo.days[day]);
    });

    Object.keys(this.global.professionalInfo.typeAttention || {}).forEach(attention => {
      this.profileForm.get(`typeAttention.${attention}`)?.setValue(this.global.professionalInfo.typeAttention[attention]);
    });
  }
}

getLanguagesText(): string {
  if (!this.global.professionalInfo?.languages) return 'No especificado';
  const languages = Object.entries(this.global.professionalInfo.languages)
    .filter(([_, value]) => value)
    .map(([lang]) => {
      const langMap = {
        es: 'Español',
        en: 'Inglés',
        fr: 'Francés',
        de: 'Alemán'
      };
      return langMap[lang as keyof typeof langMap] || 'Desconocido';
    });
  return languages.length > 0 ? languages.join(', ') : 'No especificado';
}

getCorrientesText(): string {
  if (!this.global.professionalInfo?.corriente) return 'No especificado';
  const selectedCorrientes = this.corrientes.filter(corriente => 
    this.global.professionalInfo.corriente.includes(corriente.id)
  );
  return selectedCorrientes.length > 0 ? selectedCorrientes.map(c => c.name).join(', ') : 'No especificado';
}

getTypeTherapyText(): string {
  if (!this.global.professionalInfo?.typeTherapy) return 'No especificado';
  const selectedTherapies = this.terapias.filter(therapy => 
    this.global.professionalInfo.typeTherapy.includes(therapy.id)
  );
  return selectedTherapies.length > 0 ? selectedTherapies.map(t => t.name).join(', ') : 'No especificado';
}

getTypeTreatmentText(): string {
  if (!this.global.professionalInfo?.typeTreatment) return 'No especificado';
  const selectedTreatments = this.tratamientos.filter(treatment => 
    this.global.professionalInfo.typeTreatment.includes(treatment.id)
  );
  return selectedTreatments.length > 0 ? selectedTreatments.map(t => t.name).join(', ') : 'No especificado';
}

getTypeEspecialityText(): string {
  if (!this.global.professionalInfo?.typeEspeciality) return 'No especificado';
  const selectedEspecialities = this.especialidades.filter(especiality => 
    this.global.professionalInfo.typeEspeciality.includes(especiality.id)
  );
  return selectedEspecialities.length > 0 ? selectedEspecialities.map(e => e.name).join(', ') : 'No especificado';
}
}
