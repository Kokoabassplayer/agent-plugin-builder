const nameInput = document.querySelector("#plugin-name");
const descriptionInput = document.querySelector("#plugin-description");
const generatedCommand = document.querySelector("#generated-command");
const harnessInputs = Array.from(document.querySelectorAll(".command-form input[type='checkbox']"));

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "my-plugin";
}

function quote(value) {
  return value.replace(/"/g, "\\\"");
}

function updateCommand() {
  if (!generatedCommand || !nameInput || !descriptionInput) return;

  const pluginName = slugify(nameInput.value);
  const description = descriptionInput.value.trim() || "Reusable agent plugin";
  const selectedHarnesses = harnessInputs
    .filter((input) => input.checked)
    .map((input) => input.value);
  const harnessFlag = selectedHarnesses.length ? ` --agents ${selectedHarnesses.join(",")}` : "";

  generatedCommand.textContent = `npx github:Kokoabassplayer/agent-plugin-builder create ${pluginName} --description "${quote(description)}"${harnessFlag}`;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function bindCopyButtons() {
  document.querySelectorAll(".copy-button").forEach((button) => {
    const initialLabel = button.textContent;

    button.addEventListener("click", async () => {
      const targetId = button.getAttribute("data-copy-target");
      const directCommand = button.getAttribute("data-copy-command");
      const target = targetId ? document.getElementById(targetId) : null;
      const text = directCommand || target?.textContent || "";

      try {
        await copyText(text);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Copy failed";
      }

      window.setTimeout(() => {
        button.textContent = initialLabel;
      }, 1800);
    });
  });
}

[nameInput, descriptionInput, ...harnessInputs].forEach((element) => {
  element?.addEventListener("input", updateCommand);
  element?.addEventListener("change", updateCommand);
});

updateCommand();
bindCopyButtons();
