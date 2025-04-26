import { Component } from '@angular/core';
import { GlobalService } from '../../../service/global.service';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css'
})
export class ReviewsComponent {
  constructor(
    public global: GlobalService,
    public authService: AuthPocketbaseService,
    
  ) { }

  ngOnInit(): void {
  }
  hasSelectedItems(obj: any): boolean {
    if (!obj) return false;
    return Object.values(obj).some(val => val === true);
  }
  
  getSelectedItems(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj).filter(key => obj[key]);
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
}
