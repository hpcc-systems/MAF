Feature: Validations : Set Examples from the scenario outline to be visible
    Scenario Outline: Testing
        When set examples
        Then item "<Expected>" is equal to "<ExpectedResult>"
        Examples:
            | Phone | Expected | ExpectedResult |
            | 1     | Phone | 1              |

        Examples:
            | Next | Expected | ExpectedResult |
            | 2    | Next   | 2              |
            | 3    | Next  | 3              |
        
        Examples:
            | Next | Expected | ExpectedResult | Bla |
            | 2    | Next  | 2              | 5   | 
            | 3    | Next  | 3              | 6   |


    Scenario Outline: Testing
        When set "a" to 5
        When set examples
        Then item "<Expected>" is equal to "<ExpectedResult>"
        Examples:
            | Phone | Expected | ExpectedResult |
            | 1     | Phone | 1              |

