import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from '../../service/global.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PsychologistRatingService } from '../../service/psychologistRatingService.service';
import { AuthPocketbaseService } from '../../service/auth-pocketbase.service';
import { ElementRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { RealtimeRatingsService } from '../../service/realtime-ratings.service';
import { ChangeDetectorRef } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';

declare var grecaptcha: any; 
declare global {
  interface Window {
    grecaptcha: any;
  }
}

@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule],
  templateUrl: './professional-detail.component.html',
  styleUrl: './professional-detail.component.css'
})
export class ProfessionalDetailComponent implements OnInit, AfterViewInit {
name: string = '';
phone: number = 0;
email: string = '';
profesional: any;
reviewForm: FormGroup;
  currentRating = 0;
  predefinedTags = [
    'Profesional', 
    'Puntual', 
    'Buen trato', 
    'Resultados excelentes', 
    'Recomendaría'
  ];
  selectedTags: string[] = [];
  @ViewChild('recaptcha') recaptchaElement!: ElementRef;
  isRecaptchaLoaded = false;
  averageRating = 0;
  ratingDistribution = [0, 0, 0, 0, 0];
  ratings: any[] = [];
  isSubmitting = false;
  recaptchaLoaded = false;
  public retryCount = 0;
  public maxRetries = 3;
  public retryDelay = 2000; // 2 segundos entre reintentos
  public recaptchaLoadTimeout = 10000; // 10 segundos máximo de espera
  recaptchaError: string | null = null;
  filteredRatings: any[] = [];
  filteredRatings$: Observable<any[]>;
  idSpecialist: string | null = null;
constructor(
  public global: GlobalService,
  public fb: FormBuilder,
  public ratingService: PsychologistRatingService,
  public authService: AuthPocketbaseService,
  public realtimeRatings: RealtimeRatingsService,
  private cdRef: ChangeDetectorRef
){
  this.filteredRatings$ = this.realtimeRatings.ratings$.pipe(
    map(ratings => ratings.filter(rating => 
      rating.idSpecialist === this.global.previewProfesionals?.id &&
      rating.status?.toLowerCase() === 'approved'
    ))
  );

  this.reviewForm = this.fb.group({
    title: [''],
    comment: [''],
    recaptcha: [''],
    terms: [false]
  });

  this.realtimeRatings.ratings$.subscribe(ratings => {
    console.log('Ratings recibidos en tiempo real:', ratings);
    this.ratings = ratings;
    this.updateFilteredRatings();
  });
}



calculateAverageRating() {
  // Usamos filteredRatings que ya contiene solo los aprobados del profesional actual
  if (this.filteredRatings.length > 0) {
    const totalScore = this.filteredRatings.reduce((sum, rating) => sum + rating.score, 0);
    this.averageRating = Math.round((totalScore / this.filteredRatings.length) * 10) / 10;
  } else {
    this.averageRating = 0;
  }
}
calculateRatingProgress(): number {
  // Convert average rating to a percentage (0-100)
  return (this.averageRating / 5) * 100;
}
getApprovedRatings(): any[] {
  return this.filteredRatings.filter(rating => rating.status === 'approved');
}
updateFilteredRatings() {
  this.filteredRatings = this.ratings.filter(rating => 
    rating.idSpecialist === this.global.previewProfesionals?.id &&
    rating.idSpecialist === this.global.previewProfesionals?.id &&
    rating.status?.toLowerCase() === 'approved'
  );
  this.calculateAverageRating();
}
getStars(rating: number): number[] {
  return Array(Math.floor(rating)).fill(0);
}
/* getStars(rating: number): number[] {
  return Array(rating).fill(0);
} */

getEmptyStars(rating: number): number[] {
  // Calcula cuántas estrellas vacías mostrar (5 - estrellas llenas - media estrella)
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  return Array(5 - fullStars - (hasHalfStar ? 1 : 0)).fill(0);
}
  calculateRatingDistribution(): number[] {
    const distribution = [0, 0, 0, 0, 0]; // Array para 5, 4, 3, 2, 1 estrellas
    
    this.filteredRatings.forEach(rating => {
      const score = Math.min(Math.max(1, rating.score), 5); // Limitar entre 1 y 5
      distribution[score - 1]++;
    });
    
    return distribution;
  }
  getRatingDistribution(): number[] {
    return this.calculateRatingDistribution();
  }
  

async ngOnInit() {
  this.profesional = this.global.previewProfesionals;
  this.resetForm();
  
  // Cargar ratings iniciales
  await this.loadRatings();
  
  try {
    await this.loadRecaptchaWithRetry();
  } catch (error) {
    this.showRecaptchaError('No se pudo cargar el sistema de seguridad después de varios intentos. Por favor recarga la página.');
  }
  // En el ngOnInit, después de cargar los datos reales:
if (this.filteredRatings.length === 0) {
  // Datos de prueba
  this.filteredRatings = [{
    title: "Paciente de prueba",
    score: 5,
    comment: "Excelente profesional, muy recomendable",
    tags: "Profesional, Buen trato",
    created: new Date(),
    status: "approved"
  }];
  this.calculateAverageRating();
   // Scroll to top when component loads
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
}
}

async loadRatings() {
  try {
    // Limpiar ratings existentes
    this.ratings = [];
    this.filteredRatings = [];
    
    // Obtener todos los ratings
    const allRatings = await this.ratingService.getAllRatings();
    console.log('Datos crudos de ratings:', allRatings);
    
    // Asignar y asegurar que items existe
    this.ratings = allRatings || [];
    console.log('Ratings asignados:', this.ratings);
    
    // Forzar detección de cambios
    this.cdRef.detectChanges();
    
  } catch (error) {
    console.error('Error loading ratings:', error);
    this.filteredRatings = [];
  }
}


private showRecaptchaError(message: string) {
  this.recaptchaError = message;
  this.isRecaptchaLoaded = false;
  
  // Opcional: enviar error a un servicio de monitoreo
  console.error('Error reCAPTCHA:', message);
}

async retryRecaptcha() {
  this.recaptchaError = null;
  this.retryCount = 0;
  
  try {
    await this.loadRecaptchaWithRetry();
  } catch (error) {
    this.showRecaptchaError('Seguimos teniendo problemas para cargar el sistema de seguridad. Por favor recarga la página completamente.');
  }
}
private async loadRecaptchaV3(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Tiempo de espera agotado para cargar reCAPTCHA'));
    }, this.recaptchaLoadTimeout);

    if (window.grecaptcha) {
      clearTimeout(timeout);
      this.isRecaptchaLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
    script.async = true;
    script.defer = true;
    script.id = 'recaptcha-v3-script';

    script.onload = () => {
      clearTimeout(timeout);
      this.isRecaptchaLoaded = true;
      console.log('reCAPTCHA cargado correctamente');
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Error al cargar el script de reCAPTCHA'));
    };

    const oldScript = document.getElementById('recaptcha-v3-script');
    if (oldScript) document.head.removeChild(oldScript);
    
    document.head.appendChild(script);
  });
}

public cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

sendToWhatsApp() {
  // Get the professional's phone number from the previewProfesionals object
  const professionalPhone = this.global.previewProfesionals?.phone || '';
  const cleanPhone = this.cleanPhoneNumber(professionalPhone);
  
  // Build the message with all form data
  const message = `Hola, mi nombre es ${this.name}.\n` +
                  `Mi teléfono es: ${this.phone}\n` +
                  `Mi correo electrónico es: ${this.email}\n` +
                  `Me gustaría contactarte para una consulta.`;
  
  // Create WhatsApp URL with the professional's phone number
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  
  // Log the phone number being used (for debugging)
  console.log('Sending WhatsApp message to:', cleanPhone);
  
  window.open(whatsappUrl, '_blank');
  this.resetForm();
}

sendToEmail() {
  // Get the professional's email
  const professionalEmail = this.global.previewProfesionals?.email || '';
  
  // Build the message with all form data
  const message = `Hola, mi nombre es ${this.name}.\n` +
                  `Mi teléfono es: ${this.phone}\n` +
                  `Mi correo electrónico es: ${this.email}\n` +
                  `Me gustaría contactarte para una consulta.`;
  
  // Create email URL with the professional's email
  const emailUrl = `mailto:${professionalEmail}?subject=Consulta&body=${encodeURIComponent(message)}`;
  
  // Log the email being used (for debugging)
  console.log('Sending email to:', professionalEmail);
  
  window.open(emailUrl, '_blank');
  this.resetForm();
}

resetForm() {
  this.name = '';
  this.phone = 0;
  this.email = '';
}
getSelectedItems(items: any[]) {
  return items.map(item => item.name);
}
hasSelectedItems(items: any[]) {
  return items.length > 0;
}
getLanguagesDisplay(): string {
  const langs = this.global.previewProfesionals?.languages;
  if (!langs || !Object.values(langs).length) return 'No especificado';
  return Object.keys(langs).filter(lang => langs[lang as keyof typeof langs]).join(', ');
}
floorRating(rating: number): number {
  return Math.floor(rating);
}
getRegionDisplay(): string {
  const regionId = this.global.previewProfesionals?.region;
  const region = this.global.storedRegiones?.find(r => r.id === regionId);
  return region ? region.name : 'No especificado';
}
getSelectedDays(daysObj: {[key: string]: boolean}): string[] {
  if (!daysObj) return [];
  return Object.keys(daysObj).filter(day => daysObj[day]);
}
initForm() {
  this.reviewForm = this.fb.group({
    title: ['', Validators.required],
    comment: [''],
    recaptcha: ['', Validators.required],
    terms: [false, Validators.requiredTrue]
  });
}

calculateRatingStats() {
  if (this.ratings.length === 0) return;
  
  // Calcular promedio
  const total = this.ratings.reduce((sum, rating) => sum + rating.score, 0);
  this.averageRating = total / this.ratings.length;
  
  // Calcular distribución
  this.ratingDistribution = [0, 0, 0, 0, 0];
  this.ratings.forEach(rating => {
    if (rating.score >= 1 && rating.score <= 5) {
      this.ratingDistribution[5 - rating.score]++;
    }
  });
}

setRating(rating: number) {
  this.currentRating = rating;
}

toggleTag(tag: string) {
  const index = this.selectedTags.indexOf(tag);
  if (index > -1) {
    this.selectedTags.splice(index, 1);
  } else {
    this.selectedTags.push(tag);
  }
}

ngAfterViewInit() {
  this.loadRecaptchaV3();
}


async executeRecaptchaV3(): Promise<string> {
  try {
    if (!this.isRecaptchaLoaded) {
      await this.loadRecaptchaV3();
    }

    return new Promise((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(environment.recaptchaSiteKey, {
          action: 'submit_review' // Acción específica para tracking
        }).then(resolve);
      });
    });
  } catch (error) {
    console.error('Error en reCAPTCHA:', error);
    throw error;
  }
}


public initializeRecaptcha() {
  if (typeof grecaptcha === 'undefined') {
    console.error('reCAPTCHA not available');
    this.isRecaptchaLoaded = false;
    return;
  }

  grecaptcha.ready(() => {
    console.log('reCAPTCHA ready');
    this.isRecaptchaLoaded = true;
    
    // Para reCAPTCHA v3 no necesitamos renderizar un widget visible
    // Solo verificamos que la librería está cargada
  });
}

async submitReview() {
  // Validar formulario primero
  if (this.reviewForm.invalid) {
    this.reviewForm.markAllAsTouched();
    return;
  }

  try {
    const token = await this.executeRecaptchaV3();
    
    if (!await this.ratingService.verifyToken(token)) {
      throw new Error('Verificación de seguridad fallida');
    }

    // Preparar datos del review
    const reviewData = {
      ...this.reviewForm.value,
      recaptchaToken: token,
      idUser: this.authService.getCurrentUser()?.id,
      idSpecialist: this.global.previewProfesionals.id,
      score: this.currentRating,
      tags: this.selectedTags.join(', ')
    };

    // Enviar review
    await this.ratingService.createRating(reviewData);
    
    // Mostrar éxito y resetear
    Swal.fire({
      icon: 'success',
      title: '¡Gracias!',
      text: 'Tu reseña ha sido enviada correctamente.'
    });
    this.resetFormReview();

  } catch (error) {
    console.error('Error submitting review:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al enviar tu reseña. Por favor intenta nuevamente.'
    });
  } finally {
    this.isSubmitting = false;
  }
}

resetFormReview() {
  this.reviewForm.reset();
  this.currentRating = 0;
  this.selectedTags = [];
  this.reviewForm.get('terms')?.setValue(false);
}

openTerms(event: Event) {
  event.preventDefault();
  // Lógica para mostrar términos y condiciones
}
get Array() {
  return Array;
}
// Prueba esta función en tu componente
async testRecaptcha() {
  try {
    const token = await this.executeRecaptchaV3();
    console.log('Token obtenido:', token);
    alert('reCAPTCHA funciona correctamente! Token: ' + token);
  } catch (error) {
    console.error('Error en prueba:', error);
    alert('Error: ' + (error as Error).message);
  }
}


private async loadRecaptchaWithRetry(): Promise<void> {
  try {
    await this.loadRecaptchaV3();
  } catch (error) {
    this.retryCount++;
    
    if (this.retryCount < this.maxRetries) {
      console.warn(`Intento ${this.retryCount} fallido. Reintentando en ${this.retryDelay/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.loadRecaptchaWithRetry();
    } else {
      console.error('Número máximo de reintentos alcanzado');
      throw error;
    }
  }
}


}
