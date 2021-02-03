
if [[ "$ENVIRONMENT" == "CI" ]]; then
  bash runFeatureCI.sh $*
elif [[ "$ENVIRONMENT" == "COVERAGE" ]]; then
  bash runFeatureCoverage.sh $*
else
  bash runFeatureHTML.sh $*
fi
  exit $?

