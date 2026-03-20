# cisco-ise

[![npm](https://img.shields.io/npm/v/cisco-ise.svg)](https://www.npmjs.com/package/cisco-ise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-donate-orange.svg)](https://buymeacoffee.com/automatebldrs)

CLI for Cisco ISE (Identity Services Engine) — ERS and OpenAPI operations.

## Installation

```bash
npm install -g cisco-ise
```

## Quick Start

```bash
# Add a cluster
cisco-ise config add lab --host 10.0.0.1 --username admin --password secret --insecure

# Test connection
cisco-ise config test
```

## Status

Under active development. See [docs/](docs/) for design plans.
