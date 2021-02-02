#!bin/bash
cd packages/preprocessor
npm run tsc
cd -
cd packages
node createAutoComplete.js
