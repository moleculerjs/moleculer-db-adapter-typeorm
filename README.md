[![Codacy Badge](https://api.codacy.com/project/badge/Grade/518b3bf84b8c4538b1e133d397ce700b)](https://app.codacy.com/app/dkuida/moleculer-db-adapter-typeorm?utm_source=github.com&utm_medium=referral&utm_content=dkuida/moleculer-db-adapter-typeorm&utm_campaign=Badge_Grade_Dashboard)
[![Build Status](https://travis-ci.com/dkuida/moleculer-db-adapter-typeorm.svg?branch=master)](https://travis-ci.com/dkuida/moleculer-db-adapter-typeorm)
[![Coverage Status](https://coveralls.io/repos/github/dkuida/moleculer-db-adapter-typeorm/badge.svg)](https://coveralls.io/github/dkuida/moleculer-db-adapter-typeorm)
[![Maintainability](https://api.codeclimate.com/v1/badges/48baf794e43b2537a4a0/maintainability)](https://codeclimate.com/github/dkuida/moleculer-db-adapter-typeorm/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/48baf794e43b2537a4a0/test_coverage)](https://codeclimate.com/github/dkuida/moleculer-db-adapter-typeorm/test_coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/dkuida/moleculer-db-adapter-typeorm/badge.svg)](https://snyk.io/test/github/dkuida/moleculer-db-adapter-typeorm)

# moleculer-db-adapter-typeorm [![NPM version](https://img.shields.io/npm/v/moleculer-db-adapter-typeorm.svg)](https://www.npmjs.com/package/moleculer-db-adapter-typeorm)



SQL adapter (Postgres, MySQL, SQLite & MSSQL, Oracle and many more) for Moleculer DB service with [typeorm](https://github.com/typeorm/typeorm).

it is essentially a clone of the great work on adaptor for [Sequelize](https://github.com/moleculerjs/moleculer-db/tree/master/packages/moleculer-db-adapter-sequelize) by the author of the project - since i have a need to use oracle - and i prefer typescript i just created a replace of the project.


it covers only the basics - but when you need more than basics just use the exposed

```javascript 1.8
service.adapter.repository;
```

# Features

# Install

```bash
$ npm install moleculer-db-adapter-typeorm --save
```


## Usage

examples folder - obviously the idea to use typescript throughout all the workflow


# Test
```
$ npm test
```

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).
