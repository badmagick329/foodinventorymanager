"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Receipt() {
  const [file, setFile] = useState<File>();
  const [receiptJson, setReceiptJson] = useState<string>("");
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    const postReceipt = async () => {
      if (!file) return;
      try {
        const data = new FormData();
        data.append("file", file);
        const res = await fetch(`${baseUrl}/api/receipt`, {
          method: "POST",
          body: data,
        });
        if (!res.ok) {
          // TODO: Better error handling
          console.log("Something went wrong");
          console.error(await res.text());
        }
        setReceiptJson(JSON.stringify(await res.json(), null, 2));
      } catch (e: any) {
        // TODO: Better error handling
        console.error(e.message);
      }
    };
    postReceipt();
  }, [file, baseUrl]);

  const onJsonSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!receiptJson) return;
    let parsed = null;
    try {
      parsed = JSON.parse(receiptJson);
    } catch (e: any) {
      // TODO: Better error handling
      console.error(e.message);
      alert("Error parsing JSON");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/receipt/json`, {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        // TODO: Better error handling
        console.log("Something went wrong");
        console.error(await res.text());
        return;
      }
      const response = await res.json();
      console.log("Response status:", res.status);
      if (response.status === 201) {
        router.push("/");
        router.refresh();
        return;
      }
    } catch (e: any) {
      // TODO: Better error handling
      console.error(e.message);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2 w-11/12 lg:w-9/12 2xl:w-2/3 3xl:w-1/2">
      <input
        type="file"
        accept="application/pdf"
        name="file"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <form
        className="flex form-control w-full space-y-2 items-center"
        onSubmit={onJsonSubmit}
      >
        <textarea
          rows={30}
          className="form-control w-full rounded-lg"
          value={receiptJson}
          onChange={(e) => setReceiptJson(e.target.value)}
        />
        <input className="btn btn-primary w-fit" type="submit" value="Submit" />
      </form>
    </div>
  );
}
