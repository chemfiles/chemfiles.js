// Chemfiles.js, a modern library for chemistry file reading and writing
// Copyright (C) Guillaume Fraux and contributors -- BSD license
//
// ===========================================================================
// !!!! AUTO-GENERATED FILE !!!! Do not edit. See the bindgen repository for
// the generation code (https://github.com/chemfiles/bindgen).
// This file contains emscripten/typescript interface to the C API
// ===========================================================================

// === Manual declarations
import { EmscriptenModule, POINTER } from "./emscripten";
export { FileSystem } from "./emscripten";

declare const tag: unique symbol;

export type CHFL_PTR = POINTER & { readonly [tag]: 'chemfiles pointer' };
export type c_char_ptr = POINTER & { readonly [tag]: 'char pointer' };
export type c_char_ptr_ptr = POINTER & { readonly [tag]: 'char array pointer' };
export type c_bool_ptr = POINTER & { readonly [tag]: 'bool pointer' };
export type c_double_ptr = POINTER & { readonly [tag]: 'double pointer' };
export type c_uint64_ptr = POINTER & { readonly [tag]: 'uint64_t pointer' };
export type c_int64_ptr = POINTER & { readonly [tag]: 'int64_t pointer' };
export type chfl_bond_order_ptr = POINTER & { readonly [tag]: 'chfl_bond_order pointer' };
export type chfl_property_kind_ptr = POINTER & { readonly [tag]: 'chfl_property_kind pointer' };
export type chfl_cellshape_ptr = POINTER & { readonly [tag]: 'chfl_cellshape pointer' };

export type c_char = number;
export type c_bool = number;
export type c_double = number;

export type chfl_vector3d = c_double_ptr;
export type chfl_match_ptr = POINTER & { readonly [tag]: 'chfl_match pointer' };
export type chfl_format_metadata_ptr = POINTER & { readonly [tag]: 'chfl_format_metadata pointer' };

export declare function loadChemfiles(): Promise<ChemfilesModule>;
// === End of manual declarations

export type CHFL_TRAJECTORY = CHFL_PTR & { readonly [tag]: 'CHFL_TRAJECTORY' };
export type CHFL_CELL = CHFL_PTR & { readonly [tag]: 'CHFL_CELL' };
export type CHFL_ATOM = CHFL_PTR & { readonly [tag]: 'CHFL_ATOM' };
export type CHFL_FRAME = CHFL_PTR & { readonly [tag]: 'CHFL_FRAME' };
export type CHFL_TOPOLOGY = CHFL_PTR & { readonly [tag]: 'CHFL_TOPOLOGY' };
export type CHFL_SELECTION = CHFL_PTR & { readonly [tag]: 'CHFL_SELECTION' };
export type CHFL_RESIDUE = CHFL_PTR & { readonly [tag]: 'CHFL_RESIDUE' };
export type CHFL_PROPERTY = CHFL_PTR & { readonly [tag]: 'CHFL_PROPERTY' };
export type chfl_status = number & { readonly [tag]: 'chfl_status' };
export declare const CHFL_SUCCESS: chfl_status;
export declare const CHFL_MEMORY_ERROR: chfl_status;
export declare const CHFL_FILE_ERROR: chfl_status;
export declare const CHFL_FORMAT_ERROR: chfl_status;
export declare const CHFL_SELECTION_ERROR: chfl_status;
export declare const CHFL_CONFIGURATION_ERROR: chfl_status;
export declare const CHFL_OUT_OF_BOUNDS: chfl_status;
export declare const CHFL_PROPERTY_ERROR: chfl_status;
export declare const CHFL_GENERIC_ERROR: chfl_status;
export declare const CHFL_CXX_ERROR: chfl_status;
export type chfl_bond_order = number & { readonly [tag]: 'chfl_bond_order' };
export declare const CHFL_BOND_UNKNOWN: chfl_bond_order;
export declare const CHFL_BOND_SINGLE: chfl_bond_order;
export declare const CHFL_BOND_DOUBLE: chfl_bond_order;
export declare const CHFL_BOND_TRIPLE: chfl_bond_order;
export declare const CHFL_BOND_QUADRUPLE: chfl_bond_order;
export declare const CHFL_BOND_QUINTUPLET: chfl_bond_order;
export declare const CHFL_BOND_AMIDE: chfl_bond_order;
export declare const CHFL_BOND_AROMATIC: chfl_bond_order;
export type chfl_property_kind = number & { readonly [tag]: 'chfl_property_kind' };
export declare const CHFL_PROPERTY_BOOL: chfl_property_kind;
export declare const CHFL_PROPERTY_DOUBLE: chfl_property_kind;
export declare const CHFL_PROPERTY_STRING: chfl_property_kind;
export declare const CHFL_PROPERTY_VECTOR3D: chfl_property_kind;
export type chfl_cellshape = number & { readonly [tag]: 'chfl_cellshape' };
export declare const CHFL_CELL_ORTHORHOMBIC: chfl_cellshape;
export declare const CHFL_CELL_TRICLINIC: chfl_cellshape;
export declare const CHFL_CELL_INFINITE: chfl_cellshape;

export interface ChemfilesModule extends EmscriptenModule {
    // 'chfl_version' at types.h:150
    _chfl_version(): c_char_ptr;
    // 'chfl_last_error' at misc.h:23
    _chfl_last_error(): c_char_ptr;
    // 'chfl_clear_errors' at misc.h:33
    _chfl_clear_errors(): chfl_status;
    // 'chfl_set_warning_callback' at misc.h:42
    _chfl_set_warning_callback(callback: number): chfl_status;
    // 'chfl_add_configuration' at misc.h:58
    _chfl_add_configuration(path: c_char_ptr): chfl_status;
    // 'chfl_formats_list' at misc.h:71
    _chfl_formats_list(metadata: chfl_format_metadata_ptr, count: c_uint64_ptr): chfl_status;
    // 'chfl_free' at misc.h:80
    _chfl_free(object: CHFL_PTR): void;
    // 'chfl_property_bool' at property.h:37
    _chfl_property_bool(value: c_bool): CHFL_PROPERTY;
    // 'chfl_property_double' at property.h:47
    _chfl_property_double(value: c_double): CHFL_PROPERTY;
    // 'chfl_property_string' at property.h:57
    _chfl_property_string(value: c_char_ptr): CHFL_PROPERTY;
    // 'chfl_property_vector3d' at property.h:67
    _chfl_property_vector3d(value: chfl_vector3d): CHFL_PROPERTY;
    // 'chfl_property_get_kind' at property.h:74
    _chfl_property_get_kind(property: CHFL_PROPERTY, kind: chfl_property_kind_ptr): chfl_status;
    // 'chfl_property_get_bool' at property.h:87
    _chfl_property_get_bool(property: CHFL_PROPERTY, value: c_bool_ptr): chfl_status;
    // 'chfl_property_get_double' at property.h:100
    _chfl_property_get_double(property: CHFL_PROPERTY, value: c_double_ptr): chfl_status;
    // 'chfl_property_get_string' at property.h:115
    _chfl_property_get_string(property: CHFL_PROPERTY, buffer: c_char_ptr, buffsize_lo: number, buffsize_hi: number): chfl_status;
    // 'chfl_property_get_vector3d' at property.h:128
    _chfl_property_get_vector3d(property: CHFL_PROPERTY, value: chfl_vector3d): chfl_status;
    // 'chfl_atom' at atom.h:24
    _chfl_atom(name: c_char_ptr): CHFL_ATOM;
    // 'chfl_atom_copy' at atom.h:34
    _chfl_atom_copy(atom: CHFL_ATOM): CHFL_ATOM;
    // 'chfl_atom_from_frame' at atom.h:60
    _chfl_atom_from_frame(frame: CHFL_FRAME, index_lo: number, index_hi: number): CHFL_ATOM;
    // 'chfl_atom_from_topology' at atom.h:83
    _chfl_atom_from_topology(topology: CHFL_TOPOLOGY, index_lo: number, index_hi: number): CHFL_ATOM;
    // 'chfl_atom_mass' at atom.h:94
    _chfl_atom_mass(atom: CHFL_ATOM, mass: c_double_ptr): chfl_status;
    // 'chfl_atom_set_mass' at atom.h:103
    _chfl_atom_set_mass(atom: CHFL_ATOM, mass: c_double): chfl_status;
    // 'chfl_atom_charge' at atom.h:112
    _chfl_atom_charge(atom: CHFL_ATOM, charge: c_double_ptr): chfl_status;
    // 'chfl_atom_set_charge' at atom.h:121
    _chfl_atom_set_charge(atom: CHFL_ATOM, charge: c_double): chfl_status;
    // 'chfl_atom_type' at atom.h:131
    _chfl_atom_type(atom: CHFL_ATOM, type: c_char_ptr, buffsize_lo: number, buffsize_hi: number): chfl_status;
    // 'chfl_atom_set_type' at atom.h:142
    _chfl_atom_set_type(atom: CHFL_ATOM, type: c_char_ptr): chfl_status;
    // 'chfl_atom_name' at atom.h:152
    _chfl_atom_name(atom: CHFL_ATOM, name: c_char_ptr, buffsize_lo: number, buffsize_hi: number): chfl_status;
    // 'chfl_atom_set_name' at atom.h:163
    _chfl_atom_set_name(atom: CHFL_ATOM, name: c_char_ptr): chfl_status;
    // 'chfl_atom_full_name' at atom.h:173
    _chfl_atom_full_name(atom: CHFL_ATOM, name: c_char_ptr, buffsize_lo: number, buffsize_hi: number): chfl_status;
    // 'chfl_atom_vdw_radius' at atom.h:185
    _chfl_atom_vdw_radius(atom: CHFL_ATOM, radius: c_double_ptr): chfl_status;
    // 'chfl_atom_covalent_radius' at atom.h:195
    _chfl_atom_covalent_radius(atom: CHFL_ATOM, radius: c_double_ptr): chfl_status;
    // 'chfl_atom_atomic_number' at atom.h:205
    _chfl_atom_atomic_number(atom: CHFL_ATOM, number: c_uint64_ptr): chfl_status;
    // 'chfl_atom_properties_count' at atom.h:212
    _chfl_atom_properties_count(atom: CHFL_ATOM, count: c_uint64_ptr): chfl_status;
    // 'chfl_atom_list_properties' at atom.h:228
    _chfl_atom_list_properties(atom: CHFL_ATOM, names: c_char_ptr_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_atom_set_property' at atom.h:240
    _chfl_atom_set_property(atom: CHFL_ATOM, name: c_char_ptr, property: CHFL_PROPERTY): chfl_status;
    // 'chfl_atom_get_property' at atom.h:254
    _chfl_atom_get_property(atom: CHFL_ATOM, name: c_char_ptr): CHFL_PROPERTY;
    // 'chfl_residue' at residue.h:25
    _chfl_residue(name: c_char_ptr): CHFL_RESIDUE;
    // 'chfl_residue_with_id' at residue.h:35
    _chfl_residue_with_id(name: c_char_ptr, resid_lo: number, resid_hi: number): CHFL_RESIDUE;
    // 'chfl_residue_from_topology' at residue.h:63
    _chfl_residue_from_topology(topology: CHFL_TOPOLOGY, i_lo: number, i_hi: number): CHFL_RESIDUE;
    // 'chfl_residue_for_atom' at residue.h:90
    _chfl_residue_for_atom(topology: CHFL_TOPOLOGY, i_lo: number, i_hi: number): CHFL_RESIDUE;
    // 'chfl_residue_copy' at residue.h:102
    _chfl_residue_copy(residue: CHFL_RESIDUE): CHFL_RESIDUE;
    // 'chfl_residue_atoms_count' at residue.h:109
    _chfl_residue_atoms_count(residue: CHFL_RESIDUE, count: c_uint64_ptr): chfl_status;
    // 'chfl_residue_atoms' at residue.h:123
    _chfl_residue_atoms(residue: CHFL_RESIDUE, atoms: c_uint64_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_residue_id' at residue.h:136
    _chfl_residue_id(residue: CHFL_RESIDUE, id: c_int64_ptr): chfl_status;
    // 'chfl_residue_name' at residue.h:148
    _chfl_residue_name(residue: CHFL_RESIDUE, name: c_char_ptr, buffsize_lo: number, buffsize_hi: number): chfl_status;
    // 'chfl_residue_add_atom' at residue.h:157
    _chfl_residue_add_atom(residue: CHFL_RESIDUE, i_lo: number, i_hi: number): chfl_status;
    // 'chfl_residue_contains' at residue.h:167
    _chfl_residue_contains(residue: CHFL_RESIDUE, i_lo: number, i_hi: number, result: c_bool_ptr): chfl_status;
    // 'chfl_residue_properties_count' at residue.h:176
    _chfl_residue_properties_count(residue: CHFL_RESIDUE, count: c_uint64_ptr): chfl_status;
    // 'chfl_residue_list_properties' at residue.h:192
    _chfl_residue_list_properties(residue: CHFL_RESIDUE, names: c_char_ptr_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_residue_set_property' at residue.h:204
    _chfl_residue_set_property(residue: CHFL_RESIDUE, name: c_char_ptr, property: CHFL_PROPERTY): chfl_status;
    // 'chfl_residue_get_property' at residue.h:218
    _chfl_residue_get_property(residue: CHFL_RESIDUE, name: c_char_ptr): CHFL_PROPERTY;
    // 'chfl_topology' at topology.h:25
    _chfl_topology(): CHFL_TOPOLOGY;
    // 'chfl_topology_from_frame' at topology.h:38
    _chfl_topology_from_frame(frame: CHFL_FRAME): CHFL_TOPOLOGY;
    // 'chfl_topology_copy' at topology.h:48
    _chfl_topology_copy(topology: CHFL_TOPOLOGY): CHFL_TOPOLOGY;
    // 'chfl_topology_atoms_count' at topology.h:56
    _chfl_topology_atoms_count(topology: CHFL_TOPOLOGY, count: c_uint64_ptr): chfl_status;
    // 'chfl_topology_resize' at topology.h:68
    _chfl_topology_resize(topology: CHFL_TOPOLOGY, natoms_lo: number, natoms_hi: number): chfl_status;
    // 'chfl_topology_add_atom' at topology.h:75
    _chfl_topology_add_atom(topology: CHFL_TOPOLOGY, atom: CHFL_ATOM): chfl_status;
    // 'chfl_topology_remove' at topology.h:86
    _chfl_topology_remove(topology: CHFL_TOPOLOGY, i_lo: number, i_hi: number): chfl_status;
    // 'chfl_topology_bonds_count' at topology.h:95
    _chfl_topology_bonds_count(topology: CHFL_TOPOLOGY, count: c_uint64_ptr): chfl_status;
    // 'chfl_topology_angles_count' at topology.h:104
    _chfl_topology_angles_count(topology: CHFL_TOPOLOGY, count: c_uint64_ptr): chfl_status;
    // 'chfl_topology_dihedrals_count' at topology.h:113
    _chfl_topology_dihedrals_count(topology: CHFL_TOPOLOGY, count: c_uint64_ptr): chfl_status;
    // 'chfl_topology_impropers_count' at topology.h:122
    _chfl_topology_impropers_count(topology: CHFL_TOPOLOGY, count: c_uint64_ptr): chfl_status;
    // 'chfl_topology_bonds' at topology.h:135
    _chfl_topology_bonds(topology: CHFL_TOPOLOGY, data: c_uint64_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_topology_angles' at topology.h:148
    _chfl_topology_angles(topology: CHFL_TOPOLOGY, data: c_uint64_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_topology_dihedrals' at topology.h:162
    _chfl_topology_dihedrals(topology: CHFL_TOPOLOGY, data: c_uint64_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_topology_impropers' at topology.h:176
    _chfl_topology_impropers(topology: CHFL_TOPOLOGY, data: c_uint64_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_topology_add_bond' at topology.h:185
    _chfl_topology_add_bond(topology: CHFL_TOPOLOGY, i_lo: number, i_hi: number, j_lo: number, j_hi: number): chfl_status;
    // 'chfl_topology_remove_bond' at topology.h:197
    _chfl_topology_remove_bond(topology: CHFL_TOPOLOGY, i_lo: number, i_hi: number, j_lo: number, j_hi: number): chfl_status;
    // 'chfl_topology_clear_bonds' at topology.h:207
    _chfl_topology_clear_bonds(topology: CHFL_TOPOLOGY): chfl_status;
    // 'chfl_topology_residues_count' at topology.h:215
    _chfl_topology_residues_count(topology: CHFL_TOPOLOGY, count: c_uint64_ptr): chfl_status;
    // 'chfl_topology_add_residue' at topology.h:227
    _chfl_topology_add_residue(topology: CHFL_TOPOLOGY, residue: CHFL_RESIDUE): chfl_status;
    // 'chfl_topology_residues_linked' at topology.h:238
    _chfl_topology_residues_linked(topology: CHFL_TOPOLOGY, first: CHFL_RESIDUE, second: CHFL_RESIDUE, result: c_bool_ptr): chfl_status;
    // 'chfl_topology_bond_with_order' at topology.h:251
    _chfl_topology_bond_with_order(topology: CHFL_TOPOLOGY, i_lo: number, i_hi: number, j_lo: number, j_hi: number, bond_order: chfl_bond_order): chfl_status;
    // 'chfl_topology_bond_orders' at topology.h:265
    _chfl_topology_bond_orders(topology: CHFL_TOPOLOGY, orders: chfl_bond_order_ptr, nbonds_lo: number, nbonds_hi: number): chfl_status;
    // 'chfl_topology_bond_order' at topology.h:278
    _chfl_topology_bond_order(topology: CHFL_TOPOLOGY, i_lo: number, i_hi: number, j_lo: number, j_hi: number, order: chfl_bond_order_ptr): chfl_status;
    // 'chfl_cell' at cell.h:40
    _chfl_cell(lengths: chfl_vector3d, angles: chfl_vector3d): CHFL_CELL;
    // 'chfl_cell_from_matrix' at cell.h:55
    _chfl_cell_from_matrix(matrix: chfl_vector3d): CHFL_CELL;
    // 'chfl_cell_from_frame' at cell.h:68
    _chfl_cell_from_frame(frame: CHFL_FRAME): CHFL_CELL;
    // 'chfl_cell_copy' at cell.h:78
    _chfl_cell_copy(cell: CHFL_CELL): CHFL_CELL;
    // 'chfl_cell_volume' at cell.h:85
    _chfl_cell_volume(cell: CHFL_CELL, volume: c_double_ptr): chfl_status;
    // 'chfl_cell_lengths' at cell.h:94
    _chfl_cell_lengths(cell: CHFL_CELL, lengths: chfl_vector3d): chfl_status;
    // 'chfl_cell_set_lengths' at cell.h:110
    _chfl_cell_set_lengths(cell: CHFL_CELL, lengths: chfl_vector3d): chfl_status;
    // 'chfl_cell_angles' at cell.h:119
    _chfl_cell_angles(cell: CHFL_CELL, angles: chfl_vector3d): chfl_status;
    // 'chfl_cell_set_angles' at cell.h:137
    _chfl_cell_set_angles(cell: CHFL_CELL, angles: chfl_vector3d): chfl_status;
    // 'chfl_cell_matrix' at cell.h:146
    _chfl_cell_matrix(cell: CHFL_CELL, matrix: chfl_vector3d): chfl_status;
    // 'chfl_cell_shape' at cell.h:155
    _chfl_cell_shape(cell: CHFL_CELL, shape: chfl_cellshape_ptr): chfl_status;
    // 'chfl_cell_set_shape' at cell.h:164
    _chfl_cell_set_shape(cell: CHFL_CELL, shape: chfl_cellshape): chfl_status;
    // 'chfl_cell_wrap' at cell.h:173
    _chfl_cell_wrap(cell: CHFL_CELL, vector: chfl_vector3d): chfl_status;
    // 'chfl_frame' at frame.h:25
    _chfl_frame(): CHFL_FRAME;
    // 'chfl_frame_copy' at frame.h:35
    _chfl_frame_copy(frame: CHFL_FRAME): CHFL_FRAME;
    // 'chfl_frame_atoms_count' at frame.h:43
    _chfl_frame_atoms_count(frame: CHFL_FRAME, count: c_uint64_ptr): chfl_status;
    // 'chfl_frame_positions' at frame.h:62
    _chfl_frame_positions(frame: CHFL_FRAME, positions: chfl_vector3d, size: c_uint64_ptr): chfl_status;
    // 'chfl_frame_velocities' at frame.h:85
    _chfl_frame_velocities(frame: CHFL_FRAME, velocities: chfl_vector3d, size: c_uint64_ptr): chfl_status;
    // 'chfl_frame_add_atom' at frame.h:97
    _chfl_frame_add_atom(frame: CHFL_FRAME, atom: CHFL_ATOM, position: chfl_vector3d, velocity: chfl_vector3d): chfl_status;
    // 'chfl_frame_remove' at frame.h:110
    _chfl_frame_remove(frame: CHFL_FRAME, i_lo: number, i_hi: number): chfl_status;
    // 'chfl_frame_resize' at frame.h:122
    _chfl_frame_resize(frame: CHFL_FRAME, size_lo: number, size_hi: number): chfl_status;
    // 'chfl_frame_add_velocities' at frame.h:134
    _chfl_frame_add_velocities(frame: CHFL_FRAME): chfl_status;
    // 'chfl_frame_has_velocities' at frame.h:142
    _chfl_frame_has_velocities(frame: CHFL_FRAME, has_velocities: c_bool_ptr): chfl_status;
    // 'chfl_frame_set_cell' at frame.h:151
    _chfl_frame_set_cell(frame: CHFL_FRAME, cell: CHFL_CELL): chfl_status;
    // 'chfl_frame_set_topology' at frame.h:163
    _chfl_frame_set_topology(frame: CHFL_FRAME, topology: CHFL_TOPOLOGY): chfl_status;
    // 'chfl_frame_step' at frame.h:173
    _chfl_frame_step(frame: CHFL_FRAME, step: c_uint64_ptr): chfl_status;
    // 'chfl_frame_set_step' at frame.h:182
    _chfl_frame_set_step(frame: CHFL_FRAME, step_lo: number, step_hi: number): chfl_status;
    // 'chfl_frame_guess_bonds' at frame.h:194
    _chfl_frame_guess_bonds(frame: CHFL_FRAME): chfl_status;
    // 'chfl_frame_distance' at frame.h:203
    _chfl_frame_distance(frame: CHFL_FRAME, i_lo: number, i_hi: number, j_lo: number, j_hi: number, distance: c_double_ptr): chfl_status;
    // 'chfl_frame_angle' at frame.h:214
    _chfl_frame_angle(frame: CHFL_FRAME, i_lo: number, i_hi: number, j_lo: number, j_hi: number, k_lo: number, k_hi: number, angle: c_double_ptr): chfl_status;
    // 'chfl_frame_dihedral' at frame.h:225
    _chfl_frame_dihedral(frame: CHFL_FRAME, i_lo: number, i_hi: number, j_lo: number, j_hi: number, k_lo: number, k_hi: number, m_lo: number, m_hi: number, dihedral: c_double_ptr): chfl_status;
    // 'chfl_frame_out_of_plane' at frame.h:239
    _chfl_frame_out_of_plane(frame: CHFL_FRAME, i_lo: number, i_hi: number, j_lo: number, j_hi: number, k_lo: number, k_hi: number, m_lo: number, m_hi: number, distance: c_double_ptr): chfl_status;
    // 'chfl_frame_properties_count' at frame.h:248
    _chfl_frame_properties_count(frame: CHFL_FRAME, count: c_uint64_ptr): chfl_status;
    // 'chfl_frame_list_properties' at frame.h:264
    _chfl_frame_list_properties(frame: CHFL_FRAME, names: c_char_ptr_ptr, count_lo: number, count_hi: number): chfl_status;
    // 'chfl_frame_set_property' at frame.h:276
    _chfl_frame_set_property(frame: CHFL_FRAME, name: c_char_ptr, property: CHFL_PROPERTY): chfl_status;
    // 'chfl_frame_get_property' at frame.h:290
    _chfl_frame_get_property(frame: CHFL_FRAME, name: c_char_ptr): CHFL_PROPERTY;
    // 'chfl_frame_add_bond' at frame.h:299
    _chfl_frame_add_bond(frame: CHFL_FRAME, i_lo: number, i_hi: number, j_lo: number, j_hi: number): chfl_status;
    // 'chfl_frame_bond_with_order' at frame.h:309
    _chfl_frame_bond_with_order(frame: CHFL_FRAME, i_lo: number, i_hi: number, j_lo: number, j_hi: number, bond_order: chfl_bond_order): chfl_status;
    // 'chfl_frame_remove_bond' at frame.h:321
    _chfl_frame_remove_bond(frame: CHFL_FRAME, i_lo: number, i_hi: number, j_lo: number, j_hi: number): chfl_status;
    // 'chfl_frame_clear_bonds' at frame.h:331
    _chfl_frame_clear_bonds(frame: CHFL_FRAME): chfl_status;
    // 'chfl_frame_add_residue' at frame.h:341
    _chfl_frame_add_residue(frame: CHFL_FRAME, residue: CHFL_RESIDUE): chfl_status;
    // 'chfl_trajectory_open' at trajectory.h:26
    _chfl_trajectory_open(path: c_char_ptr, mode: c_char): CHFL_TRAJECTORY;
    // 'chfl_trajectory_with_format' at trajectory.h:43
    _chfl_trajectory_with_format(path: c_char_ptr, mode: c_char, format: c_char_ptr): CHFL_TRAJECTORY;
    // 'chfl_trajectory_memory_reader' at trajectory.h:59
    _chfl_trajectory_memory_reader(memory: c_char_ptr, size_lo: number, size_hi: number, format: c_char_ptr): CHFL_TRAJECTORY;
    // 'chfl_trajectory_memory_writer' at trajectory.h:74
    _chfl_trajectory_memory_writer(format: c_char_ptr): CHFL_TRAJECTORY;
    // 'chfl_trajectory_path' at trajectory.h:86
    _chfl_trajectory_path(trajectory: CHFL_TRAJECTORY, path: c_char_ptr, buffsize_lo: number, buffsize_hi: number): chfl_status;
    // 'chfl_trajectory_read' at trajectory.h:98
    _chfl_trajectory_read(trajectory: CHFL_TRAJECTORY, frame: CHFL_FRAME): chfl_status;
    // 'chfl_trajectory_read_step' at trajectory.h:110
    _chfl_trajectory_read_step(trajectory: CHFL_TRAJECTORY, step_lo: number, step_hi: number, frame: CHFL_FRAME): chfl_status;
    // 'chfl_trajectory_write' at trajectory.h:119
    _chfl_trajectory_write(trajectory: CHFL_TRAJECTORY, frame: CHFL_FRAME): chfl_status;
    // 'chfl_trajectory_set_topology' at trajectory.h:130
    _chfl_trajectory_set_topology(trajectory: CHFL_TRAJECTORY, topology: CHFL_TOPOLOGY): chfl_status;
    // 'chfl_trajectory_topology_file' at trajectory.h:144
    _chfl_trajectory_topology_file(trajectory: CHFL_TRAJECTORY, path: c_char_ptr, format: c_char_ptr): chfl_status;
    // 'chfl_trajectory_set_cell' at trajectory.h:154
    _chfl_trajectory_set_cell(trajectory: CHFL_TRAJECTORY, cell: CHFL_CELL): chfl_status;
    // 'chfl_trajectory_nsteps' at trajectory.h:164
    _chfl_trajectory_nsteps(trajectory: CHFL_TRAJECTORY, nsteps: c_uint64_ptr): chfl_status;
    // 'chfl_trajectory_memory_buffer' at trajectory.h:178
    _chfl_trajectory_memory_buffer(trajectory: CHFL_TRAJECTORY, data: c_char_ptr_ptr, size: c_uint64_ptr): chfl_status;
    // 'chfl_trajectory_close' at trajectory.h:188
    _chfl_trajectory_close(trajectory: CHFL_TRAJECTORY): void;
    // 'chfl_selection' at selection.h:24
    _chfl_selection(selection: c_char_ptr): CHFL_SELECTION;
    // 'chfl_selection_copy' at selection.h:37
    _chfl_selection_copy(selection: CHFL_SELECTION): CHFL_SELECTION;
    // 'chfl_selection_size' at selection.h:49
    _chfl_selection_size(selection: CHFL_SELECTION, size: c_uint64_ptr): chfl_status;
    // 'chfl_selection_string' at selection.h:62
    _chfl_selection_string(selection: CHFL_SELECTION, string: c_char_ptr, buffsize_lo: number, buffsize_hi: number): chfl_status;
    // 'chfl_selection_evaluate' at selection.h:75
    _chfl_selection_evaluate(selection: CHFL_SELECTION, frame: CHFL_FRAME, n_matches: c_uint64_ptr): chfl_status;
    // 'chfl_selection_matches' at selection.h:87
    _chfl_selection_matches(selection: CHFL_SELECTION, matches: chfl_match_ptr, n_matches_lo: number, n_matches_hi: number): chfl_status;
}

