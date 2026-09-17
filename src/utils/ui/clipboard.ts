"use client";

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;user-select:text;-webkit-user-select:text";
    const host = document.querySelector("dialog[open]") ?? document.body;
    host.append(field);
    field.select();
    field.setSelectionRange(0, text.length);
    const done = document.execCommand("copy");
    field.remove();
    return done;
  } catch {
    return false;
  }
}
