module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true
    },
    extends: [
        'standard'
    ],
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        indent: ['error', 4],
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }
        ],
        'no-eval': 'off',
        'no-new-func': 'off'
    }
}
