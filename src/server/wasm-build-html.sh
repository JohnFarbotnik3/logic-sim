cd /home/developer/Documents/Development/Emscripten/emsdk
source ./emsdk_env.sh
cd /home/developer/Documents/Development/Emscripten/logic-sim/LogicSim/src/server

# debug build

clear && \
em++ -O0 --bind -std=c++14 \
-s WARN_UNALIGNED=1 \
-sNO_DISABLE_EXCEPTION_CATCHING \
-Wcast-align -Wover-aligned \
-sSTACK_SIZE=$((1024*1024)) \
./GameServer_wasm.cpp -o ./em_index.html \
-sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
-sASSERTIONS=2 \
&& node serve

# production build

clear && \
em++ -O2 --bind -std=c++14 \
-sSTACK_SIZE=$((1024*1024)) \
./GameServer_wasm.cpp -o ./em_index.html \
-sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
&& node serve


