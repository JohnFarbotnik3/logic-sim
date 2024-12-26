
source ./build-wasm-config.sh

em++ -O2 $COMBINED_SETTINGS $EXPORT_METHODS $FILE_INPUT $FILE_OUTPUT
