npx multiReport
# Create the report directory if it doesn't exist
mkdir -p test/report

# Run Cucumber.js, optionally with nyc for code coverage if TEST_COVERAGE is set
if [ "$TEST_COVERAGE" = "1" ]; then
  npx nyc --reporter=lcov --reporter=text --report-dir=../../coverage npx cucumber-js $EXTRAS -f json:test/report/postgresql.json --require "stepDefinitions/*.js" features/$FEATURE_FILE
  result=$?
else
  npx cucumber-js $EXTRAS -f json:test/report/postgresql.json --require "stepDefinitions/*.js" features/$FEATURE_FILE
  result=$?
fi

# Generate the report
npx multiReport

# Copy the report to the parent MAF directory
mkdir -p ../../test/report
cp -r test/report/* ../../test/report

# Exit with the result of the Cucumber.js command
exit $result