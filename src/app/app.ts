import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'maz-root',
  standalone: true,
  imports: [RouterOutlet, /*ToastContainerComponent*/],
  template: `
    <router-outlet />
    <!-- <maz-toast-container /> -->
  `,
})
export class AppComponent {}