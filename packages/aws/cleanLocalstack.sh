#!/bin/bash
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testScriptbucket --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket2 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket3 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket4 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket5 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket6 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket7 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket8 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket9 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket10 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 s3 rb s3://testbucket11 --force 2>/dev/null
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 dynamodb delete-table --table-name testtable >/dev/null 2>&1
aws --endpoint-url=http://${LOCALSTACKHOST}:4566 dynamodb list-tables
aws --endpoint-url=http://${LOCALSTACKHOST}:4576 sqs delete-queue --queue-url http://${LOCALSTACKHOST}:4576/queue/testQueue
aws --endpoint-url=http://${LOCALSTACKHOST}:4576 sqs delete-queue --queue-url http://${LOCALSTACKHOST}:4576/queue/testQueue2
