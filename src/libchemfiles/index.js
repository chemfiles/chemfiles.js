// Chemfiles.js, a modern library for chemistry file reading and writing
// Copyright (C) Guillaume Fraux and contributors -- BSD license
//
// ===========================================================================
// !!!! AUTO-GENERATED FILE !!!! Do not edit. See the bindgen repository for
// the generation code (https://github.com/chemfiles/bindgen).
// This file contains emscripten/typescript interface to the C API
// ===========================================================================

/* eslint-disable */
const loadChemfiles = require('../../lib/libchemfiles');

module.exports = {
    loadChemfiles,
    // chfl_status values
    CHFL_SUCCESS: 0,
    CHFL_MEMORY_ERROR: 1,
    CHFL_FILE_ERROR: 2,
    CHFL_FORMAT_ERROR: 3,
    CHFL_SELECTION_ERROR: 4,
    CHFL_CONFIGURATION_ERROR: 5,
    CHFL_OUT_OF_BOUNDS: 6,
    CHFL_PROPERTY_ERROR: 7,
    CHFL_GENERIC_ERROR: 254,
    CHFL_CXX_ERROR: 255,
    // chfl_bond_order values
    CHFL_BOND_UNKNOWN: 0,
    CHFL_BOND_SINGLE: 1,
    CHFL_BOND_DOUBLE: 2,
    CHFL_BOND_TRIPLE: 3,
    CHFL_BOND_QUADRUPLE: 4,
    CHFL_BOND_QUINTUPLET: 5,
    CHFL_BOND_AMIDE: 254,
    CHFL_BOND_AROMATIC: 255,
    // chfl_property_kind values
    CHFL_PROPERTY_BOOL: 0,
    CHFL_PROPERTY_DOUBLE: 1,
    CHFL_PROPERTY_STRING: 2,
    CHFL_PROPERTY_VECTOR3D: 3,
    // chfl_cellshape values
    CHFL_CELL_ORTHORHOMBIC: 0,
    CHFL_CELL_TRICLINIC: 1,
    CHFL_CELL_INFINITE: 2,
}
