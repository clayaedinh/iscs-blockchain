/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class CloudComputing extends Contract {
    
    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    async IssueBill(ctx, id, website, domain, transactionAmnt) {
        
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The bill ${id} already exists`);
        }
        
        const bill = {
            ID: id,
            Website: website,
            Domain: domain,
            TransactionAmnt: transactionAmnt,
            Paid: false
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(bill))));
        return JSON.stringify(bill);
    }
    
    
    async ReadBill(ctx, id) {
        const billJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!billJSON || billJSON.length === 0) {
            throw new Error(`The bill ${id} does not exist`);
        }
        return billJSON.toString();
    }
    
    async PayBill(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The bill ${id} does not exist`);
        }
        
        // Check if bill is paid
        const billJSON = await this.ReadBill(ctx, id);
        const bill = JSON.parse(billJSON);
        if (bill.Paid == true){
            throw new Error(`The bill ${id} has already been paid`);
        }
        bill.Paid = true;
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(bill))));
    }

    async GetAllBillsByWebsitePaid(ctx, website) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.Website === website && record.Paid == true){
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
    
    async GetAllBillsByWebsiteUnpaid(ctx, website) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.Website === website && record.Paid == false){
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
    
    async DeleteBill(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The bill ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }
}

module.exports = CloudComputing;
