
source /home/developer/Documents/Development/emsdk/emsdk_env.sh

BASIC_SETTINGS="--bind -std=c++17 -sSTACK_SIZE=$((1024*1024)) -sALLOW_MEMORY_GROWTH --no-entry"
MODULE_SETTINGS="-s EXPORT_ES6=1 -sMODULARIZE -s EXPORT_NAME='createEmModule' -sENVIRONMENT='web,node' -sSINGLE_FILE"
COMBINED_SETTINGS="$BASIC_SETTINGS $MODULE_SETTINGS"
EXPORT_METHODS="-sEXPORTED_RUNTIME_METHODS=ccall,cwrap"
FILE_INPUT="./GameServer_wasm.cpp"
FILE_OUTPUT="-o ./em_index.js"
