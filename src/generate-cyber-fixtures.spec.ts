import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, describe, expect, it } from 'vitest';

import {
  DEFAULT_SEED,
  FIXTURE_FILENAMES,
  generate,
  parseArgv,
  serialiseFixture,
  buildFixtures,
} from './generateCyberFixtures';

const run = promisify(execFile);

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = dirname(SRC_DIR);
const GENERATOR = join(SRC_DIR, 'generateCyberFixtures.ts');

const temporaryDirs: string[] = [];

function temporaryDir(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `cyber-fixtures-${label}-`));
  temporaryDirs.push(dir);
  return dir;
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).sort();
}

afterAll(() => {
  for (const dir of temporaryDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('generate-cyber-fixtures', () => {
  it('produces deterministic output', async () => {
    const first = temporaryDir('first');
    const second = temporaryDir('second');

    const writtenFirst = await generate(DEFAULT_SEED, first);
    const writtenSecond = await generate(DEFAULT_SEED, second);

    // The same files, both times, and not an empty run.
    expect(writtenFirst.map((path) => basename(path))).toEqual(
      Object.values(FIXTURE_FILENAMES).sort(),
    );
    expect(writtenFirst.map((path) => basename(path))).toEqual(
      writtenSecond.map((path) => basename(path)),
    );
    expect(filesIn(first)).toEqual(filesIn(second));
    expect(filesIn(first).length).toBeGreaterThan(0);

    // Byte-identical, file by file.
    for (const name of filesIn(first)) {
      const bytesFirst = readFileSync(join(first, name));
      const bytesSecond = readFileSync(join(second, name));
      expect(bytesFirst.length, `${name} differs in length between runs`).toBe(bytesSecond.length);
      expect(
        bytesFirst.equals(bytesSecond),
        `${name} is not byte-identical between two runs of the same seed`,
      ).toBe(true);
      expect(bytesFirst.toString('utf8').endsWith('}\n')).toBe(true);
    }

    // A third run through the committed CLI entry point, as `npm run
    // gen:cyber-fixtures` invokes it, produces the same bytes again.
    const third = temporaryDir('third');
    const cli = await run(process.execPath, [GENERATOR, `--seed=${DEFAULT_SEED}`, `--out=${third}`], {
      cwd: REPO_DIR,
    });
    expect(cli.stdout).toContain(`seed ${DEFAULT_SEED}`);
    expect(filesIn(third)).toEqual(filesIn(first));
    for (const name of filesIn(first)) {
      expect(
        readFileSync(join(third, name)).equals(readFileSync(join(first, name))),
        `${name} from the CLI differs from the library run of the same seed`,
      ).toBe(true);
    }

    // And a different seed really does produce different data, so the equality
    // above is determinism rather than a constant.
    const other = temporaryDir('other-seed');
    await generate(DEFAULT_SEED + 1, other);
    const differences = filesIn(first).filter(
      (name) => !readFileSync(join(other, name)).equals(readFileSync(join(first, name))),
    );
    expect(differences.length, 'a different seed produced identical fixtures').toBeGreaterThan(0);
  });

  it('writes the committed fixtures under src/ from the default seed', async () => {
    const regenerated = temporaryDir('committed');
    await generate(DEFAULT_SEED, regenerated);

    for (const name of Object.values(FIXTURE_FILENAMES)) {
      const committed = readFileSync(join(SRC_DIR, name));
      const fresh = readFileSync(join(regenerated, name));
      expect(
        committed.equals(fresh),
        `src/${name} is not what the committed generator produces for seed ${DEFAULT_SEED}; run npm run gen:cyber-fixtures`,
      ).toBe(true);
    }
  });

  it('reads no clock, no randomness and no external source', () => {
    // Comments are stripped first: the file's own documentation names the
    // calls it avoids, and naming them is not using them.
    const source = readFileSync(GENERATOR, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

    for (const forbidden of [
      'Math.random',
      'Date.now',
      'new Date()',
      'fetch(',
      'XMLHttpRequest',
      'node:http',
      'process.hrtime',
      'randomUUID',
    ]) {
      expect(source.includes(forbidden), `the generator uses ${forbidden}`).toBe(false);
    }

    // Serialisation is stable: sorted keys and exactly one trailing newline.
    const text = serialiseFixture(buildFixtures(DEFAULT_SEED).facility);
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
    expect(text).toBe(serialiseFixture(buildFixtures(DEFAULT_SEED).facility));

    const topLevelKeys = Object.keys(JSON.parse(text));
    expect(topLevelKeys).toEqual([...topLevelKeys].sort());
  });

  it('takes the seed and output directory from the command line', () => {
    expect(parseArgv(['--seed=7', '--out=/tmp/x'])).toEqual({ seed: '7', out: '/tmp/x' });
    expect(parseArgv(['--seed', '7', '--out', '/tmp/x'])).toEqual({ seed: '7', out: '/tmp/x' });
    expect(parseArgv([])).toEqual({});
  });
});
