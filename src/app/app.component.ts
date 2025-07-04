import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
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
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
import { PlanningComponent } from './components/dahsboard/planning/planning.component';
import { ChangePasswordComponent } from './components/dahsboard/change-password/change-password.component';
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
    ReviewsComponent,
    PrivacyComponent,
    TermsComponent,
    PlanningComponent,
    ChangePasswordComponent
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
  menuItems = [
    { label: 'Inicio', route: 'home', visible: () => !this.auth.isLogin(), scrollToTop: () => this.globalService.scrollToTop() },
    { label: 'Profesionales', route: 'professionals', visible: () => !this.auth.isLogin(), scrollToTop: () => this.globalService.scrollToTop() },
    { label: 'Contacto', route: 'contact', visible: () => !this.auth.isLogin(), scrollToTop: () => this.globalService.scrollToTop() },
/*     {label: 'Foro', rute: 'win' visible:()=> !this.auth.isLogin(), scrollToTop: () => this.globalservice.scrollToTop()}
 */  ]; 

  constructor(
    public globalService: GlobalService,
    private scriptLoader: ScriptLoaderService,
    public auth: AuthPocketbaseService,
    public realtimeProfesionales: RealtimeProfessionalsService,
    private router: Router,
    private route: ActivatedRoute, 
  
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
      document.body.classList.add('no-padding-top');
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
      this.route.queryParams.subscribe(params => {
        if (params['logout'] === 'true') {
          this.logout();
        }
      });
    }
   
    ngAfterViewInit() {
      this.adjustBodyPadding();
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  adjustBodyPadding() {
      const header = document.querySelector('.fixed-header');
      if (header) {
          const height = header.clientHeight;
          document.body.style.paddingTop = `${height}px`;
      }
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
        this.checkLoginStatus();
        this.router.navigate(['home']);
      });
      localStorage.clear();
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

   // Modifica tus métodos así:

closeMobileMenu() {
  // Verifica que estamos en el cliente (no en SSR)
  if (typeof window !== 'undefined') {
      const mobileMenu = document?.querySelector('.mobile-menu');
      const toggler = document?.querySelector('.mobile-nav-toggler');
      
      mobileMenu?.classList.remove('active');
      toggler?.classList.remove('active');
      
      // Asegúrate de que el scroll esté en la parte superior
      this.globalService.scrollToTop();
  }
}

toggleMobileMenu() {
  // Alternar el menú móvil
  if (typeof window !== 'undefined') {
      const mobileMenu = document?.querySelector('.mobile-menu');
      const toggler = document?.querySelector('.mobile-nav-toggler');
      
      mobileMenu?.classList.toggle('active');
      toggler?.classList.toggle('active');
  }
}

openTerms(event: Event) {
  event.preventDefault();
  // Lógica para mostrar términos y condiciones
}
}
