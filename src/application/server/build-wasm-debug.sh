source ./build-wasm-config.sh

em++ -O0 $COMBINED_SETTINGS \
-sWARN_UNALIGNED=1 -sNO_DISABLE_EXCEPTION_CATCHING -sNO_EXIT_RUNTIME \
-sSTACK_OVERFLOW_CHECK=2 -sEXCEPTION_DEBUG=1 \
-Wcast-align -Wover-aligned \
-fsanitize=undefined \
-sSAFE_HEAP -sASSERTIONS=2 \
$FILE_INPUT $FILE_OUTPUT
