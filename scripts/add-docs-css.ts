import fs from 'fs';
import path from 'path';

const css = path.join(__dirname, '..', 'dist', 'docs', 'assets', 'css', 'main.css');

const custom = `
.tsd-hierarchy {
    display: none;
}

.tsd-sources {
    display: none;
}

.tsd-type-parameters {
    display: none;
}
`;

const content = fs.readFileSync(css, { encoding: 'utf8' }) + custom;

fs.writeFileSync(css, content);
