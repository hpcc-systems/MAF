mkdir -p test/report
if [[ "$ENVIRONMENT" == "COVERAGE" ]]; then
    npx nyc --reporter=lcov --reporter=text cucumber-js $EXTRAS -f json:test/report/postgresql.json --require "stepDefinitions/*.js" $*
else
    npx cucumber-js $EXTRAS -f json:test/report/postgresql.json --require "stepDefinitions/*.js" $*
fi
result=$?
npx multiReport
exit $result