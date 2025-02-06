Feature: Validations: Luxon
  Scenario: Test Luxon
    Given set "currentDate" to '${DateTime.now().toFormat("yyyy-MM-dd")}'
    Then item "currentDate" is equal to '${new Date().toISOString().slice(0,10)}'
    And item "currentDate" is not equal to '${DateTime.now().plus({days: 1}).toFormat("yyyy-MM-dd")}'
    