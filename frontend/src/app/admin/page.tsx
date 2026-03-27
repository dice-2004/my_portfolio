"use client";

import React, { useState } from 'react';
// @ts-ignore
import nacl from 'tweetnacl';

export default function AdminLogin() {
  const [privKey, setPrivKey] = useState("");
  const [status, setStatus] = useState("");

  const handleLogin = async () => {
    setStatus("1. サーバーからチャレンジ（合言葉）を取得中...");
    try {
      // 1. サーバーから合言葉をもらう
      const res = await fetch("http://localhost:8080/api/auth/challenge");
      const { challenge } = await res.json();
      
      // Base64の文字列を、暗号処理用のバイナリ配列(Uint8Array)に変換する関数
      const b64ToUint8 = (str: string) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
      const uint8ToB64 = (arr: Uint8Array) => btoa(String.fromCharCode(...arr));

      setStatus("2. ブラウザ内で秘密鍵を使った署名を生成中...");
      // 入力された秘密鍵と、合言葉をバイナリ変換
      const privBytes = b64ToUint8(privKey.trim());
      const challengeBytes = b64ToUint8(challenge);
      
      // 秘密鍵の全データから、対応する公開鍵（南京錠）だけを抽出することもできます
      const keyPair = nacl.sign.keyPair.fromSecretKey(privBytes);
      const pubBase64 = uint8ToB64(keyPair.publicKey);

      // ここが本丸：秘密鍵を使って、合言葉に「ハンコ（署名）」を押します！！
      const signatureBytes = nacl.sign.detached(challengeBytes, privBytes);
      const signatureBase64 = uint8ToB64(signatureBytes);

      setStatus("3. サーバーへ検証をお願いしています...");
      // サーバーへ「合言葉・ハンコ・公開鍵」の3点セットを送る
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
         setStatus("❌ 認証失敗：秘密鍵が間違っているか、期限切れです");
         return;
      }

      // 4. 検証成功！身分証（JWT）をブラウザに記憶させる
      const { token } = await verifyRes.json();
      localStorage.setItem("admin_token", token);
      setStatus("✅ ログイン大成功！！（ダッシュボードへ移動します...）");
      
      // 成功したら次の画面へ遷移
      setTimeout(() => {
         window.location.href = "/admin/dashboard";
      }, 1200);

    } catch(err) {
      console.error(err);
      setStatus("エラーが発生しました。鍵の文字列が正しいか確認してください。");
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
            onClick={handleLogin}
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
