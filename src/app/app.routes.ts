import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'auth/callback',
        loadComponent: () => import('./features/auth/callback/callback.component').then(m => m.CallbackComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'problems',
                loadComponent: () => import('./features/problems/problems.component').then(m => m.ProblemsComponent)
            },
            {
                path: 'hosts',
                loadComponent: () => import('./features/hosts/hosts.component').then(m => m.HostsComponent)
            },
            {
                path: 'devices',
                loadComponent: () => import('./features/devices/devices.component').then(m => m.DevicesComponent)
            },
            {
                path: 'taskhistory',
                loadComponent: () => import('./features/task-history/task-history.component').then(m => m.TaskHistoryComponent)
            },
            {
                path: 'logout',
                loadComponent: () => import('./features/auth/login/login.component').then(m => {
                    // Hacky reset or just redirect in component init if logic needed, 
                    // but standard logout usually handled by service.
                    // Better: auth service handles logout logic and redirects to login.
                    // So no route needed here usually, or a dummy component.
                    // Let's rely on the header button calling AuthService.logout() directly.
                    return m.LoginComponent;
                })
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
