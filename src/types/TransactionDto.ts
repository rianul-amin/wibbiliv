export type TransactionDTO = {
  signatures: string[];
  message: {
    account_keys: string[];
    recent_blockhash: string;
    instructions: {
      program_id_index: number;
      accounts: number[];
      data: number;
    }[];
  };
};

export type ChainTransactionDTO = {
  status: string;
  block: number;
  timestamp: string;
  transactionAction: string;
  from: string;
  to: string;
  value: number;
  transactionFee: number;
  gasPrice: number;
  transactionHash: string;
  signature: string;
};
