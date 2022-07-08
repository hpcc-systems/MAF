Feature: Preprocessor: Create multiple different examples using the preprocessor
  Scenario Outline: Test dynamic examplse
    When set:
    | vin | vrn | name |
    | <VIN> | <VRN> | <name> |
  Examples:
    Apply combinations for json file "./vinStates.json"
    #Apply combinations for json file "vin.json"
    #Apply CSV File "bla.csv" with filter "isGroup('Clear')"
    #Apply CSV File "bla.csv" 
    #Apply CSV File "bla.csv" with filter "(i)=>i.group.toUpperCase() === 'CLEAR'"
  Examples:
    Apply JSON File "./item.json"
    
