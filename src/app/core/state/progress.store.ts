import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { defer, from } from 'rxjs';
import {
  CategoriaComentario,
  ComentarioUsuario,
  ComentariosMap,
  clearProgreso,
  loadComentariosVotadosIds,
  loadProgreso,
  mergeComentariosMateria,
  persistComentariosVotadosIds,
  saveProgreso,
  tipoDbToCategoria,
} from '../storage/progress-storage';
import {
  CommentRow,
  CommentsService,
  messageFromUnknown,
} from '../services/comments.service';
import { cargarPlanEstudios } from '../data/materias.loader';
import {
  EstadoUsuario,
  EvaluacionMateria,
  FiltroMateriasCatalogo,
  MapaEstados,
  MateriaCatalogo,
  MateriaId,
  PlanEstudios,
} from '../models/materia.model';
import { CelebracionEvent } from '../models/celebracion.model';
import { evaluarPlan, indexarPorId } from '../rules/correlativas.engine';
import { progresoTituloIngenieria } from '../rules/progreso-titulo';

/** Orden de la lista en el modal de comentarios (pestaña Recientes / Relevantes). */
export type OrdenComentariosModal = 'recientes' | 'relevantes';

const PLAN_VACIO: PlanEstudios = {
  configuracion: {
    nombre: 'Ingeniería en Sistemas de Información',
    plan: '2023',
    requisitos: {
      creditos_ingenieria: 20,
      creditos_analista_nivel3: 4,
      pps_obligatoria: true,
    },
  },
  materias: [],
};

function bucketsVacios(): Record<CategoriaComentario, ComentarioUsuario[]> {
  return {
    'donde-cursar': [],
    'opiniones-profes': [],
    'consejos-parciales': [],
  };
}

@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly commentsService = inject(CommentsService);

  readonly planResource = rxResource<PlanEstudios, void>({
    loader: () => defer(() => from(cargarPlanEstudios())),
  });

  readonly plan = computed<PlanEstudios>(
    () => this.planResource.value() ?? PLAN_VACIO,
  );

  readonly cargando = computed(() => this.planResource.isLoading());
  readonly errorCarga = computed(() => this.planResource.error());

  readonly materias = computed<MateriaCatalogo[]>(() => this.plan().materias);

  readonly estadosSignal = signal<MapaEstados>(loadProgreso());

  readonly comentariosSignal = signal<ComentariosMap>({});

  /** IDs de comentarios que este navegador ya marcó como útiles (localStorage). */
  private readonly comentariosVotadosIds = signal<Set<string>>(
    loadComentariosVotadosIds(),
  );

  readonly comentariosVotadosPorUsuario = computed(() =>
    this.comentariosVotadosIds(),
  );

  /** Clave `String(materiaId)` mientras se obtienen comentarios de esa materia. */
  readonly comentariosCargandoMateria = signal<string | null>(null);

  readonly comentariosError = signal<string | null>(null);

  readonly materiaSeleccionadaId = signal<MateriaId | null>(null);

  readonly nivelActivo = signal<number>(1);

  readonly filtroMaterias = signal<FiltroMateriasCatalogo>('todas');

  /** Cola de hitos para confetti / sidebar (se vacía al procesar). */
  private readonly colaCelebracion = signal<CelebracionEvent[]>([]);

  readonly eventosCelebracion = computed(() => this.colaCelebracion());

  /** Base para detectar subidas de % sin celebrar la primera lectura tras cargar plan/progreso. */
  private readonly progresoCelebracionBaseline = signal<number | null>(null);

  readonly evaluaciones = computed<EvaluacionMateria[]>(() =>
    evaluarPlan(this.materias(), this.estadosSignal()),
  );

  readonly evaluacionesPorId = computed<Map<MateriaId, EvaluacionMateria>>(
    () => {
      const map = new Map<MateriaId, EvaluacionMateria>();
      for (const ev of this.evaluaciones()) {
        map.set(ev.materia.id, ev);
      }
      return map;
    },
  );

  readonly indexCatalogo = computed(() => indexarPorId(this.materias()));

  readonly nivelesDisponibles = computed<number[]>(() => {
    const niveles = new Set<number>();
    for (const m of this.materias()) niveles.add(m.nivel);
    return [...niveles].sort((a, b) => a - b);
  });

  readonly evaluacionesNivelActivo = computed<EvaluacionMateria[]>(() => {
    const nivel = this.nivelActivo();
    const filtro = this.filtroMaterias();
    return this.evaluaciones().filter((ev) => {
      if (ev.materia.nivel !== nivel) return false;
      if (filtro === 'todas') return true;
      if (filtro === 'electivas') return ev.materia.esElectiva;
      return !ev.materia.esElectiva;
    });
  });

  readonly materiaSeleccionada = computed<EvaluacionMateria | null>(() => {
    const id = this.materiaSeleccionadaId();
    if (id === null) return null;
    return this.evaluacionesPorId().get(id) ?? null;
  });

  readonly disponiblesPorNivel = computed<Map<number, EvaluacionMateria[]>>(
    () => {
      const out = new Map<number, EvaluacionMateria[]>();
      for (const ev of this.evaluaciones()) {
        if (
          ev.disponibilidad === 'disponible' &&
          ev.estado === 'pendiente'
        ) {
          const arr = out.get(ev.materia.nivel) ?? [];
          arr.push(ev);
          out.set(ev.materia.nivel, arr);
        }
      }
      return out;
    },
  );

  readonly cantidadDisponibles = computed<number>(() => {
    let total = 0;
    for (const arr of this.disponiblesPorNivel().values()) total += arr.length;
    return total;
  });

  readonly stats = computed(() => {
    const counts: Record<EstadoUsuario, number> = {
      pendiente: 0,
      cursando: 0,
      regular: 0,
      aprobada: 0,
    };
    let creditosElectivosAprobados = 0;
    let creditosElectivosTotales = 0;
    let obligatoriasTotal = 0;
    let obligatoriasAprobadas = 0;
    for (const ev of this.evaluaciones()) {
      counts[ev.estado] += 1;
      if (!ev.materia.esElectiva && ev.materia.cuentaProgresoTitulo) {
        obligatoriasTotal += 1;
        if (ev.estado === 'aprobada') obligatoriasAprobadas += 1;
      }
      if (ev.materia.esElectiva) {
        creditosElectivosTotales += ev.materia.creditos;
        if (ev.estado === 'aprobada') {
          creditosElectivosAprobados += ev.materia.creditos;
        }
      }
    }
    const total = this.materias().length;
    const creditosElectivosRequeridos =
      this.plan().configuracion.requisitos.creditos_ingenieria;
    const progresoTotal = progresoTituloIngenieria({
      obligatoriasTotal,
      obligatoriasAprobadas,
      creditosElectivosAprobados,
      creditosElectivosRequeridos,
    });
    return {
      total,
      counts,
      creditosElectivosAprobados,
      creditosElectivosTotales,
      creditosElectivosRequeridos,
      progresoTotal,
    };
  });

  constructor() {
    effect(() => {
      const estados = this.estadosSignal();
      saveProgreso(estados);
    });

    effect(() => {
      const prog = this.stats().progresoTotal;
      const base = this.progresoCelebracionBaseline();
      if (base === null) {
        this.progresoCelebracionBaseline.set(prog);
        return;
      }
      if (prog > base && prog >= 100 && base < 100) {
        this.notificarCelebracion({ kind: 'titulo-completo' });
      }
      this.progresoCelebracionBaseline.set(prog);
    });
  }

  notificarCelebracion(evento: CelebracionEvent): void {
    this.colaCelebracion.update((q) => [...q, evento]);
  }

  limpiarColaCelebracion(): void {
    this.colaCelebracion.set([]);
  }

  comentariosSupabaseConfigurado(): boolean {
    return this.commentsService.isConfigured();
  }

  async cargarComentariosMateria(materiaId: MateriaId): Promise<void> {
    const key = String(materiaId);
    if (!this.commentsService.isConfigured()) {
      this.comentariosError.set(
        'Comentarios no disponibles: configurá Supabase en environment.',
      );
      return;
    }
    this.comentariosError.set(null);
    this.comentariosCargandoMateria.set(key);
    try {
      const rows = await this.commentsService.fetchByMateria(materiaId);
      const grouped = CommentsService.groupByCategoria(rows);
      this.comentariosSignal.update((prev) =>
        mergeComentariosMateria(prev, key, grouped),
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudieron cargar los comentarios.';
      this.comentariosError.set(msg);
    } finally {
      this.comentariosCargandoMateria.update((cur) =>
        cur === key ? null : cur,
      );
    }
  }

  async agregarComentario(
    materiaId: MateriaId,
    categoria: CategoriaComentario,
    texto: string,
    nombreUsuario: string | null = null,
  ): Promise<void> {
    const limpio = texto.trim();
    if (!limpio) return;
    if (!this.commentsService.isConfigured()) {
      this.comentariosError.set(
        'No se puede publicar: configurá Supabase en environment.',
      );
      return;
    }
    this.comentariosError.set(null);
    const nombre =
      nombreUsuario?.trim() ? nombreUsuario.trim().slice(0, 80) : null;
    try {
      const row = await this.commentsService.insert({
        materiaId,
        categoria,
        contenido: limpio,
        nombreUsuario: nombre,
      });
      const nuevo = CommentsService.rowToUsuario(row);
      const key = String(materiaId);
      this.comentariosSignal.update((prev) => {
        const actuales = prev[key] ?? bucketsVacios();
        const lista = actuales[categoria];
        const sinDuplicado = lista.filter((c) => c.id !== nuevo.id);
        return {
          ...prev,
          [key]: {
            ...actuales,
            [categoria]: [nuevo, ...sinDuplicado].sort(
              (a, b) => b.fecha - a.fecha,
            ),
          },
        };
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudo publicar el comentario.';
      this.comentariosError.set(msg);
      throw e;
    }
  }

  /** Marca todas las materias del catálogo de ese nivel como aprobadas (atajo para simular carrera). */
  marcarNivelTodoAprobado(nivel: number): void {
    this.estadosSignal.update((prev) => {
      const next: MapaEstados = { ...prev };
      for (const m of this.materias()) {
        if (m.nivel === nivel) {
          next[m.id] = 'aprobada';
        }
      }
      return next;
    });
  }

  setEstado(id: MateriaId, estado: EstadoUsuario): void {
    const anterior = this.estadosSignal()[id] ?? 'pendiente';
    this.estadosSignal.update((prev) => {
      const actual = prev[id] ?? 'pendiente';
      const next: MapaEstados = { ...prev };
      if (actual === estado) {
        delete next[id];
      } else {
        next[id] = estado;
      }
      return next;
    });
    const nuevo = this.estadosSignal()[id] ?? 'pendiente';
    if (
      typeof id === 'number' &&
      (id === 99 || id === 36) &&
      nuevo === 'aprobada' &&
      anterior !== 'aprobada'
    ) {
      this.notificarCelebracion({
        kind: 'materia-aprobada',
        materiaId: id as 99 | 36,
      });
    }
  }

  seleccionarMateria(id: MateriaId | null): void {
    this.materiaSeleccionadaId.set(id);
  }

  setNivelActivo(nivel: number): void {
    this.nivelActivo.set(nivel);
    this.materiaSeleccionadaId.set(null);
  }

  setFiltroMaterias(value: FiltroMateriasCatalogo): void {
    this.filtroMaterias.set(value);
  }

  reiniciarProgreso(): void {
    this.estadosSignal.set({});
    clearProgreso();
    this.materiaSeleccionadaId.set(null);
    this.progresoCelebracionBaseline.set(null);
    this.colaCelebracion.set([]);
  }

  comentariosDe(
    materiaId: MateriaId,
    categoria: CategoriaComentario,
    orden: OrdenComentariosModal = 'recientes',
  ): ComentarioUsuario[] {
    const key = String(materiaId);
    const list = this.comentariosSignal()[key]?.[categoria] ?? [];
    const copy = [...list];
    if (orden === 'recientes') {
      copy.sort((a, b) => b.fecha - a.fecha);
    } else {
      copy.sort(
        (a, b) =>
          (b.votos_count ?? 0) - (a.votos_count ?? 0) || b.fecha - a.fecha,
      );
    }
    return copy;
  }

  async votarComentario(commentId: string): Promise<void> {
    if (this.comentariosVotadosIds().has(commentId)) return;
    if (!this.commentsService.isConfigured()) {
      this.comentariosError.set(
        'No se puede votar: configurá Supabase en environment.',
      );
      return;
    }
    this.comentariosError.set(null);
    try {
      const row = await this.commentsService.incrementVotos(commentId);
      this.comentariosVotadosIds.update((prev) => {
        const next = new Set(prev);
        next.add(commentId);
        persistComentariosVotadosIds(next);
        return next;
      });
      this.aplicarComentarioActualizado(row);
    } catch (e) {
      this.comentariosError.set(messageFromUnknown(e));
      throw e;
    }
  }

  private aplicarComentarioActualizado(row: CommentRow): void {
    const key = row.materia_id;
    const cat = tipoDbToCategoria(row.categoria);
    const updated = CommentsService.rowToUsuario(row);
    this.comentariosSignal.update((prev) => {
      const buckets = prev[key];
      if (!buckets) return prev;
      const list = buckets[cat];
      const idx = list.findIndex((c) => c.id === row.id);
      if (idx === -1) return prev;
      const nextList = [...list];
      nextList[idx] = updated;
      return {
        ...prev,
        [key]: { ...buckets, [cat]: nextList },
      };
    });
  }
}
