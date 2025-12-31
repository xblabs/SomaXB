import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const production = !process.env.ROLLUP_WATCH;

const createConfig = (input, output) => ({
    input,
    output: {
        file: output,
        format: 'iife',
        name: 'app',
        sourcemap: !production
    },
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            sourceMap: !production,
            inlineSources: !production,
            declaration: false,
            declarationMap: false
        }),
        resolve({
            extensions: ['.ts', '.js']
        }),
        commonjs()
    ]
});

export default [
    // Helloworld example
    createConfig(
        'examples/helloworld/ts/helloworld.ts',
        'examples/helloworld/dist/helloworld.js'
    ),
    // Color example
    createConfig(
        'examples/color/ts/color.ts',
        'examples/color/dist/color.js'
    ),
    // Orientation example
    createConfig(
        'examples/orientation/ts/app.ts',
        'examples/orientation/dist/app.js'
    ),
    // Router example
    createConfig(
        'examples/router/ts/app.ts',
        'examples/router/dist/app.js'
    )
];
