import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { QrcodeComponent } from './qrcode/qrcode.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { AuthGuard } from './auth.guard';
import { UserOverviewComponent } from './useroverview/useroverview.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { RapportsComponent } from './rapports/rapports.component';
import { SuperadminDashboardComponent } from './superadmin-dashboard/superadmin-dashboard.component';
import { PredictionComponent } from './prediction/prediction.component';
import { DecisionComponent } from './decision/decision.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'qrcode', component: QrcodeComponent },
  { path: 'supervisor-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'technician-dashboard', component: UserDashboardComponent },
  { path: 'useroverview', component: UserOverviewComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'rapports', component: RapportsComponent },
  { path: 'admin-dashboard', component: SuperadminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'predictions', component: PredictionComponent },
  { path: 'decisions', component: DecisionComponent },

];
