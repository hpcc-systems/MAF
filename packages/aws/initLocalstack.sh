#Create a test bucket
aws --endpoint-url=http://${LOCALSTACKHOST}:4572 s3 mb s3://testScriptbucket
aws --endpoint-url=http://${LOCALSTACKHOST}:4572 s3 ls

#Create a test table
aws --endpoint-url=http://${LOCALSTACKHOST}:4569 dynamodb create-table \
    --table-name testtable \
    --attribute-definitions AttributeName=label,AttributeType="S" \
    --key-schema AttributeName=label,KeyType="HASH" \
    --provisioned-throughput ReadCapacityUnits=2,WriteCapacityUnits=2 \
    >/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4569 dynamodb list-tables

