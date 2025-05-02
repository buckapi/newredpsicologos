import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { GlobalService } from './service/global.service';
import { ScriptLoaderService } from './service/loader.service';
import { HomeComponent } from './components/home/home.component';
import { CommonModule } from '@angular/common';
import { ContactComponent } from './components/contact/contact.component';
import { ProfessionalsComponent } from './components/professionals/professionals.component';
import { ProfessionalDetailComponent } from './components/professional-detail/professional-detail.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { AuthPocketbaseService } from './service/auth-pocketbase.service';
import Swal from 'sweetalert2';
import { RealtimeProfessionalsService } from './service/realtime-professionals';
import { ProfileComponent } from './components/dahsboard/profile/profile.component';
import { HomeadminComponent } from './components/dahsboard/homeadmin/homeadmin.component';
import { HomeprofessionalComponent } from './components/dahsboard/homeprofessional/homeprofessional.component';
import { SettingsComponent } from './components/dahsboard/settings/settings.component';
import { ReviewsComponent } from './components/dahsboard/reviews/reviews.component';
import { HostListener } from '@angular/core';

import { filter } from 'rxjs';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    HomeComponent,
    ContactComponent,
    ProfessionalsComponent,
    ProfessionalDetailComponent,
    RegisterComponent,
    LoginComponent,
    ProfileComponent,
    HomeadminComponent,
    HomeprofessionalComponent,
    SettingsComponent,
    ReviewsComponent
  ],  
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'psicologospwa';
  showUserMenu = false;
  isLogin: boolean = false;
  userFullName: string = '';
  isSticky = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isSticky = window.pageYOffset > 100; // Ajusta el valor según tu diseño
  }
  menuItems = [
    { label: 'Inicio', route: 'home', visible: () => !this.auth.isLogin(), scrollToTop: () => this.globalService.scrollToTop() },
    { label: 'Profesionales', route: 'professionals', visible: () => !this.auth.isLogin(), scrollToTop: () => this.globalService.scrollToTop() },
    { label: 'Contacto', route: 'contact', visible: () => !this.auth.isLogin(), scrollToTop: () => this.globalService.scrollToTop() }
  ];

  constructor(
    public globalService: GlobalService,
    private scriptLoader: ScriptLoaderService,
    public auth: AuthPocketbaseService,
    public realtimeProfesionales: RealtimeProfessionalsService,
    private router: Router
  
  )
    {
  
      this.auth.permision();
    
    }
    isMobile(): boolean {
      return window.innerWidth <= 768; // Puedes ajustar el tamaño según tus necesidades
    }
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    }
    logoutUser() {
      Swal.fire({
        title: '¿Quieres cerrar sesión?',
        text: "",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Mantenerme aqui'
        
      }).then((result) => {
        if (result.isConfirmed) {
          this.auth.logoutUser(); // Call the original logout method
          Swal.fire(
            '¡Cerrado!',
            'Has cerrado sesión con éxito.',
            'success'
          );
        }
      });
    }
    getProfessionlINfo() {
      this.realtimeProfesionales.getProfesionalById(this.auth.getUserId()).subscribe(profesional => {    
        this.globalService.setPreviewProfesional(profesional);
        if (profesional) {
          localStorage.setItem('professionalInfo', JSON.stringify(profesional));
        }
      });
    }
    ngOnInit(): void {
      this.loadScripts();
      this.checkLoginStatus();
      this.getProfessionlINfo();
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
    ngAfterViewInit() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth' // Opcional: para un scroll suave
      });
    }
    loadScripts() {
      const scripts = [  
        'assets/js/jquery.js',
        'assets/js/popper.min.js',
        'assets/js/bootstrap.min.js',
        'assets/js/owl.js',
        'assets/js/wow.js',
        'assets/js/validation.js',
        'assets/js/jquery.fancybox.js',
        'assets/js/appear.js',
        'assets/js/scrollbar.js',
        'assets/js/tilt.jquery.js',
        'assets/js/jquery.paroller.min.js',
        'assets/js/jquery.nice-select.min.js',
        'assets/js/script.js'
      ];
  
      this.scriptLoader.loadScriptsInOrder(scripts)
        .then(() => {
          console.log('Todos los scripts cargados');
        })
        .catch(error => console.error(error));
    }
    islogin(){
    return localStorage.getItem('isLoggedin');
    }
    onAction(action: string) {
      switch(action) {
        case 'login':
          this.globalService.activeRoute = 'login';
          break;
        case 'register':
          this.globalService.activeRoute = 'register';
          break;
        case 'profile-specialist':
          this.globalService.activeRoute = 'profile-specialist';
          break;
        case 'logout':
          this.auth.logoutUser();
          break;
        default:
          break;
      }
    }
    // Función para verificar el estado de login
    checkLoginStatus(): void {
      // Verifica si el usuario está logueado usando el método isLogin() del servicio
      this.isLogin = !!this.auth.isLogin();
      if (this.isLogin) {
        // Si el usuario está logueado, obtenemos el nombre completo
        this.userFullName = this.auth.getCurrentUser()?.full_name || '';
      }
    }
    
    // Función para cerrar sesión
    logout(): void {
      this.auth.logoutUser().subscribe(() => {
        this.checkLoginStatus();  // Actualizamos el estado después de cerrar sesión
      });
    }
    
    // Función para redirigir a las rutas de login y register
    navigateTo(route: string): void {
      this.globalService.activeRoute = route; // Redirige a la vista correspondiente
    }
    
    onSelect(event: any) {
      const selectedValue = event.target.value;
    
      switch(selectedValue) {
        case 'login':
          this.globalService.activeRoute = 'login';
          break;
        case 'register':
          this.globalService.activeRoute = 'register';
          break;
        case 'profile-specialist':
          this.globalService.activeRoute = 'profile-specialist';
          break;
        case 'logout':
          this.auth.logoutUser();
          break;
        default:
          break;
      }
    }

    closeMobileMenu() {
      
    } 
    
}
