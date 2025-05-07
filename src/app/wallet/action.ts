"use client";

import { slh_dsa_sha2_256f } from "@noble/post-quantum/slh-dsa";
import { utf8ToBytes, bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha2";
import axios from "axios";
import { ChainTransactionDTO, TransactionDTO } from "@/types/TransactionDto";

export async function createSignedTransaction({
  from,
  to,
  value,
  tokenName,
}: {
  from: string;
  to: string;
  value: number;
  tokenName: string;
}) {
  const userInfo = localStorage.getItem("user_info");
  if (!userInfo) throw new Error("User not authenticated");

  const { privateKey, publicKey } = JSON.parse(userInfo);

  if (!privateKey || !publicKey)
    throw new Error("Key pair missing in localStorage");

  const privateKeyBytes = hexToBytes(privateKey);

  const transactionAction = `Transfer ${value} ${tokenName} value to ${to}`;

  const transaction = {
    transactionAction,
    from,
    to,
    value,
    transactionFee: 0,
    gasPrice: 0,
  };

  const jsonString = sha256(JSON.stringify(transaction)).toString();
  const messageBytes = utf8ToBytes(jsonString);

  if (messageBytes.length > 128) {
    throw new Error("Message too long for SLH-DSA (max 128 bytes)");
  }

  const paddedMessage = new Uint8Array(128);
  paddedMessage.set(messageBytes);

  console.log("strating signing");

  const signatureBytes = slh_dsa_sha2_256f.sign(paddedMessage, privateKeyBytes);

  console.log("finished signing");

  const signature = bytesToHex(signatureBytes);

  const hash = sha256(messageBytes);
  const transactionHash = bytesToHex(hash);

  return {
    rawSignature: jsonString,
    signature,
    transactionHash,
  };
}

export const getBalance = async (serverAddress: string, address: string) => {
  const res = await axios.get(
    `http://${serverAddress}/transaction/balance/${address}`
  );
  return {
    balance: res.data.balance,
  };
};

export const sendTransaction = async (
  serverAddress: string,
  transaction: TransactionDTO
) => {
  const res = await axios.post(
    `http://${serverAddress}/transaction`,
    transaction
  );
  console.log(res.data);
  return res.data;
};

export const getTransactions = async (
  serverAddress: string,
  address: string
) => {
  console.log("Getting transactions for address: ", address);
  const res = await axios.get(
    `http://${serverAddress}/transaction/key/${address}`
  );
  console.log("Transactions: ", res.data);
  return res.data as ChainTransactionDTO[];
};
