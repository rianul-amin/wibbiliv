"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slh_dsa_sha2_256f } from "@noble/post-quantum/slh-dsa";
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [secretPhrase, setSecretPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorSecretPhrase, setErrorSecretPhrase] = useState("");

  const handleImport = () => {
    if (secretPhrase.trim().split(" ").length < 12) {
      setErrorSecretPhrase("Please enter a valid 12+ word secret phrase.");
      return;
    }
    setErrorSecretPhrase("");
    setStep(2);
  };

  const handleFinish = async () => {
    const hashedBytes1 = sha256(utf8ToBytes(secretPhrase.trim()));
    const hashedBytes2 = sha256(utf8ToBytes(secretPhrase.trim() + "1"));
    const hashedBytes3 = sha256(utf8ToBytes(secretPhrase.trim() + "2"));

    const seed96 = new Uint8Array(96);
    seed96.set(new Uint8Array(hashedBytes1), 0);
    seed96.set(new Uint8Array(hashedBytes2), 32);
    seed96.set(new Uint8Array(hashedBytes3), 64);

    const { secretKey, publicKey } = slh_dsa_sha2_256f.keygen(seed96);

    localStorage.setItem("user_info", JSON.stringify({
      password,
      secretPhrase,
      publicKey: bytesToHex(publicKey),
      privateKey: bytesToHex(secretKey),
    }));

    router.push("/wallet");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 py-10">
      <div className="w-full max-w-md bg-[#141618] rounded-2xl shadow-lg p-8 space-y-4">

        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-white text-center">Import Wallet</h1>
            <p className="text-gray-400 text-sm ">
              Use your Secret Recovery Phrase to validate your ownership, restore your wallet, and set up a new password. First, enter the Secret Recovery Phrase that you were given when you created your wallet.
            </p>
            <textarea
            className="w-full h-40 p-4 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none resize-none"
            placeholder="Paste your secret phrase here..."
            value={secretPhrase}
            onChange={(e) => setSecretPhrase(e.target.value)}
            />

            <div className="text-red-500 text-sm">{errorSecretPhrase}</div>

            <button
                type="button"
                onClick={handleImport}
                disabled={secretPhrase.trim().length === 0}
                className={`w-full py-4 rounded-xl font-bold text-md tracking-wide transition-all duration-300 ${
                    secretPhrase.trim().length === 0
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                } mt-4`}
                >
                Import
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-white text-center">Set a Password</h1>

            <div className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-400">Password</label>
                    <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Enter password"
                        className="w-full bg-gray-800 rounded-lg p-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 pr-16 transition"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-sm text-blue-400 hover:underline"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                    </div>
                </div>

                <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-400">Confirm Password</label>
                    <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    className="w-full bg-gray-800 rounded-lg p-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-sm">Passwords do not match.</p>
                )}
                </div>

                <button
                    type="button"
                    onClick={handleFinish}
                    disabled={!(password && confirmPassword && password === confirmPassword)}
                    className={`w-full py-4 rounded-xl font-bold text-md tracking-wide transition-all duration-300 ${
                        !(password && confirmPassword && password === confirmPassword)
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                    } mt-4`}
                    >
                    Finish
            </button>
          </>
        )}

      </div>
    </div>
  );
}
