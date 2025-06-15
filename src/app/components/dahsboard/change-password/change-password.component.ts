import { Component, ViewChild, ElementRef } from '@angular/core';
import PocketBase from 'pocketbase';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { GlobalService } from '../../../service/global.service';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { RealtimeCorrientesService } from '../../../service/realtime-corrientes.service';
import { ActivatedRoute } from '@angular/router';
import { RealtimePlanesService } from '../../../service/realtime-planes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,NgMultiSelectDropDownModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  rutError: boolean = false;
  imageUrl: string = 'assets/images/resource/.png'; 
  private pb = new PocketBase('https://db.redpsicologos.cl:8090');

  isLoading = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordVisible = false;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
constructor(  
  public global: GlobalService,
  public authService: AuthPocketbaseService,
  public fb: FormBuilder,
  public realtimeProfesionales: RealtimeProfessionalsService,
  public realtimeCorrientes: RealtimeCorrientesService,
  public route: ActivatedRoute,
  public realtimePlanes: RealtimePlanesService
  
)
{
  this.global.professionalInfo = this.global.professionalInfo || {};
 }
 
 ngOnInit() {
  const cachedInfo = localStorage.getItem('professionalInfo');
  if (cachedInfo) {
    const profesional = JSON.parse(cachedInfo);
    this.global.setPreviewProfesional(profesional);
    this.setImage();
  } else {
    this.global.loadProfessionalInfo();
    this.getProfessionlInfo();
  }

  this.route.queryParams.subscribe(params => {
    if (params['type'] === 'subscription') {
      this.global.activeRoute = 'planning';
    }
    if (params['status'] === 'cancel') {
      Swal.fire('Pago cancelado', 'No completaste el proceso de pago.', 'info');
    }
  });
}
async sendResetEmail() {
  this.isLoading = true;
  const email = this.pb.authStore.model?.['email'];

  if (!email) {
    Swal.fire('Error', 'No se pudo obtener el email del usuario.', 'error');
    this.isLoading = false;
    return;
  }

  try {
    await this.pb.collection('users').requestPasswordReset(email);
    Swal.fire('Correo enviado', 'Revisa tu bandeja de entrada.', 'success');
  } catch (error: any) {
    Swal.fire('Error', `No fue posible enviar el correo: ${error?.message || error}`, 'error');
  } finally {
    this.isLoading = false;
  }
}

async changePassword() {
  if (this.newPassword !== this.confirmPassword) {
    Swal.fire('Error', 'Las contraseñas nuevas no coinciden.', 'error');
    return;
  }

  const email = this.pb.authStore.model?.['email'];
  const userId = this.pb.authStore.model?.['id'];

  if (!email || !userId) {
    Swal.fire('Error', 'Sesión no válida. Intenta iniciar sesión nuevamente.', 'error');
    return;
  }

  this.isLoading = true;

  try {
    // 1. Verificamos que la contraseña actual sea correcta
    const tempPb = new PocketBase(this.pb.baseUrl);
    await tempPb.collection('users').authWithPassword(email, this.currentPassword);

    // 2. Si autenticación exitosa, procedemos a cambiar la contraseña
    await this.pb.collection('users').update(userId, {
      password: this.newPassword,
      passwordConfirm: this.confirmPassword
    });

    Swal.fire('¡Éxito!', 'Contraseña cambiada correctamente.', 'success');
    
    // Limpieza de campos
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

  } catch (error: any) {
    const msg = error?.message || 'No se pudo cambiar la contraseña. Verifica tus datos.';
    Swal.fire('Error', msg, 'error');
  } finally {
    this.isLoading = false;
  }
}


togglePasswordVisibility() {
  this.passwordVisible = !this.passwordVisible;
}

hasSelectedItems(obj: any): boolean {
  return obj ? Object.values(obj).some(val => val === true) : false;
}

getSelectedItems(obj: any): string[] {
  return obj ? Object.keys(obj).filter(key => obj[key]) : [];
}

setImage() {
  const professionalInfo = JSON.parse(localStorage.getItem('professionalInfo') || '{}');
  this.imageUrl = professionalInfo.images?.[0] || 'assets/images/user.png';
}

async getProfessionlInfo() {
  try {
    const profesional = await this.realtimeProfesionales.getProfesionalById(this.authService.getUserId()).toPromise();
    if (profesional) {
      profesional.languages = profesional.languages || {};
      profesional.targets = profesional.targets || {};
      profesional.payments = profesional.payments || {};
      profesional.days = profesional.days || {};
      profesional.typeAttention = profesional.typeAttention || {};

      this.global.setPreviewProfesional(profesional);
      localStorage.setItem('professionalInfo', JSON.stringify(profesional));
      this.setImage();
    }
  } catch (error) {
    console.error('Error al cargar info profesional:', error);
  }
}

confirmLogout() {
  Swal.fire({
    title: '¿Quieres cerrar sesión?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  }).then(result => {
    if (result.isConfirmed) {
      this.authService.logoutUser();
      Swal.fire('Sesión cerrada', '', 'success');
    }
  });
}
}