# Create the report directory if it doesn't exist
mkdir -p test/report

# Run Cucumber.js with the specified options and save the result
npx cucumber-js $EXTRAS -f json:test/report/api.json --require "stepDefinitions/*.js" features/$*
result=$?

# Generate the report
npx multiReport

# Copy the report to the parent MAF directory
mkdir -p ../../test/report
cp -r test/report/* ../../test/report

# Exit with the result of the Cucumber.js command
exit $result
