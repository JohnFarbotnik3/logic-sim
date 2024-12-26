
# -fsanitize=address,undefined \

source ./build-wasm-config.sh

em++ -O0 $COMBINED_SETTINGS $EXPORT_METHODS \
-sWARN_UNALIGNED=1 -sNO_DISABLE_EXCEPTION_CATCHING -sNO_EXIT_RUNTIME -sSAFE_HEAP -sASSERTIONS=2 \
-Wcast-align -Wover-aligned \
-fsanitize=undefined \
$FILE_INPUT $FILE_OUTPUT
