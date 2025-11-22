"use client";

import { ChangeEvent, DragEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ImageSource =
  | { kind: "file"; url: string; name: string; size: number; lastModified: number }
  | { kind: "url"; url: string; name: string };

const sizeFormatter = Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "byte",
  unitDisplay: "narrow"
});

export default function HomePage() {
  const [current, setCurrent] = useState<ImageSource | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const updateFromFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setError(null);
    setCurrent({
      kind: "file",
      url: nextUrl,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified
    });
    setObjectUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return nextUrl;
    });
  }, []);

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files.item(0);
        if (file) {
          updateFromFile(file);
        }
      }
    },
    [updateFromFile]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragging(false);
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files.item(0);
        if (file) {
          updateFromFile(file);
        }
      }
    },
    [updateFromFile]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleUrlSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawUrl = String(form.get("imageUrl") ?? "").trim();
    if (!rawUrl) {
      setError("Enter a valid image URL.");
      return;
    }

    try {
      const verified = new URL(rawUrl);
      if (!/\.(png|jpg|jpeg|gif|webp|avif|svg|bmp|ico)$/i.test(verified.pathname)) {
        setError("URL must point to an image resource.");
        return;
      }

      setError(null);
      setCurrent({
        kind: "url",
        url: verified.toString(),
        name: verified.pathname.split("/").pop() ?? verified.hostname
      });
      setObjectUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
    } catch {
      setError("Could not parse that URL.");
    }
  }, []);

  const metaLines = useMemo(() => {
    if (!current) return [];
    if (current.kind === "file") {
      const lastModified = new Date(current.lastModified).toLocaleString();
      return [
        `File name: ${current.name}`,
        `Size: ${sizeFormatter.format(current.size)}`,
        `Last modified: ${lastModified}`
      ];
    }
    return [`Remote name: ${current.name}`, "Source: external URL"];
  }, [current]);

  return (
    <main>
      <section className="panel">
        <header className="header">
          <div>
            <h1>اعرض صورتك فوراً</h1>
            <p>حمّل صورة من جهازك أو الصق رابطاً مباشراً لمشاهدتها في الحال.</p>
          </div>
          <span className="badge">يدعم السحب والإفلات</span>
        </header>

        <div className="uploader">
          <label
            htmlFor="file-input"
            className={`dropzone ${isDragging ? "dropzone--active" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input id="file-input" type="file" accept="image/*" onChange={handleFileInput} hidden />
            <div>
              <strong>اختر ملفاً</strong>
              <span>أو اسحب الصورة وأفلتها هنا</span>
            </div>
          </label>

          <form className="url-form" onSubmit={handleUrlSubmit}>
            <input name="imageUrl" type="url" placeholder="https://example.com/image.jpg" dir="ltr" />
            <button type="submit">اعرض الرابط</button>
          </form>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="preview">
          {current ? (
            <>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.url} alt={current.name} />
              </figure>
              <aside>
                <h2>تفاصيل الصورة</h2>
                <ul>
                  {metaLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="hint">
                  يتم الاحتفاظ بالملفات محلياً داخل متصفحك. الروابط يتم تحميلها مباشرة من المصدر.
                </p>
              </aside>
            </>
          ) : (
            <div className="placeholder">
              <p>قم بتحميل صورة أو أدخل رابطاً لعرضه هنا.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
