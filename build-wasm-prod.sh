
source ./build-wasm-config.sh

em++ -O2 $BASIC_SETTINGS $EXPORT_METHODS $FILE_INPUT $FILE_OUTPUT
