#!/usr/bin/env python
"""
Generate exported.cmake file containing all functions in chemfiles.h
"""
import os

IGNORED = []
ROOT = os.path.dirname(os.path.dirname(__file__))


def functions_list():
    path = os.path.join(ROOT, "chemfiles", "include", "chemfiles", "capi")

    functions = []
    for (dirpath, _, pathes) in os.walk(path):
        for path in pathes:
            with open(os.path.join(dirpath, path)) as fd:
                for line in fd:
                    if "CHFL_EXPORT" in line:
                        name = line.split('(')[0]
                        name = name.split(' ')[-1]
                        functions.append(name)
    return functions


if __name__ == '__main__':
    functions = functions_list()
    with open(os.path.join(ROOT, "exported.cmake"), "w") as fd:
        fd.write("set(EXPORTED_FUNCTIONS\n\"")
        fd.write(", ".join(["'_{}'".format(name) for name in functions]))
        fd.write("\"\n)\n")
