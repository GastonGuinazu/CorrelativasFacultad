import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, Lightbulb, Save } from 'lucide-angular';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-modal-how-it-works',
  standalone: true,
  imports: [LucideAngularModule, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell
      [open]="open()"
      title="¿Cómo funciona?"
      (cerrar)="cerrar.emit()"
    >
      <ol class="flex flex-col gap-4 text-sm text-slate-800">
        @for (step of steps; track step.n) {
          <li class="flex gap-3">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm font-semibold text-emerald-800"
            >
              {{ step.n }}
            </span>
            <div>
              <p class="font-semibold text-slate-900">{{ step.title }}</p>
              <p class="mt-0.5 text-slate-700" [innerHTML]="step.body"></p>
            </div>
          </li>
        }
      </ol>

      <div
        class="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-xs text-slate-600"
      >
        <lucide-icon [name]="iconSave" class="h-3.5 w-3.5"></lucide-icon>
        Tu progreso se guarda automáticamente en tu navegador
      </div>
    </app-modal-shell>
  `,
})
export class ModalHowItWorksComponent {
  readonly open = input<boolean>(false);
  readonly cerrar = output<void>();

  readonly iconSave = Save;
  readonly iconBulb = Lightbulb;

  readonly steps = [
    {
      n: 1,
      title: 'Marca tu estado',
      body:
        'Hacé clic en una materia y seleccioná si la estás <strong class="text-blue-700">Cursando</strong>, la tenés <strong class="text-amber-700">Regular</strong> o <strong class="text-emerald-700">Aprobada</strong>.',
    },
    {
      n: 2,
      title: 'Descubrí qué podés cursar',
      body:
        'El sistema valida automáticamente las correlativas. Las materias bloqueadas aún no cumplen los requisitos.',
    },
    {
      n: 3,
      title: 'Completá tus créditos',
      body:
        'Necesitás créditos de materias electivas para recibirte (mínimo según el plan). El indicador <strong class="text-slate-900">Progreso al título</strong> combina obligatorias aprobadas + esos créditos electivos; no cuenta todas las electivas del catálogo como obligatorias. En estadísticas podés filtrar con <strong class="text-slate-900">Solo obligatorias</strong> o <strong class="text-slate-900">Solo electivas</strong>.',
    },
    {
      n: 4,
      title: 'Consultá los detalles',
      body:
        'Hacé clic en cualquier materia para ver sus correlativas (qué necesitás tener regular o aprobada para cursarla).',
    },
  ];
}
