cmake_minimum_required(VERSION 3.6)
project(chemfiles.js CXX)

cmake_policy(VERSION 3.6)

message(STATUS "Compiling the C++ library to WASM, this can take a while")

if (${CMAKE_CURRENT_SOURCE_DIR} STREQUAL ${CMAKE_SOURCE_DIR})
    if("${CMAKE_BUILD_TYPE}" STREQUAL "" AND "${CMAKE_CONFIGURATION_TYPES}" STREQUAL "")
        message(STATUS "Setting build type to 'release' as none was specified.")
        set(CMAKE_BUILD_TYPE "release"
            CACHE STRING
            "Choose the type of build, options are: none(CMAKE_CXX_FLAGS or CMAKE_C_FLAGS used) debug release relwithdebinfo minsizerel."
        FORCE)
        set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS release debug relwithdebuginfo minsizerel none)
    endif()
endif()

if(NOT EMSCRIPTEN)
    message(FATAL_ERROR "This CMakeFiles.txt is intended for use with emscripten: run `emcmake cmake .`")
endif()

# Debug-specific flags
set(CHEMFILES_FLAGS_DEBUG "-O0 -s ASSERTIONS=1")
set(CHEMFILES_FLAGS_DEBUG "${CHEMFILES_FLAGS_DEBUG} -s STACK_OVERFLOW_CHECK=1")
set(CHEMFILES_FLAGS_DEBUG "${CHEMFILES_FLAGS_DEBUG} -s SAFE_HEAP=1")

# Release-specific flags
set(CHEMFILES_FLAGS_RELEASE "-Oz -s ASSERTIONS=0")
set(CHEMFILES_FLAGS_RELEASE "${CHEMFILES_FLAGS_RELEASE} -flto")
set(CHEMFILES_FLAGS_RELEASE "${CHEMFILES_FLAGS_RELEASE} -s EVAL_CTORS=1")

# Default flags
set(CHEMFILES_FLAGS "-s ALLOW_MEMORY_GROWTH=1")
set(CHEMFILES_FLAGS "${CHEMFILES_FLAGS} -s ALLOW_TABLE_GROWTH=1")
set(CHEMFILES_FLAGS "${CHEMFILES_FLAGS} -s DISABLE_EXCEPTION_CATCHING=0")
set(CHEMFILES_FLAGS "${CHEMFILES_FLAGS} -s SUPPORT_LONGJMP=0")
set(CHEMFILES_FLAGS "${CHEMFILES_FLAGS} -s SINGLE_FILE=1")
# This fails with Safari WASM VM, cf https://github.com/emscripten-core/emscripten/issues/9842
# set(CHEMFILES_FLAGS "${CHEMFILES_FLAGS} -mnontrapping-fptoint")

# Use the same flags for compiling & linking
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${CHEMFILES_FLAGS}")
set(CMAKE_EXE_LINKER_FLAGS_DEBUG ${CHEMFILES_FLAGS_DEBUG})
set(CMAKE_EXE_LINKER_FLAGS_RELEASE ${CHEMFILES_FLAGS_RELEASE})

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${CHEMFILES_FLAGS}")
set(CMAKE_CXX_FLAGS_DEBUG ${CHEMFILES_FLAGS_DEBUG})
set(CMAKE_CXX_FLAGS_RELEASE ${CHEMFILES_FLAGS_RELEASE})

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${CHEMFILES_FLAGS}")
set(CMAKE_C_FLAGS_DEBUG ${CHEMFILES_FLAGS_DEBUG})
set(CMAKE_C_FLAGS_RELEASE ${CHEMFILES_FLAGS_RELEASE})

# Setup chemfiles build
if(EXISTS "${PROJECT_SOURCE_DIR}/chemfiles/CMakeLists.txt")
    add_subdirectory(chemfiles)
else()
    message(FATAL_ERROR "Missing the chemfiles library. Please run `git submodule update --init`.")
endif()

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
include(src/libchemfiles/exported.cmake)
add_executable(libchemfiles src/libchemfiles/main.cpp)
target_link_libraries(libchemfiles chemfiles)

set(CHEMFILES_LINKER_FLAGS "${CHEMFILES_LINKER_FLAGS} -s EXPORT_NAME='loadChemfiles'")
set(CHEMFILES_LINKER_FLAGS "${CHEMFILES_LINKER_FLAGS} -s NODERAWFS=1 -s MODULARIZE=1 -s EXIT_RUNTIME=1")
set(CHEMFILES_LINKER_FLAGS "${CHEMFILES_LINKER_FLAGS} --minify 0")

set(CHEMFILES_LINKER_FLAGS "${CHEMFILES_LINKER_FLAGS} -s EXPORTED_FUNCTIONS=\"[${EXPORTED_FUNCTIONS}]\"")
set(CHEMFILES_LINKER_FLAGS "${CHEMFILES_LINKER_FLAGS} -s EXTRA_EXPORTED_RUNTIME_METHODS=\"[${EXTRA_EXPORTED_RUNTIME_METHODS}]\"")
set(CHEMFILES_LINKER_FLAGS "${CHEMFILES_LINKER_FLAGS} -s EXTRA_EXPORTED_RUNTIME_METHODS=\"[${EXTRA_EXPORTED_RUNTIME_METHODS}]\"")

set_target_properties(libchemfiles PROPERTIES LINK_FLAGS "${CHEMFILES_LINKER_FLAGS}")
target_link_libraries(libchemfiles nodefs.js)

# Helper executable for getting size of chemfiles types
add_executable(sizeof src/libchemfiles/sizeof.cpp)
set_target_properties(sizeof
    PROPERTIES LINK_FLAGS "-s EXPORTED_FUNCTIONS=\"['_main']\""
)
target_link_libraries(sizeof chemfiles)
