import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, GraduationCap, GitBranch } from 'lucide-angular';
import { ProgressStore } from '../../core/state/progress.store';
import { aristasDelPlan } from '../../core/rules/grafo-plan';
import { MateriaCatalogo, MateriaId } from '../../core/models/materia.model';

/** Ancho mínimo razonable para títulos largos (el alto crece con el contenido). */
const COL_W = 236;
const ROW_H = 72;
const GAP_X = 28;
const GAP_Y = 12;
const PAD = 20;

/**
 * Bezier con tangentes horizontales suaves en los extremos (menos cruces “rectos”).
 */
function pathBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const tension = 0.42;
  const cx1 = x1 + dx * tension;
  const cy1 = y1 + dy * 0.08;
  const cx2 = x2 - dx * tension;
  const cy2 = y2 - dy * 0.08;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

/** Borde semántico por columna de nivel (1–5). */
function clasesBordeNivel(nivel: number): string {
  switch (nivel) {
    case 1:
      return 'border-sky-500/90';
    case 2:
      return 'border-violet-500/90';
    case 3:
      return 'border-teal-400/90';
    case 4:
      return 'border-amber-400/90';
    case 5:
      return 'border-rose-400/90';
    default:
      return 'border-slate-500/80';
  }
}

interface LayoutSlot {
  materia: MateriaCatalogo;
  x: number;
  y: number;
}

@Component({
  selector: 'app-correlatividades-map-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-950 pb-10">
      <header
        class="relative isolate overflow-hidden bg-slate-900"
      >
        <div
          class="absolute inset-0 z-[1] bg-gradient-to-br from-slate-950/55 via-slate-900/45 to-emerald-950/50"
          aria-hidden="true"
        ></div>
        <div
          class="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(20,184,166,0.14),transparent_50%)]"
          aria-hidden="true"
        ></div>

        <nav
          class="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur"
            >
              <lucide-icon [name]="iconCap" class="h-5 w-5"></lucide-icon>
            </span>
            <div class="flex flex-col leading-tight">
              <span class="text-sm font-semibold text-white">
                Ingeniería en Sistemas
              </span>
              <span class="text-xs text-white/70">UTN FRC</span>
            </div>
          </div>

          <div
            class="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10"
          >
            <a
              routerLink="/"
              class="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 hover:text-white"
            >
              Planificador
            </a>
            <a
              routerLink="/mapa"
              routerLinkActive="bg-emerald-600 text-white shadow-sm"
              class="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 transition hover:text-white"
            >
              Mapa de correlatividades
            </a>
          </div>
        </nav>

        <div
          class="relative z-10 mx-auto max-w-7xl px-6 pb-8 pt-2 text-center"
        >
          <span
            class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
          >
            <lucide-icon [name]="iconBranch" class="h-3.5 w-3.5"></lucide-icon>
            Vista de grafo
          </span>
          <h1
            class="text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl"
          >
            Mapa de correlatividades
          </h1>
          <p class="mt-2 max-w-2xl mx-auto text-sm text-white/85">
            Pasá el cursor o elegí una materia para ver el camino crítico:
            correlativas que necesitás y las que desbloqueás. Ctrl + rueda para
            zoom; arrastrá el fondo para mover el mapa.
          </p>
        </div>
      </header>

      <main class="relative z-10 mx-auto max-w-7xl px-6 -mt-4">
        <div
          class="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/30"
        >
          <div class="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2 w-6 rounded bg-slate-500/30 ring-1 ring-slate-500/40"></span>
              Líneas base
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2 w-6 rounded bg-red-500"></span>
              Necesarias para cursar
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2 w-6 rounded bg-emerald-500"></span>
              Permite cursar
            </span>
          </div>

          <!-- #viewport siempre en el DOM para viewChild + wheel; el grafo solo cuando hay datos -->
          <div
            #viewport
            class="relative z-0 h-[min(78vh,880px)] cursor-grab overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 touch-none select-none active:cursor-grabbing"
            style="overscroll-behavior: contain;"
            (pointerdown)="onPanStart($event)"
            (pointermove)="onPanMove($event)"
            (pointerup)="onPanEnd($event)"
            (pointercancel)="onPanEnd($event)"
            (pointerout)="onViewportPointerOut($event)"
          >
            @if (store.cargando()) {
              <div
                class="absolute inset-0 z-20 animate-pulse rounded-xl bg-slate-800/90"
                aria-busy="true"
              ></div>
            } @else if (store.errorCarga()) {
              <div
                class="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-rose-800/60 bg-slate-950/80 p-6"
              >
                <p class="text-center text-sm text-rose-300">
                  No se pudo cargar el plan de estudios.
                </p>
              </div>
            } @else {
              <div
                class="relative z-10 origin-top-left will-change-transform"
                [style.width.px]="canvas().w"
                [style.height.px]="canvas().h"
                [style.transform]="canvasTransform()"
              >
                <svg
                  class="pointer-events-none absolute left-0 top-0 z-[1] block"
                  [attr.width]="canvas().w"
                  [attr.height]="canvas().h"
                  [attr.viewBox]="viewBoxStr()"
                >
                  <defs>
                    <marker
                      id="arrow-ghost"
                      markerWidth="7"
                      markerHeight="7"
                      refX="6"
                      refY="3.5"
                      orient="auto"
                    >
                      <path
                        d="M0,0 L7,3.5 L0,7 z"
                        fill="#94a3b8"
                        fill-opacity="0.35"
                      />
                    </marker>
                    <marker
                      id="arrow-in"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,0 L8,4 L0,8 z" fill="#ef4444" />
                    </marker>
                    <marker
                      id="arrow-out"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,0 L8,4 L0,8 z" fill="#10b981" />
                    </marker>
                  </defs>
                  @for (item of aristasPintadas(); track item.key) {
                    <path
                      [attr.d]="item.d"
                      fill="none"
                      [attr.marker-end]="item.markerEnd"
                      [attr.class]="item.pathClass"
                    />
                  }
                </svg>

                @for (slot of layout(); track slot.materia.id) {
                  <button
                    type="button"
                    [class]="estilosNodo(slot.materia)"
                    [style.left.px]="slot.x"
                    [style.top.px]="slot.y"
                    [style.width.px]="COL_W"
                    [style.minHeight.px]="ROW_H"
                    [attr.aria-label]="ariaNodo(slot.materia.id)"
                    (pointerenter)="materiaResaltadaId.set(slot.materia.id)"
                    (click)="onClickNodo(slot.materia.id)"
                  >
                    <span class="line-clamp-3 text-balance">{{ slot.materia.nombre }}</span>
                    @if (slot.materia.esElectiva) {
                      <span class="mt-0.5 text-[9px] font-normal text-slate-400"
                        >Electiva · {{ slot.materia.creditos }} cr.</span
                      >
                    }
                  </button>
                }
              </div>
            }
          </div>
          <p class="mt-2 text-xs text-slate-500">
            Pasá el cursor sobre una materia: el borde del cuadro sigue el nivel;
            las flechas rojas son correlativas que exige; las verdes, las que
            habilita.
          </p>
        </div>
      </main>
    </div>
  `,
})
export class CorrelatividadesMapPage {
  readonly store = inject(ProgressStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');

  readonly COL_W = COL_W;
  readonly ROW_H = ROW_H;

  readonly iconCap = GraduationCap;
  readonly iconBranch = GitBranch;

  /**
   * Materia bajo cursor (resaltado reactivo del grafo).
   * Click además sincroniza `materiaSeleccionadaId` en el store.
   */
  readonly materiaResaltadaId = signal<MateriaId | null>(null);

  readonly pan = signal({ x: 0, y: 0 });
  readonly zoom = signal(1);

  private panDrag:
    | {
        pointerId: number;
        startX: number;
        startY: number;
        panStartX: number;
        panStartY: number;
      }
    | null = null;

  readonly canvas = computed(() => {
    const materias = this.store.materias();
    let maxRows = 1;
    for (let nivel = 1; nivel <= 5; nivel++) {
      const n = materias.filter((m) => m.nivel === nivel).length;
      maxRows = Math.max(maxRows, n);
    }
    const w = PAD * 2 + 5 * COL_W + 4 * GAP_X;
    const h =
      PAD * 2 + maxRows * ROW_H + Math.max(0, maxRows - 1) * GAP_Y;
    return { w, h };
  });

  readonly viewBoxStr = computed(
    () => `0 0 ${this.canvas().w} ${this.canvas().h}`,
  );

  readonly layout = computed<LayoutSlot[]>(() => {
    const materias = this.store.materias();
    const byNivel = new Map<number, MateriaCatalogo[]>();
    for (const m of materias) {
      const arr = byNivel.get(m.nivel) ?? [];
      arr.push(m);
      byNivel.set(m.nivel, arr);
    }
    for (const [, arr] of byNivel) {
      arr.sort((a, b) => {
        const ae = a.esElectiva ? 1 : 0;
        const be = b.esElectiva ? 1 : 0;
        if (ae !== be) return ae - be;
        if (typeof a.id === 'number' && typeof b.id === 'number') {
          return a.id - b.id;
        }
        return a.nombre.localeCompare(b.nombre, 'es');
      });
    }

    const slots: LayoutSlot[] = [];
    for (let nivel = 1; nivel <= 5; nivel++) {
      const arr = byNivel.get(nivel) ?? [];
      const col = nivel - 1;
      arr.forEach((m, row) => {
        slots.push({
          materia: m,
          x: PAD + col * (COL_W + GAP_X),
          y: PAD + row * (ROW_H + GAP_Y),
        });
      });
    }
    return slots;
  });

  readonly centroPorId = computed(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    for (const s of this.layout()) {
      map.set(String(s.materia.id), {
        cx: s.x + COL_W / 2,
        cy: s.y + ROW_H / 2,
      });
    }
    return map;
  });

  readonly aristasLista = computed(() =>
    aristasDelPlan(this.store.materias()),
  );

  readonly aristasPintadas = computed(() => {
    const aristas = this.aristasLista();
    const centers = this.centroPorId();
    const foco = this.materiaResaltadaId();
    const focalNum = typeof foco === 'number' ? foco : null;

    return aristas.map((a) => {
      const fromC = centers.get(String(a.from));
      const toC = centers.get(String(a.to));
      if (!fromC || !toC) {
        return {
          key: `${a.from}-${String(a.to)}`,
          d: '',
          pathClass: 'hidden',
          markerEnd: 'url(#arrow-ghost)',
        };
      }

      const d = pathBezier(fromC.cx, fromC.cy, toC.cx, toC.cy);
      const key = `${a.from}-${String(a.to)}-${a.tipos.join(',')}`;

      const incomingToFoco = foco !== null && String(a.to) === String(foco);
      const outgoingFromFoco = focalNum !== null && a.from === focalNum;

      let pathClass: string;
      let markerEnd: string;

      if (foco === null) {
        pathClass =
          'fill-none stroke-slate-400/25 stroke-[1] transition-opacity duration-150';
        markerEnd = 'url(#arrow-ghost)';
      } else if (incomingToFoco) {
        pathClass =
          'fill-none stroke-red-500 stroke-[2] opacity-100 transition-opacity duration-150';
        markerEnd = 'url(#arrow-in)';
      } else if (outgoingFromFoco) {
        pathClass =
          'fill-none stroke-emerald-500 stroke-[2] opacity-100 transition-opacity duration-150';
        markerEnd = 'url(#arrow-out)';
      } else {
        pathClass =
          'fill-none stroke-slate-400/25 stroke-[1] transition-opacity duration-150';
        markerEnd = 'url(#arrow-ghost)';
      }

      return {
        key,
        d,
        pathClass,
        markerEnd,
      };
    });
  });

  /**
   * Con la materia resaltada: focal, sus prereqs (reg/aprob) y las correlativas directas que salen de ella.
   */
  readonly idsRelacionadosResaltado = computed(() => {
    const foco = this.materiaResaltadaId();
    if (foco === null) return null;

    const set = new Set<string>([String(foco)]);
    const ev = this.store.evaluacionesPorId().get(foco);
    if (ev) {
      for (const x of ev.materia.reg) set.add(String(x));
      for (const x of ev.materia.aprob) set.add(String(x));
    }
    if (typeof foco === 'number') {
      for (const ar of this.aristasLista()) {
        if (ar.from === foco) set.add(String(ar.to));
      }
    }
    return set;
  });

  readonly canvasTransform = computed(() => {
    const { x, y } = this.pan();
    const z = this.zoom();
    return `translate(${x}px, ${y}px) scale(${z})`;
  });

  constructor() {
    /** `#viewport` está siempre en el plantilla → wheel con passive:false desde el primer render estable. */
    afterNextRender(() => {
      const host = this.viewport()?.nativeElement;
      if (!host) return;
      const wheelFn = (e: WheelEvent) => this.onWheelZoom(e);
      host.addEventListener('wheel', wheelFn, { passive: false, capture: true });
      this.destroyRef.onDestroy(() =>
        host.removeEventListener('wheel', wheelFn, { capture: true }),
      );
    });
  }

  nodoAtenuado(id: MateriaId): boolean {
    const rel = this.idsRelacionadosResaltado();
    if (rel === null) return false;
    return !rel.has(String(id));
  }

  estilosNodo(m: MateriaCatalogo): string {
    const id = m.id;
    const foco = this.materiaResaltadaId();
    const evMap = this.store.evaluacionesPorId();
    const ev = evMap.get(id);
    const estado = ev?.estado ?? 'pendiente';
    const disp = ev?.disponibilidad ?? 'bloqueada';

    const base =
      'absolute flex min-h-[72px] w-full flex-col justify-center rounded-xl border-2 px-2.5 py-2 text-left text-[11px] font-medium leading-snug shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70';

    const nivelBorde = clasesBordeNivel(m.nivel);

    let fill =
      `${base} ${nivelBorde} bg-slate-800/95 text-slate-100 hover:bg-slate-800`;

    if (estado === 'aprobada') {
      fill += ' bg-emerald-950/55 text-emerald-50';
    } else if (estado === 'cursando') {
      fill += ' bg-blue-950/45 text-blue-50';
    } else if (estado === 'regular') {
      fill += ' bg-amber-950/35 text-amber-50';
    }

    if (foco !== null && String(id) !== String(foco)) {
      const focalNum = typeof foco === 'number' ? foco : null;
      const focoEv = evMap.get(foco);

      const faltaPrereq =
        typeof id === 'number' &&
        focoEv &&
        (focoEv.faltantesRegular.some((f) => f.id === id) ||
          focoEv.faltantesAprobada.some((f) => f.id === id));
      if (faltaPrereq) {
        fill += ' z-[2] ring-2 ring-rose-400/70 ring-offset-2 ring-offset-slate-900';
      } else if (
        focalNum !== null &&
        estado === 'pendiente' &&
        this.aristasLista().some(
          (a) => a.from === focalNum && String(a.to) === String(id),
        )
      ) {
        if (disp === 'disponible') {
          fill +=
            ' z-[2] ring-2 ring-teal-400/80 ring-offset-2 ring-offset-slate-900';
        } else {
          fill +=
            ' z-[2] ring-2 ring-amber-400/75 ring-offset-2 ring-offset-slate-900';
        }
      }
    }

    if (String(id) === String(foco)) {
      fill +=
        ' z-[3] ring-2 ring-white/90 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-black/40';
    }

    if (this.nodoAtenuado(id)) {
      fill += ' opacity-40';
    }

    return fill;
  }

  ariaNodo(id: MateriaId): string {
    const ev = this.store.evaluacionesPorId().get(id);
    const nombre = ev?.materia.nombre ?? 'Materia';
    const est = ev?.estado ?? 'pendiente';
    return `${nombre}, estado ${est}`;
  }

  onClickNodo(id: MateriaId): void {
    this.store.seleccionarMateria(id);
  }

  onViewportPointerOut(e: PointerEvent): void {
    const next = e.relatedTarget as Node | null;
    const host = this.viewport()?.nativeElement;
    if (!host) return;
    if (next && host.contains(next)) return;
    if (this.panDrag) return;
    this.materiaResaltadaId.set(null);
  }

  onPanStart(e: PointerEvent): void {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('button')) return;

    e.preventDefault();
    const { x, y } = this.pan();
    this.panDrag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      panStartX: x,
      panStartY: y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  onPanMove(e: PointerEvent): void {
    const drag = this.panDrag;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    this.pan.set({
      x: drag.panStartX + dx,
      y: drag.panStartY + dy,
    });
  }

  onPanEnd(e: PointerEvent): void {
    const drag = this.panDrag;
    if (!drag || drag.pointerId !== e.pointerId) return;
    this.panDrag = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  private onWheelZoom(e: WheelEvent): void {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    e.stopPropagation();
    const host = this.viewport()?.nativeElement;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const oldZ = this.zoom();
    const delta = -e.deltaY * 0.0015;
    const newZ = Math.min(2.5, Math.max(0.35, oldZ + delta));
    if (newZ === oldZ) return;

    const scale = newZ / oldZ;
    const { x, y } = this.pan();
    this.zoom.set(newZ);
    this.pan.set({
      x: mx - (mx - x) * scale,
      y: my - (my - y) * scale,
    });
  }
}
