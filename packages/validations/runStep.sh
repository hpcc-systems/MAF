step=$1
cp exampleFeature.txt features/tmp.feature
echo "    $step" >> features/tmp.feature
node node_modules/cucumber/bin/cucumber-js -f json:test/report/cucumber_report.json features/tmp.feature
res=$?
exit $res
