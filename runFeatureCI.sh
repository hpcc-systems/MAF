pwd
npx preprocessor packages/$1 --packageLocation test
cd packages/$1
shift
node node_modules/@ln-maf/preprocessor/exec.js $*  --require "test/**/*.js" tmp/test 
result=$?
cd -
exit $result

