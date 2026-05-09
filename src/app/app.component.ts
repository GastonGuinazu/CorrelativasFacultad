import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CelebracionConfettiService } from './core/services/celebracion-confetti.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class AppComponent {
  /** Activa el listener de confetti al arrancar la app. */
  private readonly _celebracionFx = inject(CelebracionConfettiService);
}
