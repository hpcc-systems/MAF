# Feature: AWS: ECS Test
#     Scenario: List ECS by Family
#         When ecs cluster "telematics-us-qa-fcra-ecs-cluster" exists
#         And ecs cluster "abcsdwr" does not exist

#     Scenario: Check if ECS taskDefinition exists
#         When ecs taskDefinition "telematics-us-qa-fcra-vei-fgs-000000" exists
#         And ecs taskDefinition "telematics-us-qa-fcra-vei-fgs-000003" does not exist

#     Scenario: 
#         When information from ecs cluster "telematics-us-qa-fcra-ecs-cluster" is retrieved