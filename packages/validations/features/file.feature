Feature: Validations : File writing
  Background:
    When set "directory" to "packages/validations"
  Scenario:
    When set:
    |item|externalReferenceId|
    |hello.json|hello|
    When set "item" to file "hello.json"
    And item "item" is written in json line delimited format to file "hello2.json"
    And the file "hello2.json" is gzipped
    And string "${externalReferenceId}" is written to file "helloWERAWE.txt"
    And set "bla" to:
    """
    HELLO
    WORLD
    """
    And string "${bla}" is written to file "multiLine.txt"
   
