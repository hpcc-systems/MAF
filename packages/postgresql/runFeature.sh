mkdir -p test/report
if [[ "$ENVIRONMENT" == "COVERAGE" ]]; then
    npx nyc --reporter=lcov --reporter=text cucumber-js $EXTRAS -f json:test/report/aws.json --require "stepDefinitions/*.js" features/$*
else
    npx cucumber-js $EXTRAS -f json:test/report/postgresql.json --require "stepDefinitions/*.js" features/$*
fi
result=$?
npx multiReport
exit $result