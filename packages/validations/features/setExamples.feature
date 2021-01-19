Feature: Set Examples from the scenario outline to be visible
    Scenario Outline: Testing
        When set examples
        Then "<Expected>" is equal to "<ExpectedResult>"
        @phone
        Examples:
            | Phone | Expected | ExpectedResult |
            | 1     | ${Phone} | 1              |

        @next
        Examples:
            | Next | Expected | ExpectedResult |
            | 2    | ${Next}  | 2              |


