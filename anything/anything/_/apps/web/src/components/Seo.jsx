"use client";

import { useEffect } from "react";

function upsertMetaTagByAttr(attrName, attrValue, content) {
  if (typeof document === "undefined") {
    return;
  }

  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function Seo({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
}) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (title) {
      document.title = title;
      upsertMetaTagByAttr("property", "og:title", ogTitle || title);
      upsertMetaTagByAttr("name", "twitter:title", ogTitle || title);
    }

    if (description) {
      upsertMetaTagByAttr("name", "description", description);
      upsertMetaTagByAttr(
        "property",
        "og:description",
        ogDescription || description,
      );
      upsertMetaTagByAttr(
        "name",
        "twitter:description",
        ogDescription || description,
      );
    }

    if (keywords) {
      upsertMetaTagByAttr("name", "keywords", keywords);
    }

    if (ogImage) {
      upsertMetaTagByAttr("property", "og:image", ogImage);
      upsertMetaTagByAttr("name", "twitter:image", ogImage);
      upsertMetaTagByAttr("name", "twitter:card", "summary_large_image");
    }

    // A sensible default for sharing previews
    upsertMetaTagByAttr("property", "og:type", "website");
  }, [title, description, keywords, ogTitle, ogDescription, ogImage]);

  return null;
}
