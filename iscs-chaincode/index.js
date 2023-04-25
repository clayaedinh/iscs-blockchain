/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const cloudComputing = require('./lib/cloudComputing');

module.exports.CloudComputing = cloudComputing;
module.exports.contracts = [cloudComputing];
