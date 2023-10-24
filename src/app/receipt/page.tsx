"use client";
import { useState } from "react";

export default function Receipt() {
  const [file, setFile] = useState<File>();
  const [receiptJson, setReceiptJson] = useState<string>("");

  const onPdfSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    try {
      const data = new FormData();
      data.append("file", file);
      // data.set('file', file)
      const res = await fetch(`/api/receipt`, {
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
      const res = await fetch(`/api/receipt/json`, {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        // TODO: Better error handling
        console.log("Something went wrong");
        console.error(await res.text());
        return;
      }
      if (res.status === 201) {
        console.log("Created");
        return;
      }
      console.log(await res.json());
      return;
    } catch (e: any) {
      // TODO: Better error handling
      console.error(e.message);
    }
  };

  return (
    <div className="flex flex-col w-11/12 items-center space-y-2">
      <form
        className="flex form-control space-y-2 items-center"
        onSubmit={onPdfSubmit}
      >
        <input
          type="file"
          accept="application/pdf"
          name="file"
          onChange={(e) => setFile(e.target.files?.[0])}
        />
        <input className="btn btn-primary w-fit" type="submit" value="Upload" />
      </form>
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
