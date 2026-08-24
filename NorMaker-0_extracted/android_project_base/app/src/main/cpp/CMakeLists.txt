cmake_minimum_required(VERSION 3.22.1)
project(gm82_android C)

add_library(gm82_android SHARED
    gm82_android_core.c
    gm82_gmk_reader.c
    gm82_portable_compat.c
    gml_frontend.c
    gml_vm.c
    nor_format_native.c
    retro_rom_native.c
)

target_include_directories(gm82_android PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
target_compile_features(gm82_android PRIVATE c_std_11)
target_compile_options(gm82_android PRIVATE -Wall -Wextra -Wno-unused-parameter)
target_link_libraries(gm82_android android log jnigraphics z m)
