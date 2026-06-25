const copyButton = document.querySelector("[data-copy-command]");

if (copyButton) {
  const initialLabel = copyButton.textContent;

  copyButton.addEventListener("click", async () => {
    const command = copyButton.getAttribute("data-copy-command") || "";

    try {
      await navigator.clipboard.writeText(command);
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      copyButton.textContent = initialLabel;
    }, 1800);
  });
}
