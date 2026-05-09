import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideAngularModule, BookOpen, Lock, CircleCheck, Star, PlayCircle, MessageSquare } from 'lucide-angular';
import {
  EstadoUsuario,
  EvaluacionMateria,
} from '../../../core/models/materia.model';

@Component({
  selector: 'app-subject-card',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group relative flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
      [class]="containerClass()"
      [class.subject-card--celebracion]="brilloCelebracion()"
      [attr.data-celebracion-anchor]="anchorCelebracion()"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      tabindex="0"
      role="button"
      [attr.aria-pressed]="seleccionada()"
    >
      <header class="flex items-start justify-between mb-3">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-lg"
          [class]="iconWrapperClass()"
        >
          <lucide-icon [name]="cardIcon()" class="h-5 w-5"></lucide-icon>
        </span>
        @if (estadoBadgeIcon(); as badge) {
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full"
            [class]="badge.wrapper"
            [attr.aria-label]="badge.label"
            [title]="badge.label"
          >
            <lucide-icon [name]="badge.icon" class="h-3.5 w-3.5"></lucide-icon>
          </span>
        }
      </header>

      <h3
        class="text-sm font-semibold leading-snug text-slate-900 line-clamp-2 mb-3"
      >
        {{ evaluacion().materia.nombre }}
      </h3>

      <div class="mt-auto flex flex-wrap gap-1.5">
        <button
          type="button"
          class="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
          [class]="chipClass('cursando')"
          (click)="onSetEstado('cursando', $event)"
        >
          Cursando
        </button>
        <button
          type="button"
          class="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
          [class]="chipClass('regular')"
          (click)="onSetEstado('regular', $event)"
        >
          Regular
        </button>
        <button
          type="button"
          class="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
          [class]="chipClass('aprobada')"
          (click)="onSetEstado('aprobada', $event)"
        >
          Aprobada
        </button>
      </div>
    </article>
  `,
})
export class SubjectCardComponent {
  readonly evaluacion = input.required<EvaluacionMateria>();
  readonly seleccionada = input<boolean>(false);

  readonly seleccionar = output<void>();
  readonly cambiarEstado = output<EstadoUsuario>();

  readonly bookIcon = BookOpen;
  readonly lockIcon = Lock;

  /** IDs 99 / 36 — ancla para confetti localizado. */
  readonly anchorCelebracion = computed(() => {
    const id = this.evaluacion().materia.id;
    return id === 99 || id === 36 ? `materia-${id}` : null;
  });

  readonly brilloCelebracion = signal(false);

  readonly estado = computed(() => this.evaluacion().estado);
  readonly disponible = computed(
    () => this.evaluacion().disponibilidad === 'disponible',
  );

  constructor() {
    let estadoPrevio: EstadoUsuario | undefined;
    effect(() => {
      const e = this.estado();
      const id = this.evaluacion().materia.id;
      if (
        estadoPrevio !== undefined &&
        (id === 99 || id === 36) &&
        estadoPrevio !== 'aprobada' &&
        e === 'aprobada'
      ) {
        this.brilloCelebracion.set(true);
        window.setTimeout(() => this.brilloCelebracion.set(false), 1100);
      }
      estadoPrevio = e;
    });
  }

  readonly cardIcon = computed(() =>
    this.disponible() || this.estado() !== 'pendiente'
      ? this.bookIcon
      : this.lockIcon,
  );

  readonly containerClass = computed(() => {
    if (this.seleccionada()) {
      return 'border-emerald-500 ring-2 ring-emerald-300 bg-emerald-100/50';
    }
    switch (this.estado()) {
      case 'aprobada':
        return 'border-emerald-400 bg-emerald-100/50';
      case 'regular':
        return 'border-amber-400 bg-amber-100/50';
      case 'cursando':
        return 'border-blue-400 bg-blue-100/50';
      default:
        return this.disponible()
          ? 'border-slate-300'
          : 'border-slate-300 bg-slate-100/70 opacity-90';
    }
  });

  readonly iconWrapperClass = computed(() => {
    switch (this.estado()) {
      case 'aprobada':
        return 'bg-emerald-200 text-emerald-700';
      case 'regular':
        return 'bg-amber-200 text-amber-700';
      case 'cursando':
        return 'bg-blue-200 text-blue-700';
      default:
        return this.disponible()
          ? 'bg-slate-200 text-slate-600'
          : 'bg-slate-200 text-slate-500';
    }
  });

  readonly estadoBadgeIcon = computed<{
    icon: typeof CircleCheck;
    wrapper: string;
    label: string;
  } | null>(() => {
    const estado = this.estado();
    if (estado === 'aprobada') {
      return {
        icon: CircleCheck,
        wrapper: 'bg-emerald-600 text-white',
        label: 'Aprobada',
      };
    }
    if (estado === 'regular') {
      return {
        icon: Star,
        wrapper: 'bg-amber-600 text-white',
        label: 'Regular',
      };
    }
    if (estado === 'cursando') {
      return {
        icon: PlayCircle,
        wrapper: 'bg-blue-600 text-white',
        label: 'Cursando',
      };
    }
    if (!this.disponible()) {
      return {
        icon: Lock,
        wrapper: 'bg-orange-200 text-orange-600',
        label: 'Bloqueada',
      };
    }
    return null;
  });

  chipClass(target: EstadoUsuario): string {
    const isActive = this.estado() === target;
    if (isActive) {
      switch (target) {
        case 'cursando':
          return 'bg-blue-600 text-white shadow-sm';
        case 'regular':
          return 'bg-amber-600 text-white shadow-sm';
        case 'aprobada':
          return 'bg-emerald-600 text-white shadow-sm';
        default:
          return 'bg-slate-600 text-white shadow-sm';
      }
    }
    return 'bg-slate-200 text-slate-700 hover:bg-slate-300';
  }

  onCardClick(): void {
    this.seleccionar.emit();
  }

  onSetEstado(estado: EstadoUsuario, event: MouseEvent): void {
    event.stopPropagation();
    this.cambiarEstado.emit(estado);
  }
}
