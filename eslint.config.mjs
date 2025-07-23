import js from '@eslint/js'
import globals from 'globals'

export default [
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
            ]
        }
    }
]
