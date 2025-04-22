import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { Observable, from, tap, map, BehaviorSubject } from 'rxjs';
import { GlobalService } from './global.service';
import Swal from 'sweetalert2';
import { UserInterface } from '../interface/user.interface';
@Injectable({
  providedIn: 'root'
})
export class AuthPocketbaseService {
  private pb: PocketBase;
  isLoading: boolean = false;

  complete: boolean = false;
  private userTypeSubject = new BehaviorSubject<string | null>(this.getUserTypeFromStorage());
  userType$ = this.userTypeSubject.asObservable();
  
  constructor( 
    public global: GlobalService
   ) 
  { 
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
  }
    generateRandomPassword(length: number = 8): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }
 


    private isLocalStorageAvailable(): boolean {
      return typeof localStorage !== 'undefined';
    }
  
    // Obtener el tipo de usuario desde el almacenamiento local
    private getUserTypeFromStorage(): string | null {
      if (this.isLocalStorageAvailable()) {
        return localStorage.getItem('type');
      }
      return null;
    }
    setUserType(type: string): void {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem('type', type);
      }
      this.userTypeSubject.next(type);
    }
  
    clearUserType(): void {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem('type');
      }
      this.userTypeSubject.next(null);
    }
  isLogin() {
    return localStorage.getItem('isLoggedin');
  }

  isAdmin() {
    const userType = localStorage.getItem('type');
    return userType === 'admin';
  }

  isSpecialist() {
    const userType = localStorage.getItem('type');
    return userType === 'especialista';
  } 

  isCustomer() {
    const userType = localStorage.getItem('type');
    return userType === 'cliente  ';
  } 

  async updateProfessionalInfo(data: any) {    
    this.global.isLoading = true; // Activar el estado de carga
    const pb = new PocketBase('https://db.redpsicologos.cl:8090');
    try {
      const info = JSON.parse(localStorage.getItem('professionalInfo') || '');
// alert ("id"  +info.id);
      if (info) {
        const id = info.id;
        const record = await pb.collection('psychologistsProfessionals').update(id, info);
      } else {
        this.showErrorAlert('No se pudo obtener el ID del registro');
        return;
      }
      this.showSuccessAlert('Información actualizada correctamente');

      
    } catch (error) {
      console.error('Error al actualizar el registro:', error);
      this.showErrorAlert('Error al actualizar la información');
    } finally {
      this.global.isLoading = false; // Desactivar el estado de carga
    }

    
  }


  


  

  showSuccessAlert(message: string) {
    // Aquí usarás SweetAlert para mostrar el mensaje de éxito
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
    });
  }

  showErrorAlert(message: string) {
    // Aquí usarás SweetAlert para mostrar el mensaje de error
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
    });
  }
  registerUser(email: string, password: string, type: string, name: string, username: string,address: string): Observable<any> 
    {
    const userData = {
      email: email,
      password: password,
      passwordConfirm: password,
      type: type,
      username: username,
      name: name,
    };

    // Crear usuario y luego crear el registro en clinics
    return from(
      this.pb
        .collection('users')
        .create(userData)
        .then((user) => {
          const data = {
            username: name,
            name: name,
            address: address, // Usamos el parámetro address aquí
            phone: '', // Agrega los campos correspondientes aquí
            userId: user.id, // Utiliza el ID del usuario recién creado
            status: 'pending', // Opcional, establece el estado del cliente
            images: {}, // Agrega los campos correspondientes aquí
          };
          if (type === 'cliente') {
            return this.pb.collection('cliente').create(data);
          } else if (type === 'especialista') {
            return this.pb.collection('psychologistsProfessionals').create(data);
          } else {
            throw new Error('Tipo de usuario no válido');
          }
        })
    );
    }
  loginUser(email: string, password: string): Observable<any> {
    return from(this.pb.collection('users').authWithPassword(email, password))
      .pipe(
        map((authData) => {
          const pbUser = authData.record;
          const user: UserInterface = {
            id: pbUser.id,
            email: pbUser['email'],
            password: '', // No almacenamos la contraseña por seguridad
            full_name: pbUser['name'],
            days: pbUser['days'] || {},
            images: pbUser['images'] || {},
            type: pbUser['type'],
            username: pbUser['username'],
            address: pbUser['address'],
            created: pbUser['created'],
            updated: pbUser['updated'],
            avatar: pbUser['avatar'] || '',
            status: pbUser['status'] || 'active',
            biography: pbUser['biography'],
          };
          return { ...authData, user };
        }),
        tap((authData) => {
          this.setUser(authData.user);
          this.setToken(authData.token);
          localStorage.setItem('isLoggedin', 'true');
          this.global.islogged = true;
          localStorage.setItem('userId', authData.user.id);
        })
      );
  }

  logoutUser(): Observable<any> {
    // Limpiar la autenticación almacenada
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('dist');
    localStorage.removeItem('userId');
    localStorage.removeItem('type');
    localStorage.removeItem('clientCard');
    localStorage.removeItem('clientFicha');
    localStorage.removeItem('memberId');
    localStorage.removeItem('status');
    localStorage.removeItem('professionalInfo');
    this.global.loading = false;
    this.pb.authStore.clear();
    this.global.activeRoute = 'home';
    // this.virtualRouter.routerActive = "home";
    return new Observable<any>((observer) => {
      observer.next(''); // Indicar que la operación de cierre de sesión ha completado
      observer.complete();
    });
  }
  

  setUser(user: UserInterface): void {
    let user_string = JSON.stringify(user);
    let type = user.type;
    localStorage.setItem('currentUser', user_string);
    localStorage.setItem('type', type);
  }
  setToken(token: any): void {
    localStorage.setItem('accessToken', token);
  }
  getCurrentUser(): UserInterface | null {
    if (this.isLocalStorageAvailable()) {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null; // Devuelve el usuario actual o null si no existe
    }
    return null; // Retorna null si no está en un entorno cliente
  }
  getType(): string | null {
    if (this.isLocalStorageAvailable()) {
      const type = localStorage.getItem('type');
      return type ? type : null; // Devuelve el usuario actual o null si no existe
    }
    return null; // Retorna null si no está en un entorno cliente
  }
  
  getUserId(): string {
    if (this.isLocalStorageAvailable()) {
      const userId = localStorage.getItem('userId');
      return userId ? userId : ''; // Devuelve el usuario actual o null si no existe
    }
    return ''; // Retorna vacío si no está en un entorno cliente
  }
  getImage(){
    const userString = localStorage.getItem('professionalInfo');
    if (userString) {
      const user = JSON.parse(userString);
      this.global.loadProfessionalInfo();
      return user['images']?.[0] || 'assets/images/user.png'; // Usar el operador de encadenamiento opcional y proporcionar un valor por defecto
    }
    return 'assets/images/user.png'; // Retorna el valor por defecto si no está en un entorno cliente
  }
  getFullName(): string {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const user = JSON.parse(userString);
      return user.full_name || 'Usuario';
    }
    return 'Usuario';
  }
  profileStatus() {
    return this.complete;
  }

  completeVal(profesionale: any) {
    if (profesionale['address'] == "" || profesionale['address'] == null || profesionale['phone'] == "" || profesionale['phone'] == null) {
        this.global.setMenuOption('profile');
        this.global.profileComplete = false;
    } else {
        this.global.setMenuOption('dashboard');
        this.global.profileComplete = true;
    }
}

  permision() {
    const userId = this.getUserId(); // Get userId from localStorage
    const userType = this.getType();

    // If no userId, always redirect to home
    if (!userId) {
      this.global.activeRoute = 'home';
      return;
    }

    // Handle admin user
    if (userType === 'admin') {
      this.global.setMenuOption('dashboard');
      this.global.activeRoute = 'dashboard';
      return;
    }

    // Only fetch professional info for specialists
    if (userType === 'especialista') {
      this.pb.collection('psychologistsProfessionals').getFullList(200, {
        filter: `userId = "${userId}"`
      }).then(profesionales => {
        if (profesionales.length > 0) {
          const profesional = profesionales[0];
          localStorage.setItem('professionalInfo', JSON.stringify(profesional));
          this.completeVal(profesional);
          this.global.activeRoute = 'profile-specialist';

        } else {
          console.warn('No professional found with the provided userId');
          this.global.activeRoute = 'error';
        }
      }).catch((error) => {
        console.error('Error fetching professional information:', error);
        this.global.activeRoute = 'home';
      });
    } else if (userType === 'cliente') {
      // Redirect client to home
      this.global.activeRoute = 'home';
    } else {
      // Unknown user type
      console.warn('Unrecognized user type');
      this.global.activeRoute = 'error';
    }
  }

  getCollection(collection: string) {
    return this.pb.collection(collection);
  }
  
  
}
