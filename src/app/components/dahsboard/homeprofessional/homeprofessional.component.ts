import { Component, ViewChild, ElementRef,EventEmitter, NO_ERRORS_SCHEMA, AfterViewInit, OnInit} from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject } from 'rxjs';
import { FormGroup,FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import Cleave from 'cleave.js';
import { RealtimeRegionesService } from '../../../service/realtime-regiones';
import { RealtimeComunasService } from '../../../service/realtime-comunas.service';
import { GlobalService } from '../../../service/global.service';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { CommonModule } from '@angular/common';
import { RealtimeCorrientesService } from '../../../service/realtime-corrientes.service';


@Component({
  selector: 'app-homeprofessional',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,NgMultiSelectDropDownModule],
  templateUrl: './homeprofessional.component.html',
  styleUrl: './homeprofessional.component.css'
})
export class HomeprofessionalComponent implements OnInit {
  rutError: boolean = false;
  imageUrl: string = 'assets/images/resource/.png'; 
  private pb = new PocketBase('https://db.redpsicologos.cl:8090');
  isLoading: boolean = false;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
constructor(  
  public global: GlobalService,
  public authService: AuthPocketbaseService,
  public fb: FormBuilder,
  public realtimeProfesionales: RealtimeProfessionalsService,
  public realtimeCorrientes: RealtimeCorrientesService,
  
)
{
  this.global.professionalInfo = this.global.professionalInfo || {};
 }
 
 ngOnInit() {
  // Primero verificar si ya hay datos en localStorage
  const cachedInfo = localStorage.getItem('professionalInfo');
  
  if (cachedInfo) {
    const profesional = JSON.parse(cachedInfo);
    this.global.setPreviewProfesional(profesional);
    this.setImage();
  } else {
    // Si no hay datos en cache, cargarlos del servidor
    this.global.loadProfessionalInfo();
    this.getProfessionlInfo();
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
  setImage() {
    const professionalInfo = JSON.parse(localStorage.getItem('professionalInfo') || '{}');  
    this.imageUrl = professionalInfo.images?.[0] || 'assets/images/user.png'; 
  }
  async getProfessionlInfo() {
        try {
          // Limpiar datos existentes primero
          
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
            
            
          }
        } catch (error) {
          console.error('Error al cargar info profesional:', error);
          // Limpiar datos si hay error
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


      
    
}
