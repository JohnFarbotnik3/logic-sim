source ./build-wasm-config.sh

em++ -O2 $COMBINED_SETTINGS \
-sMINIMAL_RUNTIME=0 \
-DNDEBUG \
$FILE_INPUT $FILE_OUTPUT
