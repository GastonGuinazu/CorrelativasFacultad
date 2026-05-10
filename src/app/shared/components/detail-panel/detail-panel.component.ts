import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  LucideAngularModule,
  CircleCheck,
  Circle,
  AlertTriangle,
  Link2,
  MessageSquareMore,
  BookOpen,
} from 'lucide-angular';
import { EvaluacionMateria } from '../../../core/models/materia.model';

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (evaluacion(); as ev) {
      <aside
        class="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-sm"
      >
        <header class="flex items-start justify-between gap-2">
          <h3 class="text-lg font-semibold leading-snug text-slate-100">
            {{ ev.materia.nombre }}
          </h3>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300"
          >
            <lucide-icon [name]="iconBook" class="h-4 w-4"></lucide-icon>
          </span>
        </header>

        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-200"
            >Nivel {{ ev.materia.nivel }}</span
          >
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            [class]="badgeClass()"
          >
            {{ badgeLabel() }}
          </span>
          @if (ev.materia.esElectiva) {
            <span
              class="rounded-full bg-violet-950/70 px-2.5 py-0.5 text-xs font-medium text-violet-200 ring-1 ring-violet-500/35"
            >
              Electiva · {{ ev.materia.creditos }} crédito(s)
            </span>
          }
          @if (!ev.materia.esElectiva && !ev.materia.cuentaProgresoTitulo) {
            <span
              class="rounded-full bg-sky-950/60 px-2.5 py-0.5 text-xs font-medium text-sky-200 ring-1 ring-sky-500/35"
            >
              Título intermedio (no suma al % Ingeniería)
            </span>
          }
        </div>

        <button
          type="button"
          class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          (click)="verOpiniones.emit()"
        >
          <lucide-icon [name]="iconChat" class="h-4 w-4"></lucide-icon>
          Ver Opiniones y Consejos
        </button>

        @if (ev.materia.reg.length === 0 && ev.materia.aprob.length === 0) {
          <div
            class="flex items-center gap-2 rounded-xl bg-emerald-950/45 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-500/35"
          >
            <lucide-icon [name]="iconCheck" class="h-4 w-4"></lucide-icon>
            Esta materia no tiene prerrequisitos
          </div>
        } @else {
          <section class="flex flex-col gap-3 text-sm">
            <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <lucide-icon [name]="iconLink" class="h-4 w-4"></lucide-icon>
              Prerrequisitos
            </h4>

            @if (ev.materia.reg.length > 0) {
              <div>
                <p class="mb-1.5 text-xs font-medium text-slate-400">
                  Requiere Regular:
                </p>
                <ul class="flex flex-col gap-1.5">
                  @for (req of regulares(); track req.id) {
                    <li
                      class="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                      [class]="
                        req.cumplido
                          ? 'bg-emerald-950/55 text-emerald-200 ring-1 ring-emerald-500/35'
                          : 'bg-rose-950/50 text-rose-200 ring-1 ring-rose-500/35'
                      "
                    >
                      <lucide-icon
                        [name]="req.cumplido ? iconCheck : iconCircle"
                        class="h-3.5 w-3.5"
                      ></lucide-icon>
                      <span class="text-xs font-medium">{{ req.nombre }}</span>
                    </li>
                  }
                </ul>
              </div>
            }

            @if (ev.materia.aprob.length > 0) {
              <div>
                <p class="mb-1.5 text-xs font-medium text-slate-400">
                  Requiere Aprobada:
                </p>
                <ul class="flex flex-col gap-1.5">
                  @for (req of aprobadas(); track req.id) {
                    <li
                      class="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                      [class]="
                        req.cumplido
                          ? 'bg-emerald-950/55 text-emerald-200 ring-1 ring-emerald-500/35'
                          : 'bg-rose-950/50 text-rose-200 ring-1 ring-rose-500/35'
                      "
                    >
                      <lucide-icon
                        [name]="req.cumplido ? iconCheck : iconCircle"
                        class="h-3.5 w-3.5"
                      ></lucide-icon>
                      <span class="text-xs font-medium">{{ req.nombre }}</span>
                    </li>
                  }
                </ul>
              </div>
            }

            @if (totalFaltantes() > 0) {
              <div
                class="flex flex-col gap-1 rounded-xl bg-amber-950/45 px-3 py-2 text-xs text-amber-100 ring-1 ring-amber-500/35"
              >
                <span class="flex items-center gap-1.5 font-semibold">
                  <lucide-icon [name]="iconAlert" class="h-3.5 w-3.5"></lucide-icon>
                  Materias faltantes:
                </span>
                @if (ev.faltantesRegular.length > 0) {
                  <span>· {{ ev.faltantesRegular.length }} para regularizar</span>
                }
                @if (ev.faltantesAprobada.length > 0) {
                  <span>· {{ ev.faltantesAprobada.length }} para aprobar</span>
                }
              </div>
            }
          </section>
        }
      </aside>
    } @else {
      <aside
        class="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-600 bg-slate-900/50 p-8 text-center text-sm text-slate-400"
      >
        <lucide-icon [name]="iconBook" class="h-6 w-6 text-slate-500"></lucide-icon>
        <p>Seleccioná una materia para ver sus detalles y prerrequisitos.</p>
      </aside>
    }
  `,
})
export class DetailPanelComponent {
  readonly evaluacion = input<EvaluacionMateria | null>(null);
  readonly nombrePorId = input.required<Map<number, string>>();

  readonly verOpiniones = output<void>();

  readonly iconCheck = CircleCheck;
  readonly iconCircle = Circle;
  readonly iconAlert = AlertTriangle;
  readonly iconLink = Link2;
  readonly iconChat = MessageSquareMore;
  readonly iconBook = BookOpen;

  readonly badgeLabel = computed(() => {
    const ev = this.evaluacion();
    if (!ev) return '';
    if (ev.estado === 'aprobada') return 'Aprobada';
    if (ev.estado === 'regular') return 'Regular';
    if (ev.estado === 'cursando') return 'Cursando';
    return ev.disponibilidad === 'disponible' ? 'Disponible' : 'Bloqueada';
  });

  readonly badgeClass = computed(() => {
    const ev = this.evaluacion();
    if (!ev) return '';
    if (ev.estado === 'aprobada') return 'bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-500/40';
    if (ev.estado === 'regular') return 'bg-amber-950/60 text-amber-200 ring-1 ring-amber-500/40';
    if (ev.estado === 'cursando') return 'bg-blue-950/60 text-blue-200 ring-1 ring-blue-500/40';
    return ev.disponibilidad === 'disponible'
      ? 'bg-teal-950/55 text-teal-200 ring-1 ring-teal-500/35'
      : 'bg-orange-950/55 text-orange-200 ring-1 ring-orange-500/35';
  });

  readonly regulares = computed(() => {
    const ev = this.evaluacion();
    if (!ev) return [];
    const faltantesIds = new Set(ev.faltantesRegular.map((f) => f.id));
    return ev.materia.reg.map((id) => ({
      id,
      nombre: this.nombrePorId().get(id) ?? `Materia #${id}`,
      cumplido: !faltantesIds.has(id),
    }));
  });

  readonly aprobadas = computed(() => {
    const ev = this.evaluacion();
    if (!ev) return [];
    const faltantesIds = new Set(ev.faltantesAprobada.map((f) => f.id));
    return ev.materia.aprob.map((id) => ({
      id,
      nombre: this.nombrePorId().get(id) ?? `Materia #${id}`,
      cumplido: !faltantesIds.has(id),
    }));
  });

  readonly totalFaltantes = computed(() => {
    const ev = this.evaluacion();
    if (!ev) return 0;
    return ev.faltantesRegular.length + ev.faltantesAprobada.length;
  });
}
