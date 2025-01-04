
source /home/developer/Documents/Development/emsdk/emsdk_env.sh

BASIC_SETTINGS="--bind -std=c++20 -sSTACK_SIZE=$((1024*1024)) -sALLOW_MEMORY_GROWTH --no-entry"
MODULE_SETTINGS="-s EXPORT_ES6=1 -sMODULARIZE -s EXPORT_NAME='createEmModule' -sENVIRONMENT='web' -sSINGLE_FILE"
EXPERIMENT_SETTINGS=""
COMBINED_SETTINGS="$BASIC_SETTINGS $MODULE_SETTINGS $EXPERIMENT_SETTINGS"
FILE_INPUT="./GameServer_wasm.cpp"
FILE_OUTPUT="-o ./em_index.js"
