module.exports = function (wallaby) {
	return {
		files: [
			"__mocks__/**/*",
			"src/**/*",
			"test/services/**",
			"test/unit/utils.js"
		],
		tests: [
			"test/**/unit/**/**spec.js"
		],

		compilers: {
			"**/*.js?(x)": wallaby.compilers.babel({})

		},

		env: {
			type: "node",
			runner: "node"
		},

		testFramework: "jest"
	};
};
