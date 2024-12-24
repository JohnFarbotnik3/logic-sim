
cd /home/developer/Documents/Development/emsdk
source ./emsdk_env.sh
cd /home/developer/Documents/Development/LogicSim

BASIC_SETTINGS="--bind -std=c++14 -sSTACK_SIZE=$((1024*1024)) -sALLOW_MEMORY_GROWTH"
EXPORT_METHODS="-sEXPORTED_RUNTIME_METHODS=ccall,cwrap"
FILE_INPUT="./src/server/GameServer_wasm.cpp"
FILE_OUTPUT="-o ./src/server/em_index.js"
