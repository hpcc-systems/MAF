import js from '@eslint/js'
import globals from 'globals'

export default [
    // Global ignores configuration
    {
        ignores: [
            // Node and build output
            'node_modules/',
            'dist/',
            'build/',
            'coverage/',
            'tmp/',
            '**/tmp/',
            // Test and report output
            '**/test/report/',
            '**/report/',
            '**/lcov-report/',
            '**/lcov.info',
            // Documentation and changelogs
            '**/CHANGELOG.md',
            '**/Changelog.md',
            '**/changelog.md',
            '**/README.md',
            '**/LICENSE',
            // Config files
            'eslint.config.mjs',
            'lerna.json',
            // Specific files to ignore
            '**/packages/preprocessor/src/value_checker.js'
        ]
    },
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.commonjs,
                ...globals.es2021
            },
            ecmaVersion: 'latest',
            sourceType: 'commonjs'
        },
        rules: {
            'indent': ['error', 4],
            'space-before-function-paren': [
                'error',
                {
                    'anonymous': 'always',
                    'named': 'never',
                    'asyncArrow': 'always'
                }
            ],
            'semi': ['error', 'never']
        }
    }
]
