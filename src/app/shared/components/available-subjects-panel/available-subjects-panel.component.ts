import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  LucideAngularModule,
  Bell,
  ChevronDown,
  ChevronUp,
  Bookmark,
  ChevronRight,
  BookOpen,
} from 'lucide-angular';
import { ProgressStore } from '../../../core/state/progress.store';
import {
  EvaluacionMateria,
  etiquetaTipoCatalogo,
} from '../../../core/models/materia.model';

@Component({
  selector: 'app-available-subjects-panel',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg ring-1 ring-emerald-500/40"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/5"
        [attr.aria-expanded]="expanded()"
        (click)="toggle()"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur"
          >
            <lucide-icon [name]="iconBell" class="h-5 w-5"></lucide-icon>
          </span>
          <div class="flex flex-col">
            <span class="text-base font-semibold">
              {{ store.cantidadDisponibles() }} materias disponibles para cursar
            </span>
            <span class="text-xs text-white/80">
              {{ expanded() ? 'Clic para ocultar' : 'Clic para ver el listado completo' }}
            </span>
          </div>
        </div>
        <span
          class="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
        >
          <lucide-icon
            [name]="expanded() ? iconUp : iconDown"
            class="h-5 w-5"
          ></lucide-icon>
        </span>
      </button>

      @if (expanded() && store.cantidadDisponibles() > 0) {
        <div class="flex flex-col gap-4 px-5 pb-5">
          @for (grupo of grupos(); track grupo.nivel) {
            <div>
              <div
                class="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide"
              >
                <span class="flex items-center gap-1.5 text-white/95">
                  <lucide-icon [name]="iconBookmark" class="h-3.5 w-3.5"></lucide-icon>
                  Nivel {{ grupo.nivel }}
                </span>
                <button
                  type="button"
                  class="flex items-center gap-1 text-white/90 hover:text-white"
                  (click)="irANivel(grupo.nivel)"
                >
                  Ir al nivel
                  <lucide-icon [name]="iconChevronRight" class="h-3.5 w-3.5"></lucide-icon>
                </button>
              </div>

              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                @for (ev of grupo.materias; track ev.materia.id) {
                  <button
                    type="button"
                    class="group flex items-center justify-between gap-2 rounded-xl bg-white/15 px-3 py-2 text-left transition hover:bg-white/25"
                    (click)="seleccionar(ev)"
                  >
                    <span class="flex items-center gap-2">
                      <span
                        class="flex h-7 w-7 items-center justify-center rounded-md bg-white/20"
                      >
                        <lucide-icon [name]="iconBook" class="h-3.5 w-3.5"></lucide-icon>
                      </span>
                      <span class="flex flex-col">
                        <span class="text-sm font-medium leading-tight">{{
                          ev.materia.nombre
                        }}</span>
                        <span class="text-[11px] text-white/85">
                          {{ etiquetaTipoCatalogo(ev.materia) }}
                        </span>
                      </span>
                    </span>
                    <lucide-icon
                      [name]="iconChevronRight"
                      class="h-4 w-4 opacity-70 group-hover:opacity-100"
                    ></lucide-icon>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class AvailableSubjectsPanelComponent {
  readonly store = inject(ProgressStore);
  readonly expanded = signal(false);
  readonly etiquetaTipoCatalogo = etiquetaTipoCatalogo;

  readonly iconBell = Bell;
  readonly iconUp = ChevronUp;
  readonly iconDown = ChevronDown;
  readonly iconBookmark = Bookmark;
  readonly iconChevronRight = ChevronRight;
  readonly iconBook = BookOpen;

  readonly grupos = computed<{
    nivel: number;
    materias: EvaluacionMateria[];
  }[]>(() => {
    const map = this.store.disponiblesPorNivel();
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([nivel, materias]) => ({ nivel, materias }));
  });

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  irANivel(nivel: number): void {
    this.store.setNivelActivo(nivel);
  }

  seleccionar(ev: EvaluacionMateria): void {
    this.store.setNivelActivo(ev.materia.nivel);
    this.store.seleccionarMateria(ev.materia.id);
  }
}
