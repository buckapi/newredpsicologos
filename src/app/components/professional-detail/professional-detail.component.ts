import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from '../../service/global.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PsychologistRatingService } from '../../service/psychologistRatingService.service';
import { AuthPocketbaseService } from '../../service/auth-pocketbase.service';
import { ElementRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';


declare var grecaptcha: any; 
@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
constructor(
  public global: GlobalService,
  public fb: FormBuilder,
  public ratingService: PsychologistRatingService,
  public authService: AuthPocketbaseService
){
  this.reviewForm = this.fb.group({
    title: [''],
    comment: [''],
    recaptcha: [''],
    terms: [false]
  });
}
ngOnInit() {
  this.profesional = this.global.previewProfesionals;
  this.resetForm();  
  this.loadRatings();
}
ngAfterViewInit() {
  // Verificar explícitamente si estamos en producción
  if (!environment.production) {
    console.error('¡ADVERTENCIA! Estás usando el entorno de desarrollo');
    // En producción, forzar el uso del site key de producción
    if (window.location.hostname === 'redpsicologos.cl') {
      console.log('Forzando uso de site key de producción');
      environment.recaptchaSiteKey = '6Leeui0rAAAAAMyUKhrnhgGwJDajrKJ8yk3FZK7T';
      environment.recaptchaSecretKey = '6Leeui0rAAAAAFPGCAomijcMLh0ewkApJvXxcB5d';
    }
  }

  console.log('Entorno actual:', environment);
  console.log('Production:', environment.production);
  console.log('Site key:', environment.recaptchaSiteKey);
  
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  this.loadRecaptchaScript();
  // Inicializar el widget de reCAPTCHA
  if (typeof grecaptcha !== 'undefined') {
    grecaptcha.ready(() => {
      grecaptcha.render('recaptcha-container', {
        sitekey: environment.recaptchaSiteKey,
        size: 'invisible'
      });
    });
  }
}

private cleanPhoneNumber(phone: string): string {
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

async loadRatings() {
  try {
    const specialistId = this.global.previewProfesionals?.id;
    if (specialistId) {
      this.ratings = await this.ratingService.getRatingsBySpecialist(specialistId);
      this.calculateRatingStats();
    }
  } catch (error) {
    console.error('Error loading ratings:', error);
  }
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

/* loadRecaptchaScript() {
  // Verificar si ya está cargado
  if (typeof grecaptcha !== 'undefined') {
    this.isRecaptchaLoaded = true;
    console.log('reCAPTCHA ya está cargado');
    return;
  }

  // Verificar si el script ya existe
  const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
  if (existingScript) {
    console.log('Script de reCAPTCHA ya existe');
    return;
  }

  // Cargar el script dinámicamente
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
  script.async = true;
  script.defer = true;
  script.id = 'recaptcha-script';

  script.onload = () => {
    console.log('reCAPTCHA cargado correctamente');
    this.isRecaptchaLoaded = true;
    // Inicializar reCAPTCHA
    grecaptcha.ready(() => {
      console.log('reCAPTCHA inicializado');
    });
  };

  script.onerror = (error) => {
    console.error('Error al cargar reCAPTCHA:', error);
    this.isRecaptchaLoaded = false;
    alert('Error al cargar el sistema de verificación. Por favor, intenta recargar la página.');
  };

  document.head.appendChild(script);
} */
  loadRecaptchaScript() {
    try {
      // Verificar si ya está cargado
      if (typeof grecaptcha !== 'undefined') {
        this.isRecaptchaLoaded = true;
        console.log('reCAPTCHA ya está cargado');
        return;
      }
  
      // Verificar si el script ya existe
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (existingScript) {
        console.log('Script de reCAPTCHA ya existe');
        return;
      }
  
      // Verificar si tenemos el site key
      if (!environment.recaptchaSiteKey) {
        console.error('Site key de reCAPTCHA no configurado');
        return;
      }
  
      // Cargar el script dinámicamente
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
      script.async = true;
      script.defer = true;
      script.id = 'recaptcha-script';
  
      script.onload = () => {
        console.log('Script de reCAPTCHA cargado');
        // Esperar un poco más para asegurarnos que grecaptcha está completamente listo
        setTimeout(() => {
          if (typeof grecaptcha !== 'undefined') {
            console.log('reCAPTCHA inicializado correctamente');
            this.isRecaptchaLoaded = true;
          } else {
            console.error('reCAPTCHA no se inicializó correctamente');
            this.isRecaptchaLoaded = false;
          }
        }, 1000);
      };
  
      script.onerror = (error) => {
        console.error('Error al cargar reCAPTCHA:', error);
        this.isRecaptchaLoaded = false;
        alert('Error al cargar el sistema de verificación. Por favor, intenta recargar la página.');
      };
  
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error al cargar reCAPTCHA:', error);
      this.isRecaptchaLoaded = false;
    }
  }

async executeRecaptcha(action: string): Promise<string> {
  try {
    if (!this.isRecaptchaLoaded) {
      throw new Error('reCAPTCHA no está listo');
    }

    if (!environment.recaptchaSiteKey) {
      throw new Error('Site key de reCAPTCHA no configurado');
    }

    return new Promise((resolve, reject) => {
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(() => {
          grecaptcha.execute(environment.recaptchaSiteKey, { action })
            .then(resolve)
            .catch((error: any) => {
              console.error('Error ejecutando reCAPTCHA:', error);
              reject(error);
            });
        });
      } else {
        // Si no está listo, esperar un poco más
        const checkInterval = setInterval(() => {
          if (typeof grecaptcha !== 'undefined') {
            clearInterval(checkInterval);
            grecaptcha.ready(() => {
              grecaptcha.execute(environment.recaptchaSiteKey, { action })
                .then(resolve)
                .catch((error: any) => {
                  console.error('Error ejecutando reCAPTCHA:', error);
                  reject(error);
                });
            });
          }
        }, 100);

        // Timeout más largo (5 segundos)
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Tiempo de espera agotado para reCAPTCHA'));
        }, 5000);
      }
    });
  } catch (error) {
    console.error('Error en reCAPTCHA:', error);
    // Fallback para desarrollo
    if (window.location.hostname === 'localhost') {
      return 'TEST_TOKEN_LOCALHOST';
    }
    throw error;
  }
}

async submitReview() {
  try {
    if (!this.isRecaptchaLoaded || this.isSubmitting) {
      if (!this.isRecaptchaLoaded) {
        alert('El sistema de verificación no está listo. Por favor espera un momento.');
        return;
      }
      if (this.isSubmitting) {
        alert('Ya se está procesando tu solicitud. Por favor espera.');
        return;
      }
    }

    this.isSubmitting = true;
    
    const token = await this.executeRecaptcha('submit_review');
    
    // Verificar el token con el backend
    const isValid = await this.ratingService.verifyToken(token);
    if (!isValid) {
      alert('Error en la verificación de seguridad. Por favor intenta nuevamente.');
      this.isSubmitting = false;
      return;
    }

    // Resto de tu lógica de envío...
    const reviewData = {
      ...this.reviewForm.value,
      recaptchaToken: token,
      idUser: this.authService.getCurrentUser()?.id,
      idSpecialist: this.global.previewProfesionals.id,
      score: this.currentRating,
      tags: this.selectedTags.join(', ')
    };

    await this.ratingService.createRating(reviewData);
    
    // Resetear el formulario y mostrar mensaje de éxito
    this.resetFormReview();
    Swal.fire('Éxito', '¡Gracias por tu opinión! Se ha enviado con éxito.', 'success');
    
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'Error al procesar tu solicitud. Por favor intenta nuevamente.', 'error');
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
}
