# JavaScript (node and browser) bindings for the Chemfiles library

[![Build Status](https://travis-ci.org/chemfiles/chemfiles.js.svg?branch=master)](https://travis-ci.org/chemfiles/chemfiles.js)
[![Code coverage](http://codecov.io/github/chemfiles/chemfiles.js/coverage.svg?branch=master)](http://codecov.io/github/chemfiles/chemfiles.js?branch=master)
[![Documentation](https://img.shields.io/badge/docs-latest-brightgreen.svg)](http://chemfiles.org/chemfiles.js/)

Chemfiles is a library for reading and writing molecular trajectory files. These
files are created by your favorite theoretical chemistry program, and contains
information about atomic or residues names and positions. Chemfiles offers
abstraction on top of these formats, and a consistent interface for loading and
saving data to these files.

This repository contains the JavaScript/TypeScript binding for the chemfiles
library. They use a version of the chemfiles library compiled to WebAssembly
(WASM) to target web browsers and node.js alike.

## Installation

TODO

### Installation from sources

TODO

## Usage example

Here is a simple usage example of chemfiles on a node.js environment:

```js
const chemfiles = require('chemfiles');

const trajectory = new chemfiles.Trajectory("filename.xyz");
const frame = new chemfiles.Frame();

trajectory.read(frame);

console.log(`There are ${frame.natoms} atoms in the frame`)
const positions = frame.positions;

// Do awesome things with the positions here !
```

Here is the same example in a web browser

```js

// TODO

```

## Bug reports, feature requests

Please report any bug you find and any feature you may want as a [github
issue](https://github.com/chemfiles/chemfiles.js/issues/new).
