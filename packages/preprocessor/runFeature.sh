mkdir -p test/report
npx preprocessor --src './'
if [[ "$ENVIRONMENT" == "COVERAGE" ]]; then
    npx nyc --reporter=lcov --reporter=text cucumber-js $EXTRAS -f json:test/report/preprocessor.json --require "stepDefinitions/*.js" tmp/features/$*
else
    npx cucumber-js $EXTRAS -f json:test/report/preprocessor.json --require "stepDefinitions/*.js" tmp/features/$*
fi
result=$?
npx multiReport
exit $result