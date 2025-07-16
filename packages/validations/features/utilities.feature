Feature: Validations: Utility Functions and Helpers
  Background:
    When set "directory" to "./test"

  Scenario: Wait functionality
    When wait 5 milliseconds

  Scenario: Set examples from scenario outline
    When set examples

  Scenario Outline: Example setting with single table
    When set "directory" to "./test"
    When set examples
    Then item "<Expected>" is equal to "<ExpectedResult>"
    Examples:
      | Phone | Expected | ExpectedResult |
      | 1     | Phone    | 1              |

    Examples:
      | Next | Expected | ExpectedResult |
      | 2    | Next     | 2              |
      | 3    | Next     | 3              |

    Examples:
      | Next | Expected | ExpectedResult | Bla |
      | 2    | Next     | 2              | 5   |
      | 3    | Next     | 3              | 6   |

  Scenario Outline: Example setting with variable initialization
    When set "a" to 5
    When set examples
    Then item "<Expected>" is equal to "<ExpectedResult>"
    Examples:
      | Phone | Expected | ExpectedResult |
      | 1     | Phone    | 1              |

  Scenario: Examples with background steps
    When set "a" to 5
    When set examples
