import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import { recalculateBankAccountBalance } from '../services/financialEngine.js';
import { logAudit } from '../utils/auditLogger.js';

export const createBankAccount = async (req, res, next) => {
  try {
    const {
      bankName,
      accountHolderName,
      accountNumber,
      accountType,
      accountNickname,
      ifscCode,
      currency,
      openingBalance,
    } = req.body;

    if (!bankName || !accountHolderName || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank Name, Account Holder Name, and Account Number are required',
      });
    }

    // Mask account number (preserve only last 4 digits)
    const rawDigits = String(accountNumber).replace(/\D/g, '');
    const last4 = rawDigits.slice(-4) || '0000';
    const maskedAccountNumber = `XXXX-XXXX-${last4}`;

    const parsedOpeningBalance = parseFloat(openingBalance) || 0.0;

    const bankAccount = await BankAccount.create({
      workspaceId: req.workspace._id,
      bankName,
      accountHolderName,
      maskedAccountNumber,
      accountType: accountType || 'Savings',
      accountNickname: accountNickname || `${bankName} (${last4})`,
      ifscCode,
      currency: currency || req.workspace.currency || 'INR',
      openingBalance: parsedOpeningBalance,
      currentCalculatedBalance: parsedOpeningBalance,
      isActive: true,
    });

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'BANK_ACCOUNT_CREATED',
      entityType: 'BankAccount',
      entityId: bankAccount._id,
      metadata: { bankName, maskedAccountNumber },
    });

    res.status(201).json({ success: true, bankAccount });
  } catch (err) {
    next(err);
  }
};

export const getBankAccounts = async (req, res, next) => {
  try {
    const accounts = await BankAccount.find({
      workspaceId: req.workspace._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Recalculate balances dynamically to guarantee deterministic freshness
    const accountsWithStats = await Promise.all(
      accounts.map(async (acc) => {
        const freshBalance = await recalculateBankAccountBalance(acc._id, req.workspace._id);
        const txCount = await Transaction.countDocuments({
          bankAccountId: acc._id,
          workspaceId: req.workspace._id,
        });

        return {
          ...acc.toObject(),
          currentCalculatedBalance: freshBalance,
          transactionCount: txCount,
        };
      })
    );

    res.json({ success: true, accounts: accountsWithStats });
  } catch (err) {
    next(err);
  }
};

export const getBankAccountById = async (req, res, next) => {
  try {
    const account = await BankAccount.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }

    const currentBalance = await recalculateBankAccountBalance(account._id, req.workspace._id);
    const txCount = await Transaction.countDocuments({
      bankAccountId: account._id,
      workspaceId: req.workspace._id,
    });

    res.json({
      success: true,
      account: {
        ...account.toObject(),
        currentCalculatedBalance: currentBalance,
        transactionCount: txCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateBankAccount = async (req, res, next) => {
  try {
    const { bankName, accountHolderName, accountType, accountNickname, ifscCode, openingBalance } = req.body;
    const account = await BankAccount.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }

    if (bankName) account.bankName = bankName;
    if (accountHolderName) account.accountHolderName = accountHolderName;
    if (accountType) account.accountType = accountType;
    if (accountNickname) account.accountNickname = accountNickname;
    if (ifscCode) account.ifscCode = ifscCode;
    if (openingBalance !== undefined) account.openingBalance = parseFloat(openingBalance);

    await account.save();
    const updatedBalance = await recalculateBankAccountBalance(account._id, req.workspace._id);

    res.json({
      success: true,
      account: { ...account.toObject(), currentCalculatedBalance: updatedBalance },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteBankAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }

    // Soft delete / archive
    account.isActive = false;
    await account.save();

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'BANK_ACCOUNT_ARCHIVED',
      entityType: 'BankAccount',
      entityId: account._id,
    });

    res.json({ success: true, message: 'Bank account archived successfully' });
  } catch (err) {
    next(err);
  }
};

