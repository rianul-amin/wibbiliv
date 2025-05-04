"use client";

import { useState } from "react";
import { generate } from "random-words";
import { slh_dsa_sha2_256f } from '@noble/post-quantum/slh-dsa';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils'; 
import { sha256 } from '@noble/hashes/sha2';
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [secretPhrase] = useState(() => (generate(12) as string[]).join(" "));
  const [confirmedPhrase, setConfirmedPhrase] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmedCopy, setConfirmedCopy] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (step === 1 && password && password === confirmPassword) {
      setStep(2);
    } else if (step === 2 && confirmedCopy) {
      setStep(3);
    } else if (step === 3 && confirmedPhrase.trim() === secretPhrase.trim()) {
      const hashedBytes1 = sha256(utf8ToBytes(secretPhrase.trim()));
      const hashedBytes2 = sha256(utf8ToBytes(secretPhrase.trim() + "1"));
      const hashedBytes3 = sha256(utf8ToBytes(secretPhrase.trim() + "2"));
  
      const seed96 = new Uint8Array(96);
      seed96.set(hashedBytes1, 0);
      seed96.set(hashedBytes2, 32);
      seed96.set(hashedBytes3, 64);
  
      const { secretKey, publicKey } = slh_dsa_sha2_256f.keygen(seed96);
  
      localStorage.setItem("user_info", JSON.stringify({
        password,
        secretPhrase,
        publicKey: bytesToHex(publicKey),
        privateKey: bytesToHex(secretKey),
      }));
  
      router.push("/wallet"); 
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push("/"); 
  };

  const isNextDisabled = () => {
    if (step === 1) return !(password && confirmPassword && password === confirmPassword);
    if (step === 2) return !confirmedCopy;
    if (step === 3) return !(confirmedPhrase.trim() === secretPhrase.trim());
    return true;
  };

  const handleCopyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(secretPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = secretPhrase;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      try {
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert("Copy failed. Please manually copy the phrase.");
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-black">
      <div className="w-full max-w-lg bg-[#141618] rounded-2xl shadow-2xl p-8 flex flex-col space-y-10">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">
            {step === 1 && "Create Password"}
            {step === 2 && "Secure Wallet"}
            {step === 3 && "Confirm Recovery Phrase"}
          </h2>
          <p className="text-gray-400 text-sm">Step {step} of 3</p>
        </div>

        {step === 1 && (
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
        )}

        {step === 2 && (
          <div className="flex flex-col space-y-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              This is your secret recovery phrase. Write it down and store it somewhere safe. 
              If you lose it, you lose access to your wallet forever.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 text-blue-400 font-mono text-sm leading-relaxed break-words">
              {secretPhrase}
            </div>

            <button
              type="button"
              onClick={handleCopyPhrase}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              {copied ? "Copied!" : "Copy Secret Phrase"}
            </button>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="confirm-copy"
                checked={confirmedCopy}
                onChange={() => setConfirmedCopy(!confirmedCopy)}
                className="w-5 h-5 accent-blue-600 bg-gray-800 rounded border-gray-700 focus:ring-0"
              />
              <label htmlFor="confirm-copy" className="text-gray-400 text-sm">
                I have saved my secret recovery phrase.
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col space-y-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              Please type your secret recovery phrase to confirm you saved it.
            </p>
            <textarea
              value={confirmedPhrase}
              onChange={(e) => setConfirmedPhrase(e.target.value)}
              rows={4}
              placeholder="Type your secret phrase exactly"
              className="bg-gray-800 rounded-lg p-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            {confirmedPhrase && confirmedPhrase.trim() !== secretPhrase.trim() && (
              <p className="text-red-500 text-sm">Phrase doesn't match.</p>
            )}
          </div>
        )}

        <div className="flex justify-between space-x-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="w-1/2 py-4 rounded-xl font-bold text-md tracking-wide transition-all duration-300 bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled()}
            className={`w-1/2 py-4 rounded-xl font-bold text-md tracking-wide transition-all duration-300 ${
              isNextDisabled()
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            }`}
          >
            {step === 3 ? "Finish" : "Next"}
          </button>
        </div>

      </div>
    </div>
  );
}
