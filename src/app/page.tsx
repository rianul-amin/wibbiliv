"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  const handleCreateNewWallet = () => {
    if (agreed) {
      router.push("/auth/sign-up");
    }
  };

  const handleImportWallet = () => {
    if (agreed) {
      router.push("/auth/import");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-10 bg-black">
      <div className="w-full max-w-md bg-[#141618] rounded-2xl shadow-2xl px-6 py-10 flex flex-col space-y-10 justify-center">

        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-bold text-white">Wibbiliv</h1>
          <p className="text-gray-400 text-base">
            A next-generation blockchain wallet crafted for speed, security, and true ownership.
          </p>
        </div>

        <div className="flex justify-center items-center space-x-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={() => setAgreed(!agreed)}
            className="w-5 h-5 accent-blue-600 bg-gray-800 rounded focus:ring-0 border-2 border-gray-700"
          />
          <label htmlFor="terms" className="text-gray-400 text-sm">
            I agree to <span className="underline text-blue-500">Wibbiliv's Terms of Use</span>
          </label>
        </div>

        <div className="flex flex-col w-full space-y-4 pt-2">
          <button
            onClick={handleCreateNewWallet}
            disabled={!agreed}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 tracking-wide ${
              agreed
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            Create New Wallet
          </button>

          <button
            onClick={handleImportWallet}
            disabled={!agreed}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 tracking-wide border-2 ${
              agreed
                ? "border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                : "border-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            Import Existing Wallet
          </button>
        </div>

      </div>
    </div>
  );
}
