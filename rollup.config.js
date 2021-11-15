import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from "rollup-plugin-terser";
import pkg from './package.json';
import typescript from '@rollup/plugin-typescript';

const date = new Date().toLocaleString('en-GB', { timeZone: 'UTC' }).split(',')[0];
const banner = `/* soma - v${pkg.version} - ${date} - https://github.com/soundstep/soma */`;

const production = !process.env.ROLLUP_WATCH;

export default [
	// browser
	{
        input: 'index.ts',
        external: [
            'signals'
        ],
		output: {
			name: 'soma',
			file: pkg.browser,
			format: 'esm',
			//dir: 'dist/',
			banner,
            globals: {
                'signals': 'signals'
            }
        },
		plugins: [
			resolve(),
            commonjs(),
			typescript( {
				sourceMap: !production,
				inlineSources: !production
			} ),
		]
	},
	// browser minified
	// {
    //     input: 'index.js',
    //     external: [
    //         'signals'
    //     ],
	// 	output: {
	// 		name: 'soma',
	// 		file: pkg.browser.replace('.js', '.min.js'),
	// 		format: 'umd',
	// 		banner,
    //         globals: {
    //             'signals': 'signals'
	// 		}
    //     },
	// 	plugins: [
	// 		resolve(),
    //         commonjs(),
    //         terser({
	// 			output: {
	// 				comments: function(node, comment) {
	// 					var text = comment.value;
	// 					var type = comment.type;
	// 					if (type == "comment2") {
	// 						// keep banner
	// 						return /github.com\/soundstep\/soma/i.test(text);
	// 					}
	// 				}
	// 			}
	// 		})
	// 	]
	// },
	// es and cjs
	// {
	// 	input: 'index.js',
	// 	external: [
    //         'signals'
    //     ],
	// 	output: [
	// 		{ file: pkg.main, format: 'cjs' },
	// 		{ file: pkg.module, format: 'es' }
	// 	]
	// }
];
