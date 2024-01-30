Feature: ECL Tests
    Tesing ECL config

    Scenario: ECL Config
        Given set "config" to:
        """
        {
            "name": "ecl"
        }
        """
        And set ecl config from item "config"
        