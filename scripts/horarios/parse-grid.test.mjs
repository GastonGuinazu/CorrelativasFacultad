import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { inferCuatrimestreTag, parseSheetTab, duracionSlotMinutos } from './parse-grid.mjs';
import { matchMateriaAlias } from './match-alias.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('inferCuatrimestreTag', () => {
  assert.equal(inferCuatrimestreTag('1er Cuatrimestre - Turno Mañana'), '1er');
  assert.equal(inferCuatrimestreTag('2do Cuatrimestre'), '2do');
  assert.equal(inferCuatrimestreTag('Sin cuatrimestre aquí'), null);
});

test('duracionSlotMinutos', () => {
  assert.equal(duracionSlotMinutos('11:10', '11:20'), 10);
  assert.equal(duracionSlotMinutos('12:50', '14:00'), 70);
  assert.equal(duracionSlotMinutos('10:25', '11:10'), 45);
});

test('matchMateriaAlias: IA token vs frase larga', async () => {
  const aliases = JSON.parse(await readFile(join(__dirname, 'aliases-v5.json'), 'utf8'));
  assert.equal(matchMateriaAlias('IA', aliases)?.id, 31);
  assert.equal(matchMateriaAlias('Inteligencia Artificial', aliases)?.id, 31);
  assert.equal(matchMateriaAlias('Electiva 1', aliases)?.hueco, 'E1');
});

test('parseSheetTab: grilla mínima tipo planilla facultad (5.º año: horas A–B, días desde C)', async () => {
  const aliases = JSON.parse(await readFile(join(__dirname, 'aliases-v5.json'), 'utf8'));

  /** Layout tipo libro 5.º año: encabezado días en cols 0–4; fila horario 8:00/8:45 en 0–1; Lunes en col 2 */
  const rowData = [
    { values: [] },
    {
      values: [
        { formattedValue: '1er Cuatrimestre - Turno Mañana' },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: 'Lunes' },
        { formattedValue: 'Martes' },
        { formattedValue: 'Miércoles' },
        { formattedValue: 'Jueves' },
        { formattedValue: 'Viernes' },
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: '8:00' },
        { formattedValue: '8:45' },
        {
          formattedValue: 'IA',
          effectiveFormat: {
            backgroundColor: { rgbColor: { red: 0.2, green: 0.8, blue: 0.3 } }
          }
        },
        {},
        {},
        {},
        {
          formattedValue: 'IA',
          effectiveFormat: {
            backgroundColor: { rgbColor: { red: 0.2, green: 0.8, blue: 0.3 } }
          }
        },
        {
          formattedValue: 'Profesor Ejemplo',
          effectiveFormat: {
            backgroundColor: { rgbColor: { red: 0.2, green: 0.8, blue: 0.3 } }
          }
        }
      ]
    }
  ];

  const sheetProps = { sheetId: 0, title: '5K_TEST' };
  const dataFirst = { rowData };

  const out = parseSheetTab(sheetProps, dataFirst, aliases);

  assert.equal(out.curso, '5K_TEST');
  assert.ok(out.bloques.length >= 1);
  const b = out.bloques.find((x) => x.dia === 'Lunes');
  assert.ok(b);
  assert.equal(b.materiaCrudo, 'IA');
  assert.equal(b.materiaMatch?.tipo, 'obligatoria');
  assert.equal(b.materiaMatch?.id, 31);
  assert.equal(b.cuatrimestreTag, '1er');
});

test('parseSheetTab: 2do cuatrimestre repite encabezado de días', async () => {
  const aliases = JSON.parse(await readFile(join(__dirname, 'aliases-v1.json'), 'utf8'));

  const rowData = [
    { values: [] },
    {
      values: [
        { formattedValue: '1er Cuatrimestre' },
        {},
        {},
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: 'Lunes' },
        { formattedValue: 'Martes' },
        { formattedValue: 'Miércoles' },
        { formattedValue: 'Jueves' },
        { formattedValue: 'Viernes' },
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: '8:00' },
        { formattedValue: '8:45' },
        { formattedValue: 'Análisis 1' },
        {},
        {},
        {},
        {}
      ]
    },
    { values: [] },
    {
      values: [
        { formattedValue: '2do Cuatrimestre' },
        {},
        {},
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: 'Lunes' },
        { formattedValue: 'Martes' },
        { formattedValue: 'Miércoles' },
        { formattedValue: 'Jueves' },
        { formattedValue: 'Viernes' },
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: '10:00' },
        { formattedValue: '10:45' },
        { formattedValue: 'Física 1' },
        {},
        {},
        {},
        {}
      ]
    }
  ];

  const out = parseSheetTab({ sheetId: 2, title: '1K2Q' }, { rowData }, aliases);

  const primer = out.bloques.filter((x) => x.cuatrimestreTag === '1er');
  const segundo = out.bloques.filter((x) => x.cuatrimestreTag === '2do');
  assert.ok(primer.some((x) => normSub(x.materiaCrudo).includes('analisis')));
  assert.ok(segundo.some((x) => normSub(x.materiaCrudo).includes('fisica')));
});

test('parseSheetTab: horas en columnas B–C, días en D–H (columna A vacía)', async () => {
  const aliases = JSON.parse(await readFile(join(__dirname, 'aliases-v1.json'), 'utf8'));

  const rowData = [
    { values: [] },
    {
      values: [
        {},
        { formattedValue: '1er Cuatrimestre - Turno Mañana' },
        {},
        { formattedValue: 'Lunes' },
        { formattedValue: 'Martes' },
        { formattedValue: 'Miércoles' },
        { formattedValue: 'Jueves' },
        { formattedValue: 'Viernes' }
      ]
    },
    {
      values: [
        {},
        { formattedValue: '8:00' },
        { formattedValue: '8:45' },
        { formattedValue: 'Análisis 1' },
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        {},
        { formattedValue: '8:45' },
        { formattedValue: '9:30' },
        {},
        { formattedValue: 'Álgebra' },
        {},
        {},
        {}
      ]
    }
  ];

  const sheetProps = { sheetId: 1, title: '1K_TEST' };
  const out = parseSheetTab(sheetProps, { rowData }, aliases);

  assert.ok(out.bloques.length >= 1);
  const lunes = out.bloques.filter((x) => x.dia === 'Lunes');
  assert.ok(lunes.some((x) => normSub(x.materiaCrudo).includes('analisis')));
});

test('parseSheetTab: no arrastra materia a celdas vacías en recreo o fila larga (hueco blanco)', async () => {
  const aliases = JSON.parse(await readFile(join(__dirname, 'aliases-v1.json'), 'utf8'));

  const grey = { red: 0.75, green: 0.75, blue: 0.78 };

  const rowData = [
    { values: [] },
    {
      values: [
        { formattedValue: '1er Cuatrimestre - Turno Mañana' },
        {},
        {},
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: 'Lunes' },
        { formattedValue: 'Martes' },
        { formattedValue: 'Miércoles' },
        { formattedValue: 'Jueves' },
        { formattedValue: 'Viernes' },
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: '10:25' },
        { formattedValue: '11:10' },
        {},
        {},
        {},
        {
          formattedValue: 'SPN',
          effectiveFormat: { backgroundColor: { rgbColor: grey } }
        },
        {}
      ]
    },
    {
      values: [
        { formattedValue: '11:10' },
        { formattedValue: '11:20' },
        {},
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: '11:20' },
        { formattedValue: '12:05' },
        {},
        {},
        {},
        {
          formattedValue: 'SPN',
          effectiveFormat: { backgroundColor: { rgbColor: grey } }
        },
        {}
      ]
    },
    {
      values: [
        { formattedValue: '12:05' },
        { formattedValue: '12:50' },
        {},
        {},
        {},
        {
          formattedValue: 'Sistemas',
          effectiveFormat: { backgroundColor: { rgbColor: grey } }
        },
        {}
      ]
    },
    {
      values: [
        { formattedValue: '12:50' },
        { formattedValue: '14:00' },
        {},
        {},
        {},
        {},
        {}
      ]
    },
    {
      values: [
        { formattedValue: '14:00' },
        { formattedValue: '14:45' },
        {},
        {},
        {},
        {},
        {}
      ]
    }
  ];

  const out = parseSheetTab({ sheetId: 0, title: '1K_CARRY_TEST' }, { rowData }, aliases);
  const jueves1er = out.bloques.filter(
    (x) => x.dia === 'Jueves' && x.cuatrimestreTag === '1er'
  );

  assert.ok(
    jueves1er.some((x) => x.horaInicio === '10:25' && x.horaFin === '11:10'),
    'primer módulo SPN'
  );
  assert.ok(!jueves1er.some((x) => x.horaInicio === '11:10' && x.horaFin === '11:20'), 'recreo sin carry');
  assert.ok(
    jueves1er.some((x) => x.horaInicio === '11:20' && x.horaFin === '12:05'),
    'tercer módulo'
  );
  assert.ok(
    jueves1er.some((x) => x.horaInicio === '12:05' && x.horaFin === '12:50'),
    'cuarto módulo'
  );
  assert.ok(!jueves1er.some((x) => x.horaInicio === '12:50'), 'almuerzo vacío sin carry');
  assert.ok(!jueves1er.some((x) => x.horaInicio === '14:00'), 'tarde vacía sin carry');

  const spnMerged = jueves1er.filter((x) => normSub(x.materiaCrudo).includes('spn') || normSub(x.materiaCrudo).includes('sistemas'));
  const maxFin = Math.max(...spnMerged.map((x) => timeToMin(x.horaFin)));
  assert.ok(maxFin <= 12 * 60 + 50, 'SPN no se extiende después de 12:50');
});

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function normSub(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
