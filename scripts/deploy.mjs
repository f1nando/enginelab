import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const auth = ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential'];

function git(args, cwd = root, allowMissing = false) {
  const result = spawnSync('git', [...auth, ...args], { cwd, encoding: 'utf8', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0 && !(allowMissing && result.status === 2)) {
    throw new Error(result.stderr || result.stdout || `git ${args[0]} failed`);
  }
  return { status: result.status, text: result.stdout.trim() };
}

if (!existsSync(join(dist, 'index.html')) || !existsSync(join(dist, '.nojekyll'))) {
  throw new Error('Build output is missing. Run npm run deploy (which builds first).');
}
const remote = git(['remote', 'get-url', 'origin']).text;
const name = git(['config', '--get', 'user.name']).text;
const email = git(['config', '--get', 'user.email']).text;
const directory = mkdtempSync(join(root, '.pages-deploy-'));

try {
  git(['init', '--initial-branch=gh-pages'], directory);
  git(['remote', 'add', 'origin', remote], directory);
  const branch = git(['ls-remote', '--exit-code', '--heads', 'origin', 'refs/heads/gh-pages'], directory, true);
  if (branch.status === 0) {
    git(['fetch', '--depth=1', 'origin', 'gh-pages'], directory);
    git(['checkout', '-B', 'gh-pages', 'FETCH_HEAD'], directory);
    // Only this script's temporary deployment checkout is cleaned, never the source tree.
    for (const entry of readdirSync(directory)) {
      if (entry !== '.git') rmSync(join(directory, entry), { recursive: true, force: true });
    }
  }
  cpSync(dist, directory, { recursive: true });
  git(['add', '--all'], directory);
  const changes = git(['status', '--porcelain'], directory).text;
  if (changes) {
    git(['-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '-m', 'Deploy enginelab to GitHub Pages'], directory);
    git(['push', 'origin', 'gh-pages'], directory);
    console.log('Published build to gh-pages. GitHub Pages will update shortly.');
  } else console.log('The published build is already up to date.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
