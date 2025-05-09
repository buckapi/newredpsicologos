import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { GlobalService } from '../../service/global.service';
import { AuthPocketbaseService } from '../../service/auth-pocketbase.service';
import { EmailService } from '../../service/email.service';
import axios from 'axios';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  option: string = '';
  name: string = '';
  email: string = '';
  password: string = '';
  cpassword: string = '';
  address: string = '';
  username: string = '';
  passwordVisible: boolean = false; // Variable para mostrar/ocultar la contraseña
  errorMessage: string | null = null;
  loading=false;

  constructor(
    public global:GlobalService,
    public auth:AuthPocketbaseService,
    public fb:FormBuilder,
    public emailService: EmailService
  )
  {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      cpassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
  }, 
  { validator: this.passwordMatchValidator }); 
  }
  private passwordMatchValidator(fg: FormGroup) {
    return fg.get('password')?.value === fg.get('cpassword')?.value 
        ? null 
        : { mismatch: true };
}
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  /* specialistRegister() {
    if (this.registerForm.valid) {
        const { email, name, password } = this.registerForm.value;
      
      Swal.fire({
        title: 'Registrando usuario',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      this.loading = true;
      const username = email.split('@')[0];
  
      // 1. Registrar al usuario
      this.auth.registerUser(email, password, 'especialista', name, this.address, username).subscribe({
        next: (response) => {
          this.loading = false;
  
          // 2. Enviar correo de bienvenida (opcional - si falla, igual se loguea)
          this.emailService.sendWelcomeEmail(email, name, 1, { name }).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                html: `Bienvenido a Red Psicólogos. Se iniciará sesión automáticamente...`,
                showConfirmButton: false,
                timer: 2000
              });
              this.loginAfterRegistration(email, password);
            },
            error: (emailError) => {
              console.error('Error sending email:', emailError);
              Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                html: `Bienvenido a Red Psicólogos. Se iniciará sesión automáticamente...<br><br>
                       <small>El correo de bienvenida no pudo enviarse, pero puedes acceder normalmente.</small>`,
                showConfirmButton: false,
                timer: 2000
              });
              this.loginAfterRegistration(email, password);
            }
          });
          
        },
        error: (error) => {
          this.loading = false;
          console.error('Error registering user:', error);
          
          let errorMessage = 'Error al registrar usuario. Por favor, intente nuevamente.';
          if (error.message.includes('already exists')) {
            errorMessage = 'Este correo electrónico ya está registrado.';
          }
  
          Swal.fire({
            icon: 'error',
            title: 'Error en el registro',
            text: errorMessage,
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      // Mostrar errores de validación del formulario
      Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos correctamente.',
        confirmButtonText: 'Aceptar'
      });
    }
  } */
  
  // Método auxiliar para marcar todos los campos como touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
  
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  loginAfterRegistration(email: string, password: string) {
    this.auth.loginUser(email, password).subscribe({
      next: (response) => {
        localStorage.setItem('isLoggedin', 'true');
        this.auth.setUser(response.user);
        this.global.activeRoute = 'homeprofessional';
        this.auth.permision();
        
        // Redirigir después de login exitoso
        // this.router.navigate(['/homeprofessional']);
      },
      error: (error) => {
        console.error('Login error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error en el login automático',
          text: 'Por favor inicie sesión manualmente.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  specialistRegister() {
    if (this.registerForm.valid) {
      const { email, name, password } = this.registerForm.value;
      
      Swal.fire({
        title: 'Registrando usuario',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
  
      this.loading = true;
      const username = email.split('@')[0];
  
      this.auth.registerUser(email, password, 'especialista', name, this.address, username).subscribe({
        next: (response) => {
          this.loading = false;
          
          // Envío de correo con templateId 1 y parámetros
          // In RegisterComponent:
          this.emailService.sendWelcomeEmail(
            email,
            name,
            1,
            { name, email }
          ).subscribe({
            next: () => console.log('Welcome email sent successfully'),
            error: (err) => console.error('Error sending welcome email:', err)
          });
          this.emailService.sendWelcomeEmail(email, name, 1, { name, email }).subscribe({
            next: () => {
              this.showSuccessAndLogin(email, password, true);
            },
            error: (emailError) => {
              console.error('Error enviando correo:', emailError);
              this.showSuccessAndLogin(email, password, false);
            }
          });
        },
        error: (error) => this.handleRegistrationError(error)
      });
      this.resetForm();
    } else {
      this.markFormGroupTouched(this.registerForm);
      Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos correctamente.',
        confirmButtonText: 'Aceptar'
      });
    }
  }
  
  private showSuccessAndLogin(email: string, password: string, emailSent: boolean) {
    const htmlMessage = emailSent 
      ? '¡Registro exitoso! Se iniciará sesión automáticamente...'
      : `¡Registro exitoso!`;
  
    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      html: htmlMessage,
      showConfirmButton: false,
      timer: 2000
    }).then(() => {
      this.loginAfterRegistration(email, password);
    });
  }
  
  private handleRegistrationError(error: any) {
    this.loading = false;
    let errorMessage = 'Error al registrar usuario. Por favor, intente nuevamente.';
    
    if (error.message.includes('already exists')) {
      errorMessage = 'Este correo electrónico ya está registrado.';
    }
  
    Swal.fire({
      icon: 'error',
      title: 'Error en el registro',
      text: errorMessage,
      confirmButtonText: 'Aceptar'
    });
  }

  resetForm() {
    this.registerForm.reset();
    this.markFormGroupTouched(this.registerForm);
  }

  ngOnDestroy() {
    this.resetForm();
  }
}
