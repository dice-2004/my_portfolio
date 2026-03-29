"use client";

import React, { useState } from 'react';
// @ts-ignore
import nacl from 'tweetnacl';

export default function AdminLogin() {
  const [privKey, setPrivKey] = useState("");
  const [status, setStatus] = useState("");

  React.useEffect(() => {
    const savedKey = localStorage.getItem("admin_priv_key");
    if (savedKey) {
      setPrivKey(savedKey);
      // 自動ログインの実行
      setTimeout(() => {
        handleLogin(savedKey);
      }, 500);
    }
  }, []);

  const handleLogin = async (keyToUse?: string) => {
    const targetKey = keyToUse || privKey.trim();
    if (!targetKey) return;

    setStatus("1. サーバーからチャレンジを取得中...");
    try {
      const res = await fetch("http://localhost:8080/api/auth/challenge");
      const { challenge } = await res.json();
      
      const b64ToUint8 = (str: string) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
      const uint8ToB64 = (arr: Uint8Array) => btoa(String.fromCharCode(...arr));

      setStatus("2. 秘密鍵による署名を生成中...");
      const privBytes = b64ToUint8(targetKey);
      const challengeBytes = b64ToUint8(challenge);
      const keyPair = nacl.sign.keyPair.fromSecretKey(privBytes);
      const pubBase64 = uint8ToB64(keyPair.publicKey);

      const signatureBytes = nacl.sign.detached(challengeBytes, privBytes);
      const signatureBase64 = uint8ToB64(signatureBytes);

      setStatus("3. サーバーで署名を検証中...");
      const verifyRes = await fetch("http://localhost:8080/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge,
          signature: signatureBase64,
          public_key: pubBase64,
        })
      });

      if (!verifyRes.ok) {
         setStatus("❌ 認証失敗：鍵が正しくないか、期限切れです");
         localStorage.removeItem("admin_priv_key");
         return;
      }

      const { token } = await verifyRes.json();
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_priv_key", targetKey); // 鍵をブラウザに記憶
      
      setStatus("✅ 認証成功！ダッシュボードへ...");
      
      setTimeout(() => {
         window.location.href = "/admin/dashboard";
      }, 1000);

    } catch(err) {
      console.error(err);
      setStatus("エラーが発生しました。");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 text-center">
          Admin Login
        </h1>
        
        <p className="text-gray-300 text-sm mb-8 text-center leading-relaxed">
          パスワードは使用しません。お持ちの「秘密鍵（Private Key）」を全コピーして貼り付けてください。
        </p>

        <div className="space-y-6">
          <textarea
            rows={4}
            value={privKey}
            onChange={(e) => setPrivKey(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition break-all resize-none shadow-inner tracking-widest"
            placeholder="ztgTC/SCJjvirWJAbc8ihg5O1... (最後に == が付きます)"
          ></textarea>

          <button 
            onClick={() => handleLogin()}
            disabled={!privKey}
            className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg transition-all text-white ${privKey ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/30 transform hover:-translate-y-1' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
          >
            本物の秘密鍵でログインする
          </button>
          
          <div className="h-8 flex items-center justify-center">
            {status && (
              <p className="text-center text-sm font-semibold text-pink-300 animate-pulse">
                {status}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
