cd /home/developer/Documents/Development/Emscripten/emsdk
source ./emsdk_env.sh
cd /home/developer/Documents/Development/Emscripten/logic-sim/LogicSim/src/server

STACK_SIZE=$((1024*1024))

# debug build

clear && \
em++ -O0 --bind -std=c++14 -sSTACK_SIZE=$STACK_SIZE -sALLOW_MEMORY_GROWTH \
-s WARN_UNALIGNED=1 \
-sNO_DISABLE_EXCEPTION_CATCHING \
-sNO_EXIT_RUNTIME \
-Wcast-align -Wover-aligned \
-fsanitize=address,undefined \
./GameServer_wasm.cpp -o ./em_index.html \
-sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
-sASSERTIONS=2 \
&& node serve

# production build

clear && \
em++ -O2 --bind -std=c++14 -sSTACK_SIZE=$STACK_SIZE -sALLOW_MEMORY_GROWTH \
./GameServer_wasm.cpp -o ./em_index.html \
-sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
&& node serve


