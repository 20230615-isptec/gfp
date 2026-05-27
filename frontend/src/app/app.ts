import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import { NotificationCenterComponent } from './shared/components/notification-center.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, NotificationCenterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

