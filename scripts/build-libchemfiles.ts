import child_process from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');
const BUILDIR = path.join(ROOT, 'build');
const LIBDIR = path.join(ROOT, 'lib');

// cmake configure
fs.mkdirSync(BUILDIR, { recursive: true });
if (!fs.existsSync(path.join(BUILDIR, 'CMakeCache.txt'))) {
    child_process.execSync('emcmake cmake ..', { cwd: BUILDIR, stdio: 'inherit' });
}

// cmake build
child_process.execSync('cmake --build . --parallel', { cwd: BUILDIR, stdio: 'inherit' });

// eslint-disable-next-line no-console
console.log('\ncopying files to lib/ ...');

// copy important files to lib/ and edit them as needed
fs.mkdirSync(LIBDIR, { recursive: true });

// generate the SIZEOF_XXX constants in lib/wasm-sizes.ts
child_process.execSync('node sizeof.js', {
    cwd: BUILDIR,
    stdio: [0, fs.openSync(path.join(LIBDIR, 'wasm-sizes.ts'), 'w'), 'pipe'],
});

// small edit to the compiled code to allow access to NODERAWFS in node, while
// keeping the same file working in browsers
let content = fs.readFileSync(path.join(BUILDIR, 'libchemfiles.js'), { encoding: 'utf8' });
const replace = 'throw new Error("NODERAWFS is currently only supported on Node.js environment.");';
content = content.replace(replace, '');
fs.writeFileSync(path.join(LIBDIR, 'libchemfiles.js'), content);

// eslint-disable-next-line no-console
console.log('done!');
