"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, X, ScanLine } from "lucide-react";
import { QRCode } from "react-qrcode-logo";
import { BrowserMultiFormatReader } from "@zxing/library";
import {
  createSignedTransaction,
  getBalance,
  getTransactions,
  sendTransaction,
} from "./action";
import axios from "axios";
import { ChainTransactionDTO, TransactionDTO } from "@/types/TransactionDto";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"tokens" | "activities">("tokens");
  const [publicAddress, setPublicAddress] = useState<string>("");
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [toAddress, setToAddress] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [transactions, setTransactions] = useState<ChainTransactionDTO[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const receiveModalRef = useRef<HTMLDivElement>(null);
  const sendModalRef = useRef<HTMLDivElement>(null);
  const scannerModalRef = useRef<HTMLDivElement>(null);
  const [refetch, setRefetch] = useState(false);

  const [fullNodeAddress, setFullNodeAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  useEffect(() => {
    const userInfo = localStorage.getItem("user_info");
    if (userInfo) {
      const { publicKey } = JSON.parse(userInfo);
      setPublicAddress(publicKey);
    }
  }, []);

  useEffect(() => {
    const fetchFullNodeAddress = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_SEED_SERVER_ADDRESS}/seed`
        );
        const nodes = res.data;
        if (nodes && nodes.length > 0) {
          setFullNodeAddress(nodes[0]);
        } else alert("No full node available.");
      } catch (error) {
        console.log("Error fetching full node address:", error);
      }
    };
    fetchFullNodeAddress();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactions = await getTransactions(
          fullNodeAddress,
          publicAddress
        );
        setTransactions(transactions);
      } catch (error) {
        console.log("Error fetching transactions:", error);
      }
    };
    fetchTransactions();
  }, [publicAddress, refetch]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await getBalance(fullNodeAddress, publicAddress);
        console.log(res.balance);
        setBalance(res.balance);
      } catch (error) {
        console.log("Error fetching balance:", error);
      }
    };
    fetchBalance();
  }, [publicAddress, fullNodeAddress, refetch]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        receiveModalRef.current &&
        !receiveModalRef.current.contains(event.target)
      ) {
        setIsReceiveOpen(false);
      }
      if (
        sendModalRef.current &&
        !sendModalRef.current.contains(event.target)
      ) {
        setIsSendOpen(false);
      }
      if (
        scannerModalRef.current &&
        !scannerModalRef.current.contains(event.target)
      ) {
        setShowScanner(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showScanner) {
      codeReader.current = new BrowserMultiFormatReader();

      codeReader.current
        .listVideoInputDevices()
        .then((videoInputDevices) => {
          const backCamera = videoInputDevices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment")
          );
          const deviceId = backCamera?.deviceId;

          if (deviceId && videoRef.current) {
            codeReader.current?.decodeFromVideoDevice(
              deviceId,
              videoRef.current,
              (result, error) => {
                if (result) {
                  setToAddress(result.getText());
                  setShowScanner(false);
                }
                if (error && error.name !== "NotFoundException") {
                  console.error("QR Scanner Error:", error);
                }
              }
            );
          }
        })
        .catch((error) =>
          console.error("Error accessing video devices:", error)
        );
    }

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [showScanner]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefetch(!refetch);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const handleSend = async () => {
    setIsSendOpen(false);
    try {
      const transactionMetadata = await createSignedTransaction({
        from: publicAddress,
        to: toAddress!,
        value: Number(amount),
        tokenName: selectedToken!,
      });

      console.log("Signed Transaction:", transactionMetadata);

      //transaction send logic
      const transactionPayload: TransactionDTO = {
        signatures: [
          transactionMetadata.signature,
          transactionMetadata.rawSignature,
        ],
        message: {
          account_keys: [
            publicAddress,
            toAddress!,
            "11111111111111111111111111111111",
          ],
          recent_blockhash: "Hx7K9nQpM4vR2wLbCjFtE5sYuWd3A8zBgX6kNcVy",
          instructions: [
            {
              program_id_index: 2,
              accounts: [0, 1],
              data: Number(amount),
            },
          ],
        },
      };

      const res = await sendTransaction(fullNodeAddress, transactionPayload);
      setRefetch(!refetch);
      setIsConfirmationOpen(true);
    } catch (err) {
      console.error("Signing failed:", err);
      alert("Something went wrong during sending.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicAddress);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = publicAddress;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      try {
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
      } catch {
        alert("Copy failed. Please manually copy the phrase.");
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-10 bg-black">
      <div className="w-full max-w-md bg-[#141618] rounded-2xl shadow-lg px-6 py-8 flex flex-col space-y-8 h-[600px]">
        <div className="flex items-end justify-center space-x-2">
          <span className="text-5xl font-bold text-white leading-none">
            0.00
          </span>
          <span className="text-sm text-gray-400 mb-1">BDT</span>
        </div>

        <div className="space-y-2">
          <p className="text-gray-500 text-sm">Address</p>
          <div className="flex items-center space-x-3">
            <p className="font-mono break-all text-blue-600">
              {publicAddress
                ? `${publicAddress.slice(0, 6)}...${publicAddress.slice(-6)}`
                : "Loading..."}
            </p>
            {publicAddress && (
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-white transition"
              >
                <Copy size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setIsSendOpen(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Send
          </button>
          <button
            onClick={() => setIsReceiveOpen(true)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition"
          >
            Receive
          </button>
        </div>

        <div className="flex justify-center space-x-8">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`text-lg font-semibold transition ${
              activeTab === "tokens" ? "text-white" : "text-gray-500"
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`text-lg font-semibold transition ${
              activeTab === "activities" ? "text-white" : "text-gray-500"
            }`}
          >
            Activities
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {activeTab === "tokens" ? (
            <>
              <div className="flex justify-between items-center bg-gray-800 p-4 pr-6 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full" />
                  <div>
                    <p className="text-white font-semibold">DCL</p>
                    <p className="text-gray-400 text-sm">DCL Coin</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{balance}</p>
                  <p className="text-gray-400 text-sm">৳ 0</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {transactions.map((transaction, index) => {
                const isByMe = transaction.from === publicAddress;

                return (
                  <div
                    key={index}
                    className="bg-gray-800 p-4 rounded-lg space-y-1"
                  >
                    <p className="text-white font-semibold">
                      {isByMe
                        ? `Sent ${transaction.value} DCL`
                        : `Received ${transaction.value} DCL`}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {isByMe
                        ? `To ${
                            transaction.to && transaction.to.length >= 12
                              ? `${transaction.to.slice(
                                  0,
                                  6
                                )}...${transaction.to.slice(-6)}`
                              : transaction.to
                          }`
                        : `From ${
                            transaction.from && transaction.from.length >= 12
                              ? `${transaction.from.slice(
                                  0,
                                  6
                                )}...${transaction.from.slice(-6)}`
                              : transaction.from
                          }`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(transaction.timestamp).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
      {isReceiveOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div
            ref={receiveModalRef}
            className="bg-[#141618] rounded-2xl p-8 w-[90%] max-w-sm relative flex flex-col items-center space-y-6"
          >
            <button
              onClick={() => setIsReceiveOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
            <h1 className="text-xl font-semibold text-white text-center mb-8">
              Receive
            </h1>
            <QRCode
              value={publicAddress || " "}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <div className="w-full flex flex-col items-center space-y-3">
              <p className="text-gray-400 text-sm">Your Public Address</p>
              <div className="flex items-center space-x-3 break-all mb-3">
                <p className="font-mono text-blue-600 text-center">
                  {publicAddress
                    ? `${publicAddress.slice(0, 6)}...${publicAddress.slice(
                        -6
                      )}`
                    : "Loading..."}
                </p>
                {publicAddress && (
                  <button
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <Copy size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isSendOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div
            ref={sendModalRef}
            className="bg-[#141618] rounded-2xl p-8 w-[90%] max-w-sm relative flex flex-col space-y-6"
          >
            <button
              onClick={() => setIsSendOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>

            <h1 className="text-xl font-semibold text-white text-center mb-4">
              Send
            </h1>

            <div className="w-full space-y-2">
              <p className="text-gray-400 text-sm">From</p>
              <p className="font-mono break-all text-blue-600">
                {publicAddress.slice(0, 6)}...{publicAddress.slice(-6)}
              </p>
            </div>

            <div className="w-full space-y-2 relative">
              <p className="text-gray-400 text-sm">To</p>
              <input
                value={toAddress || ""}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Recipient address"
                className="w-full bg-gray-700 text-white rounded-lg py-3 px-4 pr-10 outline-none"
              />
              <button
                onClick={() => setShowScanner(true)}
                className="absolute right-3 top-10.5 text-gray-400 hover:text-white"
              >
                <ScanLine size={20} />
              </button>
            </div>

            {toAddress && (
              <>
                <div className="w-full space-y-2">
                  <p className="text-gray-400 text-sm">Select Token</p>
                  <div className="relative">
                    <select
                      value={selectedToken || ""}
                      onChange={(e) => {
                        setSelectedToken(e.target.value);
                        setAmount("");
                      }}
                      className="w-full appearance-none bg-gray-700 text-white rounded-lg py-3 px-4 pr-10 outline-none"
                    >
                      <option value="" disabled>
                        Select a token
                      </option>
                      <option value="ETH">DCL</option>
                      {/* <option value="USDT">USDT</option>
                      <option value="BNB">BNB</option> */}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg
                        className="w-4 h-4 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.24a.75.75 0 01-1.06 0l-4.24-4.24a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                {selectedToken && (
                  <div className="w-full space-y-2">
                    <p className="text-gray-400 text-sm flex justify-between items-center">
                      <span>Amount</span>
                      <button
                        onClick={() => {
                          // Convert balance string to float and set as amount
                          setAmount(parseFloat(balance).toString());
                        }}
                        className="text-blue-500 text-xs hover:underline"
                      >
                        Max
                      </button>
                    </p>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        // Ensure non-negative values
                        if (
                          parseFloat(e.target.value) >= 0 ||
                          e.target.value === ""
                        ) {
                          setAmount(e.target.value);
                        }
                      }}
                      placeholder="Enter amount"
                      className="w-full bg-gray-700 text-white rounded-lg py-3 px-4 outline-none"
                    />
                    {amount !== "" &&
                      parseFloat(amount) > parseFloat(balance) && (
                        <p className="text-red-500 text-xs mt-1">
                          Insufficient balance
                        </p>
                      )}
                  </div>
                )}
              </>
            )}

            <div className="flex space-x-4 pt-2 w-full">
              <button
                onClick={() => setIsSendOpen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={
                  !toAddress ||
                  !selectedToken ||
                  !amount ||
                  Number(amount) <= 0 ||
                  Number(amount) > Number(balance)
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div
            ref={scannerModalRef}
            className="relative w-full max-w-xs p-4 rounded-lg border-1 border-white shadow-lg bg-black"
          >
            <video ref={videoRef} className="w-full h-full" />
          </div>
        </div>
      )}
      {isConfirmationOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-[#141618] rounded-2xl p-8 w-[90%] max-w-sm relative flex flex-col items-center space-y-6">
            <button
              onClick={() => setIsConfirmationOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
            <h1 className="text-xl font-semibold text-white text-center">
              Transfer Initiated
            </h1>
            <p className="text-gray-400 text-sm text-center">
              Sending{" "}
              <span className="text-white font-bold">
                {amount} DCL
              </span>{" "}
              to <br />
              <span className="text-blue-500">
                {toAddress?.slice(0, 6)}...{toAddress?.slice(-6)}
              </span>
            </p>
            <button
              onClick={() => setIsConfirmationOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
