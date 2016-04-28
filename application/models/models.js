'use strict'

var models;
const initiateModels = (function () {
    
    const Mongoose  = require('mongoose'),
        Schema    = Mongoose.Schema,
        Increment = require('mongoose-auto-increment');
        
    Increment.initialize(Mongoose);
    
    const JournalEntry = new Schema({
        date         : Date,
        title        : String,
        type         : Number,
        /* 
        * 0: Asset
        * 1: Expense
        * 2: Liability
        * 3: Owner's Equity / Capital
        * 4: Revenue
        */
        
        transactions : []
        /* Transaction Schema
        * title   : String
        * amount  : Number,
        * unit    : String,
        * type    : Number { 0 : Debit, 1: Credit } 
        */
    });
    JournalEntry.plugin(Increment.plugin, 'JournalEntry');
    
    function TAccount (_title, _type) {
        this.title = _title;
        this.debits = [];
        this.credits = [];
        this.type = _type;
        
        /* 
        * 0: Asset
        * 1: Expense
        * 2: Liability
        * 3: Owner's Equity / Capital
        * 4: Revenue
        */
        
        /* Debit, Credit Schema
        * amount   : Number
        * serial   : Number
        */
        
        this.addDebit = function (debit) {
            this.debits.push (debit);
        }
        this.addCredit = function (credit) {
            this.credits.push (credit);
        }
        
        this.totalDebit = function () {
            const summation = this.debits.reduce(function(previous, current) { return { serial : 0, amount : previous.amount + current.amount }; }, { serial : 0, amount : 0 });
            return summation.amount;
        }
        
        this.totalCredit = function () {
            const summation = this.credits.reduce(function(previous, current) { return { serial : 0, amount : previous.amount + current.amount }; }, { serial : 0, amount : 0 });
            return summation.amount;
        }
        
        this.balance = function () {
            var balance = this.totalCredit() - this.totalDebit();
            return (balance < 0 ? "-" + (balance * -1) : "+" + balance); 
        }
        
        this.intBalance = function () {
            var balance = this.totalCredit() - this.totalDebit();
            return balance;
        }
    }

    // const TAccount = new Schema({
    //     title   : String,
    //     debits  : [],
    //     credits : []
    //     /* Debit, Credit Schema
    //     * amount   : Number
    //     * serial   : Number
    //     */
        
    // });

    // TAccount.methods.totalDebit = function () {
    //     const summation = this.debits.reduce(function(previous, current) { return { name : "DEFAULT", amount : previous.amount + current.amount }; }, { name : "DEFAULT", amount : 0 });
    //     return summation.amount;
    // }

    // TAccount.methods.totalCredit = function () {
    //     const summation = this.credits.reduce(function(previous, current) { return { name : "DEFAULT", amount : previous.amount + current.amount }; }, { name : "DEFAULT", amount : 0 });
    //     return summation.amount;
    // }

    // TAccount.methods.balance = function () {
    //     return this.totalCredit() - this.totalDebit();
    //}
    
	return  {
      JournalEntry 	: Mongoose.model('JournalEntry', JournalEntry),
      TAccount	    : TAccount
    };
});

function getModels() {
    if (!models) models = initiateModels();
	return models;
}

module.exports = getModels();

