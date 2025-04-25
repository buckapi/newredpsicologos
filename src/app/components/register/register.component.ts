import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { GlobalService } from '../../service/global.service';
import { AuthPocketbaseService } from '../../service/auth-pocketbase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
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
  public fb:FormBuilder 
)
{
 
  this.registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    cpassword: ['', Validators.required]
  });
  
}
togglePasswordVisibility() {
  this.passwordVisible = !this.passwordVisible;
}
specialistRegister() {
  if (this.name && this.email && this.password && this.name) {
    this.loading = true;
    const username = this.email.split('@')[0];
    this.auth.registerUser(this.email, this.password, 'especialista', this.name, this.address, username).subscribe(
      (response) => {
        this.loading = false;
        // console.log('Especialista registrado correctamente', response);
        // Automatically log in after registration
        this.loginAfterRegistration(this.email, this.password);
      },
      (error) => {
        this.loading = false;
        // console.error('Error sregistering user', error);
      }
    );
  } else {
    console.error('Please complete all required fields');
  }
}
loginAfterRegistration(email: string, password: string) {

  this.auth.loginUser(email, password).subscribe({
    next: (response) => {
      console.log('Inicio de sesión exitoso', response);
      localStorage.setItem('isLoggedin', 'true');
      this.auth.setUser(response.user);
      this.global.activeRoute = 'homeprofessional';
      this.auth.permision();
    },
    error: (error) => {
      console.error('Error en el inicio de sesión:', error);
      this.errorMessage = 'Credenciales incorrectas, intenta de nuevo.';
    }
  });
}

}
