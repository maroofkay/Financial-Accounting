const Models = require('./models/models')
var client;

function sockets (io) {
    io.on('connection', function (client) {
        notificationOfAllJournalEntries();
        generateTAccounts();
    
        client.on('add-journal-entry', function (entry) {
            Models.JournalEntry.create(entry).then(function (journalEntry) {
                generateTAccounts ();
                notificationOfANewJournalEntry(journalEntry);
            });
        });
        
        function notificationOfAllJournalEntries () {
            Models.JournalEntry.find().sort({ _id : -1 }).exec().then(function (entries) {
                entries.forEach(function(entry) {
                    notificationOfNewJournalEntry (entry);
                })
            });
        }
        
        function generateTAccounts () {
            Models.JournalEntry.find().exec().then(function (entries) {
                var trailBalances = [];
                var t_accounts = generateTAccountsFromJournalEntries (entries);
                for (var i = 0; i < t_accounts.length; i++) {
                    var account = t_accounts[i];
                    notificationOfTAccount (account);
                    var trailBalance = {  
                        title   : account.title,
                        debit   : (account.intBalance() >= 0) ? account.intBalance() : null,
                        credit  : (account.intBalance() < 0) ? (account.intBalance() * -1) : null
                    };
                    trailBalances.push(trailBalance);
                }
                notificationOfTrailBalance(trailBalances);
                generateIncomeStatement(t_accounts);
                        
            });
        }
        
        function generateIncomeStatement (t_accounts) {
            var revenue_accounts = find_accounts(4, t_accounts);
            var expense_accounts = find_accounts(1, t_accounts);
            var total_revenue = total_of_accounts(revenue_accounts);
            var total_expense = total_of_accounts(expense_accounts);
            
            var income_statement = {
                revenue_accounts: revenue_accounts,
                expense_accounts: expense_accounts,
                total_revenue   : total_revenue,
                total_expense   : total_expense,
                net_income      : (total_revenue - total_expense)  
            };
            
            notificationOfIncomeStatement(income_statement);
        }
        
        function generateBalanceStatement (t_accounts) {
            var assets_accounts = find_accounts(0, t_accounts);
            var liability_accounts = find_accounts(2, t_accounts);
            var capital_equity_accounts = find_accounts(3, t_accounts);
            
            var total_assets = total_of_accounts(assets_accounts);
            var total_liability = total_of_accounts(liability_accounts);
            var total_capital_equity = total_of_accounts(capital_equity_accounts);

            var statement = (total_assets == (total_liability + total_capital_equity)) ? "It's balanced" : "Your entries maybe wrong. The sheet is not balanced.";
            
            var balance_sheet = {
                assets_accounts         : assets_accounts,
                liability_accounts      : liability_accounts,
                capital_equity_accounts : capital_equity_accounts,
                total_assets            : total_assets,
                total_liability         : total_liability,
                total_capital_equity    : total_capital_equity,
                statement               : statement
            };
            
            notificationOfBalanceSheet(balance_sheet);
                        
        }
        
        function total_of_accounts (accounts) {
            var sum = 0;
            for (var i = 0; i < accounts.length; i++)
                sum += accounts[i].intBalance();
            
            return sum;
        } 
        
        function find_accounts (type, accounts) {
            var accounts_of_type = [];
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].type == type) accounts_of_type.push(accounts[i]);
            }
            return accounts_of_type;
        }
        
        function generateTAccountsFromJournalEntries (entries) {
            var tAccounts = []
            for (var i = 0; i < entries.length; i++) {
                const entry = entries[i];
                for (var j = 0; j < entry.transactions.length; j++) {
                    var transaction = entry.transactions[j];
                    function criteria (tAccount) { return tAccount.title == transaction.title; }
                    var account = tAccounts.find(criteria);
                    if (account == null) {
                        account = new Models.TAccount (transaction.title, entry.type);
                        tAccounts.push (account);
                    }
                    if (transaction.type == 0) account.addDebit ({ amount : transaction.amount, serial : (entry._id + 1) });
                    else account.addCredit ({ amount : transaction.amount, serial : (entry._id + 1) });
                    
                }
            }
            return tAccounts;
        }
        
        function notificationOfNewJournalEntry (entry) {
            client.emit('new-journal-entry', entry);
        }
        
        function notificationOfTAccount (tAccount) {
            client.emit('new-taccount', {
                account : tAccount,
                credit  : tAccount.totalCredit(),
                debit   : tAccount.totalDebit(),
                balance : tAccount.balance()
            });
        }
        
        function notificationOfTrailBalance (trailBalance) {
            
            var credit = 0, debit = 0;
            for (var i = 0; i < trailBalance.length; i++) {
                var trail_balance = trailBalance[i];
                if (trail_balance.debit) debit += trail_balance.debit;
                if (trail_balance.credit) credit += trail_balance.credit;
            }
            
            client.emit('trail-balance', {
                trailBalance: trailBalance,
                totalCredit : credit,
                totalDebit  : debit,
                count       : trailBalance.length
            });
        }
        
        function notificationOfIncomeStatement (income_statement) {
            client.emit('income-statement', income_statement);
        }
        
        function notificationOfBalanceSheet (balance_sheet) {
            client.emit('balance-sheet', balance_sheet);
        }
        
    });
}

function forJournalEntries(client) {
}

module.exports = sockets;