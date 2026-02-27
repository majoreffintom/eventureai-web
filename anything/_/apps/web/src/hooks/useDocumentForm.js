import { useState, useMemo } from "react";

export function useDocumentForm() {
  const [docId, setDocId] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [docUrl, setDocUrl] = useState(null);
  const [docMimeType, setDocMimeType] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [docFields, setDocFields] = useState([{ key: "", value: "" }]);
  const [docError, setDocError] = useState(null);
  const [docSuccess, setDocSuccess] = useState(null);

  const fieldsObject = useMemo(() => {
    const out = {};
    for (const row of docFields) {
      const k = (row?.key || "").trim();
      const v = (row?.value || "").trim();
      if (!k) continue;
      out[k] = v;
    }
    return out;
  }, [docFields]);

  const clearDocForm = () => {
    setDocId(null);
    setDocTitle("");
    setDocNotes("");
    setDocUrl(null);
    setDocMimeType(null);
    setDocFile(null);
    setDocFields([{ key: "", value: "" }]);
    setDocError(null);
    setDocSuccess(null);
  };

  return {
    docId,
    setDocId,
    docTitle,
    setDocTitle,
    docNotes,
    setDocNotes,
    docUrl,
    setDocUrl,
    docMimeType,
    setDocMimeType,
    docFile,
    setDocFile,
    docFields,
    setDocFields,
    docError,
    setDocError,
    docSuccess,
    setDocSuccess,
    fieldsObject,
    clearDocForm,
  };
}
