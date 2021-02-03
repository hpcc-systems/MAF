Feature: Validations : File writing
   Background:
     When set "directory" to "./test"

  Scenario:
    When set:
    |item|externalReferenceId|
    |hello.json|hello|
    When set "item" to file "hello.json"
    And item "item" is written in json line delimited format to file "hello2.json"
    And the file "hello2.json" is gzipped
    And file "hello2.json.gz" is gzip unzipped to file "HELLO_DUPL.txt"
    And string "${externalReferenceId}" is written to file "helloWERAWE.txt"
    And set "bla" to:
    """
    HELLO
    WORLD
    """
    And string "${bla}" is written to file "multiLine.txt"
   
