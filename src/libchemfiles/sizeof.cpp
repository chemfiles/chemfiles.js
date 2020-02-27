#include <cstdint>
#include <iostream>
#include <string>
#include <algorithm>

void print_size(std::string name, size_t size) {
    std::transform(std::begin(name), std::end(name), std::begin(name), [](char c){
        return static_cast<char>(std::toupper(c));
    });
    std::cout << "export const " << name << " = " << size << ";\n";
}

#define PRINT_SIZE(type) print_size("SIZEOF_" #type, sizeof (type))

int main() {
    PRINT_SIZE(double);
    PRINT_SIZE(bool);
    PRINT_SIZE(uint64_t);

    return 0;
}
