import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { GlobalService } from '../../service/global.service';
import { AuthPocketbaseService } from '../../service/auth-pocketbase.service';
import { TermsComponent } from '../terms/terms.component';
import { PrivacyComponent } from '../privacy/privacy.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,ReactiveFormsModule, TermsComponent, PrivacyComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loading: boolean = false;
  modalTitle: string = '';
  modalContent: string = '';
  loginForm: FormGroup;
  passwordVisible: boolean = false; // Variable para mostrar/ocultar la contraseña
  errorMessage: string | null = null;
  showModal: boolean = false;
  constructor(
  public global: GlobalService,
  public fb: FormBuilder,
  public auth: AuthPocketbaseService
  )
{// Inicializa el formulario de inicio de sesión con validación básica
  this.loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    terms: [false, Validators.required]
  });
}
togglePasswordVisibility() {
  this.passwordVisible = !this.passwordVisible;
}
  onLogin() {
    this.global.loading = true;
    
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.auth.loginUser(email, password).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso', response);
          localStorage.setItem('isLoggedin', 'true');
          this.auth.setUser(response.user);
          this.global.activeRoute = 'homeprofessional';
          this.auth.permision();
          this.global.loadProfessionalInfo();
        },
        error: (error) => {
          this.global.loading = false;
          console.error('Error en el inicio de sesión:', error);
          this.errorMessage = 'Credenciales incorrectas, intenta de nuevo.';
        }
      });
    } else {
      if (this.terms?.invalid) {
        this.errorMessage = 'Debes aceptar los términos y condiciones para continuar.';
      } else {
        this.errorMessage = 'Por favor, completa los campos correctamente.';
      }
    }
    this.global.loading = false;
  }

  // Métodos de acceso a los controles para mostrar los mensajes de error
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
  get terms() {
    return this.loginForm.get('terms');
  }
  openTermsModal(type: 'terms' | 'privacy') {
    this.modalTitle = type === 'terms' ? 'Términos y Condiciones' : 'Política de Privacidad';
    this.modalContent = type;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}
