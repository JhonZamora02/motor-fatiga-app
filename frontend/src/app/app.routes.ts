import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileFormComponent } from './components/profile-form/profile-form.component';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { HistorialComponent } from './components/historial/historial.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',          component: DashboardComponent, canActivate: [authGuard] },
  { path: 'login',     component: LoginComponent },
  { path: 'perfil',    component: ProfileFormComponent, canActivate: [authGuard] },
  { path: 'usuario',   component: UsuarioComponent,   canActivate: [authGuard] },
  { path: 'historial', component: HistorialComponent,  canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
